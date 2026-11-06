// Frontend/src/pages/version/VersionPage.tsx
import { useEffect, useState } from 'react';
import { Card, Button, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { FaSyncAlt, FaCheckCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { api } from '../../api/axios';

interface VersionInfo {
    version_actual: string;
    version_disponible: string;
    hay_actualizacion: boolean;
    download_url?: string;
    release_notes?: string;
}

interface ProgresoInfo {
    descargando: boolean;
    porcentaje: number;
    completado: boolean;
    error: string | null;
    mensaje: string;
}

export default function VersionPage() {
    const [cargandoCheck, setCargandoCheck] = useState(true);
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [errorCheck, setErrorCheck] = useState<string | null>(null);

    // Estados para proceso de descarga e instalación directa
    const [descargando, setDescargando] = useState(false);
    const [progreso, setProgreso] = useState<ProgresoInfo>({
        descargando: false,
        porcentaje: 0,
        completado: false,
        error: null,
        mensaje: 'Listo'
    });

    const consultarVersion = async () => {
        setCargandoCheck(true);
        setErrorCheck(null);
        try {
            const res = await api.get('/actualizaciones/check');
            setVersionInfo(res.data);
        } catch (err: any) {
            console.error("Error al verificar versión:", err);
            setErrorCheck("No se pudo conectar con el servidor de actualizaciones. Verifica tu conexión.");
        } finally {
            setCargandoCheck(false);
        }
    };

    useEffect(() => {
        consultarVersion();
    }, []);

    // Polling de progreso cuando inicia la descarga
    useEffect(() => {
        let interval: any = null;
        if (descargando) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get('/actualizaciones/progreso');
                    setProgreso(res.data);

                    if (res.data.completado) {
                        setDescargando(false);
                        clearInterval(interval);
                        localStorage.setItem('version_aplicada', versionInfo?.version_disponible || '');
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else if (res.data.error) {
                        setDescargando(false);
                        clearInterval(interval);
                    }
                } catch (e) {
                    console.error("Error verificando progreso:", e);
                }
            }, 500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [descargando, versionInfo]);

    const handleIniciarInstalacion = async () => {
        try {
            setDescargando(true);
            await api.post('/actualizaciones/iniciar');
        } catch (err) {
            console.error("Error iniciando instalación:", err);
            setDescargando(false);
        }
    };

    return (
        <div className="container-fluid px-2 px-sm-3 px-md-4 py-3">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
                <div>
                    <h2 className="mb-0">Versión y Sistema</h2>
                    <p className="text-muted small mb-0">Información del software e instalador de actualizaciones en vivo</p>
                </div>

                <Button
                    variant="outline-primary"
                    onClick={consultarVersion}
                    disabled={cargandoCheck || descargando}
                    className="d-flex align-items-center gap-2 fw-semibold"
                >
                    <FaSyncAlt className={cargandoCheck ? "spinner-border spinner-border-sm border-0" : ""} />
                    <span>{cargandoCheck ? "Buscando..." : "Buscar Nuevas Actualizaciones"}</span>
                </Button>
            </div>

            {errorCheck && <Alert variant="danger" dismissible onClose={() => setErrorCheck(null)}>{errorCheck}</Alert>}

            <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
                    <span>Estado del Sistema TallerERP</span>
                    {cargandoCheck ? (
                        <Spinner animation="border" size="sm" variant="light" />
                    ) : versionInfo?.hay_actualizacion ? (
                        <Badge bg="warning" text="dark" className="fs-6 px-3 py-2">
                            <FaExclamationTriangle className="me-1" /> ¡Nueva Versión v{versionInfo.version_disponible} Disponible!
                        </Badge>
                    ) : (
                        <Badge bg="success" className="fs-6 px-3 py-2">
                            <FaCheckCircle className="me-1" /> Sistema Actualizado
                        </Badge>
                    )}
                </Card.Header>
                <Card.Body className="p-4">
                    <div className="row align-items-center">
                        <div className="col-md-6 mb-3 mb-md-0">
                            <div className="p-3 bg-light border rounded">
                                <small className="text-secondary fw-bold d-block mb-1">Versión Instalada Actualmente:</small>
                                <div className="d-flex align-items-baseline gap-2">
                                    <span className="fs-3 fw-bold text-dark font-monospace">
                                        v{versionInfo?.version_actual || '1.0.1'}
                                    </span>
                                    <Badge bg="secondary" className="px-2 py-1">Ejecutable Local</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="p-3 bg-light border rounded">
                                <small className="text-secondary fw-bold d-block mb-1">Última Versión en el Servidor:</small>
                                <div className="d-flex align-items-baseline gap-2">
                                    <span className="fs-3 fw-bold text-primary font-monospace">
                                        v{versionInfo?.version_disponible || versionInfo?.version_actual || '1.0.1'}
                                    </span>
                                    {versionInfo?.hay_actualizacion ? (
                                        <Badge bg="warning" text="dark" className="px-2 py-1 fw-bold">Actualización Lista</Badge>
                                    ) : (
                                        <Badge bg="success" className="px-2 py-1">En Sintonia</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {versionInfo?.hay_actualizacion && (
                        <div className="mt-4 p-3 border border-warning rounded bg-warning bg-opacity-10">
                            <h6 className="fw-bold text-dark mb-2">Novedades de la Versión v{versionInfo.version_disponible}:</h6>
                            <p className="text-dark small mb-3">
                                {versionInfo.release_notes || "Mejoras de estabilidad, corrección de errores y optimización de rendimiento."}
                            </p>

                            {!descargando && !progreso.completado && (
                                <Button
                                    variant="success"
                                    size="lg"
                                    className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
                                    onClick={handleIniciarInstalacion}
                                >
                                    <FaDownload />
                                    <span>Descargar e Instalar v{versionInfo.version_disponible} Ahora</span>
                                </Button>
                            )}

                            {descargando && (
                                <div className="mt-3">
                                    <div className="d-flex justify-content-between small fw-bold mb-1">
                                        <span>{progreso.mensaje}</span>
                                        <span>{progreso.porcentaje}%</span>
                                    </div>
                                    <ProgressBar animated now={progreso.porcentaje} variant="success" className="mb-2" style={{ height: '14px' }} />
                                </div>
                            )}

                            {progreso.completado && (
                                <Alert variant="success" className="mb-0 mt-2 fw-bold text-center">
                                    ¡Actualización completada! Reiniciando aplicación...
                                </Alert>
                            )}

                            {progreso.error && (
                                <Alert variant="danger" className="mb-0 mt-2 small">
                                    {progreso.error}
                                </Alert>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
