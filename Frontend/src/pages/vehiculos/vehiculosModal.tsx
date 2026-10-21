// Frontend/src/pages/vehiculos/vehiculosModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Vehiculo, VehiculoCreate, Cliente } from '../../types';
import { createVehiculo, updateVehiculo, getCatalogoVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';

interface VehiculosModalProps {
    show: boolean;
    handleClose: () => void;
    onVehiculoSaved: () => void;
    vehiculoEditando: Vehiculo | null;
}

interface VehiculoFormInputs {
    cliente_id: string | number;
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    vin?: string;
}

export default function VehiculoModal({ show, handleClose, onVehiculoSaved, vehiculoEditando }: VehiculosModalProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [catalogo, setCatalogo] = useState<Record<string, string[]>>({});
    const [cargando, setCargando] = useState(false);
    const [errorServidor, setErrorServidor] = useState('');

    const anioActualMax = new Date().getFullYear() + 1;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<VehiculoFormInputs>({
        defaultValues: {
            cliente_id: '',
            patente: '',
            marca: '',
            modelo: '',
            anio: new Date().getFullYear(),
            vin: ''
        }
    });

    const marcaSeleccionada = watch('marca');

    useEffect(() => {
        const cargarDatosModal = async () => {
            try {
                const [clientesRes, catalogoRes] = await Promise.all([
                    getClientes(),
                    getCatalogoVehiculos()
                ]);
                setClientes(Array.isArray(clientesRes) ? clientesRes : []);
                setCatalogo(catalogoRes || {});
            } catch (err) {
                console.error("Error al cargar datos del modal:", err);
            }
        };

        if (show) {
            cargarDatosModal();
            setErrorServidor('');

            if (vehiculoEditando) {
                reset({
                    cliente_id: vehiculoEditando.cliente_id,
                    patente: vehiculoEditando.patente,
                    marca: vehiculoEditando.marca,
                    modelo: vehiculoEditando.modelo,
                    anio: vehiculoEditando.anio,
                    vin: vehiculoEditando.vin || ''
                });
            } else {
                reset({
                    cliente_id: '',
                    patente: '',
                    marca: '',
                    modelo: '',
                    anio: new Date().getFullYear(),
                    vin: ''
                });
            }
        }
    }, [show, vehiculoEditando, reset]);

    const onSubmit = async (data: VehiculoFormInputs) => {
        setCargando(true);
        setErrorServidor('');

        try {
            const vehiculoData: VehiculoCreate = {
                cliente_id: data.cliente_id,
                patente: data.patente.toUpperCase().replace(/\s+/g, ''),
                marca: data.marca,
                modelo: data.modelo,
                anio: Number(data.anio),
                vin: data.vin || undefined
            };

            if (vehiculoEditando) {
                await updateVehiculo(vehiculoEditando.id, vehiculoData);
            } else {
                await createVehiculo(vehiculoData);
            }

            onVehiculoSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al guardar vehículo:", error);
            setErrorServidor(error.response?.data?.detail || "No se pudo guardar el vehículo.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{vehiculoEditando ? 'Editar Vehículo' : 'Nuevo Vehículo'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    {errorServidor && <Alert variant="danger">{errorServidor}</Alert>}

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Propietario / Cliente *</Form.Label>
                                <Form.Select
                                    {...register('cliente_id', { required: 'Debes seleccionar un cliente.' })}
                                    isInvalid={!!errors.cliente_id}
                                >
                                    <option value="">Selecciona un cliente...</option>
                                    {(Array.isArray(clientes) ? clientes : []).map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre} ({c.telefono})
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.cliente_id?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Patente / Dominio *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ej: AA123BB o AB123CD"
                                    {...register('patente', {
                                        required: 'La patente es obligatoria.',
                                        pattern: {
                                            value: /^[A-Za-z0-9]{6,10}$/,
                                            message: 'Ingrese una patente válida sin espacios ni guiones.'
                                        }
                                    })}
                                    isInvalid={!!errors.patente}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.patente?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Marca *</Form.Label>
                                <Form.Select
                                    {...register('marca', { required: 'Selecciona una marca.' })}
                                    onChange={(e) => {
                                        setValue('marca', e.target.value);
                                        setValue('modelo', '');
                                    }}
                                    isInvalid={!!errors.marca}
                                >
                                    <option value="">Selecciona marca...</option>
                                    {Object.keys(catalogo).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.marca?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Modelo *</Form.Label>
                                <Form.Select
                                    {...register('modelo', { required: 'Selecciona un modelo.' })}
                                    disabled={!marcaSeleccionada}
                                    isInvalid={!!errors.modelo}
                                >
                                    <option value="">Selecciona modelo...</option>
                                    {marcaSeleccionada && catalogo[marcaSeleccionada]?.map(mod => (
                                        <option key={mod} value={mod}>{mod}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.modelo?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Año de Fabricación *</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Ej: 2018"
                                    {...register('anio', {
                                        required: 'El año es obligatorio.',
                                        min: { value: 1900, message: 'Año inválido.' },
                                        max: { value: anioActualMax, message: `No puede ser mayor a ${anioActualMax}` }
                                    })}
                                    isInvalid={!!errors.anio}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.anio?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Nº de Chasis / VIN (Opcional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="17 caracteres opcionales..."
                                    {...register('vin')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={cargando}>
                        Cancelar
                    </Button>
                    <Button variant="success" type="submit" disabled={cargando}>
                        {cargando ? <Spinner animation="border" size="sm" /> : (vehiculoEditando ? 'Guardar Cambios' : 'Registrar Vehículo')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
