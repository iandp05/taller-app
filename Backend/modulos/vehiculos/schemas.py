# backend/modulos/vehiculos/schemas.py
import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional

def normalizar_patente(val: str) -> str:
    if not val:
        raise ValueError("La patente no puede estar vacía.")
    p = re.sub(r"[^A-Za-z0-9]", "", str(val)).upper()
    if len(p) < 6 or len(p) > 9:
        raise ValueError(f"La patente '{val}' no tiene un formato válido (debe tener entre 6 y 9 caracteres alfanuméricos).")
    return p

def validar_anio_vehiculo(val: int) -> int:
    anio_max = datetime.now().year + 1
    if val < 1900 or val > anio_max:
        raise ValueError(f"El año debe estar comprendido entre 1900 y {anio_max}.")
    return val

# 1. Esquema Base
class VehiculoBase(BaseModel):
    patente: str = Field(..., min_length=6, max_length=10, description="Patente o dominio del vehículo")
    marca: str = Field(..., min_length=2, max_length=50, description="Marca del fabricante")
    modelo: str = Field(..., min_length=1, max_length=50, description="Modelo del vehículo")
    anio: int = Field(..., ge=1900, description="Año de fabricación")
    vin: Optional[str] = Field(None, max_length=17, description="Número de chasis (VIN)")
    cliente_id: int = Field(..., gt=0, description="ID del cliente propietario")

    @field_validator("patente", mode="before")
    @classmethod
    def validar_patente(cls, v):
        return normalizar_patente(v)

    @field_validator("anio")
    @classmethod
    def validar_anio(cls, v):
        return validar_anio_vehiculo(v)

    @field_validator("vin", mode="before")
    @classmethod
    def validar_vin(cls, v):
        if not v:
            return None
        v_clean = str(v).strip().upper()
        return v_clean if v_clean else None

    # NUEVO: Limpiador de espacios para el catálogo
    @field_validator("marca", "modelo", mode="before")
    @classmethod
    def limpiar_textos(cls, v):
        if v and isinstance(v, str):
            return v.strip()
        return v

# 2. Esquema para CREAR (POST)
class VehiculoCreate(VehiculoBase):
    pass

# 3. Esquema para ACTUALIZAR (PUT/PATCH)
class VehiculoUpdate(BaseModel):
    patente: Optional[str] = Field(None, min_length=6, max_length=10)
    marca: Optional[str] = Field(None, min_length=2, max_length=50)
    modelo: Optional[str] = Field(None, min_length=1, max_length=50)
    anio: Optional[int] = Field(None, ge=1900)
    vin: Optional[str] = Field(None, max_length=17)
    cliente_id: Optional[int] = Field(None, gt=0)

    @field_validator("patente", mode="before")
    @classmethod
    def validar_patente(cls, v):
        if v is None:
            return None
        return normalizar_patente(v)

    @field_validator("anio")
    @classmethod
    def validar_anio(cls, v):
        if v is None:
            return None
        return validar_anio_vehiculo(v)

    @field_validator("vin", mode="before")
    @classmethod
    def validar_vin(cls, v):
        if not v:
            return None
        v_clean = str(v).strip().upper()
        return v_clean if v_clean else None

    @field_validator("marca", "modelo", mode="before")
    @classmethod
    def limpiar_textos_update(cls, v):
        if v and isinstance(v, str):
            return v.strip()
        return v

# 4. Esquema para cambio de dueño
class CambioDueno(BaseModel):
    nuevo_cliente_id: int = Field(..., gt=0, description="ID del nuevo cliente propietario")

# 5. Esquema de RESPUESTA (GET)
class VehiculoResponse(VehiculoBase):
    id: int

    class Config:
        from_attributes = True