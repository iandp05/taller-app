# backend/modulos/inventario/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/inventario", tags=["Inventario"])

# ==========================================
# CREAR (POST)
# ==========================================
@router.post("/", response_model=schemas.ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    if producto.codigo:
        db_producto = services.get_producto_por_codigo(db, codigo=producto.codigo)
        if db_producto:
            raise HTTPException(status_code=400, detail="Ya existe un producto con este código de barras/SKU.")
            
    return services.create_producto(db=db, producto=producto)

# ==========================================
# LEER - ALERTAS (GET) 
# ==========================================
@router.get("/alertas", response_model=List[schemas.ProductoResponse])
def obtener_alertas_stock(db: Session = Depends(get_db)):
    """
    Endpoint para el Dashboard. Devuelve repuestos con stock crítico.
    """
    return services.get_productos_bajo_stock(db)

# ==========================================
# LEER (GET)
# ==========================================
@router.get("/", response_model=List[schemas.ProductoResponse])
def leer_productos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_productos(db, skip=skip, limit=limit)

@router.get("/{producto_id}", response_model=schemas.ProductoResponse)
def leer_producto(producto_id: int, db: Session = Depends(get_db)):
    db_producto = services.get_producto(db, producto_id=producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado en el inventario.")
    return db_producto

# ==========================================
# ACTUALIZAR (PUT)
# ==========================================
@router.put("/{producto_id}", response_model=schemas.ProductoResponse)
def actualizar_producto(producto_id: int, producto_data: schemas.ProductoUpdate, db: Session = Depends(get_db)):
    # VALIDACIÓN CLAVE: Evita crasheos 500 si se intenta usar un código que ya tiene otro repuesto
    if producto_data.codigo:
        db_existente = services.get_producto_por_codigo(db, codigo=producto_data.codigo)
        if db_existente and db_existente.id != producto_id:
            raise HTTPException(status_code=400, detail="El código ingresado ya pertenece a otro repuesto del inventario.")

    db_producto = services.update_producto(db, producto_id=producto_id, producto_data=producto_data)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return db_producto

# ==========================================
# ELIMINAR (DELETE)
# ==========================================
@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    # Si intentas eliminar un producto que ya está facturado o en un presupuesto,
    # SQLAlchemy lanzará un IntegrityError para proteger la contabilidad.
    try:
        db_producto = services.delete_producto(db, producto_id=producto_id)
        if db_producto is None:
            raise HTTPException(status_code=404, detail="Producto no encontrado.")
    except Exception as e:
        raise HTTPException(status_code=400, detail="No se puede eliminar este repuesto porque ya está asociado a facturas, presupuestos u órdenes de trabajo.")