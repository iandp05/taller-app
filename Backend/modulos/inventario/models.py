# backend/modulos/inventario/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from database import Base

class Producto(Base):
    __tablename__ = "inventario"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(150), nullable=False)
    codigo = Column(String(50), unique=True, index=True, nullable=True)
    categoria = Column(String(50), default="Repuestos")
    precio = Column(Float, nullable=False, default=0.0)
    cantidad = Column(Integer, nullable=False, default=0)
    stock_critico = Column(Integer, default=2)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
