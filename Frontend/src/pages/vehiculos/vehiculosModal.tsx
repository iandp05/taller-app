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
    cliente_id: number;
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
            cliente_id: 0,
            patente: '',
            marca: '',
            modelo: '',
            anio: new Date().getFullYear(),
            vin: ''
        }
    });

    const marcaWatch = watch('marca');

    useEffect(() => {
        if (show) {
            setErrorServidor('');
            getClientes()
                .then(data => setClientes(data || []))
                .catch(err => console.error("Error al cargar clientes en modal:", err));

            getCatalogoVehiculos()
                .then(data => setCatalogo(data || {}))
                .catch(err => console.error("Error al cargar catálogo:", err));
        }
    }, [show]);

    useEffect(() => {
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
                cliente_id: 0,
                patente: '',
                marca: '',
                modelo: '',
                anio: new Date().getFullYear(),
                vin: ''
            });
        }
    }, [vehiculoEditando, show, reset]);

    const onSubmit = async (data: VehiculoFormInputs) => {
        setCargando(true);
        setErrorServidor('');

        const patenteLimpia = data.patente.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        const vehiculoData: VehiculoCreate = {
            patente: patenteLimpia,
            marca: data.marca.trim(),
            modelo: data.modelo.trim(),
            anio: Number(data.anio),
            vin: data.vin?.trim().toUpperCase() || undefined,
            cliente_id: Number(data.cliente_id)
        };

        try {
            if (vehiculoEditando) {
                await updateVehiculo(vehiculoEditando.id, vehiculoData);
            } else {
                await createVehiculo(vehiculoData);
            }
            onVehiculoSaved(); 
            handleClose();     
        } catch (error: any) {
            console.error("Error al guardar el vehículo:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorServidor(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(" | "));
            } else if (typeof detail === 'string') {
                setErrorServidor(detail);
            } else {
                setErrorServidor("Hubo un error al guardar el vehículo.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{vehiculoEditando ? 'Editar Vehículo' : 'Registrar Vehículo'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorServidor && (
                    <Alert variant="danger" dismissible onClose={() => setErrorServidor('')}>
                        {errorServidor}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)} id="vehiculoForm" noValidate>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Dueño del Vehículo (Cliente) *</Form.Label>
                        <Form.Select 
                            isInvalid={!!errors.cliente_id}
                            {...register('cliente_id', {
                                validate: value => Number(value) > 0 || "Por favor selecciona a qué cliente pertenece este vehículo."
                            })}
                        >
                            <option value={0}>Selecciona un cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre} (ID: {c.id})
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.cliente_id?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Patente / Dominio *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ej: AA123BB"
                                    isInvalid={!!errors.patente}
                                    {...register('patente', {
                                        required: "La patente es obligatoria.",
                                        validate: value => {
                                            const clean = value.replace(/[^A-Za-z0-9]/g, '');
                                            return (clean.length >= 6 && clean.length <= 9) || "La patente debe tener entre 6 y 9 caracteres alfanuméricos.";
                                        }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.patente?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Marca *</Form.Label>
                                <Form.Control 
                                    type="text"
                                    placeholder="Ej: Toyota"
                                    isInvalid={!!errors.marca}
                                    autoComplete="off"
                                    list="marcas-lista"
                                    {...register('marca', {
                                        required: "La marca del vehículo es obligatoria.",
                                        onChange: () => setValue('modelo', '')
                                    })}
                                />
                                <datalist id="marcas-lista">
                                    {Object.keys(catalogo).map(m => (
                                        <option key={m} value={m} />
                                    ))}
                                </datalist>
                                <Form.Control.Feedback type="invalid">
                                    {errors.marca?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Modelo *</Form.Label>
                                <Form.Control 
                                    type="text"
                                    placeholder="Ej: Hilux"
                                    isInvalid={!!errors.modelo}
                                    disabled={!marcaWatch}
                                    autoComplete="off"
                                    list="modelos-lista"
                                    {...register('modelo', {
                                        required: "El modelo del vehículo es obligatorio."
                                    })}
                                />
                                <datalist id="modelos-lista">
                                    {marcaWatch && catalogo[marcaWatch] ? catalogo[marcaWatch].map((mod: string) => (
                                        <option key={mod} value={mod} />
                                    )) : null}
                                </datalist>
                                <Form.Control.Feedback type="invalid">
                                    {errors.modelo?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Año *</Form.Label>
                                <Form.Control
                                    type="number"
                                    isInvalid={!!errors.anio}
                                    {...register('anio', {
                                        required: "El año es obligatorio.",
                                        validate: value => {
                                            const num = Number(value);
                                            return (num >= 1900 && num <= anioActualMax) || `El año debe estar entre 1900 y ${anioActualMax}.`;
                                        }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.anio?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>N° de Chasis / VIN (Opcional)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        {...register('vin')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="primary" type="submit" form="vehiculoForm" disabled={cargando}>
                    {cargando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
