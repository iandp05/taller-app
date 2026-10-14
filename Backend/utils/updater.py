# backend/utils/updater.py
import urllib.request
import json

APP_VERSION = "1.0.0"
REMOTE_UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/taller-erp/updates/main/latest.json"

def verificar_actualizacion():
    """
    Consulta si existe una nueva versión liberada en el canal de actualizaciones.
    Si no hay conexión a Internet, atrapa el error silenciosamente y retorna que no hay actualización.
    """
    try:
        req = urllib.request.Request(
            REMOTE_UPDATE_MANIFEST_URL,
            headers={"User-Agent": "TallerERP-DesktopApp/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                remote_version = data.get("version", APP_VERSION)
                download_url = data.get("url", "")
                release_notes = data.get("notes", "")

                return {
                    "version_actual": APP_VERSION,
                    "version_disponible": remote_version,
                    "hay_actualizacion": remote_version != APP_VERSION,
                    "download_url": download_url,
                    "release_notes": release_notes
                }
    except Exception as e:
        print("Aviso de Auto-Updater (Sin conexión o canal no disponible):", e)

    return {
        "version_actual": APP_VERSION,
        "version_disponible": APP_VERSION,
        "hay_actualizacion": False,
        "download_url": "",
        "release_notes": ""
    }
