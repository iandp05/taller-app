# backend/worker_sync.py
import time
import json
import os
import threading
import sqlite3
from database import cargar_env_multi_ruta
from utils.paths import APP_PATHS
import utils.turso_driver

cargar_env_multi_ruta()

def procesar_cola_sincronizacion():
    cargar_env_multi_ruta()
    turso_url_env = os.environ.get("TURSO_DATABASE_URL")
    turso_token = os.environ.get("TURSO_AUTH_TOKEN")

    if not turso_url_env or not turso_token:
        return

    local_db_path = APP_PATHS['db_path']
    if not os.path.exists(local_db_path):
        return

    try:
        conn_local = sqlite3.connect(local_db_path)
        cursor_local = conn_local.cursor()

        cursor_local.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_queue';")
        if not cursor_local.fetchone():
            conn_local.close()
            return

        cursor_local.execute("SELECT id, sql_statement, params FROM sync_queue WHERE status='PENDING' ORDER BY id ASC LIMIT 50;")
        pendientes = cursor_local.fetchall()

        if not pendientes:
            conn_local.close()
            return

        turso_conn = utils.turso_driver.connect(turso_url_env, turso_token)
        turso_cur = turso_conn.cursor()

        for req_id, sql_statement, params_raw in pendientes:
            params = json.loads(params_raw) if params_raw else ()

            is_batch = False
            if isinstance(params, (list, tuple)) and len(params) > 0:
                if isinstance(params[0], (list, tuple, dict)):
                    is_batch = True

            try:
                if is_batch:
                    batch_params = [
                        list(p.values()) if isinstance(p, dict) else p
                        for p in params
                    ]
                    if hasattr(turso_cur, "executemany"):
                        turso_cur.executemany(sql_statement, batch_params)
                    else:
                        for single_param in batch_params:
                            turso_cur.execute(sql_statement, single_param)
                else:
                    if isinstance(params, dict):
                        turso_cur.execute(sql_statement, params)
                    elif isinstance(params, (list, tuple)):
                        turso_cur.execute(sql_statement, params)
                    else:
                        turso_cur.execute(sql_statement, ())

                cursor_local.execute("UPDATE sync_queue SET status='COMPLETED' WHERE id=?", (req_id,))
                conn_local.commit()
            except Exception as e:
                err_str = str(e).upper()
                if any(x in err_str for x in ["UNIQUE", "CONSTRAINT", "PRIMARY KEY", "ALREADY EXISTS"]):
                    print(f"Worker Sync: Registro ya existente en Turso (ítem {req_id}), marcando como COMPLETED:", e)
                    cursor_local.execute("UPDATE sync_queue SET status='COMPLETED' WHERE id=?", (req_id,))
                    conn_local.commit()
                else:
                    print(f"Worker Sync: Error de conexión o red en ítem {req_id}, manteniendo PENDING:", e)
                    cursor_local.execute("UPDATE sync_queue SET retries = retries + 1 WHERE id=?", (req_id,))
                    conn_local.commit()
                    break  # Abortar ciclo para preservar orden estricto cuando no hay red

        conn_local.close()
    except Exception as err:
        print("Worker Sync: Error procesando cola local:", err)

def sincronizar_desde_turso():
    """
    Sincronización descendente (Turso Cloud DB -> SQLite Local):
    Lee los registros guardados en Turso Cloud DB e inserta/actualiza (UPSERT)
    en la base de datos SQLite local para que la App de Escritorio vea en tiempo real
    los datos creados o modificados desde la Web.
    """
    cargar_env_multi_ruta()
    turso_url_env = os.environ.get("TURSO_DATABASE_URL")
    turso_token = os.environ.get("TURSO_AUTH_TOKEN")

    if not turso_url_env or not turso_token:
        return

    local_db_path = APP_PATHS['db_path']
    if not os.path.exists(local_db_path):
        return

    tablas = [
        "usuarios",
        "clientes",
        "vehiculos",
        "inventario",
        "ordenes_trabajo",
        "presupuestos",
        "facturas",
        "configuracion_taller"
    ]

    try:
        turso_conn = utils.turso_driver.connect(turso_url_env, turso_token)
        turso_cur = turso_conn.cursor()

        conn_local = sqlite3.connect(local_db_path)
        cursor_local = conn_local.cursor()

        for tabla in tablas:
            try:
                cursor_local.execute(f"PRAGMA table_info({tabla});")
                cols_local = cursor_local.fetchall()
                if not cols_local:
                    continue

                col_names = [col[1] for col in cols_local]
                cols_str = ", ".join([f'"{c}"' for c in col_names])
                placeholders = ", ".join(["?"] * len(col_names))
                sql_upsert = f'INSERT OR REPLACE INTO "{tabla}" ({cols_str}) VALUES ({placeholders});'

                turso_cur.execute(f'SELECT {cols_str} FROM "{tabla}";')
                rows_turso = turso_cur.fetchall()

                if rows_turso:
                    cursor_local.executemany(sql_upsert, rows_turso)
                    conn_local.commit()
            except Exception as e_t:
                pass

        conn_local.close()
    except Exception as err:
        print("Worker Sync: Error en sincronización descendente Turso -> Local:", err)

def iniciar_worker_sync_background(intervalo_segundos: int = 7):
    def loop():
        while True:
            try:
                # 1. Subida Outbox (Escritorio -> Turso Cloud DB)
                procesar_cola_sincronizacion()

                # 2. Bajada Differential (Turso Cloud DB -> SQLite Local)
                sincronizar_desde_turso()
            except Exception as e:
                print("Excepción en loop de sincronización:", e)
            time.sleep(intervalo_segundos)

    thread = threading.Thread(target=loop, daemon=True, name="WorkerSyncTurso")
    thread.start()
    print(f"--- Worker Sync Bidireccional de Turso iniciado en segundo plano (intervalo {intervalo_segundos}s) ---")
    return thread

if __name__ == "__main__":
    print("Ejecutando worker de sincronización bidireccional manualmente...")
    procesar_cola_sincronizacion()
    sincronizar_desde_turso()
