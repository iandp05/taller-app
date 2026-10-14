from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import sqlite3
import os
import sys
from dotenv import load_dotenv
from fastapi import Request
from utils.paths import APP_PATHS
import utils.turso_driver

# Cargar variables de entorno desde .env con resolución multi-ruta
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

# Conexión por defecto local dentro de 'BaseDeDatos/taller.db'
LOCAL_DATABASE_URL = f"sqlite:///{APP_PATHS['db_path']}"

engine_local = create_engine(
    LOCAL_DATABASE_URL, connect_args={"check_same_thread": False}
)
engine = engine_local

SesionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_local)
Base = declarative_base()

# Caché de engines de bases de datos por taller para alta eficiencia
engines_cache = {}

def get_db_session_for_taller(taller_slug: str = "default"):
    """
    Sistemas de Conexión Multi-Tenant Dinámico:
    - En modo nube (Turso DB): Si se definen 'TURSO_DATABASE_URL' y 'TURSO_AUTH_TOKEN', conecta
      a la BDD remota de Turso en la nube vía driver HTTP Pipeline.
    - En modo local escritorio / offline: Conecta a la BDD SQLite protegida del Escritorio 'BaseDeDatos/taller.db'.
    """
    turso_base_url = os.environ.get("TURSO_DATABASE_URL")
    turso_auth_token = os.environ.get("TURSO_AUTH_TOKEN")

    if turso_base_url and turso_auth_token:
        slug_limpio = (taller_slug or "default").lower().strip().replace("-", "_")
        cache_key = f"turso_{slug_limpio}"

        if cache_key not in engines_cache:
            try:
                engine_turso = create_engine(
                    "sqlite://",
                    creator=lambda: utils.turso_driver.connect(turso_base_url, turso_auth_token)
                )
                engines_cache[cache_key] = sessionmaker(autocommit=False, autoflush=False, bind=engine_turso)
            except Exception as e:
                print("Aviso de conexión a Turso, usando BDD local protegida:", e)
                return SesionLocal()

        session_factory = engines_cache[cache_key]
        return session_factory()

    # Fallback a Base de Datos Local protegida
    return SesionLocal()

def get_db(request: Request = None):
    """
    Dependencia de FastAPI que extrae automáticamente la cabecera 'X-Taller-Slug'
    inyectada por el Frontend en cada petición y provee la sesión de BDD correspondiente.
    """
    taller_slug = "default"
    if request:
        taller_slug = request.headers.get("X-Taller-Slug") or request.headers.get("x-taller-slug") or "default"

    db = get_db_session_for_taller(taller_slug)
    try:
        yield db
    finally:
        db.close()

def ejecutar_migraciones_sqlite():
    """
    Ejecuta migraciones automáticas sobre la base de datos SQLite (taller.db)
    agregando columnas faltantes a tablas existentes sin borrar datos.
    """
    try:
        conn = sqlite3.connect(APP_PATHS['db_path'])
        cursor = conn.cursor()

        # 1. Migración para tabla 'facturas'
        cursor.execute("PRAGMA table_info(facturas)")
        cols_facturas = [row[1] for row in cursor.fetchall()]
        if cols_facturas and "mecanico_id" not in cols_facturas:
            cursor.execute("ALTER TABLE facturas ADD COLUMN mecanico_id INTEGER REFERENCES usuarios(id)")
            print("Migración SQLite: columna 'mecanico_id' añadida con éxito a la tabla 'facturas'")

        # 2. Migración para tabla 'presupuestos'
        cursor.execute("PRAGMA table_info(presupuestos)")
        cols_presupuestos = [row[1] for row in cursor.fetchall()]
        if cols_presupuestos and "mecanico_id" not in cols_presupuestos:
            cursor.execute("ALTER TABLE presupuestos ADD COLUMN mecanico_id INTEGER REFERENCES usuarios(id)")
            print("Migración SQLite: columna 'mecanico_id' añadida con éxito a la tabla 'presupuestos'")

        conn.commit()
        conn.close()
    except Exception as e:
        print("Aviso de migración SQLite:", e)
