// Frontend/src/config/empresaConfig.ts
import logoEmpresa from '../assets/logo-patagonia.png';
import { ConfiguracionTaller } from '../types';

/**
 * Configuración por defecto (usada como fallback si no hay conexión o se inicia la BDD).
 */
export const DEFAULT_EMPRESA_CONFIG: ConfiguracionTaller = {
    nombre_comercial: "Patagonia Servicios",
    razon_social: "PERDOMO GUSTAVO CAP I SECC IV",
    cuit: "33-71755502-9",
    ingresos_brutos: "33-71755502-9",
    domicilio: "Albarracin 1219",
    ciudad_provincia: "Trelew, Chubut",
    telefono: "0280 4416083",
    subtitulo: "TODAS LAS MARCAS",
    condicion_iva: "IVA Responsable Inscripto",
    condicion_iva_presupuesto: "IVA Responsable Monotributo",
    inicio_actividades: "01/04/2022",
    logo_base64: null,
};

/**
 * Objeto auxiliar mantenido para compatibilidad con componentes existentes.
 */
export const EMPRESA_CONFIG = {
    nombreComercial: DEFAULT_EMPRESA_CONFIG.nombre_comercial,
    razonSocial: DEFAULT_EMPRESA_CONFIG.razon_social,
    cuit: DEFAULT_EMPRESA_CONFIG.cuit,
    ingresosBrutos: DEFAULT_EMPRESA_CONFIG.ingresos_brutos,
    domicilio: DEFAULT_EMPRESA_CONFIG.domicilio,
    ciudadProvincia: DEFAULT_EMPRESA_CONFIG.ciudad_provincia,
    domicilioCompleto: `${DEFAULT_EMPRESA_CONFIG.domicilio} - ${DEFAULT_EMPRESA_CONFIG.ciudad_provincia}`,
    telefono: DEFAULT_EMPRESA_CONFIG.telefono,
    subtitulo: DEFAULT_EMPRESA_CONFIG.subtitulo,
    condicionIva: DEFAULT_EMPRESA_CONFIG.condicion_iva,
    condicionIvaPresupuesto: DEFAULT_EMPRESA_CONFIG.condicion_iva_presupuesto,
    inicioActividades: DEFAULT_EMPRESA_CONFIG.inicio_actividades,
    logo: logoEmpresa,
    altLogo: `Logo ${DEFAULT_EMPRESA_CONFIG.nombre_comercial}`,
    pdfFileNamePrefix: DEFAULT_EMPRESA_CONFIG.nombre_comercial.replace(/\s+/g, '_'),
};

export const formatEmpresaConfig = (config?: ConfiguracionTaller | null) => {
    if (!config) return EMPRESA_CONFIG;
    return {
        nombreComercial: config.nombre_comercial || DEFAULT_EMPRESA_CONFIG.nombre_comercial,
        razonSocial: config.razon_social || DEFAULT_EMPRESA_CONFIG.razon_social,
        cuit: config.cuit || DEFAULT_EMPRESA_CONFIG.cuit,
        ingresosBrutos: config.ingresos_brutos || DEFAULT_EMPRESA_CONFIG.ingresos_brutos,
        domicilio: config.domicilio || DEFAULT_EMPRESA_CONFIG.domicilio,
        ciudadProvincia: config.ciudad_provincia || DEFAULT_EMPRESA_CONFIG.ciudad_provincia,
        domicilioCompleto: `${config.domicilio || DEFAULT_EMPRESA_CONFIG.domicilio} - ${config.ciudad_provincia || DEFAULT_EMPRESA_CONFIG.ciudad_provincia}`,
        telefono: config.telefono || DEFAULT_EMPRESA_CONFIG.telefono,
        subtitulo: config.subtitulo || DEFAULT_EMPRESA_CONFIG.subtitulo,
        condicionIva: config.condicion_iva || DEFAULT_EMPRESA_CONFIG.condicion_iva,
        condicionIvaPresupuesto: config.condicion_iva_presupuesto || DEFAULT_EMPRESA_CONFIG.condicion_iva_presupuesto,
        inicioActividades: config.inicio_actividades || DEFAULT_EMPRESA_CONFIG.inicio_actividades,
        logo: config.logo_base64 || logoEmpresa,
        altLogo: `Logo ${config.nombre_comercial || DEFAULT_EMPRESA_CONFIG.nombre_comercial}`,
        pdfFileNamePrefix: (config.nombre_comercial || DEFAULT_EMPRESA_CONFIG.nombre_comercial).replace(/\s+/g, '_'),
    };
};
