// Frontend/src/pages/empleados/empleadosModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Usuario, UsuarioCreate } from '../../types';
import { createUsuario, updateUsuario } from '../../api/usuariosApi';

interface EmpleadosModalProps {
    show: boolean;
    handleClose: () => void;
    onEmpleadoSaved: () => void;
    empleadoEditando: Usuario | null;
}

interface EmpleadoFormInputs {
    nombre: string;
    username: string;
    rol: string;
    password?: string;
}

export default function EmpleadosModal({ show, handleClose, onEmpleadoSaved, empleadoEditando }: EmpleadosModalProps) {
    const [cargando, setCargando] = useState(false);
    const [errorServidor, setErrorServidor] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<EmpleadoFormInputs>({
        defaultValues: {
            nombre: '',
            username: '',
            rol: 'Mecánico',
            password: ''
        }
    });

    useEffect(() => {
        if (show) {
            setErrorServidor('');
        }
    }, [show]);

    useEffect(() => {
        if (empleadoEditando) {
            reset({
                nombre: empleadoEditando.nombre,
                username: empleadoEditando.username,
                rol: empleadoEditando.rol,
                password: ''
            });
        } else {
            reset({
                nombre: '',
                username: '',
                rol: 'Mecánico',
                password: ''
            });
        }
    }, [empleadoEditando, show, reset]);

    const onSubmit = async (data: EmpleadoFormInputs) => {
        setCargando(true);
        setErrorServidor('');

        const empleadoData: UsuarioCreate = {
            nombre: data.nombre.trim(),
            username: data.username.trim(),
            rol: data.rol,
            ...(data.password ? { password: data.password } : {})
        };

        try {
            if (empleadoEditando) {
                await updateUsuario(empleadoEditando.id, empleadoData);
            } else {
                await createUsuario(empleadoData);
            }
            onEmpleadoSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al guardar empleado:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorServidor(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(" | "));
            } else if (typeof detail === 'string') {
                setErrorServidor(detail);
            } else {
                setErrorServidor("Hubo un error al guardar el empleado.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{empleadoEditando ? 'Editar Empleado' : 'Registrar Empleado'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorServidor && (
                    <Alert variant="danger" dismissible onClose={() => setErrorServidor('')}>
                        {errorServidor}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)} id="empleadoForm" noValidate>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Nombre Completo *</Form.Label>
                        <Form.Control
                            type="text"
                            isInvalid={!!errors.nombre}
                            {...register('nombre', {
                                required: "El nombre completo es obligatorio.",
                                minLength: { value: 2, message: "El nombre completo debe tener al menos 2 caracteres." }
                            })}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.nombre?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Nombre de Usuario *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.username}
                                    {...register('username', {
                                        required: "El nombre de usuario es obligatorio.",
                                        minLength: { value: 3, message: "El usuario debe tener al menos 3 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.username?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Rol del Sistema</Form.Label>
                                <Form.Select {...register('rol')}>
                                    <option value="Mecánico">Mecánico</option>
                                    <option value="Jefe de Taller">Jefe de Taller</option>
                                    <option value="Administrador">Administrador</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                            {empleadoEditando ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
                        </Form.Label>
                        <Form.Control 
                            type="password" 
                            isInvalid={!!errors.password}
                            placeholder={empleadoEditando ? 'Dejar en blanco para no cambiarla' : 'Mínimo 6 caracteres'}
                            {...register('password', {
                                validate: value => {
                                    if (!empleadoEditando && (!value || value.length < 6)) {
                                        return "La contraseña para un usuario nuevo debe tener al menos 6 caracteres.";
                                    }
                                    if (empleadoEditando && value && value.length < 6) {
                                        return "La nueva contraseña debe tener al menos 6 caracteres.";
                                    }
                                    return true;
                                }
                            })}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="primary" type="submit" form="empleadoForm" disabled={cargando}>
                    {cargando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar Empleado"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
