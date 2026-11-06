// Frontend/src/components/UpdateModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { checkActualizaciones, ActualizacionesResponse } from '../api/updaterApi';

export const UpdateModal: React.FC = () => {
    const [infoUpdate, setInfoUpdate] = useState<ActualizacionesResponse | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const verificar = async () => {
            try {
                const res = await checkActualizaciones();
                if (isMounted && res && res.hay_actualizacion) {
                    setInfoUpdate(res);
                    setShow(true);
                }
            } catch (error) {
                console.log("No se pudo verificar actualizaciones automáticamente:", error);
            }
        };

        // Verificar al iniciar y cada 30 minutos
        verificar();
        const interval = setInterval(verificar, 30 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleActualizarClick = () => {
        if (infoUpdate?.download_url) {
            window.open(infoUpdate.download_url, '_blank');
        } else {
            window.open('https://github.com/iandp05/taller-app/releases/latest', '_blank');
        }
    };

    if (!show || !infoUpdate) return null;

    return (
        <Modal show={show} onHide={() => setShow(false)} centered backdrop="static" size="lg">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title className="d-flex align-items-center gap-2">
                    🚀 <span>¡Nueva Actualización Disponible!</span>
                    <Badge bg="warning" text="dark" className="ms-2">v{infoUpdate.version_disponible}</Badge>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
                    <strong>Versión instalada actual:</strong> <code>v{infoUpdate.version_actual}</code>
                    <span className="ms-auto">➡️</span>
                    <strong>Nueva versión lista:</strong> <code>v{infoUpdate.version_disponible}</code>
                </div>

                <h5 className="fw-bold mb-2 text-dark">📋 Novedades de esta actualización:</h5>
                <div className="p-3 bg-light border rounded text-secondary mb-3" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                    {infoUpdate.release_notes || "Corrección de errores, mejoras de rendimiento y optimizaciones del sistema."}
                </div>

                <p className="text-muted small mb-0">
                    💡 Se recomienda actualizar la aplicación para contar con las últimas funciones, correcciones de errores y sincronización en la nube.
                </p>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="outline-secondary" onClick={() => setShow(false)}>
                    Más tarde
                </Button>
                <Button variant="success" onClick={handleActualizarClick} className="fw-bold px-4">
                    ⬇️ Descargar e Instalar v{infoUpdate.version_disponible}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateModal;
