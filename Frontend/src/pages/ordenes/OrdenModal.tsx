// Frontend/src/pages/ordenes/OrdenModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { OrdenTrabajo, OrdenCreate, Vehiculo, Usuario } from '../../types';
import { createOrden, updateOrden } from '../../api/ordenesApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getUsuarios } from '../../api/usuariosApi';
import ConfirmModal from '../../components/ConfirmModal';

interface OrdenModalProps {
    show: boolean;
    handleClose: () => void;
    onOrdenSaved: () => void;
    ordenEditando: OrdenTrabajo | null;
}

interface OrdenFormInputs {
    vehiculo_id: string | number;
    mecanico_id: string | number;
    estado: string;
    descripcion_falla: string;
    kilometros: string | number;
    nivel_combustible: string;
    frente_stereo: boolean;
    rueda_auxilio: boolean;
    codigo_stereo: string;
}

export default function OrdenModal({ show, handleClose, onOrdenSaved, ordenEditando }: OrdenModalProps) {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [empleados, setEmpleados] = useState<Usuario[]>([]);
    
    const [cargando, setCargando] = useState(false);
    const [errorServidor, setErrorServidor] = useState('');
    const [showConfirmSinMecanico, setShowConfirmSinMecanico] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<OrdenFormInputs>({
        defaultValues: {
            vehiculo_id: '',
            mecanico_id: '',
            estado: 'En Recepción',
            descripcion_falla: '',
            kilometros: '',
            nivel_combustible: 'Medio',
            frente_stereo: true,
            rueda_auxilio: true,
            codigo_stereo: ''
        }
    });

    const estadoSeleccionado = watch('estado');

    useEffect(() => {
        const cargarDatosModal = async () => {
            try {
                const [vehsRes, empsRes] = await Promise.all([
                    getVehiculos(),
                    getUsuarios()
                ]);
                setVehiculos(Array.isArray(vehsRes) ? vehsRes : []);
                setEmpleados(Array.isArray(empsRes) ? empsRes : []);
            } catch (err) {
                console.error("Error al cargar datos del modal:", err);
            }
        };

        if (show) {
            cargarDatosModal();
            setErrorServidor('');

            if (ordenEditando) {
                reset({
                    vehiculo_id: ordenEditando.vehiculo_id,
                    mecanico_id: ordenEditando.mecanico_id || '',
                    estado: ordenEditando.estado || 'En Recepción',
                    descripcion_falla: ordenEditando.descripcion_falla || '',
                    kilometros: ordenEditando.kilometros !== null && ordenEditando.kilometros !== undefined ? ordenEditando.kilometros : '',
                    nivel_combustible: ordenEditando.nivel_combustible || 'Medio',
                    frente_stereo: Boolean(ordenEditando.frente_stereo),
                    rueda_auxilio: Boolean(ordenEditando.rueda_auxilio),
                    codigo_stereo: ordenEditando.codigo_stereo || ''
                });
            } else {
                reset({
                    vehiculo_id: '',
                    mecanico_id: '',
                    estado: 'En Recepción',
                    descripcion_falla: '',
                    kilometros: '',
                    nivel_combustible: 'Medio',
                    frente_stereo: true,
                    rueda_auxilio: true,
                    codigo_stereo: ''
                });
            }
        }
    }, [show, ordenEditando, reset]);

    const ejecutarGuardadoReal = async (data: OrdenFormInputs) => {
        setCargando(true);
        setErrorServidor('');

        try {
            if (ordenEditando && data.estado === 'Listo para Entregar' && ordenEditando.estado !== 'Listo para Entregar') {
                await updateOrden(ordenEditando.id, { estado: 'Listo para Entregar' });
            }

            const ordenData: OrdenCreate = {
                vehiculo_id: data.vehiculo_id,
                mecanico_id: data.mecanico_id || undefined,
                estado: data.estado,
                descripcion_falla: data.descripcion_falla,
                detalles: [],
                kilometros: data.kilometros !== '' ? Number(data.kilometros) : undefined,
                nivel_combustible: data.nivel_combustible,
                frente_stereo: data.frente_stereo,
                rueda_auxilio: data.rueda_auxilio,
                codigo_stereo: data.codigo_stereo || undefined
            };

            if (ordenEditando) {
                await updateOrden(ordenEditando.id, ordenData);
            } else {
                await createOrden(ordenData);
            }

            onOrdenSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al guardar orden:", error);
            setErrorServidor(error.response?.data?.detail || "Ocurrió un error al intentar guardar la orden de trabajo.");
        } finally {
            setCargando(false);
        }
    };

    const onSubmit = (data: OrdenFormInputs) => {
        if (estadoSeleccionado === 'Listo para Entregar' && !data.mecanico_id) {
            setShowConfirmSinMecanico(true);
            (window as any)._pendingOrdenData = data;
            return;
        }

        ejecutarGuardadoReal(data);
    };

    const handleConfirmarGuardadoSinMecanico = () => {
        setShowConfirmSinMecanico(false);
        const data = (window as any)._pendingOrdenData;
        if (data) {
            ejecutarGuardadoReal(data);
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{ordenEditando ? `Editar Orden #${String(ordenEditando.id).slice(0, 8)}` : 'Nueva Orden de Ingreso'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        {errorServidor && <Alert variant="danger">{errorServidor}</Alert>}

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Vehículo *</Form.Label>
                                    <Form.Select
                                        {...register('vehiculo_id', { required: 'Debes seleccionar un vehículo.' })}
                                        isInvalid={!!errors.vehiculo_id}
                                    >
                                        <option value="">Selecciona un vehículo...</option>
                                        {(Array.isArray(vehiculos) ? vehiculos : []).map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.patente} - {v.marca} {v.modelo}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.vehiculo_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Mecánico Responsable</Form.Label>
                                    <Form.Select {...register('mecanico_id')}>
                                        <option value="">Sin asignar...</option>
                                        {(Array.isArray(empleados) ? empleados : []).map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nombre} ({emp.rol})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Estado de la Orden</Form.Label>
                            <Form.Select {...register('estado')}>
                                <option value="En Recepción">En Recepción</option>
                                <option value="En Diagnóstico">En Diagnóstico</option>
                                <option value="En Reparación">En Reparación</option>
                                <option value="Listo para Entregar">Listo para Entregar</option>
                                <option value="Entregado">Entregado / Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </Form.Select>
                        </Form.Group>

                        <div className="p-3 mb-3 bg-light rounded border">
                            <h6 className="fw-bold mb-3">Datos de Ingreso del Vehículo</h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Kilómetros Actuales</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Ej: 154000"
                                            {...register('kilometros')}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Nivel de Combustible</Form.Label>
                                        <Form.Select {...register('nivel_combustible')}>
                                            <option value="Reserva">Reserva / Muy Bajo</option>
                                            <option value="1/4">1/4 Tanque</option>
                                            <option value="Medio">1/2 Tanque (Medio)</option>
                                            <option value="3/4">3/4 Tanque</option>
                                            <option value="Lleno">Tanque Lleno</option>
                                            <option value="Desconocido">Desconocido...</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Código del Estéreo (Si aplica)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ej: 1432"
                                            {...register('codigo_stereo')}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="d-flex align-items-center gap-4 pt-4">
                                    <Form.Check
                                        type="checkbox"
                                        id="frente_stereo"
                                        label="Tiene Frente Estéreo"
                                        {...register('frente_stereo')}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        id="rueda_auxilio"
                                        label="Tiene Rueda Auxilio"
                                        {...register('rueda_auxilio')}
                                    />
                                </Col>
                            </Row>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción del Trabajo o Falla Reportada *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Describe el problema del vehículo o las tareas a realizar..."
                                {...register('descripcion_falla', {
                                    required: 'Debes ingresar una descripción.',
                                    minLength: { value: 3, message: 'Ingresa al menos 3 caracteres.' }
                                })}
                                isInvalid={!!errors.descripcion_falla}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.descripcion_falla?.message}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose} disabled={cargando}>
                            Cancelar
                        </Button>
                        <Button variant="success" type="submit" disabled={cargando}>
                            {cargando ? <Spinner animation="border" size="sm" /> : (ordenEditando ? 'Guardar Cambios' : 'Crear Orden')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ConfirmModal
                show={showConfirmSinMecanico}
                title="Aviso de Asignación"
                message="Esta orden pasará a 'Listo para Entregar' pero no tiene mecánico asignado. ¿Deseas guardar de todos modos?"
                confirmText="Sí, Guardar"
                confirmVariant="warning"
                onClose={() => setShowConfirmSinMecanico(false)}
                onConfirm={handleConfirmarGuardadoSinMecanico}
            />
        </>
    );
}
