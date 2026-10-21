# backend/modulos/presupuestos/models.py
import uuid
import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehiculo_id = Column(String(36), ForeignKey("vehiculos.id"))
    cliente_id = Column(String(36), ForeignKey("clientes.id"))
    mecanico_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)

    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    estado = Column(String(50), default="Emitido")
    validez_dias = Column(String(50), default="15 días")
    condiciones_pago = Column(String(100), default="Efectivo / Transferencia")
    total = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vehiculo = relationship("Vehiculo")
    cliente = relationship("Cliente")
    mecanico = relationship("Usuario")
    detalles = relationship("DetallePresupuesto", back_populates="presupuesto", cascade="all, delete-orphan")


class DetallePresupuesto(Base):
    __tablename__ = "detalle_presupuestos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    presupuesto_id = Column(String(36), ForeignKey("presupuestos.id"))
    producto_id = Column(String(36), ForeignKey("inventario.id"), nullable=True)
    
    descripcion = Column(String(200))
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    presupuesto = relationship("Presupuesto", back_populates="detalles")
