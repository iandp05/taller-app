// Frontend/src/components/UpdateModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Badge, ProgressBar, Alert } from 'react-bootstrap';
import {
    checkActualizaciones,
    iniciarActualizacion,
    getProgresoActualizacion,
    ActualizacionesResponse
} from '../api/updaterApi';

export const UpdateModal: React.FC = () => {
    const [infoUpdate, setInfoUpdate] = useState<ActualizacionesResponse | null>(null);
    const [show, setShow] = useState(false);

    // Estados para el progreso en vivo dentro del modal
    const [descargando, setDescargando] = useState(false);
    const [porcentaje, setPorcentaje] = useState(0);
    const [mensajeEstado, setMensajeEstado] = useState('');
    const [completado, setCompletado] = useState(false);
    const [errorModal, setErrorModal] = useState<string | null>(null);

    const pollingIntervalRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;

        // La verificación de actualización se ejecuta EXCLUSIVAMENTE en la app de Escritorio / Localhost.
        // La versión Web siempre corre la última versión del servidor y NUNCA debe mostrar este cartel.
        const esEntornoDesktop = (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            (window as any).pywebview !== undefined ||
            window.navigator.userAgent.includes('TallerERP')
        );

        if (!esEntornoDesktop) {
            return;
        }

        const verificar = async () => {
            try {
                const res = await checkActualizaciones();
                const versionAplicada = localStorage.getItem('version_aplicada');
                if (isMounted && res && res.hay_actualizacion && res.version_disponible !== versionAplicada) {
                    setInfoUpdate(res);
                    setShow(true);
                }
            } catch (error) {
                console.log("No se pudo verificar actualizaciones en escritorio:", error);
            }
        };

        verificar();
        const interval = setInterval(verificar, 30 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    const handleIniciarDescarga = async () => {
        setErrorModal(null);
        setDescargando(true);
        setPorcentaje(5);
        setMensajeEstado('Iniciando descarga e instalación en vivo...');

        try {
            await iniciarActualizacion();

            // Polling cada 300ms para obtener el progreso en tiempo real
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    const prog = await getProgresoActualizacion();
                    setPorcentaje(prog.porcentaje);
                    setMensajeEstado(prog.mensaje);

                    if (prog.error) {
                        clearInterval(pollingIntervalRef.current);
                        setDescargando(false);
                        setErrorModal(prog.error);
                    } else if (prog.completado) {
                        clearInterval(pollingIntervalRef.current);
                        setDescargando(false);
                        setCompletado(true);
                        if (infoUpdate) {
                            localStorage.setItem('version_aplicada', infoUpdate.version_disponible);
                        }

                        // Reiniciar o recargar la aplicación en 2.5s
                        setTimeout(() => {
                            window.location.reload();
                        }, 2500);
                    }
                } catch (err) {
                    console.error("Error consultando progreso:", err);
                }
            }, 300);

        } catch (err: any) {
            setDescargando(false);
            setErrorModal("No se pudo iniciar la actualización. Revisa tu conexión a red.");
        }
    };

    if (!show || !infoUpdate) return null;

    return (
        <Modal show={show} onHide={() => !descargando && setShow(false)} centered backdrop="static" size="lg">
            <Modal.Header closeButton={!descargando} className="bg-dark text-white border-bottom border-secondary">
                <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold">
                    <span>Actualización del Sistema Disponible</span>
                    <Badge bg="primary" className="ms-2 font-monospace">v{infoUpdate.version_disponible}</Badge>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 bg-white">
                <div className="p-3 bg-light border rounded d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <span className="text-muted small d-block">Versión Instalada:</span>
                        <strong className="text-secondary font-monospace fs-6">v{infoUpdate.version_actual}</strong>
                    </div>
                    <div className="text-muted fw-bold">→</div>
                    <div className="text-end">
                        <span className="text-muted small d-block">Versión Disponible:</span>
                        <strong className="text-primary font-monospace fs-6">v{infoUpdate.version_disponible}</strong>
                    </div>
                </div>

                {!descargando && !completado && !errorModal && (
                    <>
                        <h6 className="fw-bold text-dark mb-2">Notas de la Versión:</h6>
                        <div
                            className="p-3 bg-light border rounded text-secondary mb-3"
                            style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: '1.5' }}
                        >
                            {infoUpdate.release_notes || "Mejoras generales de rendimiento, estabilidad y optimización de componentes."}
                        </div>

                        <p className="text-muted small mb-0">
                            Se recomienda actualizar el sistema para mantener la compatibilidad con el servidor de sincronización y disponer de las últimas funciones.
                        </p>
                    </>
                )}

                {/* Zona de Carga en Vivo (Sin pestañas ni ventanas externas) */}
                {(descargando || completado) && (
                    <div className="my-3 p-3 bg-light border rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-semibold text-dark small">{mensajeEstado}</span>
                            <span className="fw-bold font-monospace text-primary">{porcentaje}%</span>
                        </div>
                        <ProgressBar
                            animated={descargando}
                            now={porcentaje}
                            variant={completado ? "success" : "primary"}
                            style={{ height: '12px' }}
                        />
                    </div>
                )}

                {/* Cartel Verde de Éxito al Completar */}
                {completado && (
                    <Alert variant="success" className="mt-3 mb-0 fw-semibold text-center">
                        ¡Actualización v{infoUpdate.version_disponible} instalada correctamente! Reiniciando aplicación en 2 segundos...
                    </Alert>
                )}

                {/* Cartel Rojo de Error con Rollback Seguro */}
                {errorModal && (
                    <Alert variant="danger" className="mt-3 mb-0">
                        <div className="fw-bold mb-1">Fallo de Actualización</div>
                        <div className="small mb-2">{errorModal}</div>
                        <div className="small text-secondary">Tu versión v{infoUpdate.version_actual} se conservó 100% segura e intacta. Podés reintentar cuando gustes.</div>
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-light border-top-0 pt-0 pb-3 px-4">
                {!descargando && !completado && (
                    <>
                        <Button variant="outline-secondary" onClick={() => setShow(false)} className="px-3">
                            Posponer
                        </Button>
                        <Button variant="primary" onClick={handleIniciarDescarga} className="fw-semibold px-4">
                            {errorModal ? "Reintentar Actualización" : `Descargar e Instalar v${infoUpdate.version_disponible}`}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateModal;
