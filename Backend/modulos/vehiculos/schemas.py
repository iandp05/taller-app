# backend/modulos/vehiculos/schemas.py
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional

class VehiculoBase(BaseModel):
    patente: str = Field(..., min_length=6, max_length=20, description="Patente del vehículo")
    marca: str = Field(..., min_length=2, max_length=50, description="Marca del vehículo")
    modelo: str = Field(..., min_length=1, max_length=50, description="Modelo del vehículo")
    anio: Optional[int] = Field(None, ge=1900, le=2100, description="Año de fabricación")
    cliente_id: str = Field(..., description="ID UUID del cliente propietario")

    @field_validator("patente", mode="before")
    @classmethod
    def normalizar_patente(cls, v):
        if v is not None and isinstance(v, str):
            v_limpia = v.strip().replace("-", "").replace(" ", "").upper()
            if not v_limpia:
                raise ValueError("La patente no puede estar vacía.")
            return v_limpia
        return v

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoUpdate(BaseModel):
    patente: Optional[str] = Field(None, min_length=6, max_length=20)
    marca: Optional[str] = Field(None, min_length=2, max_length=50)
    modelo: Optional[str] = Field(None, min_length=1, max_length=50)
    anio: Optional[int] = Field(None, ge=1900, le=2100)
    cliente_id: Optional[str] = Field(None)

    @field_validator("patente", mode="before")
    @classmethod
    def normalizar_patente_update(cls, v):
        if v is not None and isinstance(v, str):
            v_limpia = v.strip().replace("-", "").replace(" ", "").upper()
            if not v_limpia:
                raise ValueError("La patente no puede estar vacía.")
            return v_limpia
        return v

class VehiculoResponse(VehiculoBase):
    id: str

    @field_validator("id", "cliente_id", mode="before")
    @classmethod
    def convertir_id_vehiculo_str(cls, v):
        return str(v) if v is not None else None

    model_config = ConfigDict(from_attributes=True)
