# backend/modulos/configuracion/schemas.py
from pydantic import BaseModel
from typing import Optional

class ConfiguracionTallerBase(BaseModel):
    nombre_comercial: Optional[str] = "Patagonia Servicios"
    razon_social: Optional[str] = "PERDOMO GUSTAVO CAP I SECC IV"
    cuit: Optional[str] = "33-71755502-9"
    ingresos_brutos: Optional[str] = "33-71755502-9"
    domicilio: Optional[str] = "Albarracin 1219"
    ciudad_provincia: Optional[str] = "Trelew, Chubut"
    telefono: Optional[str] = "0280 4416083"
    subtitulo: Optional[str] = "TODAS LAS MARCAS"
    condicion_iva: Optional[str] = "IVA Responsable Inscripto"
    condicion_iva_presupuesto: Optional[str] = "IVA Responsable Monotributo"
    inicio_actividades: Optional[str] = "01/04/2022"
    logo_base64: Optional[str] = None

class ConfiguracionTallerCreate(ConfiguracionTallerBase):
    pass

class ConfiguracionTallerUpdate(ConfiguracionTallerBase):
    pass

class ConfiguracionTallerResponse(ConfiguracionTallerBase):
    id: str

    class Config:
        from_attributes = True

# Aliases for router compatibility
ConfiguracionResponse = ConfiguracionTallerResponse
ConfiguracionUpdate = ConfiguracionTallerUpdate
