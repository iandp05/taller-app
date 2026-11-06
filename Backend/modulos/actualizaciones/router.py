# backend/modulos/actualizaciones/router.py
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from utils.updater import verificar_actualizacion

router = APIRouter(prefix="/actualizaciones", tags=["Actualizaciones Auto-Updater"])

@router.get("/check")
def consultar_actualizaciones():
    return verificar_actualizacion()

@router.get("/descargar")
def descargar_actualizacion():
    """
    Sirve directamente el instalador/ejecutable .exe para la actualización del cliente de escritorio.
    """
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
