// Frontend/src/pages/ordenes/OrdenModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from 'react-bootstrap';
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
    const [busquedaVehiculo, setBusquedaVehiculo] = useState('');

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
            setBusquedaVehiculo('');

            if (ordenEditando) {
                reset({
                    vehiculo_id: ordenEditando.vehiculo_id,
                    mecanico_id: ordenEditando.mecanico_id || '',
                    estado: ordenEditando.estado || 'En Recepción',
                    descripcion_falla: ordenEditando.descripcion_falla || '',
                    kilometros: ordenEditando.kilometros !== null && ordenEditando.kilometros !== undefined ? ordenEditando.kilometros : '',
                    nivel_combustible: ordenEditando.nivel_combustible || 'Medio',
                    frente_stereo: String(ordenEditando.frente_stereo).toLowerCase() === 'si' || Boolean(ordenEditando.frente_stereo),
                    rueda_auxilio: String(ordenEditando.rueda_auxilio).toLowerCase() === 'si' || Boolean(ordenEditando.rueda_auxilio),
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

    const vehiculosFiltrados = (Array.isArray(vehiculos) ? vehiculos : []).filter(v =>
        !busquedaVehiculo ||
        v.patente.toLowerCase().includes(busquedaVehiculo.toLowerCase()) ||
        v.marca.toLowerCase().includes(busquedaVehiculo.toLowerCase()) ||
        v.modelo.toLowerCase().includes(busquedaVehiculo.toLowerCase())
    );

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
                frente_stereo: data.frente_stereo ? "Si" : "No",
                rueda_auxilio: data.rueda_auxilio ? "Si" : "No",
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
                                    <InputGroup className="mb-1">
                                        <InputGroup.Text>🔍</InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Tipea patente o modelo..."
                                            value={busquedaVehiculo}
                                            onChange={(e) => setBusquedaVehiculo(e.target.value)}
                                        />
                                    </InputGroup>
                                    <Form.Select
                                        {...register('vehiculo_id', { required: 'Debes seleccionar un vehículo.' })}
                                        isInvalid={!!errors.vehiculo_id}
                                    >
                                        <option value="">Selecciona un vehículo ({vehiculosFiltrados.length})...</option>
                                        {vehiculosFiltrados.map(v => (
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
                                            <option value="Reserva">Reserva (1/8)</option>
                                            <option value="Bajo">Bajo (1/4)</option>
                                            <option value="Medio">Medio (1/2)</option>
                                            <option value="Alto">Alto (3/4)</option>
                                            <option value="Lleno">Lleno (4/4)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Check
                                        type="switch"
                                        id="stereo-switch"
                                        label="Tiene Frente Estéreo"
                                        {...register('frente_stereo')}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Check
                                        type="switch"
                                        id="auxilio-switch"
                                        label="Tiene Rueda Auxilio"
                                        {...register('rueda_auxilio')}
                                    />
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>Código Estéreo / Observaciones Extra</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ej: 1234 o detalles..."
                                            {...register('codigo_stereo')}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción del Trabajo o Falla Informada *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Describe el problema del vehículo o las tareas solicitadas..."
                                {...register('descripcion_falla', {
                                    required: 'La descripción es obligatoria.',
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
                            {cargando ? <Spinner animation="border" size="sm" /> : (ordenEditando ? 'Guardar Cambios' : 'Ingresar Vehículo')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ConfirmModal
                show={showConfirmSinMecanico}
                title="Atención: Orden sin Mecánico"
                message="Estás marcando la orden como 'Listo para Entregar' sin haber asignado un mecánico responsable. ¿Deseas guardar de todos modos?"
                confirmText="Guardar de Todos Modos"
                confirmVariant="warning"
                onClose={() => setShowConfirmSinMecanico(false)}
                onConfirm={handleConfirmarGuardadoSinMecanico}
            />
        </>
    );
}
