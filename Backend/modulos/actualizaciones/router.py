# backend/modulos/actualizaciones/router.py
from fastapi import APIRouter
from utils.updater import verificar_actualizacion

router = APIRouter(prefix="/actualizaciones", tags=["Actualizaciones Auto-Updater"])

@router.get("/check")
def consultar_actualizaciones():
    return verificar_actualizacion()
