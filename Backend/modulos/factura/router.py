# backend/modulos/facturas/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/facturas", tags=["Facturación y Remitos"])

@router.post("/", response_model=schemas.FacturaResponse, status_code=status.HTTP_201_CREATED)
def crear_factura(factura: schemas.FacturaCreate, db: Session = Depends(get_db)):
    return services.create_factura(db=db, factura=factura)

@router.get("/", response_model=List[schemas.FacturaResponse])
def leer_facturas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_facturas(db, skip=skip, limit=limit)

@router.get("/{factura_id}", response_model=schemas.FacturaResponse)
def leer_factura(factura_id: str, db: Session = Depends(get_db)):
    db_factura = services.get_factura(db, factura_id=factura_id)
    if db_factura is None:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return db_factura

@router.delete("/{factura_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_factura(factura_id: str, reponer_stock: bool = True, db: Session = Depends(get_db)):
    db_factura = services.delete_factura(db, factura_id=factura_id, reponer_stock=reponer_stock)
    if db_factura is None:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
