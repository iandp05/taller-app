# backend/modulos/facturas/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from modulos.clientes.schemas import ClienteResponse 
from modulos.vehiculos.schemas import VehiculoResponse
from modulos.usuarios import schemas as usuarios_schemas

class DetalleFacturaBase(BaseModel):
    producto_id: Optional[int] = Field(None, gt=0)
    descripcion: str = Field(..., min_length=1, max_length=200, description="Descripción del producto o servicio")
    cantidad: int = Field(..., gt=0, description="Cantidad, debe ser mayor a cero")
    precio_unitario: float = Field(..., ge=0.0, description="Precio unitario con IVA incluido, no puede ser negativo")
    alicuota_iva: float = Field(21.0, ge=0.0, le=100.0, description="Alícuota de IVA")

class DetalleFacturaCreate(DetalleFacturaBase):
    pass

class DetalleFacturaResponse(DetalleFacturaBase):
    id: int
    subtotal: float = Field(..., ge=0.0)

    class Config:
        from_attributes = True

class FacturaBase(BaseModel):
    vehiculo_id: int = Field(..., gt=0, description="ID del vehículo")
    cliente_id: int = Field(..., gt=0, description="ID del cliente")
    mecanico_id: Optional[int] = Field(None, gt=0, description="ID del mecánico/empleado asignado")
    tipo_comprobante: str = Field("Factura A", min_length=1, max_length=50)
    punto_venta: str = Field("00001", min_length=1, max_length=10)
    numero_comprobante: int = Field(..., gt=0, description="Número correlativo de comprobante, mayor a cero")
    cae: Optional[str] = Field(None, max_length=50)
    cae_vencimiento: Optional[str] = Field(None, max_length=50)
    condicion_venta: str = Field("Contado", max_length=50)

class FacturaCreate(FacturaBase):
    detalles: List[DetalleFacturaCreate] = Field(..., min_length=1, description="Debe contener al menos un ítem a facturar")

class FacturaUpdate(BaseModel):
    mecanico_id: Optional[int] = Field(None, gt=0)
    tipo_comprobante: Optional[str] = Field(None, max_length=50)
    cae: Optional[str] = Field(None, max_length=50)
    cae_vencimiento: Optional[str] = Field(None, max_length=50)
    condicion_venta: Optional[str] = Field(None, max_length=50)

class FacturaResponse(FacturaBase):
    id: int
    fecha_emision: datetime
    neto_gravado: float = Field(..., ge=0.0)
    iva_21: float = Field(..., ge=0.0)
    total: float = Field(..., ge=0.0)
    cliente: Optional[ClienteResponse] = None
    vehiculo: Optional[VehiculoResponse] = None
    mecanico: Optional[usuarios_schemas.UsuarioResponse] = None
    detalles: List[DetalleFacturaResponse] = []

    class Config:
        from_attributes = True
