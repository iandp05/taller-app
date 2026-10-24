# backend/modulos/configuracion/schemas.py
from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional

class ConfiguracionTallerBase(BaseModel):
    nombre_comercial: Optional[str] = "Patagonia Servicios - Taller Mecánico"
    razon_social: Optional[str] = "Patagonia Servicios S.R.L."
    cuit: Optional[str] = "30-71755502-9"
    ingresos_brutos: Optional[str] = "30-71755502-9"
    domicilio: Optional[str] = "Av. Fontana 1250"
    ciudad_provincia: Optional[str] = "Trelew, Chubut"
    telefono: Optional[str] = "0280 441-6083"
    subtitulo: Optional[str] = "Mecánica Integral & Diagnóstico Computarizado"
    condicion_iva: Optional[str] = "IVA Responsable Inscripto"
    condicion_iva_presupuesto: Optional[str] = "IVA Responsable Monotributo"
    inicio_actividades: Optional[str] = "01/04/2020"
    logo_base64: Optional[str] = None

class ConfiguracionTallerCreate(ConfiguracionTallerBase):
    pass

class ConfiguracionTallerUpdate(ConfiguracionTallerBase):
    pass

class ConfiguracionTallerResponse(ConfiguracionTallerBase):
    id: str

    @field_validator("id", mode="before")
    @classmethod
    def convertir_id_str(cls, v):
        return str(v) if v is not None else ""

    model_config = ConfigDict(from_attributes=True)

# Aliases for router compatibility
ConfiguracionResponse = ConfiguracionTallerResponse
ConfiguracionUpdate = ConfiguracionTallerUpdate
