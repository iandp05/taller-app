# Backend/sembrar_5_de_cada_entidad.py
import os
import sys
import uuid
import datetime

# Asegurar import de Backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
from database import engine_local, get_turso_engine, SesionLocal
from modulos.usuarios.models import Usuario
from modulos.usuarios.services import get_password_hash
from modulos.clientes.models import Cliente
from modulos.vehiculos.models import Vehiculo
from modulos.inventario.models import Producto
from modulos.ordenes.models import OrdenTrabajo, DetalleOrden
from modulos.presupuestos.models import Presupuesto, DetallePresupuesto
from modulos.factura.models import Factura, DetalleFactura
from modulos.configuracion.models import ConfiguracionTaller

def sembrar_sesion(session):
    print("  -> Limpiando tablas previas para regeneración limpia...")
    session.query(DetalleFactura).delete()
    session.query(Factura).delete()
    session.query(DetallePresupuesto).delete()
    session.query(Presupuesto).delete()
    session.query(DetalleOrden).delete()
    session.query(OrdenTrabajo).delete()
    session.query(Producto).delete()
    session.query(Vehiculo).delete()
    session.query(Cliente).delete()
    session.query(Usuario).delete()
    session.query(ConfiguracionTaller).delete()
    session.commit()

    print("  -> 1. Sembrando Configuración del Taller...")
    config = ConfiguracionTaller(
        id=str(uuid.uuid4()),
        nombre_comercial="Patagonia",
        razon_social="prueba",
        cuit="20-45380395-4",
        ingresos_brutos="20-45380395-4",
        domicilio="calle 1234",
        ciudad_provincia="Trelew, Chubut",
        telefono="0280 4489002",
        subtitulo="TODAS LAS MARCAS",
        condicion_iva="IVA Responsable Inscripto",
        condicion_iva_presupuesto="IVA Responsable Monotributo",
        inicio_actividades="01/04/2022"
    )
    session.add(config)

    print("  -> 2. Sembrando 5 Usuarios...")
    pass_hash = get_password_hash("1234")
    u1 = Usuario(id=str(uuid.uuid4()), nombre="Luca Del Pino", username="luca", password_hash=pass_hash, rol="Admin", preferencia_tema="light")
    u2 = Usuario(id=str(uuid.uuid4()), nombre="Gustavo Perdomo", username="gustavo", password_hash=pass_hash, rol="Mecánico", preferencia_tema="light")
    u3 = Usuario(id=str(uuid.uuid4()), nombre="Carlos Rodríguez", username="carlos", password_hash=pass_hash, rol="Mecánico", preferencia_tema="light")
    u4 = Usuario(id=str(uuid.uuid4()), nombre="Juan Pérez", username="juan", password_hash=pass_hash, rol="Vendedor", preferencia_tema="light")
    u5 = Usuario(id=str(uuid.uuid4()), nombre="María Fernández", username="maria", password_hash=pass_hash, rol="Administrativa", preferencia_tema="light")
    usuarios = [u1, u2, u3, u4, u5]
    session.add_all(usuarios)

    print("  -> 3. Sembrando 5 Clientes...")
    c1 = Cliente(id=str(uuid.uuid4()), nombre="Juan Pérez", telefono="0280 411-2233", email="juan.perez@gmail.com", cuit="20-30123456-7", domicilio="Av. Rawson 450", condicion_iva="Consumidor Final")
    c2 = Cliente(id=str(uuid.uuid4()), nombre="Transportes Chubut S.A.", telefono="0280 445-8899", email="contacto@transporteschubut.com", cuit="30-70987654-3", domicilio="Ruta 3 Km 1420", condicion_iva="IVA Responsable Inscripto")
    c3 = Cliente(id=str(uuid.uuid4()), nombre="María González", telefono="0280 422-3344", email="maria.gonzalez@hotmail.com", cuit="27-28345678-2", domicilio="Belgrano 182", condicion_iva="Consumidor Final")
    c4 = Cliente(id=str(uuid.uuid4()), nombre="Distribuidora Patagonia", telefono="0280 443-1122", email="ventas@distpatagonia.com.ar", cuit="30-65432109-8", domicilio="Italia 650", condicion_iva="IVA Responsable Inscripto")
    c5 = Cliente(id=str(uuid.uuid4()), nombre="Roberto Fernández", telefono="0280 455-6677", email="rfernandez@yahoo.com.ar", cuit="20-25678901-5", domicilio="Mitre 890", condicion_iva="Consumidor Final")
    clientes = [c1, c2, c3, c4, c5]
    session.add_all(clientes)

    print("  -> 4. Sembrando 5 Vehículos...")
    v1 = Vehiculo(id=str(uuid.uuid4()), patente="AA123BB", marca="Toyota", modelo="Hilux 2.8 TDI", anio=2021, cliente_id=c1.id)
    v2 = Vehiculo(id=str(uuid.uuid4()), patente="AB456CD", marca="Volkswagen", modelo="Amarok 3.0 V6", anio=2022, cliente_id=c2.id)
    v3 = Vehiculo(id=str(uuid.uuid4()), patente="AC789EF", marca="Ford", modelo="Ranger 3.2 Limited", anio=2020, cliente_id=c3.id)
    v4 = Vehiculo(id=str(uuid.uuid4()), patente="AD012GH", marca="Renault", modelo="Kangoo Express 1.6", anio=2019, cliente_id=c4.id)
    v5 = Vehiculo(id=str(uuid.uuid4()), patente="AE345IJ", marca="Chevrolet", modelo="Cruze 1.4T LTZ", anio=2023, cliente_id=c5.id)
    vehiculos = [v1, v2, v3, v4, v5]
    session.add_all(vehiculos)

    print("  -> 5. Sembrando 5 Productos de Inventario...")
    p1 = Producto(id=str(uuid.uuid4()), nombre="Aceite Sintético 5W-30 (4L)", codigo="ACE-5W30", categoria="Lubricantes", precio=45000.0, cantidad=25, stock_critico=5)
    p2 = Producto(id=str(uuid.uuid4()), nombre="Filtro de Aceite Hilux/Amarok", codigo="FIL-ACE-01", categoria="Filtros", precio=12500.0, cantidad=30, stock_critico=8)
    p3 = Producto(id=str(uuid.uuid4()), nombre="Filtro de Aire Ranger/Kangoo", codigo="FIL-AIR-02", categoria="Filtros", precio=18000.0, cantidad=20, stock_critico=5)
    p4 = Producto(id=str(uuid.uuid4()), nombre="Pastillas de Freno Delanteras", codigo="PAS-FRE-03", categoria="Frenos", precio=35000.0, cantidad=15, stock_critico=4)
    p5 = Producto(id=str(uuid.uuid4()), nombre="Batería 12V 75Ah Moura", codigo="BAT-12V75", categoria="Electricidad", precio=120000.0, cantidad=8, stock_critico=2)
    productos = [p1, p2, p3, p4, p5]
    session.add_all(productos)
    session.flush()

    print("  -> 6. Sembrando 5 Órdenes de Trabajo (con estados exactos)...")
    o1 = OrdenTrabajo(id=str(uuid.uuid4()), vehiculo_id=v1.id, cliente_id=c1.id, mecanico_id=u2.id, descripcion_falla="Cambio de aceite, filtros y chequeo general de frenos.", estado="Ingresado", costo_mano_obra=25000.0, kilometros=45000, nivel_combustible="Medio", frente_stereo="Si", rueda_auxilio="Si", codigo_stereo="1234", total=120500.0)
    o2 = OrdenTrabajo(id=str(uuid.uuid4()), vehiculo_id=v2.id, cliente_id=c2.id, mecanico_id=u3.id, descripcion_falla="Ruido metálico en ruedas delanteras al frenar.", estado="En Reparación", costo_mano_obra=30000.0, kilometros=62000, nivel_combustible="3/4", frente_stereo="Si", rueda_auxilio="Si", codigo_stereo="5678", total=65000.0)
    o3 = OrdenTrabajo(id=str(uuid.uuid4()), vehiculo_id=v3.id, cliente_id=c3.id, mecanico_id=u2.id, descripcion_falla="Service completo 60.000 km y alineación.", estado="Listo para Entregar", costo_mano_obra=35000.0, kilometros=60000, nivel_combustible="Lleno", frente_stereo="Si", rueda_auxilio="Si", codigo_stereo="4321", total=110500.0)
    o4 = OrdenTrabajo(id=str(uuid.uuid4()), vehiculo_id=v4.id, cliente_id=c4.id, mecanico_id=u3.id, descripcion_falla="Reemplazo de batería y control de alternador.", estado="Entregado", costo_mano_obra=20000.0, kilometros=85000, nivel_combustible="1/2", frente_stereo="No", rueda_auxilio="Si", codigo_stereo=None, total=140000.0)
    o5 = OrdenTrabajo(id=str(uuid.uuid4()), vehiculo_id=v5.id, cliente_id=c5.id, mecanico_id=u2.id, descripcion_falla="Revisión de suspensión y cambio de filtro de aire.", estado="Ingresado", costo_mano_obra=18000.0, kilometros=25000, nivel_combustible="1/4", frente_stereo="Si", rueda_auxilio="Si", codigo_stereo="9988", total=36000.0)
    ordenes = [o1, o2, o3, o4, o5]
    session.add_all(ordenes)

    print("  -> 7. Sembrando 5 Presupuestos...")
    pr1 = Presupuesto(id=str(uuid.uuid4()), vehiculo_id=v1.id, cliente_id=c1.id, mecanico_id=u2.id, estado="Emitido", validez_dias="15 días", condiciones_pago="Efectivo / Transferencia", total=120500.0)
    pr2 = Presupuesto(id=str(uuid.uuid4()), vehiculo_id=v2.id, cliente_id=c2.id, mecanico_id=u3.id, estado="Aprobado", validez_dias="15 días", condiciones_pago="Contado 50% anticipo", total=65000.0)
    pr3 = Presupuesto(id=str(uuid.uuid4()), vehiculo_id=v3.id, cliente_id=c3.id, mecanico_id=u2.id, estado="Emitido", validez_dias="10 días", condiciones_pago="Transferencia Bancaria", total=110500.0)
    pr4 = Presupuesto(id=str(uuid.uuid4()), vehiculo_id=v4.id, cliente_id=c4.id, mecanico_id=u3.id, estado="Aprobado", validez_dias="30 días", condiciones_pago="Cheque 30 días", total=140000.0)
    pr5 = Presupuesto(id=str(uuid.uuid4()), vehiculo_id=v5.id, cliente_id=c5.id, mecanico_id=u2.id, estado="Emitido", validez_dias="15 días", condiciones_pago="Tarjeta de Crédito", total=36000.0)
    presupuestos = [pr1, pr2, pr3, pr4, pr5]
    session.add_all(presupuestos)

    print("  -> 8. Sembrando 5 Facturas / Remitos...")
    f1 = Factura(id=str(uuid.uuid4()), vehiculo_id=v1.id, cliente_id=c1.id, mecanico_id=u2.id, tipo_comprobante="Factura B", punto_venta="00001", numero_comprobante=101, cae="74125896301234", cae_vencimiento="30/11/2026", condicion_venta="Contado", neto_gravado=99586.78, iva_21=20913.22, total=120500.0)
    f2 = Factura(id=str(uuid.uuid4()), vehiculo_id=v2.id, cliente_id=c2.id, mecanico_id=u3.id, tipo_comprobante="Factura A", punto_venta="00001", numero_comprobante=102, cae="85236974102345", cae_vencimiento="30/11/2026", condicion_venta="Cuenta Corriente", neto_gravado=53719.01, iva_21=11280.99, total=65000.0)
    f3 = Factura(id=str(uuid.uuid4()), vehiculo_id=v3.id, cliente_id=c3.id, mecanico_id=u2.id, tipo_comprobante="Factura B", punto_venta="00001", numero_comprobante=103, cae="96325874103456", cae_vencimiento="30/11/2026", condicion_venta="Transferencia", neto_gravado=91322.31, iva_21=19177.69, total=110500.0)
    f4 = Factura(id=str(uuid.uuid4()), vehiculo_id=v4.id, cliente_id=c4.id, mecanico_id=u3.id, tipo_comprobante="Remito", punto_venta="00001", numero_comprobante=104, cae=None, cae_vencimiento=None, condicion_venta="Contado", neto_gravado=115702.48, iva_21=24297.52, total=140000.0)
    f5 = Factura(id=str(uuid.uuid4()), vehiculo_id=v5.id, cliente_id=c5.id, mecanico_id=u2.id, tipo_comprobante="Factura B", punto_venta="00001", numero_comprobante=105, cae="14725836904567", cae_vencimiento="30/11/2026", condicion_venta="Efectivo", neto_gravado=29752.07, iva_21=6247.93, total=36000.0)
    facturas = [f1, f2, f3, f4, f5]
    session.add_all(facturas)

    session.commit()
    print("  -> ¡5 Elementos por entidad sembrados con éxito!")

def ejecutar():
    print("==========================================")
    print("1. Sembrando base de datos LOCAL (SQLite)...")
    db_local = SesionLocal()
    try:
        sembrar_sesion(db_local)
    finally:
        db_local.close()

    engine_turso = get_turso_engine()
    if engine_turso:
        print("2. Sembrando base de datos NUBE (Turso Cloud DB)...")
        session_turso = database.sessionmaker(autocommit=False, autoflush=False, bind=engine_turso)()
        try:
            sembrar_sesion(session_turso)
        finally:
            session_turso.close()
    else:
        print("Aviso: No se pudo obtener el engine de Turso DB.")

    print("==========================================")
    print("¡SEMBRADO DE 5 ELEMENTOS COMPLETADO CON ÉXITO!")

if __name__ == "__main__":
    ejecutar()
