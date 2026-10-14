# backend/modulos/ordenes/services.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from . import models, schemas
from modulos.inventario import services as inventario_services
from modulos.vehiculos.models import Vehiculo 

def get_orden(db: Session, orden_id: int):
    return db.query(models.OrdenTrabajo).filter(models.OrdenTrabajo.id == orden_id).first()

def get_ordenes(db: Session, skip: int = 0, limit: int = 100, vehiculo_id: Optional[int] = None):
    query = db.query(models.OrdenTrabajo)
    if vehiculo_id:
        query = query.filter(models.OrdenTrabajo.vehiculo_id == vehiculo_id)
    return query.offset(skip).limit(limit).all()

def create_orden(db: Session, orden: schemas.OrdenCreate):
    total_calculado = orden.costo_mano_obra
    
    vehiculo_actual = db.query(Vehiculo).filter(Vehiculo.id == orden.vehiculo_id).first()
    cliente_congelado_id = vehiculo_actual.cliente_id if vehiculo_actual else None
    
    db_orden = models.OrdenTrabajo(
        vehiculo_id=orden.vehiculo_id,
        cliente_id=cliente_congelado_id, 
        mecanico_id=orden.mecanico_id,
        descripcion_falla=orden.descripcion_falla,
        estado=orden.estado,
        costo_mano_obra=orden.costo_mano_obra,
        kilometros=orden.kilometros,
        nivel_combustible=orden.nivel_combustible,
        frente_stereo=orden.frente_stereo,
        rueda_auxilio=orden.rueda_auxilio,
        codigo_stereo=orden.codigo_stereo,
        total=0  
    )
    
    db.add(db_orden)
    db.flush() 

    for detalle in orden.detalles:
        producto = inventario_services.get_producto(db, detalle.producto_id)
        if not producto:
            raise HTTPException(status_code=404, detail=f"El producto con ID {detalle.producto_id} no existe.")
            
        if producto.cantidad < detalle.cantidad:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente de '{producto.nombre}'. Intentas usar {detalle.cantidad} y quedan {producto.cantidad}."
            )

        total_calculado += (producto.precio * detalle.cantidad)

        db_detalle = models.DetalleOrden(
            orden_id=db_orden.id,
            producto_id=producto.id,
            cantidad=detalle.cantidad,
            precio_unitario=producto.precio
        )
        db.add(db_detalle)
        inventario_services.actualizar_stock(db, producto.id, detalle.cantidad)

    db_orden.total = total_calculado
    db.commit()
    db.refresh(db_orden)
    
    return db_orden

def update_orden(db: Session, orden_id: int, orden_data: schemas.OrdenUpdate):
    db_orden = get_orden(db, orden_id)
    
    if db_orden:
        update_data = orden_data.model_dump(exclude_unset=True)
        
        if "detalles" in update_data:
            nuevos_detalles = update_data.pop("detalles")
            
            for viejo_detalle in db_orden.detalles:
                inventario_services.actualizar_stock(db, viejo_detalle.producto_id, -viejo_detalle.cantidad)
                db.delete(viejo_detalle)
            
            db.flush() 
            
            nueva_mano_obra = update_data.get("costo_mano_obra", db_orden.costo_mano_obra)
            total_calculado = nueva_mano_obra
            
            for detalle in nuevos_detalles:
                producto = inventario_services.get_producto(db, detalle['producto_id'])
                if not producto or producto.cantidad < detalle['cantidad']:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente para el repuesto ID {detalle['producto_id']}")
                
                total_calculado += (producto.precio * detalle['cantidad'])
                
                nuevo_db_detalle = models.DetalleOrden(
                    orden_id=db_orden.id,
                    producto_id=producto.id,
                    cantidad=detalle['cantidad'],
                    precio_unitario=producto.precio
                )
                db.add(nuevo_db_detalle)
                inventario_services.actualizar_stock(db, producto.id, detalle['cantidad'])
                
            update_data["total"] = total_calculado

        elif "costo_mano_obra" in update_data:
            diferencia = update_data["costo_mano_obra"] - db_orden.costo_mano_obra
            db_orden.total += diferencia

        for key, value in update_data.items():
            setattr(db_orden, key, value)
            
        db.commit()
        db.refresh(db_orden)
        
    return db_orden

def delete_orden(db: Session, orden_id: int, reponer_stock: bool = True):
    db_orden = get_orden(db, orden_id)
    
    if db_orden:
        if reponer_stock:
            for detalle in db_orden.detalles:
                inventario_services.actualizar_stock(db, detalle.producto_id, -detalle.cantidad)
            
        db.delete(db_orden)
        db.commit()
        
    return db_orden