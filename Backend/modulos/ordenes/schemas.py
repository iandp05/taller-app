# backend/modulos/ordenes/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from modulos.clientes.schemas import ClienteResponse 
from modulos.usuarios import schemas as usuarios_schemas 

class DetalleOrdenBase(BaseModel):
    producto_id: int = Field(..., gt=0, description="ID del repuesto")
    cantidad: int = Field(..., gt=0, description="Cantidad utilizada, debe ser mayor a 0")

class DetalleOrdenCreate(DetalleOrdenBase):
    pass

class DetalleOrdenResponse(DetalleOrdenBase):
    id: int
    precio_unitario: float = Field(..., ge=0.0)

    class Config:
        from_attributes = True

class OrdenBase(BaseModel):
    vehiculo_id: int = Field(..., gt=0, description="ID del vehículo")
    mecanico_id: Optional[int] = Field(None, gt=0, description="ID del mecánico asignado")
    descripcion_falla: str = Field(..., min_length=2, max_length=1000, description="Descripción del problema o tarea")
    estado: str = Field("Pendiente", max_length=50)
    costo_mano_obra: float = Field(0.0, ge=0.0, description="Costo de mano de obra, no puede ser negativo")

    kilometros: Optional[int] = Field(None, ge=0, description="Kilómetros actuales del vehículo, no pueden ser negativos")
    nivel_combustible: Optional[str] = Field(None, max_length=50)
    frente_stereo: bool = False
    rueda_auxilio: bool = False
    codigo_stereo: Optional[str] = Field(None, max_length=50)

class OrdenCreate(OrdenBase):
    detalles: List[DetalleOrdenCreate] = []

class OrdenUpdate(BaseModel):
    vehiculo_id: Optional[int] = Field(None, gt=0)
    mecanico_id: Optional[int] = Field(None, gt=0)
    descripcion_falla: Optional[str] = Field(None, min_length=2, max_length=1000)
    estado: Optional[str] = Field(None, max_length=50)
    costo_mano_obra: Optional[float] = Field(None, ge=0.0)
    
    kilometros: Optional[int] = Field(None, ge=0)
    nivel_combustible: Optional[str] = Field(None, max_length=50)
    frente_stereo: Optional[bool] = None
    rueda_auxilio: Optional[bool] = None
    codigo_stereo: Optional[str] = Field(None, max_length=50)
    
    detalles: Optional[List[DetalleOrdenCreate]] = None  

class OrdenResponse(OrdenBase):
    id: int
    fecha_ingreso: datetime
    total: float = Field(..., ge=0.0)
    
    cliente_id: Optional[int] = None
    cliente: Optional[ClienteResponse] = None
    mecanico: Optional[usuarios_schemas.UsuarioResponse] = None 
    detalles: List[DetalleOrdenResponse] = []

    class Config:
        from_attributes = True