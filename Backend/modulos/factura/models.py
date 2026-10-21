# backend/modulos/factura/models.py
import uuid
import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehiculo_id = Column(String(36), ForeignKey("vehiculos.id"))
    cliente_id = Column(String(36), ForeignKey("clientes.id"))
    mecanico_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)

    tipo_comprobante = Column(String(50), default="Factura A")
    punto_venta = Column(String(20), default="00001")
    numero_comprobante = Column(Integer, index=True)
    
    cae = Column(String(50), nullable=True)
    cae_vencimiento = Column(String(50), nullable=True)
    
    fecha_emision = Column(DateTime, default=datetime.datetime.utcnow)
    condicion_venta = Column(String(50), default="Contado")
    
    neto_gravado = Column(Float, default=0.0)
    iva_21 = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vehiculo = relationship("Vehiculo")
    cliente = relationship("Cliente")
    mecanico = relationship("Usuario")
    detalles = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    factura_id = Column(String(36), ForeignKey("facturas.id"))
    producto_id = Column(String(36), ForeignKey("inventario.id"), nullable=True)
    
    descripcion = Column(String(200))
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(Float, default=0.0)
    alicuota_iva = Column(Float, default=21.0)
    subtotal = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    factura = relationship("Factura", back_populates="detalles")
