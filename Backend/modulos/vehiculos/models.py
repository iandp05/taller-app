# backend/modulos/vehiculos/models.py
import uuid
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patente = Column(String(20), unique=True, index=True, nullable=False)
    marca = Column(String(50), nullable=False)
    modelo = Column(String(50), nullable=False)
    anio = Column(Integer, nullable=True)
    cliente_id = Column(String(36), ForeignKey("clientes.id"), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cliente = relationship("Cliente", back_populates="vehiculos")
    ordenes = relationship("OrdenTrabajo", back_populates="vehiculo", cascade="all, delete-orphan")

class CatalogoVehiculo(Base):
    __tablename__ = "catalogo_vehiculos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    marca = Column(String(50), nullable=False)
    modelo = Column(String(50), nullable=False)
