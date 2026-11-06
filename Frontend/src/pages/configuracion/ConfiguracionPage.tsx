// Frontend/src/pages/configuracion/ConfiguracionPage.tsx
import { useEffect, useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { getConfiguracion, updateConfiguracion } from '../../api/configuracionApi';
import { ConfiguracionTaller } from '../../types';
import { DEFAULT_EMPRESA_CONFIG } from '../../config/empresaConfig';

// Validador de CUIT argentino con protección total contra valores nulos/no-string
const validarCUIT = (cuit: any): boolean | string => {
    if (cuit === null || cuit === undefined || typeof cuit !== 'string' || !cuit.trim()) {
        return "El CUIT es obligatorio.";
    }
    const clean = cuit.replace(/\D/g, '');
    if (clean.length !== 11) return "El CUIT debe tener exactamente 11 dígitos numéricos.";

    const digits = clean.split('').map(Number);
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const total = digits.slice(0, 10).reduce((acc, digit, idx) => acc + digit * multipliers[idx], 0);

    let verificador = 11 - (total % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10) verificador = 9;

    if (verificador !== digits[10]) {
        return "El CUIT no es válido (dígito verificador incorrecto).";
    }

    return true;
};

// Validador de fecha real en calendario con protección contra valores nulos/no-string
const validarFechaCalendario = (fechaStr: any): boolean | string => {
    if (fechaStr === null || fechaStr === undefined || typeof fechaStr !== 'string' || !fechaStr.trim()) {
        return "La fecha de inicio de actividades es obligatoria.";
    }

    const trimmed = fechaStr.trim();
    let dia: number, mes: number, anio: number;

    if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length !== 3) return "Formato de fecha inválido (use DD/MM/AAAA).";
        dia = parseInt(parts[0], 10);
        mes = parseInt(parts[1], 10);
        anio = parseInt(parts[2], 10);
    } else if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        if (parts.length !== 3) return "Formato de fecha inválido (use DD/MM/AAAA o AAAA-MM-DD).";
        if (parts[0].length === 4) {
            anio = parseInt(parts[0], 10);
            mes = parseInt(parts[1], 10);
            dia = parseInt(parts[2], 10);
        } else {
            dia = parseInt(parts[0], 10);
            mes = parseInt(parts[1], 10);
            anio = parseInt(parts[2], 10);
        }
    } else {
        return "Formato de fecha inválido (use DD/MM/AAAA).";
    }

    if (isNaN(dia) || isNaN(mes) || isNaN(anio)) return "La fecha contiene valores no numéricos.";
    if (mes < 1 || mes > 12) return "El mes debe estar entre 01 y 12.";
    if (anio < 1900) return "El año debe ser posterior a 1900.";

    // Verificación exacta de existencia en el calendario (días reales del mes y años bisiestos)
    const fechaObj = new Date(anio, mes - 1, dia);
    if (
        fechaObj.getFullYear() !== anio ||
        fechaObj.getMonth() !== mes - 1 ||
        fechaObj.getDate() !== dia
    ) {
        return `La fecha ${dia}/${mes}/${anio} no existe en el calendario (ej: febrero no tiene ${dia} días).`;
    }

    // Verificación de fecha futura
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (fechaObj > hoy) {
        return "La fecha de inicio de actividades no puede ser una fecha futura.";
    }

    return true;
};

