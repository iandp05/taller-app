# backend/modulos/configuracion/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date
import re

def validar_cuit_dni(val: Optional[str]) -> Optional[str]:
    if not val:
        return val
    clean = re.sub(r'\D', '', val)
    if len(clean) != 11:
        raise ValueError(f"El CUIT {val} debe tener exactamente 11 dígitos numéricos.")

    digits = [int(d) for d in clean]
    multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    total = sum(d * m for d, m in zip(digits[:10], multipliers))
    verificador = 11 - (total % 11)
    if verificador == 11:
        verificador = 0
    elif verificador == 10:
        verificador = 9

    if verificador != digits[10]:
        raise ValueError(f"El CUIT {val} no es válido (dígito verificador incorrecto).")
    return val

def validar_fecha_inicio(val: Optional[str]) -> Optional[str]:
    if not val:
        return val
    s = val.strip()
    parsed_date = None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            parsed_date = datetime.strptime(s, fmt).date()
            break
        except ValueError:
            pass

    if not parsed_date:
        raise ValueError("La fecha de inicio de actividades debe ser una fecha válida del calendario (ej: DD/MM/AAAA).")

    if parsed_date > date.today():
        raise ValueError("La fecha de inicio de actividades no puede ser una fecha futura.")

    return parsed_date.strftime("%d/%m/%Y")

class ConfiguracionBase(BaseModel):
    nombre_comercial: str = Field(..., min_length=2, max_length=100)
    razon_social: str = Field(..., min_length=2, max_length=100)
    cuit: str = Field(..., min_length=7, max_length=20)
    ingresos_brutos: str = Field(..., min_length=2, max_length=30)
    domicilio: str = Field(..., min_length=3, max_length=150)
    ciudad_provincia: str = Field(..., min_length=3, max_length=100)
    telefono: str = Field(..., min_length=6, max_length=30)
    subtitulo: str = Field(default="TODAS LAS MARCAS", max_length=100)
    condicion_iva: str = Field(..., min_length=3, max_length=50)
    condicion_iva_presupuesto: str = Field(..., min_length=3, max_length=50)
    inicio_actividades: str = Field(..., min_length=8, max_length=20)
    logo_base64: Optional[str] = None

    @field_validator("cuit", mode="before")
    def validar_cuit_field(cls, v):
        return validar_cuit_dni(v)

    @field_validator("inicio_actividades", mode="before")
    def validar_fecha_field(cls, v):
        return validar_fecha_inicio(v)

class ConfiguracionCreate(ConfiguracionBase):
    pass

class ConfiguracionUpdate(BaseModel):
    nombre_comercial: Optional[str] = Field(None, min_length=2, max_length=100)
    razon_social: Optional[str] = Field(None, min_length=2, max_length=100)
    cuit: Optional[str] = Field(None, min_length=7, max_length=20)
    ingresos_brutos: Optional[str] = Field(None, min_length=2, max_length=30)
    domicilio: Optional[str] = Field(None, min_length=3, max_length=150)
    ciudad_provincia: Optional[str] = Field(None, min_length=3, max_length=100)
    telefono: Optional[str] = Field(None, min_length=6, max_length=30)
    subtitulo: Optional[str] = Field(None, max_length=100)
    condicion_iva: Optional[str] = Field(None, min_length=3, max_length=50)
    condicion_iva_presupuesto: Optional[str] = Field(None, min_length=3, max_length=50)
    inicio_actividades: Optional[str] = Field(None, min_length=8, max_length=20)
    logo_base64: Optional[str] = None

    @field_validator("cuit", mode="before")
    def validar_cuit_field(cls, v):
        if v:
            return validar_cuit_dni(v)
        return v

    @field_validator("inicio_actividades", mode="before")
    def validar_fecha_field(cls, v):
        if v:
            return validar_fecha_inicio(v)
        return v

class ConfiguracionResponse(ConfiguracionBase):
    id: int

    class Config:
        from_attributes = True
