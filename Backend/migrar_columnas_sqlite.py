# backend/migrar_columnas_sqlite.py
import sqlite3
from utils.paths import APP_PATHS

local_db_path = APP_PATHS['db_path']
conn = sqlite3.connect(local_db_path)
cursor = conn.cursor()

tablas = [
    "usuarios",
    "clientes",
    "vehiculos",
    "inventario",
    "ordenes_trabajo",
    "detalle_ordenes",
    "presupuestos",
    "detalle_presupuestos",
    "facturas",
    "detalle_facturas",
    "configuracion_taller"
]

for tabla in tablas:
    try:
        cursor.execute(f"PRAGMA table_info({tabla})")
        cols = [row[1] for row in cursor.fetchall()]
        if cols and "updated_at" not in cols:
            cursor.execute(f"ALTER TABLE {tabla} ADD COLUMN updated_at DATETIME;")
            print(f"Columna 'updated_at' agregada con éxito a la tabla local '{tabla}'")
    except Exception as e:
        print(f"Aviso migrando tabla local '{tabla}':", e)

conn.commit()
conn.close()
