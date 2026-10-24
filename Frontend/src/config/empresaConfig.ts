// Frontend/src/config/empresaConfig.ts
import logoEmpresa from '../assets/logo-patagonia.png';
import { ConfiguracionTaller } from '../types';

export const DEFAULT_EMPRESA_CONFIG: ConfiguracionTaller = {
    nombre_comercial: "Patagonia Servicios - Taller Mecánico",
    razon_social: "Patagonia Servicios S.R.L.",
    cuit: "30-71755502-9",
    ingresos_brutos: "30-71755502-9",
    domicilio: "Av. Fontana 1250",
    ciudad_provincia: "Trelew, Chubut",
    telefono: "0280 441-6083",
    subtitulo: "Mecánica Integral & Diagnóstico Computarizado",
    condicion_iva: "IVA Responsable Inscripto",
    condicion_iva_presupuesto: "IVA Responsable Monotributo",
    inicio_actividades: "01/04/2020",
    logo_base64: undefined,
};

const nomComercialDef = DEFAULT_EMPRESA_CONFIG.nombre_comercial || "Patagonia Servicios";

export const EMPRESA_CONFIG = {
    nombreComercial: nomComercialDef,
    razonSocial: DEFAULT_EMPRESA_CONFIG.razon_social || "",
    cuit: DEFAULT_EMPRESA_CONFIG.cuit || "",
    ingresosBrutos: DEFAULT_EMPRESA_CONFIG.ingresos_brutos || "",
    domicilio: DEFAULT_EMPRESA_CONFIG.domicilio || "",
    ciudadProvincia: DEFAULT_EMPRESA_CONFIG.ciudad_provincia || "",
    domicilioCompleto: `${DEFAULT_EMPRESA_CONFIG.domicilio} - ${DEFAULT_EMPRESA_CONFIG.ciudad_provincia}`,
    telefono: DEFAULT_EMPRESA_CONFIG.telefono || "",
    subtitulo: DEFAULT_EMPRESA_CONFIG.subtitulo || "",
    condicionIva: DEFAULT_EMPRESA_CONFIG.condicion_iva || "",
    condicionIvaPresupuesto: DEFAULT_EMPRESA_CONFIG.condicion_iva_presupuesto || "",
    inicioActividades: DEFAULT_EMPRESA_CONFIG.inicio_actividades || "",
    logo: logoEmpresa,
    altLogo: `Logo ${nomComercialDef}`,
    pdfFileNamePrefix: nomComercialDef.replace(/\s+/g, '_'),
};

export const formatEmpresaConfig = (config?: ConfiguracionTaller | null) => {
    if (!config) return EMPRESA_CONFIG;
    const nomComercial = config.nombre_comercial || nomComercialDef;
    return {
        nombreComercial: nomComercial,
        razonSocial: config.razon_social || DEFAULT_EMPRESA_CONFIG.razon_social || "",
        cuit: config.cuit || DEFAULT_EMPRESA_CONFIG.cuit || "",
        ingresosBrutos: config.ingresos_brutos || DEFAULT_EMPRESA_CONFIG.ingresos_brutos || "",
        domicilio: config.domicilio || DEFAULT_EMPRESA_CONFIG.domicilio || "",
        ciudadProvincia: config.ciudad_provincia || DEFAULT_EMPRESA_CONFIG.ciudad_provincia || "",
        domicilioCompleto: `${config.domicilio || DEFAULT_EMPRESA_CONFIG.domicilio} - ${config.ciudad_provincia || DEFAULT_EMPRESA_CONFIG.ciudad_provincia}`,
        telefono: config.telefono || DEFAULT_EMPRESA_CONFIG.telefono || "",
        subtitulo: config.subtitulo || DEFAULT_EMPRESA_CONFIG.subtitulo || "",
        condicionIva: config.condicion_iva || DEFAULT_EMPRESA_CONFIG.condicion_iva || "",
        condicionIvaPresupuesto: config.condicion_iva_presupuesto || DEFAULT_EMPRESA_CONFIG.condicion_iva_presupuesto || "",
        inicioActividades: config.inicio_actividades || DEFAULT_EMPRESA_CONFIG.inicio_actividades || "",
        logo: config.logo_base64 || logoEmpresa,
        altLogo: `Logo ${nomComercial}`,
        pdfFileNamePrefix: nomComercial.replace(/\s+/g, '_'),
    };
};
