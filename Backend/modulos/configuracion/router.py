# backend/modulos/configuracion/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from . import schemas, services

router = APIRouter(prefix="/configuracion", tags=["Configuración Taller"])

@router.get("/", response_model=schemas.ConfiguracionResponse)
def obtener_configuracion(db: Session = Depends(get_db)):
    return services.get_or_create_configuracion(db)

@router.put("/", response_model=schemas.ConfiguracionResponse)
def actualizar_configuracion(config_data: schemas.ConfiguracionUpdate, db: Session = Depends(get_db)):
    return services.update_configuracion(db, config_data)
