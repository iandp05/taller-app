# backend/modulos/inventario/models.py
from sqlalchemy import Column, Integer, String, Float
from database import Base

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    codigo = Column(String, unique=True, index=True, nullable=True) # Código de barra o SKU
    categoria = Column(String) # Ej: Aceites, Filtros, Frenos
    precio = Column(Float) # Usamos Float para manejar centavos si es necesario
    cantidad = Column(Integer, default=0)
    stock_critico = Column(Integer, default=5) # Cuando baje de 5, tiramos alerta