# backend/modulos/sync/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from . import models

router = APIRouter(prefix="/sync", tags=["Sincronización"])

@router.get("/estado")
def obtener_estado_sincronizacion(db: Session = Depends(get_db)):
    pendientes = db.query(models.SyncQueue).filter(models.SyncQueue.status == "PENDING").count()
    completados = db.query(models.SyncQueue).filter(models.SyncQueue.status == "COMPLETED").count()
    return {
        "pendientes": pendientes,
        "completados": completados,
        "online": True
    }
