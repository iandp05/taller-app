# backend/utils/paths.py
import os
import sys
import shutil

def get_desktop_dir():
    user_profile = os.environ.get("USERPROFILE", os.path.expanduser("~"))
    candidates = [
        os.path.join(user_profile, "OneDrive", "Desktop"),
        os.path.join(user_profile, "OneDrive", "Escritorio"),
        os.path.join(user_profile, "Desktop"),
        os.path.join(user_profile, "Escritorio")
    ]
    for d in candidates:
        if os.path.exists(d):
            return d
    return os.path.join(user_profile, "Desktop")

def get_app_paths():
    r"""
    Gestiona la estructura de carpetas organizada directamente en el Escritorio del usuario:
    - C:\Users\<Usuario>\Desktop\TallerERP_Datos\
      - BaseDeDatos/ : Almacena la base de datos SQLite 'taller.db'
      - PDFs/ : Subcarpetas Ordenes, Presupuestos, Facturas
      - Backups/ : Copias de seguridad automáticas
    """
    desktop = get_desktop_dir()
    root_dir = os.path.join(desktop, "TallerERP_Datos")

    db_dir = os.path.join(root_dir, "BaseDeDatos")
    pdf_dir = os.path.join(root_dir, "PDFs")
    pdf_ordenes = os.path.join(pdf_dir, "Ordenes")
    pdf_presupuestos = os.path.join(pdf_dir, "Presupuestos")
    pdf_facturas = os.path.join(pdf_dir, "Facturas")
    backups_dir = os.path.join(root_dir, "Backups")

    folders = [root_dir, db_dir, pdf_dir, pdf_ordenes, pdf_presupuestos, pdf_facturas, backups_dir]
    for folder in folders:
        os.makedirs(folder, exist_ok=True)

    target_db_path = os.path.join(db_dir, "taller.db")

    # Si existe BDD previa en APPDATA o en la raíz del proyecto, trasladarla al Escritorio
    appdata_db = os.path.join(os.environ.get("APPDATA", ""), "TallerERP_Datos", "BaseDeDatos", "taller.db")
    local_dev_db = os.path.join(os.path.dirname(os.path.dirname(__file__)), "taller.db")

    source_db = None
    if os.path.exists(appdata_db):
        source_db = appdata_db
    elif os.path.exists(local_dev_db):
        source_db = local_dev_db

    if source_db and not os.path.exists(target_db_path):
        try:
            shutil.copy2(source_db, target_db_path)
            print(f"Base de datos 'taller.db' trasladada con éxito a carpeta del Escritorio: {target_db_path}")
        except Exception as e:
            print("Aviso al migrar base de datos local:", e)

    return {
        "root": root_dir,
        "db_dir": db_dir,
        "db_path": target_db_path,
        "pdf_dir": pdf_dir,
        "pdf_ordenes": pdf_ordenes,
        "pdf_presupuestos": pdf_presupuestos,
        "pdf_facturas": pdf_facturas,
        "backups_dir": backups_dir
    }

APP_PATHS = get_app_paths()
