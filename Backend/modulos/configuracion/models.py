# backend/modulos/configuracion/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime
from database import Base

class ConfiguracionTaller(Base):
    __tablename__ = "configuracion_taller"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre_comercial = Column(String(150), default="Patagonia Servicios")
    razon_social = Column(String(150), default="PERDOMO GUSTAVO CAP I SECC IV")
    cuit = Column(String(30), default="33-71755502-9")
    ingresos_brutos = Column(String(30), default="33-71755502-9")
    domicilio = Column(String(200), default="Albarracin 1219")
    ciudad_provincia = Column(String(100), default="Trelew, Chubut")
    telefono = Column(String(50), default="0280 4416083")
    subtitulo = Column(String(100), default="TODAS LAS MARCAS")
    condicion_iva = Column(String(50), default="IVA Responsable Inscripto")
    condicion_iva_presupuesto = Column(String(50), default="IVA Responsable Monotributo")
    inicio_actividades = Column(String(50), default="01/04/2022")
    logo_base64 = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
