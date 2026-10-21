# backend/modulos/usuarios/models.py
import uuid
import datetime
from sqlalchemy import Column, String, DateTime
from database import Base
from sqlalchemy.orm import relationship

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(150))
    username = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    rol = Column(String(50), default="mecanico")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    ordenes_atendidas = relationship("OrdenTrabajo", back_populates="mecanico")
