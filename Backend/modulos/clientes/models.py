# backend/modulos/clientes/models.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    telefono = Column(String)
    
    # Datos opcionales
    email = Column(String, nullable=True)
    
    # --- CAMPOS FISCALES / FACTURACIÓN ---
    cuit = Column(String, nullable=True)
    domicilio = Column(String, nullable=True)
    condicion_iva = Column(String, default="Consumidor Final")

    # --- Relaciones ---
    vehiculos = relationship("Vehiculo", back_populates="propietario")