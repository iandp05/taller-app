// Frontend/src/pages/presupuestos/PresupuestoModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table, Alert, Spinner } from 'react-bootstrap';
import { Presupuesto, PresupuestoCreate, Vehiculo, Producto, DetallePresupuestoCreate, Usuario } from '../../types';
import { createPresupuesto, updatePresupuesto } from '../../api/presupuestosApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getProductos } from '../../api/inventarioApi';
import { getUsuarios } from '../../api/usuariosApi';

interface PresupuestoModalProps {
    show: boolean;
    handleClose: () => void;
    onPresupuestoSaved: () => void;
    presupuestoEditando: Presupuesto | null;
}

export default function PresupuestoModal({ show, handleClose, onPresupuestoSaved, presupuestoEditando }: PresupuestoModalProps) {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [empleados, setEmpleados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [vehiculoId, setVehiculoId] = useState<string | number>('');
    const [mecanicoId, setMecanicoId] = useState<string | number>('');
    const [estado, setEstado] = useState('Emitido');
    const [validezDias, setValidezDias] = useState('15 días');
    const [condicionesPago, setCondicionesPago] = useState('Efectivo / Transferencia');
    
    const [detalles, setDetalles] = useState<DetallePresupuestoCreate[]>([]);
    
    const [prodId, setProdId] = useState<string | number>('');
    const [prodCant, setProdCant] = useState<number>(1);
    const [prodPrecio, setProdPrecio] = useState<number | string>('');

    const [moDesc, setMoDesc] = useState('Mano de Obra');
    const [moCant, setMoCant] = useState<number>(1);
    const [moPrecio, setMoPrecio] = useState<number | string>('');

    useEffect(() => {
        if (show) {
            cargarCatalogos();
            setErrorMsg(null);

            if (presupuestoEditando) {
                setVehiculoId(presupuestoEditando.vehiculo_id);
                setMecanicoId(presupuestoEditando.mecanico_id || '');
                setEstado(presupuestoEditando.estado);
                setValidezDias(presupuestoEditando.validez_dias);
                setCondicionesPago(presupuestoEditando.condiciones_pago);
                setDetalles(presupuestoEditando.detalles.map(d => ({
                    producto_id: d.producto_id || undefined,
                    descripcion: d.descripcion,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario
                })));
            } else {
                setVehiculoId('');
                setMecanicoId('');
                setEstado('Emitido');
                setValidezDias('15 días');
                setCondicionesPago('Efectivo / Transferencia');
                setDetalles([]);
            }
        }
    }, [show, presupuestoEditando]);

    const cargarCatalogos = async () => {
        try {
            const [vehs, prods, emps] = await Promise.all([
                getVehiculos(),
                getProductos(),
                getUsuarios()
            ]);
            setVehiculos(Array.isArray(vehs) ? vehs : []);
            setProductos(Array.isArray(prods) ? prods : []);
            setEmpleados(Array.isArray(emps) ? emps : []);
        } catch (err) {
            console.error("Error al cargar datos para el presupuesto:", err);
        }
    };

    const handleSelectProducto = (pId: string | number) => {
        setProdId(pId);
        const prod = (Array.isArray(productos) ? productos : []).find(p => String(p.id) === String(pId));
        if (prod) {
            setProdPrecio(prod.precio);
        }
    };

    const handleAgregarRepuesto = () => {
        if (!prodId) {
            setErrorMsg("Debes seleccionar un repuesto.");
            return;
        }
        const prod = (Array.isArray(productos) ? productos : []).find(p => String(p.id) === String(prodId));
        if (!prod) return;

        const precio = Number(prodPrecio) || prod.precio;

        setDetalles([...detalles, {
            producto_id: prod.id,
            descripcion: prod.nombre,
            cantidad: prodCant,
            precio_unitario: precio
        }]);

        setProdId('');
        setProdCant(1);
        setProdPrecio('');
        setErrorMsg(null);
    };

    const handleAgregarManoDeObra = () => {
        if (!moDesc.trim()) {
            setErrorMsg("Escribe una descripción para la mano de obra.");
            return;
        }
        const precio = Number(moPrecio);
        if (isNaN(precio) || precio <= 0) {
            setErrorMsg("Ingresa un precio válido para la mano de obra.");
            return;
        }

        setDetalles([...detalles, {
            producto_id: undefined,
            descripcion: moDesc,
            cantidad: moCant,
            precio_unitario: precio
        }]);

        setMoDesc('Mano de Obra');
        setMoCant(1);
        setMoPrecio('');
        setErrorMsg(null);
    };

    const handleEliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const totalGeneral = detalles.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

    const handleGuardar = async () => {
        if (!vehiculoId) {
            setErrorMsg("Debes seleccionar un vehículo obligatoriamente.");
            return;
        }
        if (detalles.length === 0) {
            setErrorMsg("Debes agregar al menos un ítem al presupuesto.");
            return;
        }

        const vehiculoSeleccionado = (Array.isArray(vehiculos) ? vehiculos : []).find(v => String(v.id) === String(vehiculoId));
        if (!vehiculoSeleccionado) {
            setErrorMsg("Vehículo inválido.");
            return;
        }

        setCargando(true);
        setErrorMsg(null);

        const presupuestoData: PresupuestoCreate = {
            vehiculo_id: vehiculoId,
            cliente_id: vehiculoSeleccionado.cliente_id,
            mecanico_id: mecanicoId || undefined,
            estado,
            validez_dias: validezDias,
            condiciones_pago: condicionesPago,
            detalles
        };

        try {
            if (presupuestoEditando) {
                await updatePresupuesto(presupuestoEditando.id, presupuestoData);
            } else {
                await createPresupuesto(presupuestoData);
            }
            onPresupuestoSaved();
            handleClose();
        } catch (err: any) {
            console.error("Error al guardar presupuesto:", err);
            setErrorMsg(err.response?.data?.detail || "No se pudo guardar el presupuesto.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>{presupuestoEditando ? `Editar Presupuesto #${String(presupuestoEditando.id).slice(0, 8)}` : 'Nuevo Presupuesto'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Vehículo *</Form.Label>
                            <Form.Select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                                <option value="">Selecciona un vehículo...</option>
                                {(Array.isArray(vehiculos) ? vehiculos : []).map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.patente} - {v.marca} {v.modelo} (Propietario ID: {String(v.cliente_id).slice(0, 8)})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Mecánico Encargado</Form.Label>
                            <Form.Select value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)}>
                                <option value="">Sin asignar...</option>
                                {(Array.isArray(empleados) ? empleados : []).map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.rol})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                    <Form.Label>Estado del Presupuesto</Form.Label>
                    <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                        <option value="Emitido">Emitido</option>
                        <option value="Aprobado">Aprobado por el Cliente</option>
                        <option value="Rechazado">Rechazado</option>
                    </Form.Select>
                </Form.Group>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Validez</Form.Label>
                            <Form.Control type="text" value={validezDias} onChange={(e) => setValidezDias(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Condiciones de Pago</Form.Label>
                            <Form.Control type="text" value={condicionesPago} onChange={(e) => setCondicionesPago(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col md={6}>
                        <div className="p-3 border rounded bg-light h-100">
                            <h6 className="fw-bold text-primary mb-2">+ Repuesto / Insumo</h6>
                            <Form.Group className="mb-2">
                                <Form.Select value={prodId} onChange={(e) => handleSelectProducto(e.target.value)}>
                                    <option value="">Selecciona repuesto...</option>
                                    {(Array.isArray(productos) ? productos : []).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} (Stock: {p.cantidad}) - ${p.precio}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Row className="g-2">
                                <Col xs={4}>
                                    <Form.Control type="number" min="1" value={prodCant} onChange={(e) => setProdCant(Number(e.target.value))} placeholder="Cant" />
                                </Col>
                                <Col xs={8}>
                                    <Form.Control type="number" step="0.01" value={prodPrecio} onChange={(e) => setProdPrecio(e.target.value)} placeholder="Precio (Opcional)" />
                                </Col>
                            </Row>
                            <Button variant="outline-primary" size="sm" className="w-100 mt-2" onClick={handleAgregarRepuesto}>
                                Agregar Repuesto
                            </Button>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="p-3 border rounded bg-light h-100 mt-2 mt-md-0">
                            <h6 className="fw-bold text-success mb-2">+ Mano de Obra / Servicio</h6>
                            <Form.Group className="mb-2">
                                <Form.Control type="text" value={moDesc} onChange={(e) => setMoDesc(e.target.value)} placeholder="Descripción del trabajo..." />
                            </Form.Group>
                            <Row className="g-2">
                                <Col xs={4}>
                                    <Form.Control type="number" min="1" value={moCant} onChange={(e) => setMoCant(Number(e.target.value))} placeholder="Cant" />
                                </Col>
                                <Col xs={8}>
                                    <Form.Control type="number" step="0.01" value={moPrecio} onChange={(e) => setMoPrecio(e.target.value)} placeholder="Precio $" />
                                </Col>
                            </Row>
                            <Button variant="outline-success" size="sm" className="w-100 mt-2" onClick={handleAgregarManoDeObra}>
                                Agregar Servicio
                            </Button>
                        </div>
                    </Col>
                </Row>

                <h5 className="fw-bold mb-2">Detalles del Presupuesto</h5>
                <Table striped bordered hover responsive>
                    <thead className="table-dark">
                        <tr>
                            <th>Descripción</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-end">Precio Unit.</th>
                            <th className="text-end">Subtotal</th>
                            <th className="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-3 text-muted">No se agregaron ítems al presupuesto.</td>
                            </tr>
                        ) : (
                            detalles.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.descripcion}</td>
                                    <td className="text-center">{item.cantidad}</td>
                                    <td className="text-end">${item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-end fw-bold">${(item.cantidad * item.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-center">
                                        <Button variant="outline-danger" size="sm" onClick={() => handleEliminarDetalle(index)}>Eliminar</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>

                <div className="d-flex justify-content-end mt-3">
                    <h4 className="fw-bold text-success">Total: ${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="success" onClick={handleGuardar} disabled={cargando}>
                    {cargando ? <Spinner animation="border" size="sm" /> : 'Guardar Presupuesto'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
