from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
import sqlite3
import os
import sys
import threading
import json
import urllib.request
from dotenv import load_dotenv
from fastapi import Request
from utils.paths import APP_PATHS
import utils.turso_driver

DEFAULT_TURSO_URL = "libsql://taller-gustavo-perdomo-iandev.aws-sa-east-1.turso.io"
DEFAULT_TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIwMjc5MzAsImlkIjoiMDFhMTNkMzAtMTUwMS03OGNjLTg5MDYtODAxYTE1YjkxYWFmIiwia2lkIjoiSDVRcm1HYm56MkpkaG9rOUlvcDgyWXREdHE2X1hwcWF1WS0zN0ZRNTJrNCIsInJpZCI6Ijc4MjY5Yjk4LTlmNzYtNGUyYi05NzQxLTA0MzFiZmZjMTgzZSJ9.GYwI_h1pXQQT0tyz7ua94-LarF5pmbErdBkLQnhEopxhGciZC8hvZ8mV3VgcOq56lu0eiAuTdtU3XtbmUN1aCA"

def cargar_env_multi_ruta():
    candidates = []
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        candidates.append(os.path.join(exe_dir, ".env"))
        meipass_dir = getattr(sys, '_MEIPASS', None)
        if meipass_dir:
            candidates.append(os.path.join(meipass_dir, ".env"))
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates.append(os.path.join(base_dir, ".env"))
    candidates.append(os.path.join(os.getcwd(), ".env"))

    for path in candidates:
        if os.path.exists(path):
            load_dotenv(path, override=True)
            break

cargar_env_multi_ruta()

# Conexión Local Principal (Disco Duro)
LOCAL_DATABASE_URL = f"sqlite:///{APP_PATHS['db_path']}"

engine_local = create_engine(
    LOCAL_DATABASE_URL, connect_args={"check_same_thread": False}
)
engine = engine_local

SesionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_local)
Base = declarative_base()

# ==========================================
# RÉPLICA ASÍNCRONA A TURSO CLOUD DB (MODO OFFLINE/BACKUP)
# ==========================================
def _convert_val(p):
    if p is None:
        return {"type": "null"}
    elif isinstance(p, bool):
        return {"type": "integer", "value": "1" if p else "0"}
    elif isinstance(p, int):
        return {"type": "integer", "value": str(p)}
    elif isinstance(p, float):
        return {"type": "float", "value": p}
    else:
        return {"type": "text", "value": str(p)}

def _replicar_sql_a_turso_async(sql, params):
    turso_base_url = os.environ.get("TURSO_DATABASE_URL", DEFAULT_TURSO_URL)
    turso_auth_token = os.environ.get("TURSO_AUTH_TOKEN", DEFAULT_TURSO_TOKEN)
    if not turso_base_url or not turso_auth_token:
        return

    url = turso_base_url.replace("libsql://", "https://").replace("sqlite://", "https://").rstrip("/") + "/v2/pipeline"

    stmt = {"sql": sql}

    if params:
        if isinstance(params, dict):
            named_args = []
            for k, v in params.items():
                param_name = k if k.startswith(":") else f":{k}"
                named_args.append({"name": param_name, "value": _convert_val(v)})
            stmt["named_args"] = named_args
        elif isinstance(params, (list, tuple)):
            stmt["args"] = [_convert_val(p) for p in params]

    payload = {"requests": [{"type": "execute", "stmt": stmt}]}

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {turso_auth_token}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            pass
    except Exception as e:
        print("Aviso de réplica en segundo plano a Turso:", e)

def replicar_a_turso_en_segundo_plano(sql, params):
    if not sql:
        return
    sql_upper = sql.strip().upper()
    if sql_upper.startswith(("INSERT", "UPDATE", "DELETE", "REPLACE")):
        threading.Thread(
            target=_replicar_sql_a_turso_async,
            args=(sql, params),
            daemon=True
        ).start()

@event.listens_for(engine_local, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    replicar_a_turso_en_segundo_plano(statement, parameters)

# Caché de engines de bases de datos por taller
engines_cache = {}

def get_db_session_for_taller(taller_slug: str = "default"):
    """
    Sistemas de Conexión Multi-Tenant Dinámico Unificado:
    Tanto la App de Escritorio como la Web de Netlify/Render leen y escriben
    directamente en Turso Cloud DB por defecto para visibilidad en tiempo real de todos los cambios.
    Si no hay conexión a Internet, conmuta automáticamente a la BDD local de respaldo.
    """
    turso_base_url = os.environ.get("TURSO_DATABASE_URL", DEFAULT_TURSO_URL)
    turso_auth_token = os.environ.get("TURSO_AUTH_TOKEN", DEFAULT_TURSO_TOKEN)

    if turso_base_url and turso_auth_token:
        slug_limpio = (taller_slug or "default").lower().strip().replace("-", "_")
        cache_key = f"turso_{slug_limpio}"

        if cache_key not in engines_cache:
            try:
                engine_turso = create_engine(
                    "sqlite://",
                    creator=lambda: utils.turso_driver.connect(turso_base_url, turso_auth_token)
                )

                # Auto-crear esquema DDL y auto-sembrar usuario inicial en Turso
                try:
                    Base.metadata.create_all(bind=engine_turso)
                    from seed import sembrar_datos_completos
                    temp_session = sessionmaker(autocommit=False, autoflush=False, bind=engine_turso)()
                    sembrar_datos_completos(session=temp_session, bind_engine=engine_turso)
                    temp_session.close()
                except Exception as seed_err:
                    print("Aviso de auto-inicialización en Turso:", seed_err)

                engines_cache[cache_key] = sessionmaker(autocommit=False, autoflush=False, bind=engine_turso)
            except Exception as e:
                print("Aviso de conexión a Turso Cloud DB, conmutando a BDD local protegida:", e)
                return SesionLocal()

        session_factory = engines_cache[cache_key]
        return session_factory()

    # Fallback a Base de Datos Local protegida
    return SesionLocal()

def get_db(request: Request = None):
    taller_slug = "default"
    if request:
        taller_slug = request.headers.get("X-Taller-Slug") or request.headers.get("x-taller-slug") or "default"

    db = get_db_session_for_taller(taller_slug)
    try:
        yield db
    finally:
        db.close()

def ejecutar_migraciones_sqlite():
    try:
        conn = sqlite3.connect(APP_PATHS['db_path'])
        cursor = conn.cursor()

        cursor.execute("PRAGMA table_info(facturas)")
        cols_facturas = [row[1] for row in cursor.fetchall()]
        if cols_facturas and "mecanico_id" not in cols_facturas:
            cursor.execute("ALTER TABLE facturas ADD COLUMN mecanico_id INTEGER REFERENCES usuarios(id)")

        cursor.execute("PRAGMA table_info(presupuestos)")
        cols_presupuestos = [row[1] for row in cursor.fetchall()]
        if cols_presupuestos and "mecanico_id" not in cols_presupuestos:
            cursor.execute("ALTER TABLE presupuestos ADD COLUMN mecanico_id INTEGER REFERENCES usuarios(id)")

        conn.commit()
        conn.close()
    except Exception as e:
        print("Aviso de migración SQLite:", e)
