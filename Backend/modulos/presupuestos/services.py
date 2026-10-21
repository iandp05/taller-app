# backend/modulos/presupuestos/services.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from . import models, schemas
from typing import Optional
from modulos.vehiculos.models import Vehiculo

def get_presupuesto(db: Session, presupuesto_id: str):
    return db.query(models.Presupuesto).options(
        joinedload(models.Presupuesto.vehiculo),
        joinedload(models.Presupuesto.cliente),
        joinedload(models.Presupuesto.mecanico)
    ).filter(models.Presupuesto.id == presupuesto_id).first()

def get_presupuestos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Presupuesto).options(
        joinedload(models.Presupuesto.vehiculo),
        joinedload(models.Presupuesto.cliente),
        joinedload(models.Presupuesto.mecanico)
    ).order_by(models.Presupuesto.fecha_creacion.desc()).offset(skip).limit(limit).all()

def create_presupuesto(db: Session, presupuesto: schemas.PresupuestoCreate):
    # PROTECCIÓN 1: Validar existencia del vehículo y congelar al dueño real
    vehiculo_actual = db.query(Vehiculo).filter(Vehiculo.id == presupuesto.vehiculo_id).first()
    if not vehiculo_actual:
        raise HTTPException(status_code=404, detail="El vehículo seleccionado no existe en la base de datos.")
        
    cliente_real_id = vehiculo_actual.cliente_id
    total_calculado = 0.0
    
    db_presupuesto = models.Presupuesto(
        vehiculo_id=presupuesto.vehiculo_id,
        cliente_id=cliente_real_id, # Forzamos el ID real de la DB, no el del request
        mecanico_id=presupuesto.mecanico_id,
        estado=presupuesto.estado,
        validez_dias=presupuesto.validez_dias,
        condiciones_pago=presupuesto.condiciones_pago,
        total=0.0
    )
    
    db.add(db_presupuesto)
    db.flush() 

    for detalle in presupuesto.detalles:
        subtotal = detalle.cantidad * detalle.precio_unitario
        total_calculado += subtotal

        db_detalle = models.DetallePresupuesto(
            presupuesto_id=db_presupuesto.id,
            producto_id=detalle.producto_id,
            descripcion=detalle.descripcion,
            cantidad=detalle.cantidad,
            precio_unitario=detalle.precio_unitario
        )
        db.add(db_detalle)

    db_presupuesto.total = total_calculado
    db.commit()
    db.refresh(db_presupuesto)
    
    return db_presupuesto

def update_presupuesto(db: Session, presupuesto_id: int, presupuesto_data: schemas.PresupuestoUpdate):
    db_presupuesto = get_presupuesto(db, presupuesto_id)
    
    if db_presupuesto:
        update_data = presupuesto_data.model_dump(exclude_unset=True)
        
        # PROTECCIÓN 2: Si se cambia el vehículo, actualizamos automáticamente al cliente
        if "vehiculo_id" in update_data and update_data["vehiculo_id"] != db_presupuesto.vehiculo_id:
            nuevo_vehiculo = db.query(Vehiculo).filter(Vehiculo.id == update_data["vehiculo_id"]).first()
            if not nuevo_vehiculo:
                raise HTTPException(status_code=404, detail="El nuevo vehículo seleccionado no existe.")
            update_data["cliente_id"] = nuevo_vehiculo.cliente_id
        
        # Si la actualización incluye detalles nuevos, recalculamos todo
        if "detalles" in update_data:
            nuevos_detalles = update_data.pop("detalles")
            
            # Borramos los detalles viejos
            for viejo_detalle in db_presupuesto.detalles:
                db.delete(viejo_detalle)
            
            db.flush()
            
            # Insertamos los nuevos y recalculamos el total
            total_calculado = 0.0
            for detalle in nuevos_detalles:
                subtotal = detalle['cantidad'] * detalle['precio_unitario']
                total_calculado += subtotal
                
                nuevo_db_detalle = models.DetallePresupuesto(
                    presupuesto_id=db_presupuesto.id,
                    producto_id=detalle.get('producto_id'),
                    descripcion=detalle['descripcion'],
                    cantidad=detalle['cantidad'],
                    precio_unitario=detalle['precio_unitario']
                )
                db.add(nuevo_db_detalle)
                
            update_data["total"] = total_calculado

        for key, value in update_data.items():
            setattr(db_presupuesto, key, value)
            
        db.commit()
        db.refresh(db_presupuesto)
        
    return db_presupuesto

def delete_presupuesto(db: Session, presupuesto_id: int):
    db_presupuesto = get_presupuesto(db, presupuesto_id)
    if db_presupuesto:
        db.delete(db_presupuesto)
        db.commit()
    return db_presupuesto