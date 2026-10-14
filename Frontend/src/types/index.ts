// Frontend/src/types/index.ts

// --- USUARIOS ---
export interface Usuario {
    id: number;
    nombre: string;
    username: string;
    rol: string;
}

export interface UsuarioCreate {
    nombre: string;
    username: string;
    rol: string;
    password?: string;
}

// --- CLIENTES ---
export interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email?: string | null;
    cuit?: string | null;
    domicilio?: string | null;
    condicion_iva?: string | null;
    vehiculos?: Vehiculo[]; 
}

export interface ClienteCreate {
    nombre: string;
    telefono: string;
    email?: string;
    cuit?: string;
    domicilio?: string;
    condicion_iva?: string;
}

// --- VEHÍCULOS ---
export interface Vehiculo {
    id: number;
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    vin?: string | null;
    cliente_id: number;
}

export interface VehiculoCreate {
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    vin?: string;
    cliente_id: number;
}

// --- INVENTARIO ---
export interface Producto {
    id: number;
    nombre: string;
    codigo?: string | null;
    categoria: string;
    precio: number;
    cantidad: number;
    stock_critico: number;
}

export interface ProductoCreate {
    nombre: string;
    codigo?: string;
    categoria: string;
    precio: number;
    cantidad?: number;
    stock_critico?: number;
}

// --- ÓRDENES DE TRABAJO ---
export interface DetalleOrden {
    id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
}

export interface DetalleOrdenCreate {
    producto_id: number;
    cantidad: number;
}

export interface OrdenTrabajo {
    id: number;
    vehiculo_id: number;
    mecanico_id: number;
    mecanico?: Usuario; 
    cliente_id?: number;
    cliente?: Cliente;
    fecha_ingreso: string;
    estado: string;
    descripcion_falla: string;
    costo_mano_obra: number;
    total: number;
    detalles: DetalleOrden[];
    kilometros?: number | null;
    nivel_combustible?: string | null;
    frente_stereo?: boolean;
    rueda_auxilio?: boolean;
    codigo_stereo?: string | null;
}

export type Planilla = OrdenTrabajo;

export interface OrdenCreate {
    vehiculo_id: number;
    mecanico_id?: number;
    descripcion_falla: string;
    estado?: string;
    costo_mano_obra?: number;
    detalles: DetalleOrdenCreate[];
    kilometros?: number;
    nivel_combustible?: string;
    frente_stereo?: boolean;
    rueda_auxilio?: boolean;
    codigo_stereo?: string;
}

// --- PRESUPUESTOS ---
export interface DetallePresupuesto {
    id: number;
    producto_id?: number | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
}

export interface DetallePresupuestoCreate {
    producto_id?: number | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
}

export interface Presupuesto {
    id: number;
    vehiculo_id: number;
    cliente_id: number;
    mecanico_id?: number | null;
    fecha_creacion: string;
    estado: string;
    validez_dias: string;
    condiciones_pago: string;
    total: number;
    cliente?: Cliente;
    vehiculo?: Vehiculo;
    mecanico?: Usuario;
    detalles: DetallePresupuesto[];
}

export interface PresupuestoCreate {
    vehiculo_id: number;
    cliente_id: number;
    mecanico_id?: number;
    estado?: string;
    validez_dias?: string;
    condiciones_pago?: string;
    detalles: DetallePresupuestoCreate[];
}

// --- FACTURACIÓN Y REMITOS ---
export interface DetalleFactura {
    id: number;
    producto_id?: number | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    alicuota_iva: number;
    subtotal: number;
}

export interface DetalleFacturaCreate {
    producto_id?: number | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    alicuota_iva?: number;
}

export interface Factura {
    id: number;
    vehiculo_id: number;
    cliente_id: number;
    mecanico_id?: number | null;
    tipo_comprobante: string; // "Factura A", "Factura B", "Remito"
    punto_venta: string;
    numero_comprobante: number;
    cae?: string | null;
    cae_vencimiento?: string | null;
    fecha_emision: string;
    condicion_venta: string;
    neto_gravado: number;
    iva_21: number;
    total: number;
    cliente?: Cliente;
    vehiculo?: Vehiculo;
    mecanico?: Usuario;
    detalles: DetalleFactura[];
}

export interface FacturaCreate {
    vehiculo_id: number;
    cliente_id: number;
    mecanico_id?: number;
    tipo_comprobante: string;
    punto_venta: string;
    numero_comprobante: number;
    cae?: string;
    cae_vencimiento?: string;
    condicion_venta: string;
    detalles: DetalleFacturaCreate[];
}

// --- CONFIGURACIÓN TALLER ---
export interface ConfiguracionTaller {
    id?: number;
    nombre_comercial: string;
    razon_social: string;
    cuit: string;
    ingresos_brutos: string;
    domicilio: string;
    ciudad_provincia: string;
    telefono: string;
    subtitulo: string;
    condicion_iva: string;
    condicion_iva_presupuesto: string;
    inicio_actividades: string;
    logo_base64?: string | null;
}