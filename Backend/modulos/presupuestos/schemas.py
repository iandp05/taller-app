# backend/modulos/presupuestos/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from modulos.clientes.schemas import ClienteResponse 
from modulos.vehiculos.schemas import VehiculoResponse
from modulos.usuarios import schemas as usuarios_schemas

class DetallePresupuestoBase(BaseModel):
    producto_id: Optional[int] = Field(None, gt=0)
    descripcion: str = Field(..., min_length=2, max_length=200, description="Descripción del repuesto o mano de obra")
    cantidad: int = Field(..., gt=0, description="Cantidad estimada, debe ser mayor a cero")
    precio_unitario: float = Field(..., ge=0.0, description="Precio unitario, no puede ser negativo")

    @field_validator("descripcion", mode="before")
    @classmethod
    def limpiar_descripcion(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

class DetallePresupuestoCreate(DetallePresupuestoBase):
    pass

class DetallePresupuestoResponse(DetallePresupuestoBase):
    id: int

    class Config:
        from_attributes = True

class PresupuestoBase(BaseModel):
    vehiculo_id: int = Field(..., gt=0, description="ID del vehículo")
    cliente_id: int = Field(..., gt=0, description="ID del cliente")
    mecanico_id: Optional[int] = Field(None, gt=0, description="ID del mecánico/empleado asignado")
    estado: str = Field("Emitido", max_length=50)
    validez_dias: str = Field("15 días", max_length=50)
    condiciones_pago: str = Field("Efectivo / Transferencia", max_length=100)

    @field_validator("estado", "validez_dias", "condiciones_pago", mode="before")
    @classmethod
    def limpiar_textos(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

class PresupuestoCreate(PresupuestoBase):
    detalles: List[DetallePresupuestoCreate] = Field(..., min_length=1, description="El presupuesto debe incluir al menos un ítem")

class PresupuestoUpdate(BaseModel):
    mecanico_id: Optional[int] = Field(None, gt=0)
    estado: Optional[str] = Field(None, max_length=50)
    validez_dias: Optional[str] = Field(None, max_length=50)
    condiciones_pago: Optional[str] = Field(None, max_length=100)
    detalles: Optional[List[DetallePresupuestoCreate]] = None

    @field_validator("estado", "validez_dias", "condiciones_pago", mode="before")
    @classmethod
    def limpiar_textos_update(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

class PresupuestoResponse(PresupuestoBase):
    id: int
    fecha_creacion: datetime
    total: float = Field(..., ge=0.0)
    cliente: Optional[ClienteResponse] = None
    vehiculo: Optional[VehiculoResponse] = None
    mecanico: Optional[usuarios_schemas.UsuarioResponse] = None
    detalles: List[DetallePresupuestoResponse] = []

    class Config:
        from_attributes = True
