# backend/modulos/vehiculos/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from modulos.vehiculos.models import CatalogoVehiculo

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/vehiculos", tags=["Vehículos"])

# ==========================================
# CREAR (POST)
# ==========================================
@router.post("/", response_model=schemas.VehiculoResponse, status_code=status.HTTP_201_CREATED)
def crear_vehiculo(vehiculo: schemas.VehiculoCreate, db: Session = Depends(get_db)):
    db_vehiculo = services.get_vehiculo_por_patente(db, patente=vehiculo.patente)
    if db_vehiculo:
        raise HTTPException(status_code=400, detail="Ya existe un vehículo registrado con esta patente.")
    
    return services.create_vehiculo(db=db, vehiculo=vehiculo)

# ==========================================
# LEER (GET)
# ==========================================
@router.get("/", response_model=List[schemas.VehiculoResponse])
def leer_vehiculos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_vehiculos(db, skip=skip, limit=limit)

@router.get("/{vehiculo_id}", response_model=schemas.VehiculoResponse)
def leer_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    db_vehiculo = services.get_vehiculo(db, vehiculo_id=vehiculo_id)
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return db_vehiculo

# ==========================================
# ACTUALIZAR (PUT)
# ==========================================
@router.put("/{vehiculo_id}", response_model=schemas.VehiculoResponse)
def actualizar_vehiculo(vehiculo_id: int, vehiculo_data: schemas.VehiculoUpdate, db: Session = Depends(get_db)):
    # PROTECCIÓN: Evitar que al actualizar se use la patente de otro auto
    if vehiculo_data.patente:
        db_existente = services.get_vehiculo_por_patente(db, patente=vehiculo_data.patente)
        if db_existente and db_existente.id != vehiculo_id:
            raise HTTPException(status_code=400, detail="La patente ingresada ya le pertenece a otro vehículo.")

    db_vehiculo = services.update_vehiculo(db, vehiculo_id=vehiculo_id, vehiculo_data=vehiculo_data)
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return db_vehiculo

@router.put("/{vehiculo_id}/cambiar_dueno", response_model=schemas.VehiculoResponse)
def cambiar_dueno_vehiculo(vehiculo_id: int, datos: schemas.CambioDueno, db: Session = Depends(get_db)):
    db_vehiculo = services.cambiar_dueno(db, vehiculo_id=vehiculo_id, nuevo_cliente_id=datos.nuevo_cliente_id)
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return db_vehiculo

# ==========================================
# ELIMINAR (DELETE)
# ==========================================
@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    db_vehiculo = services.delete_vehiculo(db, vehiculo_id=vehiculo_id)
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")

# ==========================================
# OBTENER CATÁLOGO DE MARCAS Y MODELOS
# ==========================================
@router.get("/catalogo/marcas-modelos")
def obtener_catalogo(db: Session = Depends(get_db)):
    registros = db.query(CatalogoVehiculo).all()
    
    diccionario_catalogo = {}
    for reg in registros:
        if reg.marca not in diccionario_catalogo:
            diccionario_catalogo[reg.marca] = []
        diccionario_catalogo[reg.marca].append(reg.modelo)
        
    return diccionario_catalogo