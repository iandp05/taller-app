# backend/modulos/facturas/services.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from . import models, schemas
from modulos.inventario import services as inventario_services

def get_factura(db: Session, factura_id: str):
    return db.query(models.Factura).options(
        joinedload(models.Factura.vehiculo),
        joinedload(models.Factura.cliente),
        joinedload(models.Factura.mecanico)
    ).filter(models.Factura.id == factura_id).first()

def get_facturas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Factura).options(
        joinedload(models.Factura.vehiculo),
        joinedload(models.Factura.cliente),
        joinedload(models.Factura.mecanico)
    ).order_by(models.Factura.fecha_emision.desc()).offset(skip).limit(limit).all()

def create_factura(db: Session, factura: schemas.FacturaCreate):
    total_general = 0.0
    neto_general = 0.0
    iva_general = 0.0

    db_factura = models.Factura(
        vehiculo_id=factura.vehiculo_id,
        cliente_id=factura.cliente_id,
        mecanico_id=factura.mecanico_id,
        tipo_comprobante=factura.tipo_comprobante,
        punto_venta=factura.punto_venta,
        numero_comprobante=factura.numero_comprobante,
        cae=factura.cae,
        cae_vencimiento=factura.cae_vencimiento,
        condicion_venta=factura.condicion_venta,
        neto_gravado=0.0,
        iva_21=0.0,
        total=0.0
    )
    
    db.add(db_factura)
    db.flush() 

    for detalle in factura.detalles:
        subtotal_item = detalle.cantidad * detalle.precio_unitario
        
        # Desglose fiscal estándar (IVA 21% incluido en precio unitario)
        neto_item = subtotal_item / 1.21
        iva_item = subtotal_item - neto_item

        neto_general += neto_item
        iva_general += iva_item
        total_general += subtotal_item

        # SI EL ÍTEM ES UN PRODUCTO DE INVENTARIO, DESCONTAMOS STOCK DEFINITIVAMENTE
        if detalle.producto_id:
            producto = inventario_services.get_producto(db, detalle.producto_id)
            if not producto:
                raise HTTPException(status_code=404, detail=f"El producto con ID {detalle.producto_id} no existe.")
            if producto.cantidad < detalle.cantidad:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente de '{producto.nombre}'. Quedan {producto.cantidad} unidades."
                )
            inventario_services.actualizar_stock(db, producto.id, detalle.cantidad)

        db_detalle = models.DetalleFactura(
            factura_id=db_factura.id,
            producto_id=detalle.producto_id,
            descripcion=detalle.descripcion,
            cantidad=detalle.cantidad,
            precio_unitario=detalle.precio_unitario,
            alicuota_iva=detalle.alicuota_iva,
            subtotal=subtotal_item
        )
        db.add(db_detalle)

    db_factura.neto_gravado = round(neto_general, 2)
    db_factura.iva_21 = round(iva_general, 2)
    db_factura.total = round(total_general, 2)

    db.commit()
    db.refresh(db_factura)
    
    return db_factura

def delete_factura(db: Session, factura_id: str, reponer_stock: bool = True):
    db_factura = get_factura(db, factura_id)
    if db_factura:
        if reponer_stock:
            for detalle in db_factura.detalles:
                if detalle.producto_id:
                    # Reponemos el stock restando la cantidad (inverso a actualizar_stock positivo)
                    inventario_services.actualizar_stock(db, detalle.producto_id, -detalle.cantidad)
                    
        db.delete(db_factura)
        db.commit()
    return db_factura