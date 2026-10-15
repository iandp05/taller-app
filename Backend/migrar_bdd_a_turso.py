# backend/migrar_bdd_a_turso.py
import sqlite3
import os
import json
import urllib.request
from dotenv import load_dotenv
from utils.paths import APP_PATHS

load_dotenv()

turso_url = os.environ.get("TURSO_DATABASE_URL", "").replace("libsql://", "https://") + "/v2/pipeline"
turso_token = os.environ.get("TURSO_AUTH_TOKEN", "")

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
            print(f"Tabla '{table_name}' no tiene registros para migrar.")
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

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = data.get("results", [])
            print(f"Tabla '{table_name}': {len(rows)} registros migrados con éxito a Turso Cloud DB.")
    except Exception as e:
        print(f"Aviso migrando tabla '{table_name}':", e)

def migrar_base_de_datos_completa():
    local_db_path = APP_PATHS['db_path']
    if not os.path.exists(local_db_path):
        print("No se encontró la base de datos local en:", local_db_path)
        return

    print(f"Iniciando migración completa desde BDD local ({local_db_path}) hacia Turso Cloud DB...")
    conn = sqlite3.connect(local_db_path)

    tablas = [
        "usuarios",
        "clientes",
        "vehiculos",
        "catalogo_vehiculos",
        "inventario",
        "ordenes_trabajo",
        "presupuestos",
        "facturas",
        "configuracion"
    ]

    for tabla in tablas:
        migrar_tabla(conn, tabla)

    conn.close()
    print("--- ¡Migración Completa Finalizada con Éxito en Turso Cloud DB! ---")

if __name__ == "__main__":
    migrar_base_de_datos_completa()
