# backend/modulos/factura/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from modulos.vehiculos.schemas import VehiculoResponse
from modulos.clientes.schemas import ClienteResponse
from modulos.usuarios.schemas import UsuarioResponse

class DetalleFacturaCreate(BaseModel):
    producto_id: Optional[str] = None
    descripcion: str = Field(..., min_length=1, max_length=200)
    cantidad: int = Field(1, gt=0)
    precio_unitario: float = Field(..., ge=0.0)
    alicuota_iva: float = Field(21.0, ge=0.0)

class DetalleFacturaResponse(BaseModel):
    id: str
    factura_id: str
    producto_id: Optional[str] = None
    descripcion: str
    cantidad: int
    precio_unitario: float
    alicuota_iva: float
    subtotal: float

    class Config:
        from_attributes = True

class FacturaBase(BaseModel):
    vehiculo_id: str = Field(..., description="ID UUID del vehículo")
    cliente_id: str = Field(..., description="ID UUID del cliente")
    mecanico_id: Optional[str] = None
    tipo_comprobante: str = Field("Factura A", max_length=50)
    punto_venta: str = Field("00001", max_length=20)
    condicion_venta: str = Field("Contado", max_length=50)

class FacturaCreate(FacturaBase):
    detalles: List[DetalleFacturaCreate] = []

class FacturaResponse(FacturaBase):
    id: str
    numero_comprobante: int
    cae: Optional[str] = None
    cae_vencimiento: Optional[str] = None
    fecha_emision: datetime
    neto_gravado: float
    iva_21: float
    total: float
    vehiculo: Optional[VehiculoResponse] = None
    cliente: Optional[ClienteResponse] = None
    mecanico: Optional[UsuarioResponse] = None
    detalles: List[DetalleFacturaResponse] = []

    class Config:
        from_attributes = True
