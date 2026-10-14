// Frontend/src/components/ConflictoSincronizacionModal.tsx
import { Modal, Button, Card, Row, Col } from 'react-bootstrap';

interface ConflictoData {
    campo: string;
    valorLocal: string;
    valorServidor: string;
}

interface ConflictoSincronizacionModalProps {
    show: boolean;
    tituloRegistro?: string;
    conflictos: ConflictoData[];
    onResolver: (conservarLocal: boolean) => void;
    onClose: () => void;
}

export default function ConflictoSincronizacionModal({
    show,
    tituloRegistro = "Registro de Cliente / Vehículo",
    conflictos,
    onResolver,
    onClose
}: ConflictoSincronizacionModalProps) {
    return (
        <Modal show={show} onHide={onClose} size="lg" centered>
            <Modal.Header closeButton className="bg-warning text-dark">
                <Modal.Title className="fw-bold">Conflicto de Sincronización Detectado</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <p className="mb-3">
                    El registro <strong>{tituloRegistro}</strong> fue modificado en el servidor mientras la aplicación estuvo trabajando sin conexión.
                </p>
                <p className="text-muted small mb-4">
                    Por favor selecciona qué versión deseas conservar para resolver el conflicto:
                </p>

                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="border-primary h-100 shadow-sm">
                            <Card.Header className="bg-primary text-white fw-bold">
                                Versión Creada Localmente (Sin Conexión)
                            </Card.Header>
                            <Card.Body className="p-3">
                                {conflictos.map((c, idx) => (
                                    <div key={idx} className="mb-2">
                                        <small className="text-muted fw-bold d-block">{c.campo}:</small>
                                        <span className="fw-bold text-dark">{c.valorLocal || 'Sin datos'}</span>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className="border-secondary h-100 shadow-sm">
                            <Card.Header className="bg-secondary text-white fw-bold">
                                Versión Actual en Servidor / Nube
                            </Card.Header>
                            <Card.Body className="p-3">
                                {conflictos.map((c, idx) => (
                                    <div key={idx} className="mb-2">
                                        <small className="text-muted fw-bold d-block">{c.campo}:</small>
                                        <span className="fw-bold text-dark">{c.valorServidor || 'Sin datos'}</span>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light d-flex justify-content-between">
                <Button variant="secondary" onClick={onClose}>
                    Cancelar
                </Button>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => onResolver(false)}>
                        Conservar Versión Servidor
                    </Button>
                    <Button variant="primary" onClick={() => onResolver(true)}>
                        Conservar Versión Local
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}
