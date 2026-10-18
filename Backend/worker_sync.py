# backend/worker_sync.py
import time
import json
import os
import threading
import sqlite3
from dotenv import load_dotenv
from utils.paths import APP_PATHS
import utils.turso_driver

load_dotenv()

def procesar_cola_sincronizacion():
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

            if isinstance(params, dict):
                sql_params = list(params.values())
            elif isinstance(params, (list, tuple)):
                sql_params = params
            else:
                sql_params = ()

            try:
                turso_cur.execute(sql_statement, sql_params)
                cursor_local.execute("UPDATE sync_queue SET status='COMPLETED' WHERE id=?", (req_id,))
                conn_local.commit()
            except Exception as e:
                print(f"Worker Sync: Error ejecutando item {req_id} en Turso:", e)
                cursor_local.execute("UPDATE sync_queue SET retries = retries + 1 WHERE id=?", (req_id,))
                conn_local.commit()
                break  # Abortar ciclo para preservar orden estricto

        conn_local.close()
    except Exception as err:
        print("Worker Sync: Error procesando cola local:", err)

def sincronizar_desde_turso():
    """
    Sincronización descendente (Turso -> Local) leyendo registros modificados.
    """
    turso_url_env = os.environ.get("TURSO_DATABASE_URL")
    turso_token = os.environ.get("TURSO_AUTH_TOKEN")
    if not turso_url_env or not turso_token:
        return

def iniciar_worker_sync_background(intervalo_segundos: int = 7):
    def loop():
        while True:
            try:
                procesar_cola_sincronizacion()
            except Exception as e:
                print("Excepción en loop de sincronización:", e)
            time.sleep(intervalo_segundos)

    thread = threading.Thread(target=loop, daemon=True, name="WorkerSyncTurso")
    thread.start()
    print(f"--- Worker Sync de Turso iniciado en segundo plano (intervalo {intervalo_segundos}s) ---")
    return thread

if __name__ == "__main__":
    print("Ejecutando worker de sincronización manualmente...")
    procesar_cola_sincronizacion()
