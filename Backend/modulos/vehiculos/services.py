# backend/modulos/vehiculos/services.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException 
from . import models, schemas

def get_vehiculo(db: Session, vehiculo_id: int):
    return db.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()

def get_vehiculos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Vehiculo).offset(skip).limit(limit).all()

def get_vehiculo_por_patente(db: Session, patente: str):
    return db.query(models.Vehiculo).filter(models.Vehiculo.patente == patente).first()

def create_vehiculo(db: Session, vehiculo: schemas.VehiculoCreate):
    db_vehiculo = models.Vehiculo(**vehiculo.model_dump())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

def update_vehiculo(db: Session, vehiculo_id: int, vehiculo_data: schemas.VehiculoUpdate):
    db_vehiculo = get_vehiculo(db, vehiculo_id)
    if db_vehiculo:
        update_data = vehiculo_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_vehiculo, key, value)
        db.commit()
        db.refresh(db_vehiculo)
    return db_vehiculo

def cambiar_dueno(db: Session, vehiculo_id: int, nuevo_cliente_id: int):
    db_vehiculo = get_vehiculo(db, vehiculo_id)
    if db_vehiculo:
        db_vehiculo.cliente_id = nuevo_cliente_id
        db.commit()
        db.refresh(db_vehiculo)
    return db_vehiculo

def delete_vehiculo(db: Session, vehiculo_id: int):
    db_vehiculo = get_vehiculo(db, vehiculo_id)
    if db_vehiculo:
        # Validamos primero contra órdenes manualmente
        if db_vehiculo.ordenes:
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar un vehículo que tiene órdenes de trabajo activas o archivadas."
            )
            
        # Protegemos contra Facturas o Presupuestos usando IntegrityError
        try:
            db.delete(db_vehiculo)
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar este vehículo porque está asociado a comprobantes fiscales o presupuestos emitidos."
            )
            
    return db_vehiculo