from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    mecanico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    estado = Column(String, default="Emitido") # Opciones: Emitido, Aprobado, Rechazado
    
    validez_dias = Column(String, default="15 días")
    condiciones_pago = Column(String, default="Efectivo / Transferencia")
    
    total = Column(Float, default=0.0)

    # Relaciones
    vehiculo = relationship("Vehiculo")
    cliente = relationship("Cliente")
    mecanico = relationship("Usuario")
    detalles = relationship("DetallePresupuesto", back_populates="presupuesto", cascade="all, delete-orphan")


class DetallePresupuesto(Base):
    __tablename__ = "detalle_presupuestos"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    
    descripcion = Column(String)
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(Float, default=0.0)

    # Relaciones
    presupuesto = relationship("Presupuesto", back_populates="detalles")
