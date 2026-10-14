# backend/modulos/facturas/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    mecanico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Configuración del Comprobante
    tipo_comprobante = Column(String, default="Factura A") # "Factura A", "Factura B", "Remito"
    punto_venta = Column(String, default="00001")
    numero_comprobante = Column(Integer, index=True)
    
    cae = Column(String, nullable=True)
    cae_vencimiento = Column(String, nullable=True)
    
    fecha_emision = Column(DateTime, default=datetime.utcnow)
    condicion_venta = Column(String, default="Contado")
    
    neto_gravado = Column(Float, default=0.0)
    iva_21 = Column(Float, default=0.0)
    total = Column(Float, default=0.0)

    # Relaciones
    vehiculo = relationship("Vehiculo")
    cliente = relationship("Cliente")
    mecanico = relationship("Usuario")
    detalles = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    
    descripcion = Column(String)
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(Float, default=0.0)
    alicuota_iva = Column(Float, default=21.0)
    subtotal = Column(Float, default=0.0)

    factura = relationship("Factura", back_populates="detalles")
