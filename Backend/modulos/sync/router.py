# backend/modulos/sync/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from . import models
from modulos.clientes import models as clientes_models
from modulos.vehiculos import models as vehiculos_models
from modulos.ordenes import models as ordenes_models
from modulos.presupuestos import models as presupuestos_models

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

@router.get("/version")
def obtener_version_base_datos(db: Session = Depends(get_db)):
    try:
        cli_cnt = db.query(clientes_models.Cliente).count()
        veh_cnt = db.query(vehiculos_models.Vehiculo).count()
        ord_cnt = db.query(ordenes_models.OrdenTrabajo).count()
        pre_cnt = db.query(presupuestos_models.Presupuesto).count()
        sq_cnt = db.query(models.SyncQueue).filter(models.SyncQueue.status == "COMPLETED").count()
        version_hash = f"{cli_cnt}_{veh_cnt}_{ord_cnt}_{pre_cnt}_{sq_cnt}"
    except Exception:
        version_hash = "1"

    return {"version": version_hash}
