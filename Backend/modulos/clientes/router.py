from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# ==========================================
# CREAR (POST)
# ==========================================
@router.post("/", response_model=schemas.ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    # Opcional: Verificamos si ya existe alguien con ese teléfono para evitar duplicados
    db_cliente = services.get_cliente_por_telefono(db, telefono=cliente.telefono)
    if db_cliente:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese número de teléfono")
    
    return services.create_cliente(db=db, cliente=cliente)

# ==========================================
# LEER (GET)
# ==========================================
@router.get("/", response_model=List[schemas.ClienteResponse])
def leer_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Devuelve la lista básica de clientes (sin cargar todos los vehículos para que sea más rápido)
    return services.get_clientes(db, skip=skip, limit=limit)

@router.get("/{cliente_id}", response_model=schemas.ClienteDetalleResponse)
def leer_cliente(cliente_id: int, db: Session = Depends(get_db)):
    # ¡Aquí ocurre la magia! Usamos ClienteDetalleResponse para incluir la lista de vehículos
    db_cliente = services.get_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

# ==========================================
# ACTUALIZAR (PUT)
# ==========================================
@router.put("/{cliente_id}", response_model=schemas.ClienteResponse)
def actualizar_cliente(cliente_id: int, cliente_data: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = services.update_cliente(db, cliente_id=cliente_id, cliente_data=cliente_data)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

# ==========================================
# ELIMINAR (DELETE)
# ==========================================
@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    # Intentamos eliminarlo. Si tiene vehículos asociados, SQLAlchemy podría 
    # lanzar un error de integridad (IntegrityError), lo cual es bueno por seguridad.
    try:
        db_cliente = services.delete_cliente(db, cliente_id=cliente_id)
        if db_cliente is None:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    except Exception as e:
        raise HTTPException(status_code=400, detail="No se puede eliminar un cliente que tiene vehículos registrados.")