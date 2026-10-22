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
        getValues,
        formState: { errors }
    } = useForm<OrdenFormInputs>({
        defaultValues: {
            vehiculo_id: '',
            mecanico_id: '',
            estado: 'Ingresado',
            descripcion_falla: '',
            kilometros: '',
            nivel_combustible: '',
            frente_stereo: false,
            rueda_auxilio: false,
            codigo_stereo: ''
        }
    });

    useEffect(() => {
        if (show) {
            getVehiculos().then(setVehiculos).catch(console.error);
            getUsuarios().then(setEmpleados).catch(console.error);
            setErrorServidor('');
        }
    }, [show]);

    useEffect(() => {
        if (ordenEditando) {
            let estadoInicial = ordenEditando.estado;
            if (estadoInicial === 'Pendiente') estadoInicial = 'Ingresado';
            if (estadoInicial === 'En Taller') estadoInicial = 'En Reparación';
            if (estadoInicial === 'Terminado') estadoInicial = 'Listo para Entregar';

            reset({
                vehiculo_id: ordenEditando.vehiculo_id,
                mecanico_id: ordenEditando.mecanico_id || '',
                estado: estadoInicial,
                descripcion_falla: ordenEditando.descripcion_falla || '',
                kilometros: ordenEditando.kilometros !== null && ordenEditando.kilometros !== undefined ? ordenEditando.kilometros : '',
                nivel_combustible: ordenEditando.nivel_combustible || '',
                frente_stereo: String(ordenEditando.frente_stereo).toLowerCase() === 'si' || Boolean(ordenEditando.frente_stereo),
                rueda_auxilio: String(ordenEditando.rueda_auxilio).toLowerCase() === 'si' || Boolean(ordenEditando.rueda_auxilio),
                codigo_stereo: ordenEditando.codigo_stereo || ''
            });
        } else {
            reset({
                vehiculo_id: '',
                mecanico_id: '',
                estado: 'Ingresado',
                descripcion_falla: '',
                kilometros: '',
                nivel_combustible: '',
                frente_stereo: false,
                rueda_auxilio: false,
                codigo_stereo: ''
            });
        }
    }, [ordenEditando, show, reset]);

    const estadoHistoricoBruto = ordenEditando?.estado || 'Ingresado';
    let estadoHistorico = estadoHistoricoBruto;
    if (estadoHistorico === 'Pendiente') estadoHistorico = 'Ingresado';
    if (estadoHistorico === 'En Taller') estadoHistorico = 'En Reparación';
    if (estadoHistorico === 'Terminado') estadoHistorico = 'Listo para Entregar';

    const isYaArchivado = estadoHistorico === 'Entregado';
    const isYaTerminado = estadoHistorico === 'Listo para Entregar';
    const isYaEnReparacion = estadoHistorico === 'En Reparación';

    const disableAll = isYaArchivado; 
    const disableIngreso = disableAll || isYaTerminado || isYaEnReparacion;
    const disableDesc = disableAll || isYaTerminado; 

    const handleDesarchivar = async () => {
        if (!ordenEditando) return;
        
        setCargando(true);
        setErrorServidor('');
        try {
            await updateOrden(ordenEditando.id, { estado: 'Listo para Entregar' });
            onOrdenSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al desarchivar:", error);
            setErrorServidor("Hubo un error al reabrir la orden de trabajo.");
        } finally {
            setCargando(false);
        }
    };

    const ejecutarGuardadoOrden = async (mecanicoIdFinal: string | number) => {
        if (cargando) return;
        setCargando(true); 
        setErrorServidor('');

        const formValues = getValues();

        const ordenData: OrdenCreate = {
            vehiculo_id: formValues.vehiculo_id,
            mecanico_id: mecanicoIdFinal && mecanicoIdFinal !== '0' && mecanicoIdFinal !== 0 ? mecanicoIdFinal : undefined,
            descripcion_falla: formValues.descripcion_falla.trim(),
            estado: formValues.estado,
            kilometros: formValues.kilometros !== '' ? Number(formValues.kilometros) : undefined,
            nivel_combustible: formValues.nivel_combustible || undefined,
            frente_stereo: formValues.frente_stereo ? "Si" : "No",
            rueda_auxilio: formValues.rueda_auxilio ? "Si" : "No",
            codigo_stereo: formValues.codigo_stereo.trim() || undefined,
            costo_mano_obra: 0,
            detalles: []
        };

        try {
            if (ordenEditando) {
                await updateOrden(ordenEditando.id, ordenData);
            } else {
                await createOrden(ordenData);
            }
            onOrdenSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al guardar orden:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorServidor(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(" | "));
            } else if (typeof detail === 'string') {
                setErrorServidor(detail);
            } else {
                setErrorServidor("Hubo un error al guardar la orden de trabajo.");
            }
        } finally {
            setCargando(false);
        }
    };

    const onSubmitForm = async (data: OrdenFormInputs) => {
        if (!data.mecanico_id || data.mecanico_id === '0' || data.mecanico_id === 0) {
            setShowConfirmSinMecanico(true);
            return;
        }

        await ejecutarGuardadoOrden(data.mecanico_id);
    };

    return (
        <>
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className={disableAll ? "bg-secondary text-white" : "bg-light"}>
                <Modal.Title>
                    {ordenEditando 
                        ? (disableAll ? 'Orden Archivada (Solo Lectura)' : 'Actualizar Orden de Trabajo')
                        : 'Nueva Orden de Ingreso'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                
                {errorServidor && (
                    <Alert variant="danger" dismissible onClose={() => setErrorServidor('')}>
                        {errorServidor}
                    </Alert>
                )}

                {disableAll && (
                    <Alert variant="warning" className="py-2 d-flex justify-content-between align-items-center mb-3">
                        <span className="mb-0">Esta orden ya fue entregada y archivada. No se pueden modificar sus datos.</span>
                        <Button 
                            variant="outline-dark" 
                            size="sm" 
                            onClick={handleDesarchivar} 
                            disabled={cargando}
                        >
                            {cargando ? 'Reabriendo...' : 'Desarchivar (Reabrir)'}
                        </Button>
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmitForm)} id="ordenForm" noValidate>
                    <Row className="mb-3">
                        <Col md={5}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Vehículo *</Form.Label>
                                <Form.Select 
                                    isInvalid={!!errors.vehiculo_id}
                                    disabled={!!ordenEditando}
                                    {...register('vehiculo_id', {
                                        required: "Por favor selecciona un vehículo."
                                    })}
                                >
                                    <option value="">Selecciona un vehículo...</option>
                                    {vehiculos.map(v => (
                                        <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.vehiculo_id?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Mecánico Responsable</Form.Label>
                                <Form.Select 
                                    disabled={disableIngreso}
                                    {...register('mecanico_id')}
                                >
                                    <option value="">Sin asignar (Opcional)</option>
                                    {empleados.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nombre} ({emp.rol})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Estado</Form.Label>
                                <Form.Select 
                                    disabled={disableAll}
                                    {...register('estado')}
                                >
                                    <option value="Ingresado">Ingresado</option>
                                    <option value="En Reparación">En Reparación</option>
                                    <option value="Listo para Entregar">Listo para Entregar</option>
                                    <option value="Entregado">Entregado</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="border p-3 rounded bg-light mb-4 shadow-sm">
                        <h6 className="mb-3 text-secondary border-bottom pb-2 fw-bold">Datos de Ingreso del Vehículo</h6>
                        
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Kilómetros Actuales</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        min="0"
                                        placeholder="Ej: 154000"
                                        isInvalid={!!errors.kilometros}
                                        disabled={disableIngreso}
                                        {...register('kilometros', {
                                            validate: value => value === '' || Number(value) >= 0 || "Los kilómetros no pueden ser negativos."
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.kilometros?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Nivel de Combustible</Form.Label>
                                    <Form.Select 
                                        disabled={disableIngreso}
                                        {...register('nivel_combustible')}
                                    >
                                        <option value="">Desconocido...</option>
                                        <option value="Vacío">Vacío</option>
                                        <option value="1/4">1/4 Tanque</option>
                                        <option value="1/2">1/2 Tanque</option>
                                        <option value="3/4">3/4 Tanque</option>
                                        <option value="Lleno">Lleno</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Código del Estéreo</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ej: 1432"
                                        disabled={disableIngreso}
                                        {...register('codigo_stereo')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Check 
                                        type="checkbox" 
                                        label="¿Dejó el Frente de Estéreo?" 
                                        disabled={disableIngreso}
                                        {...register('frente_stereo')}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Check 
                                        type="checkbox" 
                                        label="¿Tiene Rueda de Auxilio?" 
                                        disabled={disableIngreso}
                                        {...register('rueda_auxilio')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <Form.Group className="mb-2">
                        <Form.Label className="fw-bold">Descripción del problema / Tareas a realizar *</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            isInvalid={!!errors.descripcion_falla}
                            disabled={disableDesc}
                            {...register('descripcion_falla', {
                                required: "La descripción del problema o falla es obligatoria.",
                                minLength: { value: 2, message: "La descripción debe tener al menos 2 caracteres." }
                            })}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.descripcion_falla?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cerrar</Button>
                
                {!disableAll && (
                    <Button variant="primary" type="submit" form="ordenForm" disabled={cargando}>
                        {cargando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : (ordenEditando ? 'Guardar Cambios' : 'Crear Orden de Ingreso')}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>

        <ConfirmModal
            show={showConfirmSinMecanico}
            title="Confirmación de Registro"
            message="¿Está seguro de no asignar un mecánico a cargo?"
            confirmText="Sí, Continuar"
            confirmVariant="primary"
            onClose={() => setShowConfirmSinMecanico(false)}
            onConfirm={() => {
                setShowConfirmSinMecanico(false);
                ejecutarGuardadoOrden('');
            }}
        />
        </>
    );
}
