# backend/modulos/ordenes/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base

class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehiculo_id = Column(String(36), ForeignKey("vehiculos.id"), nullable=False)
    cliente_id = Column(String(36), ForeignKey("clientes.id"), nullable=True)
    mecanico_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    
    fecha_ingreso = Column(DateTime, default=datetime.datetime.utcnow)
    descripcion_falla = Column(Text, nullable=False)
    estado = Column(String(50), default="En Recepción")
    costo_mano_obra = Column(Float, default=0.0)
    total = Column(Float, default=0.0)

    kilometros = Column(Integer, nullable=True)
    nivel_combustible = Column(String(50), nullable=True)
    frente_stereo = Column(String(10), nullable=True)
    rueda_auxilio = Column(String(10), nullable=True)
    codigo_stereo = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    mecanico = relationship("Usuario", back_populates="ordenes_atendidas")
    detalles = relationship("DetalleOrden", back_populates="orden", cascade="all, delete-orphan")

class DetalleOrden(Base):
    __tablename__ = "detalle_ordenes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    orden_id = Column(String(36), ForeignKey("ordenes_trabajo.id"), nullable=False)
    producto_id = Column(String(36), ForeignKey("inventario.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    orden = relationship("OrdenTrabajo", back_populates="detalles")
    producto = relationship("Producto")
