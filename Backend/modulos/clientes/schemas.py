# backend/modulos/clientes/schemas.py
import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from modulos.vehiculos.schemas import VehiculoResponse

def validar_email_str(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    val = val.strip()
    if not val:
        return None
    regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(regex, val):
        raise ValueError("El formato del correo electrónico no es válido.")
    return val.lower()

def validar_cuit_dni(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    c = re.sub(r"\D", "", str(val))
    if not c:
        return None
    if len(c) in (7, 8):
        return c
    elif len(c) == 11:
        mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        s = sum(int(c[i]) * mult[i] for i in range(10))
        r = 11 - (s % 11)
        v = 0 if r == 11 else 9 if r == 10 else r
        if int(c[10]) != v:
            raise ValueError(f"El CUIT {val} no es válido (dígito verificador incorrecto).")
        return f"{c[:2]}-{c[2:10]}-{c[10]}"
    else:
        raise ValueError("Debe ingresar un CUIT válido (11 dígitos) o un DNI (7 u 8 dígitos).")

class ClienteBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150, description="Nombre o Razón Social del cliente")
    telefono: str = Field(..., min_length=1, max_length=30, description="Teléfono de contacto")
    email: Optional[str] = Field(None, max_length=100, description="Correo electrónico opcional")
    cuit: Optional[str] = Field(None, max_length=20, description="CUIT o DNI")
    domicilio: Optional[str] = Field(None, max_length=200, description="Domicilio comercial")
    condicion_iva: Optional[str] = Field("Consumidor Final", max_length=50)

class ClienteCreate(ClienteBase):
    @field_validator("email", mode="before")
    @classmethod
    def validar_email(cls, v):
        return validar_email_str(v)

    @field_validator("cuit", mode="before")
    @classmethod
    def validar_cuit(cls, v):
        return validar_cuit_dni(v)

    @field_validator("telefono", mode="before")
    @classmethod
    def validar_telefono(cls, v):
        if not v or not str(v).strip():
            raise ValueError("El teléfono no puede estar vacío.")
        return str(v).strip()

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=150)
    telefono: Optional[str] = Field(None, min_length=1, max_length=30)
    email: Optional[str] = Field(None, max_length=100)
    cuit: Optional[str] = Field(None, max_length=20)
    domicilio: Optional[str] = Field(None, max_length=200)
    condicion_iva: Optional[str] = Field(None, max_length=50)

    @field_validator("email", mode="before")
    @classmethod
    def validar_email(cls, v):
        return validar_email_str(v)

    @field_validator("cuit", mode="before")
    @classmethod
    def validar_cuit(cls, v):
        return validar_cuit_dni(v)

    @field_validator("telefono", mode="before")
    @classmethod
    def validar_telefono(cls, v):
        if v is not None and not str(v).strip():
            raise ValueError("El teléfono no puede estar vacío.")
        return str(v).strip() if v is not None else None

class ClienteResponse(ClienteBase):
    id: str

    class Config:
        from_attributes = True

class ClienteDetalleResponse(ClienteResponse):
    vehiculos: List[VehiculoResponse] = []

    class Config:
        from_attributes = True
