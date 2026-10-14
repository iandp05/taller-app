# backend/modulos/usuarios/models.py
from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy.orm import relationship

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    username = Column(String, unique=True, index=True) 
    
    password_hash = Column(String) 
    rol = Column(String, default="mecanico") 
    
    # CAMBIO: Apuntamos a OrdenTrabajo y cambiamos el nombre de la relación
    ordenes_atendidas = relationship("OrdenTrabajo", back_populates="mecanico")