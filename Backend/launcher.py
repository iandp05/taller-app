# backend/launcher.py
import sys
import os
import socket
import time
import subprocess

CREATE_NO_WINDOW = 0x08000000  # Windows API flag para suprimir consolas CMD

# Solución para PyInstaller --noconsole en Windows:
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Importaciones explícitas de módulos internos para PyInstaller
import utils.paths
import utils.backups
import utils.updater

import uvicorn
import webview
import threading
from main import app

def crear_acceso_directo_escritorio():
    """Crea automáticamente el acceso directo 'Taller ERP.lnk' en el Escritorio de Windows de forma silenciosa."""
    if sys.platform != "win32":
        return
    try:
        user_profile = os.environ.get("USERPROFILE", os.path.expanduser("~"))

        candidatos_escritorio = [
            os.path.join(user_profile, "OneDrive", "Desktop"),
            os.path.join(user_profile, "OneDrive", "Escritorio"),
            os.path.join(user_profile, "Desktop"),
            os.path.join(user_profile, "Escritorio")
        ]

        exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)

        for desktop_dir in candidatos_escritorio:
            if os.path.exists(desktop_dir):
                shortcut_path = os.path.join(desktop_dir, "Taller ERP.lnk")
                vbs_content = (
                    f'Set WshShell = CreateObject("WScript.Shell")\n'
                    f'Set shortcut = WshShell.CreateShortcut("{shortcut_path}")\n'
                    f'shortcut.TargetPath = "{exe_path}"\n'
                    f'shortcut.WorkingDirectory = "{os.path.dirname(exe_path)}"\n'
                    f'shortcut.Description = "Sistema ERP Taller Mecánico"\n'
                    f'shortcut.Save\n'
                )

                temp_dir = os.environ.get("TEMP", "C:\\Temp")
                vbs_path = os.path.join(temp_dir, "make_lnk.vbs")
                with open(vbs_path, "w", encoding="utf-8") as f:
                    f.write(vbs_content)

                # Ejecución silenciosa de VBScript sin abrir ventana negra de comandos CMD
                subprocess.run(["cscript", "//Nologo", vbs_path], creationflags=CREATE_NO_WINDOW, check=False)
                if os.path.exists(vbs_path):
                    os.remove(vbs_path)

    except Exception as e:
        pass

def iniciar_servidor():
    """Inicia el servidor FastAPI en segundo plano."""
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="critical",
        log_config=None,
        reload=False
    )

def esperar_servidor(host="127.0.0.1", port=8000, timeout=15):
    """Espera activamente a que el servidor HTTP de FastAPI esté listo y aceptando conexiones en el puerto 8000."""
    inicio = time.time()
    while time.time() - inicio < timeout:
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except (OSError, ConnectionRefusedError):
            time.sleep(0.1)
    return False

def main():
    # 1. Crear acceso directo en el Escritorio de Windows de forma 100% silenciosa
    crear_acceso_directo_escritorio()

    # 2. Iniciar servidor FastAPI en hilo secundario (daemon)
    server_thread = threading.Thread(target=iniciar_servidor, daemon=True)
    server_thread.start()

    # 3. Aguardar a que el servidor FastAPI esté 100% activo en el puerto 8000 antes de abrir la ventana gráfica
    esperar_servidor("127.0.0.1", 8000, timeout=15)

    # 4. Abrir ventana nativa de escritorio independiente (PyWebView - estilo Android Studio / Steam)
    webview.create_window(
        title="Taller ERP - Sistema de Gestión",
        url="http://127.0.0.1:8000",
        width=1280,
        height=800,
        min_size=(800, 600),
        resizable=True
    )

    # Iniciar bucle gráfico nativo de la ventana
    webview.start()

if __name__ == "__main__":
    main()
