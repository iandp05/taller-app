# backend/utils/backups.py
import os
import shutil
import time
from datetime import datetime
from utils.paths import APP_PATHS

def ejecutar_backup_diario():
    """
    Genera un respaldo automático de la base de datos 'taller.db' en la subcarpeta 'Backups/'.
    Elimina automáticamente los respaldos antiguos con más de 14 días.
    """
    try:
        db_source = APP_PATHS['db_path']
        if not os.path.exists(db_source):
            return

        backups_dir = APP_PATHS['backups_dir']
        fecha_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"taller_backup_{fecha_str}.db"
        target_backup_path = os.path.join(backups_dir, backup_filename)

        # Copiar base de datos
        shutil.copy2(db_source, target_backup_path)
        print(f"Respaldo automático generado con éxito: {target_backup_path}")

        # Limpiar respaldos antiguos de más de 14 días (14 * 86400 segundos)
        limite_tiempo = time.time() - (14 * 86400)
        for f in os.listdir(backups_dir):
            file_path = os.path.join(backups_dir, f)
            if os.path.isfile(file_path) and f.startswith("taller_backup_") and f.endswith(".db"):
                if os.path.getmtime(file_path) < limite_tiempo:
                    try:
                        os.remove(file_path)
                        print(f"Respaldo antiguo eliminado por mantenimiento: {f}")
                    except Exception as err:
                        print("Aviso al eliminar respaldo antiguo:", err)

    except Exception as e:
        print("Aviso de respaldo automático SQLite:", e)
