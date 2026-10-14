// Frontend/src/components/ConfirmModal.tsx
import { Modal, Button } from 'react-bootstrap';

interface ConfirmModalProps {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    confirmVariant?: string;
}

export default function ConfirmModal({
    show,
    title,
    message,
    onConfirm,
    onClose,
    confirmText = 'Aceptar',
    confirmVariant = 'danger'
}: ConfirmModalProps) {
    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="mb-0">{message}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancelar
                </Button>
                <Button variant={confirmVariant} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}