export default function ConfiguracionPage() {
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [errorServidor, setErrorServidor] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ConfiguracionTaller>({
        defaultValues: DEFAULT_EMPRESA_CONFIG
    });

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        setCargando(true);
        setErrorServidor('');
        try {
            const data = await getConfiguracion();
            reset({
                nombre_comercial: data?.nombre_comercial || DEFAULT_EMPRESA_CONFIG.nombre_comercial,
                razon_social: data?.razon_social || DEFAULT_EMPRESA_CONFIG.razon_social,
                cuit: data?.cuit || DEFAULT_EMPRESA_CONFIG.cuit,
                ingresos_brutos: data?.ingresos_brutos || DEFAULT_EMPRESA_CONFIG.ingresos_brutos,
                domicilio: data?.domicilio || DEFAULT_EMPRESA_CONFIG.domicilio,
                ciudad_provincia: data?.ciudad_provincia || DEFAULT_EMPRESA_CONFIG.ciudad_provincia,
                telefono: data?.telefono || DEFAULT_EMPRESA_CONFIG.telefono,
                subtitulo: data?.subtitulo || DEFAULT_EMPRESA_CONFIG.subtitulo,
                condicion_iva: data?.condicion_iva || DEFAULT_EMPRESA_CONFIG.condicion_iva,
                condicion_iva_presupuesto: data?.condicion_iva_presupuesto || DEFAULT_EMPRESA_CONFIG.condicion_iva_presupuesto,
                inicio_actividades: data?.inicio_actividades || DEFAULT_EMPRESA_CONFIG.inicio_actividades,
                logo_base64: data?.logo_base64 || undefined
            });
        } catch (err: any) {
            console.error("Error al cargar la configuración", err);
            reset(DEFAULT_EMPRESA_CONFIG);
        } finally {
            setCargando(false);
        }
    };

    const onSubmit = async (formData: ConfiguracionTaller) => {
        setGuardando(true);
        setErrorServidor('');
        setMensajeExito('');

        try {
            const res = await updateConfiguracion(formData);
            reset(res);
            setMensajeExito("Datos del taller guardados correctamente en la base de datos local.");
        } catch (err: any) {
            console.error("Error al guardar la configuración", err);
            const detalle = err.response?.data?.detail;
            if (Array.isArray(detalle)) {
                setErrorServidor(detalle.map((d: any) => d.msg || d.detail).join(' | '));
            } else if (typeof detalle === 'string') {
                setErrorServidor(detalle);
            } else {
                setErrorServidor("Error al guardar la configuración.");
            }
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center my-5">
                <Spinner animation="border" variant="primary" className="me-2" />
                <span>Cargando datos del taller...</span>
            </div>
        );
    }

    return (
        <div className="container-fluid px-2 px-sm-3 px-md-4 py-3">
            <h2 className="mb-4">Ajustes y Datos del Taller</h2>

            {mensajeExito && <Alert variant="success" dismissible onClose={() => setMensajeExito('')}>{mensajeExito}</Alert>}
            {errorServidor && <Alert variant="danger" dismissible onClose={() => setErrorServidor('')}>{errorServidor}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white fw-bold">
                    Información Institucional y Fiscal
                </Card.Header>
                <Card.Body className="p-3 p-md-4">
                    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Nombre Comercial del Taller *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.nombre_comercial}
                                    {...register('nombre_comercial', {
                                        required: "El nombre comercial es obligatorio.",
                                        minLength: { value: 2, message: "Debe tener al menos 2 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.nombre_comercial?.message}
                                </Form.Control.Feedback>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Razón Social / Titular *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.razon_social}
                                    {...register('razon_social', {
                                        required: "La razón social es obligatoria.",
                                        minLength: { value: 2, message: "Debe tener al menos 2 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.razon_social?.message}
                                </Form.Control.Feedback>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">CUIT / CUIL *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ej: 33-71755502-9"
                                    isInvalid={!!errors.cuit}
                                    {...register('cuit', {
                                        required: "El CUIT es obligatorio.",
                                        validate: value => validarCUIT(value)
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.cuit?.message}
                                </Form.Control.Feedback>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Ingresos Brutos *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.ingresos_brutos}
                                    {...register('ingresos_brutos', {
                                        required: "Ingresos Brutos es obligatorio."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.ingresos_brutos?.message}
                                </Form.Control.Feedback>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Domicilio Comercial *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.domicilio}
                                    {...register('domicilio', {
                                        required: "El domicilio comercial es obligatorio.",
                                        minLength: { value: 3, message: "Debe tener al menos 3 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.domicilio?.message}
                                </Form.Control.Feedback>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Ciudad y Provincia *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.ciudad_provincia}
                                    {...register('ciudad_provincia', {
                                        required: "La ciudad y provincia son obligatorias.",
                                        minLength: { value: 3, message: "Debe tener al menos 3 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.ciudad_provincia?.message}
                                </Form.Control.Feedback>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Teléfono / WhatsApp *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.telefono}
                                    {...register('telefono', {
                                        required: "El teléfono es obligatorio.",
                                        validate: value => (typeof value === 'string' && value.replace(/\D/g, '').length >= 6) || "El teléfono debe contener al menos 6 dígitos numéricos."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.telefono?.message}
                                </Form.Control.Feedback>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Label className="fw-bold">Subtítulo / Especialidad</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.subtitulo}
                                    {...register('subtitulo')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.subtitulo?.message}
                                </Form.Control.Feedback>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4} className="mb-3">
                                <Form.Label className="fw-bold">Condición IVA (Facturación) *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.condicion_iva}
                                    {...register('condicion_iva', {
                                        required: "La condición de IVA es obligatoria."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.condicion_iva?.message}
                                </Form.Control.Feedback>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Label className="fw-bold">Condición IVA (Presupuesto) *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.condicion_iva_presupuesto}
                                    {...register('condicion_iva_presupuesto', {
                                        required: "La condición de IVA para presupuestos es obligatoria."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.condicion_iva_presupuesto?.message}
                                </Form.Control.Feedback>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Label className="fw-bold">Fecha Inicio de Actividades *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="DD/MM/AAAA"
                                    isInvalid={!!errors.inicio_actividades}
                                    {...register('inicio_actividades', {
                                        required: "La fecha de inicio de actividades es obligatoria.",
                                        validate: value => validarFechaCalendario(value)
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.inicio_actividades?.message}
                                </Form.Control.Feedback>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="primary" type="submit" disabled={guardando} className="px-4 fw-bold">
                                {guardando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar Cambios"}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
