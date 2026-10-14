# backend/modulos/configuracion/models.py
from sqlalchemy import Column, Integer, String, Text
from database import Base

class ConfiguracionTaller(Base):
    __tablename__ = "configuracion_taller"

    id = Column(Integer, primary_key=True, index=True)
    nombre_comercial = Column(String, default="Patagonia Servicios")
    razon_social = Column(String, default="PERDOMO GUSTAVO CAP I SECC IV")
    cuit = Column(String, default="33-71755502-9")
    ingresos_brutos = Column(String, default="33-71755502-9")
    domicilio = Column(String, default="Albarracin 1219")
    ciudad_provincia = Column(String, default="Trelew, Chubut")
    telefono = Column(String, default="0280 4416083")
    subtitulo = Column(String, default="TODAS LAS MARCAS")
    condicion_iva = Column(String, default="IVA Responsable Inscripto")
    condicion_iva_presupuesto = Column(String, default="IVA Responsable Monotributo")
    inicio_actividades = Column(String, default="01/04/2022")
    logo_base64 = Column(Text, nullable=True)
