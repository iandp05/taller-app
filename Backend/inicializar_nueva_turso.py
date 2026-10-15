# backend/inicializar_nueva_turso.py
import sqlite3
import os
import json
import urllib.request
from sqlalchemy import create_engine
from database import Base, DEFAULT_TURSO_URL, DEFAULT_TURSO_TOKEN
import utils.turso_driver
from utils.paths import APP_PATHS

turso_url = DEFAULT_TURSO_URL.replace("libsql://", "https://").rstrip("/") + "/v2/pipeline"
turso_token = DEFAULT_TURSO_TOKEN

print("1. Conectando a Turso DB para crear todas las tablas (DDL)...")
engine_turso = create_engine(
    "sqlite://",
    creator=lambda: utils.turso_driver.connect(DEFAULT_TURSO_URL, DEFAULT_TURSO_TOKEN)
)
Base.metadata.create_all(bind=engine_turso)
print("--- ¡Las 9 tablas han sido creadas con éxito en Turso Cloud DB! ---")

def _convert_arg(arg):
    if arg is None:
        return {"type": "null"}
    elif isinstance(arg, bool):
        return {"type": "integer", "value": "1" if arg else "0"}
    elif isinstance(arg, int):
        return {"type": "integer", "value": str(arg)}
    elif isinstance(arg, float):
        return {"type": "float", "value": arg}
    else:
        return {"type": "text", "value": str(arg)}

def migrar_tabla(local_conn, table_name):
    cursor = local_conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info({table_name});")
        cols_info = cursor.fetchall()
        if not cols_info:
            return

        col_names = [col[1] for col in cols_info]
        cursor.execute(f"SELECT * FROM {table_name};")
        rows = cursor.fetchall()
        if not rows:
            print(f"Tabla '{table_name}': sin registros locales para migrar.")
            return

        placeholders = ", ".join(["?"] * len(col_names))
        cols_str = ", ".join([f'"{c}"' for c in col_names])
        sql_insert = f'INSERT OR REPLACE INTO "{table_name}" ({cols_str}) VALUES ({placeholders});'

        requests_list = []
        for row in rows:
            args = [_convert_arg(val) for val in row]
            requests_list.append({
                "type": "execute",
                "stmt": {
                    "sql": sql_insert,
                    "args": args
                }
            })

        payload = {"requests": requests_list}
        req = urllib.request.Request(
            turso_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {turso_token}",
                "Content-Type": "application/json"
            }
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"Tabla '{table_name}': {len(rows)} registros copiados a Turso Cloud DB.")
    except Exception as e:
        print(f"Aviso en tabla '{table_name}':", e)

print("2. Migrando registros desde la base de datos local...")
local_db_path = APP_PATHS['db_path']
if os.path.exists(local_db_path):
    conn = sqlite3.connect(local_db_path)
    tablas = [
        "usuarios",
        "clientes",
        "vehiculos",
        "inventario",
        "ordenes_trabajo",
        "presupuestos",
        "facturas",
        "configuracion"
    ]
    for tabla in tablas:
        migrar_tabla(conn, tabla)
    conn.close()

print("--- ¡Inicialización y Migración Completa Finalizada! ---")
