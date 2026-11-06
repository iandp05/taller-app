# backend/utils/updater.py
import urllib.request
import json
import os

APP_VERSION = "1.0.1"
REMOTE_UPDATE_MANIFEST_URLS = [
    "https://raw.githubusercontent.com/iandp05/taller-app/main/version.json",
    "https://taller-backend-a7rb.onrender.com/version.json"
]

def verificar_actualizacion():
    """
    Consulta si existe una nueva versión liberada en el canal de actualizaciones.
    Si no hay conexión a Internet o falla la petición remota, revisa version.json local como respaldo.
    """
    for url in REMOTE_UPDATE_MANIFEST_URLS:
        try:
            req = urllib.request.Request(
                url,
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
            print(f"Aviso Auto-Updater (Falló URL {url}):", e)

    # Respaldo local si existe version.json en la raíz del proyecto
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    local_version_file = os.path.join(root_dir, "version.json")
    if os.path.exists(local_version_file):
        try:
            with open(local_version_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                remote_version = data.get("version", APP_VERSION)
                return {
                    "version_actual": APP_VERSION,
                    "version_disponible": remote_version,
                    "hay_actualizacion": remote_version != APP_VERSION,
                    "download_url": data.get("url", ""),
                    "release_notes": data.get("notes", "")
                }
        except Exception as e:
            print("Error leyendo version.json local:", e)

    return {
        "version_actual": APP_VERSION,
        "version_disponible": APP_VERSION,
        "hay_actualizacion": False,
        "download_url": "",
        "release_notes": ""
    }
