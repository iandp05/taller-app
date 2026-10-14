from sqlalchemy.orm import Session
from . import models, schemas

# ==========================================
# LEER (GET)
# ==========================================

def get_cliente(db: Session, cliente_id: int):
    """Busca un cliente específico por su ID."""
    # Nota: Al devolver este modelo, SQLAlchemy automáticamente 
    # tiene acceso a .vehiculos gracias a la relationship()
    return db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene la lista de clientes."""
    return db.query(models.Cliente).offset(skip).limit(limit).all()

def get_cliente_por_telefono(db: Session, telefono: str):
    """Útil para evitar registrar al mismo cliente dos veces."""
    return db.query(models.Cliente).filter(models.Cliente.telefono == telefono).first()

# ==========================================
# CREAR (POST)
# ==========================================

def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    """Crea un nuevo cliente en la base de datos."""
    db_cliente = models.Cliente(**cliente.model_dump())
    
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    return db_cliente

# ==========================================
# ACTUALIZAR (PUT / PATCH)
# ==========================================

def update_cliente(db: Session, cliente_id: int, cliente_data: schemas.ClienteUpdate):
    """Actualiza los datos de un cliente (nombre, teléfono, etc.)."""
    db_cliente = get_cliente(db, cliente_id)
    
    if db_cliente:
        # exclude_unset=True asegura que solo toquemos los datos que se enviaron
        update_data = cliente_data.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_cliente, key, value)
            
        db.commit()
        db.refresh(db_cliente)
        
    return db_cliente

# ==========================================
# ELIMINAR (DELETE)
# ==========================================

def delete_cliente(db: Session, cliente_id: int):
    """Elimina un cliente de la base de datos."""
    db_cliente = get_cliente(db, cliente_id)
    
    if db_cliente:
        db.delete(db_cliente)
        db.commit()
        
    return db_cliente