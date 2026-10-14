// Frontend/src/pages/clientes/clienteModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Cliente, ClienteCreate } from '../../types';
import { createCliente, updateCliente } from '../../api/clientesApi';

interface ClienteModalProps {
    show: boolean;
    handleClose: () => void;
    onClientSaved: () => void;
    clienteEditando: Cliente | null;
}

interface ClienteFormInputs {
    nombre: string;
    telefono: string;
    email?: string;
    domicilio?: string;
    cuit?: string;
    condicion_iva?: string;
}

export default function ClienteModal({ show, handleClose, onClientSaved, clienteEditando }: ClienteModalProps) {
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ClienteFormInputs>({
        defaultValues: {
            nombre: '',
            telefono: '',
            email: '',
            domicilio: '',
            cuit: '',
            condicion_iva: 'Consumidor Final'
        }
    });

    useEffect(() => {
        if (show) {
            setErrorMsg(null);
        }
    }, [show]);

    useEffect(() => {
        if (clienteEditando) {
            reset({
                nombre: clienteEditando.nombre,
                telefono: clienteEditando.telefono,
                email: clienteEditando.email || '',
                domicilio: clienteEditando.domicilio || '',
                cuit: clienteEditando.cuit || '',
                condicion_iva: clienteEditando.condicion_iva || 'Consumidor Final'
            });
        } else {
            reset({
                nombre: '',
                telefono: '',
                email: '',
                domicilio: '',
                cuit: '',
                condicion_iva: 'Consumidor Final'
            });
        }
    }, [clienteEditando, show, reset]);

    const validarCuitODNI = (cuitVal?: string): boolean | string => {
        if (!cuitVal || !cuitVal.trim()) return true;
        const limpio = cuitVal.replace(/\D/g, '');
        if (limpio.length === 7 || limpio.length === 8) {
            return true;
        }
        if (limpio.length === 11) {
            const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
            let suma = 0;
            for (let i = 0; i < 10; i++) {
                suma += parseInt(limpio[i], 10) * mult[i];
            }
            const resto = 11 - (suma % 11);
            const digitoEsperado = resto === 11 ? 0 : resto === 10 ? 9 : resto;
            if (parseInt(limpio[10], 10) !== digitoEsperado) {
                return "El CUIT ingresado no es válido (dígito verificador incorrecto).";
            }
            return true;
        }
        return "Debes ingresar un CUIT válido (11 dígitos) o un DNI (7 u 8 dígitos).";
    };

    const onSubmit = async (data: ClienteFormInputs) => {
        setCargando(true);
        setErrorMsg(null);

        let cuitFinal: string | undefined = undefined;
        if (data.cuit?.trim()) {
            const limpio = data.cuit.replace(/\D/g, '');
            if (limpio.length === 7 || limpio.length === 8) {
                cuitFinal = limpio;
            } else if (limpio.length === 11) {
                cuitFinal = `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio[10]}`;
            }
        }

        const clienteData: ClienteCreate = {
            nombre: data.nombre.trim(),
            telefono: data.telefono.trim(),
            email: data.email?.trim() ? data.email.trim().toLowerCase() : undefined,
            domicilio: data.domicilio?.trim() || undefined,
            cuit: cuitFinal,
            condicion_iva: data.condicion_iva || 'Consumidor Final'
        };

        try {
            if (clienteEditando) {
                await updateCliente(clienteEditando.id, clienteData);
            } else {
                await createCliente(clienteData);
            }
            onClientSaved(); 
            handleClose();  
        } catch (error: any) {
            console.error("Error al guardar el cliente:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorMsg(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(" | "));
            } else if (typeof detail === 'string') {
                setErrorMsg(detail);
            } else {
                setErrorMsg("Hubo un error al guardar el cliente.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorMsg && (
                    <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
                        {errorMsg}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)} id="clienteForm" noValidate>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Nombre / Razón Social *</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Ej: Juan Pérez o Transportes SA"
                                    isInvalid={!!errors.nombre}
                                    {...register('nombre', {
                                        required: "El nombre o razón social es obligatorio.",
                                        minLength: { value: 2, message: "Debe tener al menos 2 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.nombre?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Teléfono *</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Ej: 2804416083"
                                    isInvalid={!!errors.telefono}
                                    {...register('telefono', {
                                        required: "El teléfono es obligatorio.",
                                        validate: value => value.replace(/\D/g, '').length >= 6 || "El número de teléfono debe contener al menos 6 dígitos numéricos."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.telefono?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Email</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    placeholder="ejemplo@correo.com"
                                    isInvalid={!!errors.email}
                                    {...register('email', {
                                        validate: value => {
                                            if (!value || !value.trim()) return true;
                                            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                                            return emailRegex.test(value.trim()) || "El formato del correo electrónico no es válido.";
                                        }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <hr className="text-muted" />
                    <h6 className="text-secondary mb-3 fw-bold">Datos de Facturación</h6>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Domicilio Comercial</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Calle, número, localidad"
                                    {...register('domicilio')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">CUIT / DNI</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Ej: 20-12345678-9"
                                    isInvalid={!!errors.cuit}
                                    {...register('cuit', {
                                        validate: value => validarCuitODNI(value)
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.cuit?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Condición frente al IVA</Form.Label>
                                <Form.Select {...register('condicion_iva')}>
                                    <option value="Consumidor Final">Consumidor Final</option>
                                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                                    <option value="Monotributista">Monotributista</option>
                                    <option value="Exento">Exento</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="primary" type="submit" form="clienteForm" disabled={cargando}>
                    {cargando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar Cliente"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
