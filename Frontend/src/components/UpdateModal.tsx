// Frontend/src/components/UpdateModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { checkActualizaciones, ActualizacionesResponse } from '../api/updaterApi';

export const UpdateModal: React.FC = () => {
    const [infoUpdate, setInfoUpdate] = useState<ActualizacionesResponse | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // La verificación de actualización se ejecuta EXCLUSIVAMENTE en la app de Escritorio TallerERP.exe / Desktop.
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
                if (isMounted && res && res.hay_actualizacion) {
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
        };
    }, []);

    const handleActualizarClick = () => {
        const downloadUrl = infoUpdate?.download_url || '/actualizaciones/descargar';
        // Inicia la descarga directa del archivo ejecutable .exe
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `TallerERP_Setup_v${infoUpdate?.version_disponible || '1.0.1'}.exe`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!show || !infoUpdate) return null;

    return (
        <Modal show={show} onHide={() => setShow(false)} centered backdrop="static" size="lg">
            <Modal.Header closeButton className="bg-dark text-white border-bottom border-secondary">
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

                <h6 className="fw-bold text-dark mb-2">Notas de la Versión:</h6>
                <div
                    className="p-3 bg-light border rounded text-secondary mb-3"
                    style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: '1.5' }}
                >
                    {infoUpdate.release_notes || "Mejoras generales de rendimiento, estabilidad y optimización de componentes."}
                </div>

                <p className="text-muted small mb-0">
                    Se recomienda descargar e instalar la actualización para contar con las últimas funciones y la sincronización con la nube.
                </p>
            </Modal.Body>
            <Modal.Footer className="bg-light border-top-0 pt-0 pb-3 px-4">
                <Button variant="outline-secondary" onClick={() => setShow(false)} className="px-3">
                    Posponer
                </Button>
                <Button variant="primary" onClick={handleActualizarClick} className="fw-semibold px-4">
                    Descargar e Instalar v{infoUpdate.version_disponible}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateModal;
