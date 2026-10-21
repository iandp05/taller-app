# backend/modulos/ordenes/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/ordenes", tags=["Órdenes de Trabajo"])

@router.post("/", response_model=schemas.OrdenResponse, status_code=status.HTTP_201_CREATED)
def crear_orden(orden: schemas.OrdenCreate, db: Session = Depends(get_db)):
    return services.create_orden(db=db, orden=orden)

@router.get("/", response_model=List[schemas.OrdenResponse])
def leer_ordenes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_ordenes(db, skip=skip, limit=limit)

@router.get("/{orden_id}", response_model=schemas.OrdenResponse)
def leer_orden(orden_id: str, db: Session = Depends(get_db)):
    db_orden = services.get_orden(db, orden_id=orden_id)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return db_orden

@router.put("/{orden_id}", response_model=schemas.OrdenResponse)
def actualizar_orden(orden_id: str, orden_data: schemas.OrdenUpdate, db: Session = Depends(get_db)):
    db_orden = services.update_orden(db, orden_id=orden_id, orden_data=orden_data)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return db_orden

@router.delete("/{orden_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_orden(orden_id: str, reponer_stock: bool = True, db: Session = Depends(get_db)):
    db_orden = services.delete_orden(db, orden_id=orden_id, reponer_stock=reponer_stock)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
