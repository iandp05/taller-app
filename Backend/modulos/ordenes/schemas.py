# backend/modulos/ordenes/schemas.py
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime
from modulos.vehiculos.schemas import VehiculoResponse
from modulos.clientes.schemas import ClienteResponse
from modulos.usuarios.schemas import UsuarioResponse

class DetalleOrdenCreate(BaseModel):
    producto_id: str = Field(..., description="ID UUID del repuesto/producto")
    cantidad: int = Field(..., gt=0, description="Cantidad utilizada")

class DetalleOrdenResponse(BaseModel):
    id: str
    orden_id: str
    producto_id: str
    cantidad: int
    precio_unitario: float

    model_config = ConfigDict(from_attributes=True)

class OrdenBase(BaseModel):
    vehiculo_id: str = Field(..., description="ID UUID del vehículo a reparar")
    mecanico_id: Optional[str] = Field(None, description="ID UUID del mecánico asignado")
    descripcion_falla: str = Field(..., min_length=3, description="Descripción del trabajo")
    estado: str = Field("En Recepción", max_length=50)
    costo_mano_obra: float = Field(0.0, ge=0.0)

    kilometros: Optional[int] = Field(None, ge=0)
    nivel_combustible: Optional[str] = Field("Desconocido", max_length=50)
    frente_stereo: Optional[str] = Field("No", max_length=50)
    rueda_auxilio: Optional[str] = Field("No", max_length=50)
    codigo_stereo: Optional[str] = Field(None, max_length=50)

    @field_validator("frente_stereo", "rueda_auxilio", mode="before")
    @classmethod
    def normalizar_si_no(cls, v):
        if v is True or v == "true" or v == "True":
            return "Si"
        if v is False or v == "false" or v == "False" or v is None:
            return "No"
        return str(v)

    @field_validator("vehiculo_id", "mecanico_id", mode="before")
    @classmethod
    def convertir_id_str(cls, v):
        return str(v) if v is not None else None

class OrdenCreate(OrdenBase):
    detalles: List[DetalleOrdenCreate] = []

class OrdenUpdate(BaseModel):
    descripcion_falla: Optional[str] = Field(None, min_length=3)
    estado: Optional[str] = Field(None, max_length=50)
    costo_mano_obra: Optional[float] = Field(None, ge=0.0)
    mecanico_id: Optional[str] = Field(None)
    detalles: Optional[List[DetalleOrdenCreate]] = None

    kilometros: Optional[int] = Field(None, ge=0)
    nivel_combustible: Optional[str] = Field(None, max_length=50)
    frente_stereo: Optional[str] = Field(None, max_length=50)
    rueda_auxilio: Optional[str] = Field(None, max_length=50)
    codigo_stereo: Optional[str] = Field(None, max_length=50)

    @field_validator("frente_stereo", "rueda_auxilio", mode="before")
    @classmethod
    def normalizar_si_no_update(cls, v):
        if v is True or v == "true" or v == "True":
            return "Si"
        if v is False or v == "false" or v == "False" or v is None:
            return "No"
        return str(v)

class OrdenResponse(OrdenBase):
    id: str
    cliente_id: Optional[str] = None
    fecha_ingreso: datetime
    total: float
    vehiculo: Optional[VehiculoResponse] = None
    cliente: Optional[ClienteResponse] = None
    mecanico: Optional[UsuarioResponse] = None
    detalles: List[DetalleOrdenResponse] = []

    @field_validator("id", "cliente_id", mode="before")
    @classmethod
    def convertir_id_str_response(cls, v):
        return str(v) if v is not None else None

    model_config = ConfigDict(from_attributes=True)
