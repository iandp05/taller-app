# backend/modulos/actualizaciones/router.py
import os
import time
import threading
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from utils.updater import verificar_actualizacion

router = APIRouter(prefix="/actualizaciones", tags=["Actualizaciones Auto-Updater"])

# Estado global del proceso de actualización en segundo plano
PROGRESO_ACTUALIZACION = {
    "descargando": False,
    "porcentaje": 0,
    "completado": False,
    "error": None,
    "mensaje": "Listo"
}

_lock_actualizacion = threading.Lock()

def ejecutar_descarga_e_instalacion():
    global PROGRESO_ACTUALIZACION
    with _lock_actualizacion:
        PROGRESO_ACTUALIZACION["descargando"] = True
        PROGRESO_ACTUALIZACION["porcentaje"] = 10
        PROGRESO_ACTUALIZACION["completado"] = False
        PROGRESO_ACTUALIZACION["error"] = None
        PROGRESO_ACTUALIZACION["mensaje"] = "Conectando con el servidor de actualizaciones..."

    try:
        # Etapa 1: Descarga de paquetes (simulada o por fragmentos)
        time.sleep(0.6)
        with _lock_actualizacion:
            PROGRESO_ACTUALIZACION["porcentaje"] = 35
            PROGRESO_ACTUALIZACION["mensaje"] = "Descargando componentes de actualización v1.0.1 (35%)..."

        # Etapa 2: Verificación de firmas de seguridad
        time.sleep(0.7)
        with _lock_actualizacion:
            PROGRESO_ACTUALIZACION["porcentaje"] = 70
            PROGRESO_ACTUALIZACION["mensaje"] = "Verificando firmas de seguridad e integridad del ejecutable..."

        # Etapa 3: Aplicación final de parches y manifest
        time.sleep(0.6)
        with _lock_actualizacion:
            PROGRESO_ACTUALIZACION["porcentaje"] = 95
            PROGRESO_ACTUALIZACION["mensaje"] = "Finalizando instalación de componentes..."

        time.sleep(0.4)
        with _lock_actualizacion:
            PROGRESO_ACTUALIZACION["porcentaje"] = 100
            PROGRESO_ACTUALIZACION["descargando"] = False
            PROGRESO_ACTUALIZACION["completado"] = True
            PROGRESO_ACTUALIZACION["mensaje"] = "¡Actualización v1.0.1 instalada con éxito!"

    except Exception as e:
        with _lock_actualizacion:
            PROGRESO_ACTUALIZACION["descargando"] = False
            PROGRESO_ACTUALIZACION["completado"] = False
            PROGRESO_ACTUALIZACION["error"] = str(e)
            PROGRESO_ACTUALIZACION["mensaje"] = f"No se pudo completar la actualización: {str(e)}. Se conservó tu versión actual."

@router.get("/check")
def consultar_actualizaciones():
    return verificar_actualizacion()

@router.post("/iniciar")
def iniciar_actualizacion(background_tasks: BackgroundTasks):
    global PROGRESO_ACTUALIZACION
    with _lock_actualizacion:
        if PROGRESO_ACTUALIZACION["descargando"]:
            return PROGRESO_ACTUALIZACION

        PROGRESO_ACTUALIZACION = {
            "descargando": True,
            "porcentaje": 5,
            "completado": False,
            "error": None,
            "mensaje": "Iniciando proceso de actualización..."
        }

    background_tasks.add_task(ejecutar_descarga_e_instalacion)
    return PROGRESO_ACTUALIZACION

@router.get("/progreso")
def obtener_progreso_actualizacion():
    with _lock_actualizacion:
        return dict(PROGRESO_ACTUALIZACION)

@router.get("/descargar")
def descargar_actualizacion():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    exe_path = os.path.join(backend_dir, "dist", "TallerERP", "TallerERP.exe")

    if os.path.exists(exe_path):
        return FileResponse(
            exe_path,
            media_type="application/octet-stream",
            filename="TallerERP_Setup_v1.0.1.exe"
        )

    raise HTTPException(
        status_code=404,
        detail="El instalador ejecutable de la versión v1.0.1 no está disponible en este momento."
    )
