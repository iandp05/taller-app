# backend/modulos/presupuestos/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from modulos.vehiculos.schemas import VehiculoResponse
from modulos.clientes.schemas import ClienteResponse
from modulos.usuarios.schemas import UsuarioResponse

class DetallePresupuestoCreate(BaseModel):
    producto_id: Optional[str] = None
    descripcion: str = Field(..., min_length=1, max_length=200)
    cantidad: int = Field(1, gt=0)
    precio_unitario: float = Field(..., ge=0.0)

class DetallePresupuestoResponse(BaseModel):
    id: str
    presupuesto_id: str
    producto_id: Optional[str] = None
    descripcion: str
    cantidad: int
    precio_unitario: float

    @field_validator("id", "presupuesto_id", "producto_id", mode="before")
    @classmethod
    def convertir_ids_detalle_presupuesto_str(cls, v):
        return str(v) if v is not None else None

    class Config:
        from_attributes = True

class PresupuestoBase(BaseModel):
    vehiculo_id: str = Field(..., description="ID UUID del vehículo")
    cliente_id: str = Field(..., description="ID UUID del cliente")
    mecanico_id: Optional[str] = None
    estado: str = Field("Emitido", max_length=50)
    validez_dias: str = Field("15 días", max_length=50)
    condiciones_pago: str = Field("Efectivo / Transferencia", max_length=100)

class PresupuestoCreate(PresupuestoBase):
    detalles: List[DetallePresupuestoCreate] = []

class PresupuestoUpdate(BaseModel):
    vehiculo_id: Optional[str] = None
    cliente_id: Optional[str] = None
    mecanico_id: Optional[str] = None
    estado: Optional[str] = None
    validez_dias: Optional[str] = None
    condiciones_pago: Optional[str] = None
    detalles: Optional[List[DetallePresupuestoCreate]] = None

class PresupuestoResponse(PresupuestoBase):
    id: str
    fecha_creacion: datetime
    total: float
    vehiculo: Optional[VehiculoResponse] = None
    cliente: Optional[ClienteResponse] = None
    mecanico: Optional[UsuarioResponse] = None
    detalles: List[DetallePresupuestoResponse] = []

    @field_validator("id", "vehiculo_id", "cliente_id", "mecanico_id", mode="before")
    @classmethod
    def convertir_ids_presupuesto_str(cls, v):
        return str(v) if v is not None else None

    class Config:
        from_attributes = True
