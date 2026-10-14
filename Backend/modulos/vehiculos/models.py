# backend/modulos/vehiculos/models.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    patente = Column(String, unique=True, index=True)
    marca = Column(String)
    modelo = Column(String)
    anio = Column(Integer)
    vin = Column(String, unique=True, index=True, nullable=True)
    
    cliente_id = Column(Integer, ForeignKey("clientes.id"))

    # --- Relaciones ---
    propietario = relationship("Cliente", back_populates="vehiculos")

    # CAMBIO: De "planillas" a "ordenes"
    ordenes = relationship("OrdenTrabajo", back_populates="vehiculo")

class CatalogoVehiculo(Base):
    __tablename__ = "catalogo_vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    marca = Column(String, index=True)
    modelo = Column(String)