# backend/modulos/ordenes/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"

    id = Column(Integer, primary_key=True, index=True)
    
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    mecanico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    
    fecha_ingreso = Column(DateTime, default=datetime.utcnow) 
    estado = Column(String, default="Pendiente") 
    descripcion_falla = Column(String)
    
    kilometros = Column(Integer, nullable=True)
    nivel_combustible = Column(String, nullable=True)
    frente_stereo = Column(Boolean, default=False)
    rueda_auxilio = Column(Boolean, default=False)
    codigo_stereo = Column(String, nullable=True)
    
    costo_mano_obra = Column(Float, default=0.0)
    total = Column(Float, default=0.0)

    # --- Relaciones corregidas ---
    mecanico = relationship("Usuario", back_populates="ordenes_atendidas")
    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    cliente = relationship("Cliente") 
    detalles = relationship("DetalleOrden", back_populates="orden", cascade="all, delete-orphan")


class DetalleOrden(Base):
    __tablename__ = "detalle_ordenes"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    
    cantidad = Column(Integer)
    precio_unitario = Column(Float) 

    # --- Relaciones ---
    orden = relationship("OrdenTrabajo", back_populates="detalles")