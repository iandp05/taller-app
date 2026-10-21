# backend/modulos/clientes/models.py
import uuid
import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(150), nullable=False)
    telefono = Column(String(30), nullable=False)
    email = Column(String(100), nullable=True)
    cuit = Column(String(20), nullable=True)
    domicilio = Column(String(200), nullable=True)
    condicion_iva = Column(String(50), default="Consumidor Final")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vehiculos = relationship("Vehiculo", back_populates="cliente", cascade="all, delete-orphan")
