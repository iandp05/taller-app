from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/presupuestos", tags=["Presupuestos"])

@router.post("/", response_model=schemas.PresupuestoResponse, status_code=status.HTTP_201_CREATED)
def crear_presupuesto(presupuesto: schemas.PresupuestoCreate, db: Session = Depends(get_db)):
    return services.create_presupuesto(db=db, presupuesto=presupuesto)

@router.get("/", response_model=List[schemas.PresupuestoResponse])
def leer_presupuestos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_presupuestos(db, skip=skip, limit=limit)

@router.get("/{presupuesto_id}", response_model=schemas.PresupuestoResponse)
def leer_presupuesto(presupuesto_id: int, db: Session = Depends(get_db)):
    db_presupuesto = services.get_presupuesto(db, presupuesto_id=presupuesto_id)
    if db_presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return db_presupuesto

@router.put("/{presupuesto_id}", response_model=schemas.PresupuestoResponse)
def actualizar_presupuesto(presupuesto_id: int, presupuesto_data: schemas.PresupuestoUpdate, db: Session = Depends(get_db)):
    db_presupuesto = services.update_presupuesto(db, presupuesto_id=presupuesto_id, presupuesto_data=presupuesto_data)
    if db_presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return db_presupuesto

@router.delete("/{presupuesto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_presupuesto(presupuesto_id: int, db: Session = Depends(get_db)):
    db_presupuesto = services.delete_presupuesto(db, presupuesto_id=presupuesto_id)
    if db_presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")