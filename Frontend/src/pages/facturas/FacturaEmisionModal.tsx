// Frontend/src/pages/facturas/FacturaEmisionModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table, InputGroup, Alert, Card } from 'react-bootstrap';
import { Factura, FacturaCreate, Vehiculo, Cliente, Producto, DetalleFacturaCreate, Usuario } from '../../types';
import { createFactura } from '../../api/facturasApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import { getProductos } from '../../api/inventarioApi';
import { getUsuarios } from '../../api/usuariosApi';

interface FacturaEmisionModalProps {
    show: boolean;
    handleClose: () => void;
    onFacturaSaved: () => void;
    facturasExistentes: Factura[]; 
}

export default function FacturaEmisionModal({ show, handleClose, onFacturaSaved, facturasExistentes }: FacturaEmisionModalProps) {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [, setProductos] = useState<Producto[]>([]);
    const [empleados, setEmpleados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(false);

    const [mecanicoId, setMecanicoId] = useState<string | number>('');

    const [tipoComprobante, setTipoComprobante] = useState('Factura A');
    const [puntoVenta] = useState('00001'); 
    const [numeroComprobante, setNumeroComprobante] = useState<number>(1);
    const [condicionVenta] = useState('Contado');

    const [cae] = useState('');
    const [caeVencimiento] = useState('');

    const [clienteId, setClienteId] = useState<string | number>('');
    const [clienteSearch, setClienteSearch] = useState('');
    
    const [vehiculoId, setVehiculoId] = useState<string | number>('');
    const [vehiculoSearch, setVehiculoSearch] = useState('');

    const [detalles, setDetalles] = useState<DetalleFacturaCreate[]>([]);
    const [itemDesc, setItemDesc] = useState('');
    const [itemCant, setItemCant] = useState<number>(1);
    const [itemPrecio, setItemPrecio] = useState<number>(0);
    const [itemProductoId, setItemProductoId] = useState<string | number>('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (show) {
            cargarDatos();
            calcularProximoNumero();
            resetForm();
        }
    }, [show]);

    const cargarDatos = async () => {
        try {
            const [vData, cData, pData, eData] = await Promise.all([
                getVehiculos(),
                getClientes(),
                getProductos(),
                getUsuarios()
            ]);
            setVehiculos(Array.isArray(vData) ? vData : []);
            setClientes(Array.isArray(cData) ? cData : []);
            setProductos(Array.isArray(pData) ? pData : []);
            setEmpleados(Array.isArray(eData) ? eData : []);
        } catch (error) {
            console.error("Error al cargar datos para facturación:", error);
        }
    };

    const calcularProximoNumero = () => {
        if (Array.isArray(facturasExistentes) && facturasExistentes.length > 0) {
            const maxNumero = Math.max(...facturasExistentes.map(f => f.numero_comprobante || 0));
            setNumeroComprobante(maxNumero + 1);
        } else {
            setNumeroComprobante(1);
        }
    };

    const resetForm = () => {
        setClienteId('');
        setVehiculoId('');
        setMecanicoId('');
        setClienteSearch('');
        setVehiculoSearch('');
        setDetalles([]);
        setItemDesc('');
        setItemCant(1);
        setItemPrecio(0);
        setItemProductoId('');
        setTipoComprobante('Factura A');
        setErrorMsg('');
    };

    const handleSelectCliente = (c: Cliente) => {
        setClienteId(c.id);
        setClienteSearch(c.nombre);

        const vehsDelCliente = (Array.isArray(vehiculos) ? vehiculos : []).filter(v => String(v.cliente_id) === String(c.id));
        if (vehsDelCliente.length > 0) {
            setVehiculoId(vehsDelCliente[0].id);
            setVehiculoSearch(`${vehsDelCliente[0].patente} - ${vehsDelCliente[0].marca} ${vehsDelCliente[0].modelo}`);
        } else {
            setVehiculoId('');
            setVehiculoSearch('');
        }
    };

    const handleSelectVehiculo = (v: Vehiculo) => {
        setVehiculoId(v.id);
        setVehiculoSearch(`${v.patente} - ${v.marca} ${v.modelo}`);

        const c = (Array.isArray(clientes) ? clientes : []).find(cli => String(cli.id) === String(v.cliente_id));
        if (c) {
            setClienteId(c.id);
            setClienteSearch(c.nombre);
        }
    };

    const handleAgregarDetalle = () => {
        if (!itemDesc.trim()) {
            setErrorMsg("Debe ingresar una descripción para el ítem.");
            return;
        }
        if (itemCant <= 0 || itemPrecio < 0) {
            setErrorMsg("Cantidad y precio deben ser válidos.");
            return;
        }

        const nuevoDetalle: DetalleFacturaCreate = {
            producto_id: itemProductoId || undefined,
            descripcion: itemDesc,
            cantidad: itemCant,
            precio_unitario: itemPrecio,
            alicuota_iva: 21.0
        };

        setDetalles([...detalles, nuevoDetalle]);
        setItemDesc('');
        setItemCant(1);
        setItemPrecio(0);
        setItemProductoId('');
        setErrorMsg('');
    };

    const handleEliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const netoGravado = detalles.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0);
    const iva21 = netoGravado * 0.21;
    const totalFactura = netoGravado + iva21;

    const handleEmitir = async () => {
        if (!clienteId || !vehiculoId) {
            setErrorMsg("Debe seleccionar un cliente y un vehículo.");
            return;
        }
        if (detalles.length === 0) {
            setErrorMsg("Debe agregar al menos un ítem al comprobante.");
            return;
        }

        setCargando(true);
        setErrorMsg('');

        try {
            const nuevaFactura: FacturaCreate = {
                cliente_id: clienteId,
                vehiculo_id: vehiculoId,
                mecanico_id: mecanicoId || undefined,
                tipo_comprobante: tipoComprobante,
                punto_venta: puntoVenta,
                numero_comprobante: numeroComprobante,
                condicion_venta: condicionVenta,
                cae: cae || undefined,
                cae_vencimiento: caeVencimiento || undefined,
                detalles: detalles
            };

            await createFactura(nuevaFactura);
            onFacturaSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al emitir factura:", error);
            setErrorMsg(error.response?.data?.detail || "No se pudo emitir la factura.");
        } finally {
            setCargando(false);
        }
    };

    const clientesFiltrados = (Array.isArray(clientes) ? clientes : []).filter(c =>
        clienteSearch && c.nombre.toLowerCase().includes(clienteSearch.toLowerCase())
    );

    const vehiculosFiltrados = (Array.isArray(vehiculos) ? vehiculos : []).filter(v =>
        vehiculoSearch && (v.patente.toLowerCase().includes(vehiculoSearch.toLowerCase()) || v.modelo.toLowerCase().includes(vehiculoSearch.toLowerCase()))
    );

    return (
        <Modal show={show} onHide={handleClose} size="xl" backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>Emisión de Comprobante / Factura</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

                <Row className="mb-3">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Tipo de Comprobante</Form.Label>
                            <Form.Select value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)}>
                                <option value="Factura A">Factura A</option>
                                <option value="Factura B">Factura B</option>
                                <option value="Remito">Remito de Entrega</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Form.Group>
                            <Form.Label>Punto Venta</Form.Label>
                            <Form.Control type="text" value={puntoVenta} readOnly />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Nº Comprobante</Form.Label>
                            <Form.Control type="number" value={numeroComprobante} onChange={(e) => setNumeroComprobante(Number(e.target.value))} />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Mecánico / Encargado</Form.Label>
                            <Form.Select value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)}>
                                <option value="">Sin asignar...</option>
                                {(Array.isArray(empleados) ? empleados : []).map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.rol})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group className="position-relative">
                            <Form.Label>Cliente / Razón Social *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={clienteSearch}
                                onChange={(e) => {
                                    setClienteSearch(e.target.value);
                                    setClienteId('');
                                }}
                            />
                            {clienteSearch && !clienteId && clientesFiltrados.length > 0 && (
                                <div className="position-absolute w-100 bg-white border shadow-sm z-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {clientesFiltrados.map(c => (
                                        <div key={c.id} className="p-2 border-bottom style-select-item" onClick={() => handleSelectCliente(c)}>
                                            {c.nombre} - CUIT: {c.cuit || 'S/N'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="position-relative">
                            <Form.Label>Vehículo *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Buscar por patente o modelo..."
                                value={vehiculoSearch}
                                onChange={(e) => {
                                    setVehiculoSearch(e.target.value);
                                    setVehiculoId('');
                                }}
                            />
                            {vehiculoSearch && !vehiculoId && vehiculosFiltrados.length > 0 && (
                                <div className="position-absolute w-100 bg-white border shadow-sm z-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {vehiculosFiltrados.map(v => (
                                        <div key={v.id} className="p-2 border-bottom style-select-item" onClick={() => handleSelectVehiculo(v)}>
                                            {v.patente} - {v.marca} {v.modelo}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Form.Group>
                    </Col>
                </Row>

                <Card className="mb-3 bg-light border-0 shadow-sm">
                    <Card.Body>
                        <h6 className="fw-bold mb-2">Agregar Ítem / Repuesto</h6>
                        <Row className="g-2">
                            <Col md={5}>
                                <Form.Control
                                    type="text"
                                    placeholder="Descripción o buscar repuesto..."
                                    value={itemDesc}
                                    onChange={(e) => setItemDesc(e.target.value)}
                                />
                            </Col>
                            <Col md={2}>
                                <Form.Control
                                    type="number"
                                    placeholder="Cant"
                                    min="1"
                                    value={itemCant}
                                    onChange={(e) => setItemCant(Number(e.target.value))}
                                />
                            </Col>
                            <Col md={3}>
                                <InputGroup>
                                    <InputGroup.Text>$</InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        placeholder="Precio Unit"
                                        min="0"
                                        step="0.01"
                                        value={itemPrecio}
                                        onChange={(e) => setItemPrecio(Number(e.target.value))}
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={2}>
                                <Button variant="primary" className="w-100" onClick={handleAgregarDetalle}>
                                    + Agregar
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Table striped bordered hover responsive>
                    <thead className="table-dark">
                        <tr>
                            <th>Descripción</th>
                            <th className="text-center">Cant</th>
                            <th className="text-end">Precio Unit</th>
                            <th className="text-end">Subtotal</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-3 text-muted">No se agregaron detalles al comprobante.</td>
                            </tr>
                        ) : (
                            detalles.map((d, index) => (
                                <tr key={index}>
                                    <td>{d.descripcion}</td>
                                    <td className="text-center">{d.cantidad}</td>
                                    <td className="text-end">${d.precio_unitario.toFixed(2)}</td>
                                    <td className="text-end">${(d.cantidad * d.precio_unitario).toFixed(2)}</td>
                                    <td className="text-center">
                                        <Button variant="outline-danger" size="sm" onClick={() => handleEliminarDetalle(index)}>Eliminar</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>

                <Row className="justify-content-end text-end mt-3">
                    <Col md={4}>
                        <p className="mb-1 text-muted">Neto Gravado: ${netoGravado.toFixed(2)}</p>
                        <p className="mb-1 text-muted">IVA 21%: ${iva21.toFixed(2)}</p>
                        <h4 className="fw-bold text-success">Total: ${totalFactura.toFixed(2)}</h4>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="success" onClick={handleEmitir} disabled={cargando}>
                    {cargando ? 'Emitiendo...' : 'Emitir Comprobante'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
