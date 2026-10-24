# backend/database.py
import os
import sys
import json
import sqlite3
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, Column, Integer, String, Text, DateTime, text
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import Request
from utils.paths import APP_PATHS
import utils.turso_driver

# Cargar variables de entorno estrictamente desde .env
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

# Conexión Local-First Ultrarrápida en SQLite
LOCAL_DATABASE_URL = f"sqlite:///{APP_PATHS['db_path']}"

engine_local = create_engine(
    LOCAL_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 30.0}
)
engine = engine_local

SesionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_local)
Base = declarative_base()

# Precargar todos los modelos ORM para que SQLAlchemy resuelva relaciones cruzadas
try:
    import modulos.usuarios.models
    import modulos.clientes.models
    import modulos.vehiculos.models
    import modulos.inventario.models
    import modulos.ordenes.models
    import modulos.presupuestos.models
    import modulos.factura.models
    import modulos.configuracion.models
except Exception as e_models:
    print("Aviso al precargar modelos SQLAlchemy:", e_models)

# Singleton Engine y SessionFactory para Turso Cloud DB
_TURSO_ENGINE_SINGLETON = None
_TURSO_SESSION_FACTORY = None

def get_turso_engine():
    global _TURSO_ENGINE_SINGLETON
    if _TURSO_ENGINE_SINGLETON is not None:
        return _TURSO_ENGINE_SINGLETON

    turso_url = os.environ.get("TURSO_DATABASE_URL")
    turso_token = os.environ.get("TURSO_AUTH_TOKEN")
    if turso_url and turso_token:
        try:
            _TURSO_ENGINE_SINGLETON = create_engine(
                "sqlite://",
                creator=lambda: utils.turso_driver.connect(turso_url, turso_token)
            )
            return _TURSO_ENGINE_SINGLETON
        except Exception as e:
            print("Aviso al crear engine de Turso:", e)
            return None
    return None

# ==========================================
# INTERCEPCIÓN Y COLA DE SINCRONIZACIÓN (OUTBOX PATTERN)
# ==========================================
@event.listens_for(engine_local, "after_cursor_execute")
def registrar_en_cola_sincronizacion(conn, cursor, statement, parameters, context, executemany):
    if not statement:
        return
    sql_upper = statement.strip().upper()
    if sql_upper.startswith(("INSERT", "UPDATE", "DELETE", "REPLACE")) and "SYNC_QUEUE" not in sql_upper:
        try:
            params_json = json.dumps(parameters) if parameters else None
            cursor.execute(
                "INSERT INTO sync_queue (sql_statement, params, status) VALUES (?, ?, ?)",
                (statement, params_json, "PENDING")
            )
        except Exception as err:
            pass  # Evita interrumpir la transacción principal local si la tabla aún se está creando

def get_db_session_for_taller(taller_slug: str = "default"):
    """
    Arquitectura Local-First con Singleton Engine:
    En Render/Netlify reutiliza la fábrica de sesiones persistente en RAM.
    """
    global _TURSO_SESSION_FACTORY
    if os.environ.get("RENDER") or os.environ.get("NETLIFY"):
        turso_engine = get_turso_engine()
        if turso_engine:
            if _TURSO_SESSION_FACTORY is None:
                _TURSO_SESSION_FACTORY = sessionmaker(autocommit=False, autoflush=False, bind=turso_engine)
            return _TURSO_SESSION_FACTORY()

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

        cursor.execute("PRAGMA table_info(usuarios)")
        cols_usuarios = [row[1] for row in cursor.fetchall()]
        if cols_usuarios and "preferencia_tema" not in cols_usuarios:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN preferencia_tema VARCHAR(20) DEFAULT 'light'")

        conn.commit()
        conn.close()
    except Exception as e:
        print("Aviso de migración SQLite:", e)

def ejecutar_migraciones_turso(turso_engine):
    if not turso_engine:
        return
    try:
        with turso_engine.connect() as conn:
            tablas = ["configuracion_taller", "usuarios", "clientes", "vehiculos", "inventario", "ordenes_trabajo", "detalle_ordenes", "presupuestos", "detalle_presupuestos", "facturas", "detalle_facturas"]
            for tabla in tablas:
                try:
                    conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN updated_at DATETIME;"))
                    conn.commit()
                except Exception:
                    pass

            try:
                conn.execute(text("ALTER TABLE usuarios ADD COLUMN preferencia_tema VARCHAR(20) DEFAULT 'light';"))
                conn.commit()
            except Exception:
                pass
    except Exception as e:
        print("Aviso de migración Turso:", e)
