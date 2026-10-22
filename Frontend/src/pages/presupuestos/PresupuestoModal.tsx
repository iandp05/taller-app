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

    // Estados base
    const [vehiculoId, setVehiculoId] = useState<number>(0);
    const [mecanicoId, setMecanicoId] = useState<number>(0);
    const [estado, setEstado] = useState('Emitido');
    const [validezDias, setValidezDias] = useState('15 días');
    const [condicionesPago, setCondicionesPago] = useState('Efectivo / Transferencia');
    
    // Lista final de ítems
    const [detalles, setDetalles] = useState<DetallePresupuestoCreate[]>([]);
    
    // Estados para ZONA 1: Repuestos
    const [prodId, setProdId] = useState<number | ''>('');
    const [prodCant, setProdCant] = useState<number>(1);
    const [prodPrecio, setProdPrecio] = useState<number | string>('');

    // Estados para ZONA 2: Mano de Obra
    const [moDesc, setMoDesc] = useState('Mano de Obra');
    const [moPrecio, setMoPrecio] = useState<number | string>('');

    const reordenarDetalles = (lista: DetallePresupuestoCreate[]) => {
        return [...lista].sort((a, b) => {
            const isRepuestoA = a.producto_id !== undefined && a.producto_id !== null;
            const isRepuestoB = b.producto_id !== undefined && b.producto_id !== null;
            
            if (isRepuestoA && !isRepuestoB) return -1;
            if (!isRepuestoA && isRepuestoB) return 1;
            return 0;
        });
    };

    useEffect(() => {
        if (show) {
            setErrorMsg(null);
            getVehiculos().then(setVehiculos).catch(console.error);
            getProductos().then(setProductos).catch(console.error);
            getUsuarios().then(setEmpleados).catch(console.error);
        }
    }, [show]);

    useEffect(() => {
        if (presupuestoEditando) {
            setVehiculoId(presupuestoEditando.vehiculo_id);
            setMecanicoId(presupuestoEditando.mecanico_id || 0);
            setEstado(presupuestoEditando.estado);
            setValidezDias(presupuestoEditando.validez_dias);
            setCondicionesPago(presupuestoEditando.condiciones_pago);
            setDetalles(reordenarDetalles(presupuestoEditando.detalles || []));
        } else {
            setVehiculoId(0);
            setMecanicoId(0);
            setEstado('Emitido');
            setValidezDias('15 días');
            setCondicionesPago('Efectivo / Transferencia');
            setDetalles([]);
        }
        
        setProdId('');
        setProdCant(1);
        setProdPrecio('');
        setMoDesc('Mano de Obra');
        setMoPrecio('');
        setErrorMsg(null);
    }, [presupuestoEditando, show]);

    const handleProductoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setProdId(id ? Number(id) : '');
        
        if (id) {
            const producto = productos.find(p => p.id === Number(id));
            if (producto) setProdPrecio(producto.precio);
        } else {
            setProdPrecio('');
        }
    };

    const agregarRepuesto = () => {
        setErrorMsg(null);
        if (prodId === '') {
            setErrorMsg("Por favor selecciona un repuesto del inventario.");
            return;
        }
        const cant = Number(prodCant);
        const prec = Number(prodPrecio);

        if (isNaN(cant) || cant <= 0) {
            setErrorMsg("La cantidad del repuesto debe ser mayor a 0.");
            return;
        }
        if (isNaN(prec) || prec < 0) {
            setErrorMsg("El precio unitario no puede ser negativo.");
            return;
        }
        
        const producto = productos.find(p => p.id === prodId);
        if (!producto) return;

        const nuevosDetalles = [...detalles];
        const indexExistente = nuevosDetalles.findIndex(d => d.producto_id === producto.id);

        if (indexExistente >= 0) {
            nuevosDetalles[indexExistente].cantidad += cant;
            nuevosDetalles[indexExistente].precio_unitario = prec;
        } else {
            nuevosDetalles.push({
                producto_id: producto.id,
                descripcion: producto.nombre,
                cantidad: cant,
                precio_unitario: prec
            });
        }
        
        setDetalles(reordenarDetalles(nuevosDetalles));
        setProdId('');
        setProdCant(1);
        setProdPrecio('');
    };

    const agregarManoObra = () => {
        setErrorMsg(null);
        if (!moDesc.trim()) {
            setErrorMsg("Por favor describe la tarea o mano de obra.");
            return;
        }
        const prec = Number(moPrecio);
        if (moPrecio === '' || isNaN(prec) || prec <= 0) {
            setErrorMsg("El precio de la mano de obra debe ser mayor a 0.");
            return;
        }

        const nuevosDetalles = [...detalles];
        const indexExistente = nuevosDetalles.findIndex(
            d => !d.producto_id && d.descripcion.trim().toLowerCase() === moDesc.trim().toLowerCase()
        );

        if (indexExistente >= 0) {
            nuevosDetalles[indexExistente].precio_unitario += prec;
        } else {
            nuevosDetalles.push({
                producto_id: null,
                descripcion: moDesc.trim(),
                cantidad: 1,
                precio_unitario: prec
            });
        }

        setDetalles(reordenarDetalles(nuevosDetalles));
        setMoDesc('Mano de Obra');
        setMoPrecio('');
    };

    const quitarItem = (index: number) => {
        const nuevosDetalles = [...detalles];
        nuevosDetalles.splice(index, 1);
        setDetalles(nuevosDetalles);
    };

    const totalPresupuesto = detalles.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (vehiculoId === 0) {
            setErrorMsg("Por favor selecciona un vehículo.");
            return;
        }

        if (detalles.length === 0) {
            setErrorMsg("Debes agregar al menos un ítem al presupuesto.");
            return;
        }

        if (totalPresupuesto < 0) {
            setErrorMsg("El total estimado no puede ser negativo.");
            return;
        }

        const vehiculoObj = vehiculos.find(v => v.id === vehiculoId);
        if (!vehiculoObj) return;

        if (cargando) return;
        setCargando(true); 

        const presupuestoData: PresupuestoCreate = {
            vehiculo_id: Number(vehiculoId),
            cliente_id: vehiculoObj.cliente_id, 
            mecanico_id: mecanicoId > 0 ? Number(mecanicoId) : undefined,
            estado,
            validez_dias: validezDias,
            condiciones_pago: condicionesPago,
            detalles: detalles
        };

        try {
            if (presupuestoEditando) {
                await updatePresupuesto(presupuestoEditando.id, presupuestoData);
            } else {
                await createPresupuesto(presupuestoData);
            }
            onPresupuestoSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al guardar:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorMsg(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(" | "));
            } else if (typeof detail === 'string') {
                setErrorMsg(detail);
            } else {
                setErrorMsg("Hubo un error al guardar el presupuesto.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{presupuestoEditando ? 'Actualizar Presupuesto' : 'Crear Nuevo Presupuesto'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorMsg && (
                    <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
                        {errorMsg}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit} id="presupuestoForm" noValidate>
                    <Row className="mb-4">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Vehículo *</Form.Label>
                                <Form.Select 
                                    value={vehiculoId} 
                                    onChange={(e) => setVehiculoId(Number(e.target.value))}
                                    disabled={!!presupuestoEditando}
                                >
                                    <option value={0}>Selecciona un vehículo...</option>
                                    {vehiculos.map(v => (
                                        <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Mecánico Responsable</Form.Label>
                                <Form.Select
                                    value={mecanicoId}
                                    onChange={(e) => setMecanicoId(Number(e.target.value))}
                                >
                                    <option value={0}>Sin asignar (Opcional)</option>
                                    {empleados.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nombre} ({emp.rol})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Estado</Form.Label>
                                <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                                    <option value="Emitido">Emitido</option>
                                    <option value="Aprobado">Aprobado</option>
                                    <option value="Rechazado">Rechazado</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Validez</Form.Label>
                                <Form.Control type="text" value={validezDias} onChange={(e) => setValidezDias(e.target.value)} />
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Condiciones de Pago</Form.Label>
                                <Form.Control type="text" value={condicionesPago} onChange={(e) => setCondicionesPago(e.target.value)} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="border p-4 rounded bg-light mb-4 shadow-sm">
                        <h6 className="mb-3 text-secondary border-bottom pb-2 fw-bold">Agregar Ítems a la Cotización</h6>
                        
                        <Row className="align-items-end mb-3">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-primary">1. Agregar Repuesto (desde Inventario)</Form.Label>
                                    <Form.Select value={prodId} onChange={handleProductoChange}>
                                        <option value="">Seleccionar repuesto...</option>
                                        {productos.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre} (Disp: {p.cantidad})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small">Cantidad</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        min="1" 
                                        value={prodCant} 
                                        onChange={(e) => setProdCant(Number(e.target.value))} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small">Precio Unit. ($)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01" 
                                        value={prodPrecio} 
                                        onChange={(e) => setProdPrecio(e.target.value)} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Button variant="outline-primary" className="w-100 fw-bold" onClick={agregarRepuesto} disabled={!prodId}>
                                    + Sumar Repuesto
                                </Button>
                            </Col>
                        </Row>

                        <hr className="text-muted opacity-25" />

                        <Row className="align-items-end">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-success">2. Agregar Mano de Obra / Otros</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={moDesc} 
                                        onChange={(e) => setMoDesc(e.target.value)} 
                                        placeholder="Ej: Mano de obra frenos" 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small">Precio Total ($)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01" 
                                        value={moPrecio} 
                                        onChange={(e) => setMoPrecio(e.target.value)} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Button variant="outline-success" className="w-100 fw-bold" onClick={agregarManoObra} disabled={!moDesc || !moPrecio}>
                                    + Sumar Trabajo
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {detalles.length > 0 ? (
                        <Table size="sm" striped bordered hover className="align-middle">
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
                                {detalles.map((detalle, index) => (
                                    <tr key={index}>
                                        <td className={detalle.producto_id ? "fw-normal" : "fw-bold text-success"}>
                                            {detalle.descripcion}
                                        </td>
                                        <td className="text-center">{detalle.cantidad}</td>
                                        <td className="text-end">${detalle.precio_unitario.toLocaleString()}</td>
                                        <td className="text-end fw-bold">${(detalle.cantidad * detalle.precio_unitario).toLocaleString()}</td>
                                        <td className="text-center">
                                            <Button variant="danger" size="sm" onClick={() => quitarItem(index)}>X</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="text-end fw-bold fs-5">TOTAL ESTIMADO:</td>
                                    <td className="text-end fw-bold fs-5 text-primary">${totalPresupuesto.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </Table>
                    ) : (
                        <div className="text-center text-muted mt-2 mb-2 p-3 border rounded">
                            Aún no agregaste ítems a este presupuesto.
                        </div>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="primary" type="submit" form="presupuestoForm" disabled={cargando}>
                    {cargando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : (presupuestoEditando ? 'Guardar Cambios' : 'Crear Presupuesto')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
