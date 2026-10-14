# backend/modulos/inventario/services.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import models, schemas

# ==========================================
# LEER (GET)
# ==========================================

def get_producto(db: Session, producto_id: int):
    """Busca un producto/repuesto específico por su ID."""
    return db.query(models.Producto).filter(models.Producto.id == producto_id).first()

def get_producto_por_codigo(db: Session, codigo: str):
    """Busca por código de barras o SKU."""
    return db.query(models.Producto).filter(models.Producto.codigo == codigo).first()

def get_productos(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene el listado general del inventario."""
    return db.query(models.Producto).offset(skip).limit(limit).all()

def get_productos_bajo_stock(db: Session):
    """
    Devuelve solo los productos cuya cantidad actual 
    es menor o igual a su límite de stock crítico.
    """
    return db.query(models.Producto).filter(models.Producto.cantidad <= models.Producto.stock_critico).all()

# ==========================================
# CREAR (POST)
# ==========================================

def create_producto(db: Session, producto: schemas.ProductoCreate):
    """Registra un nuevo repuesto en el sistema."""
    db_producto = models.Producto(**producto.model_dump())
    
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    
    return db_producto

# ==========================================
# ACTUALIZAR (PUT / PATCH)
# ==========================================

def update_producto(db: Session, producto_id: int, producto_data: schemas.ProductoUpdate):
    """Actualiza datos generales del producto (precio, nombre, categoría)."""
    db_producto = get_producto(db, producto_id)
    
    if db_producto:
        update_data = producto_data.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_producto, key, value)
            
        db.commit()
        db.refresh(db_producto)
        
    return db_producto

def actualizar_stock(db: Session, producto_id: int, cantidad_a_restar: int):
    """
    Esta función se ejecuta automáticamente cuando se emite una factura o 
    se cierra una orden de trabajo. Restará la cantidad usada del inventario.
    (Si necesitas sumar stock, simplemente le pasas un número negativo).
    """
    db_producto = get_producto(db, producto_id)
    
    if db_producto:
        # Validación: evitamos que el stock quede en negativo si se está restando
        if cantidad_a_restar > 0 and db_producto.cantidad < cantidad_a_restar:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente de '{db_producto.nombre}'. Stock disponible: {db_producto.cantidad}, solicitado: {cantidad_a_restar}."
            )
        
        db_producto.cantidad -= cantidad_a_restar
        db.commit()
        db.refresh(db_producto)
        
    return db_producto

# ==========================================
# ELIMINAR (DELETE)
# ==========================================

def delete_producto(db: Session, producto_id: int):
    """Elimina un producto del catálogo."""
    db_producto = get_producto(db, producto_id)
    
    if db_producto:
        db.delete(db_producto)
        db.commit()
        
    return db_producto