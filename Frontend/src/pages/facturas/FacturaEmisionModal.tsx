// Frontend/src/pages/facturas/FacturaEmisionModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table, InputGroup, Alert } from 'react-bootstrap';
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
    const [productos, setProductos] = useState<Producto[]>([]);
    const [empleados, setEmpleados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(false);

    const [mecanicoId, setMecanicoId] = useState<string | number>('');

    const [tipoComprobante, setTipoComprobante] = useState('Factura A');
    const [puntoVenta] = useState('00001'); 
    const [numeroComprobante, setNumeroComprobante] = useState<number>(1);
    const [condicionVenta, setCondicionVenta] = useState('Contado');

    const [mostrarCAE, setMostrarCAE] = useState(false);
    const [cae, setCae] = useState('');
    const [caeVencimiento, setCaeVencimiento] = useState('');

    const [clienteId, setClienteId] = useState<string | number>('');
    const [clienteSearch, setClienteSearch] = useState('');
    
    const [vehiculoId, setVehiculoId] = useState<string | number>('');
    const [vehiculoSearch, setVehiculoSearch] = useState('');

    const [detalles, setDetalles] = useState<DetalleFacturaCreate[]>([]);
    const [prodId, setProdId] = useState<number | ''>('');
    const [prodCant, setProdCant] = useState<number>(1);
    const [prodPrecio, setProdPrecio] = useState<number | string>('');
    
    const [moPrecio, setMoPrecio] = useState<number | string>('');

    // Estado para manejar alertas visuales dentro del modal en lugar de pop-ups nativos
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const reordenarDetalles = (lista: DetalleFacturaCreate[]) => {
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
            Promise.all([getVehiculos(), getClientes(), getProductos(), getUsuarios()])
                .then(([vData, cData, pData, eData]) => {
                    setVehiculos(Array.isArray(vData) ? vData : []);
                    setClientes(Array.isArray(cData) ? cData : []);
                    setProductos(Array.isArray(pData) ? pData : []);
                    setEmpleados(Array.isArray(eData) ? eData : []);
                }).catch(err => {
                    console.error(err);
                    setErrorMsg("Error al cargar los datos iniciales.");
                });
        } else {
            setClienteId(0); setClienteSearch('');
            setVehiculoId(0); setVehiculoSearch('');
            setMecanicoId(0);
            setDetalles([]);
            setCae(''); setCaeVencimiento('');
            setMostrarCAE(false);
            setTipoComprobante('Factura A');
            setErrorMsg(null);
        }
    }, [show]);

    useEffect(() => {
        if (show) {
            const listaSegura = Array.isArray(facturasExistentes) ? facturasExistentes : [];
            const facturasMismoTipo = listaSegura.filter(f => f.tipo_comprobante === tipoComprobante);
            if (facturasMismoTipo.length > 0) {
                const maxNum = Math.max(...facturasMismoTipo.map(f => Number(f.numero_comprobante) || 0));
                setNumeroComprobante(maxNum + 1);
            } else {
                setNumeroComprobante(1);
            }
        }
    }, [tipoComprobante, facturasExistentes, show]);

    const clienteIdValido = Boolean(clienteId) && clienteId !== '0' && clienteId !== 0;

    const vehiculosDisponibles = clienteIdValido
        ? vehiculos.filter(v => v.cliente_id === clienteId) 
        : vehiculos;

    const handleClienteSearch = (val: string) => {
        setClienteSearch(val);
        const c = clientes.find(cli => `${cli.nombre} (CUIT: ${cli.cuit || 'Sin CUIT'})` === val);
        
        if (c) {
            setClienteId(c.id);
            const vehsDelCliente = vehiculos.filter(v => v.cliente_id === c.id);
            
            if (vehsDelCliente.length === 1) {
                setVehiculoId(vehsDelCliente[0].id);
                setVehiculoSearch(`${vehsDelCliente[0].patente} - ${vehsDelCliente[0].marca} ${vehsDelCliente[0].modelo}`);
            } else {
                setVehiculoId('');
                setVehiculoSearch(''); 
            }
        } else {
            setClienteId('');
        }
    };

    const handleVehiculoSearch = (val: string) => {
        setVehiculoSearch(val);
        const v = vehiculos.find(veh => `${veh.patente} - ${veh.marca} ${veh.modelo}` === val);
        
        if (v) {
            setVehiculoId(v.id);
            const c = clientes.find(cli => cli.id === v.cliente_id);
            if (c) {
                setClienteId(c.id);
                setClienteSearch(`${c.nombre} (CUIT: ${c.cuit || 'Sin CUIT'})`);
            }
        } else {
            setVehiculoId(0);
        }
    };

    const handleProductoSelect = (id: string) => {
        const pId = id ? Number(id) : '';
        setProdId(pId);
        if (pId) {
            const prod = productos.find(p => p.id === pId);
            if (prod) setProdPrecio(prod.precio);
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
            setErrorMsg("La cantidad debe ser mayor a 0.");
            return;
        }
        if (isNaN(prec) || prec < 0) {
            setErrorMsg("El precio unitario no puede ser negativo.");
            return;
        }

        const prod = productos.find(p => p.id === prodId);
        if (!prod) return;

        const nuevos = [...detalles];
        const idx = nuevos.findIndex(d => d.producto_id === prod.id);
        const cantTotal = (idx >= 0 ? nuevos[idx].cantidad : 0) + cant;

        if (prod.cantidad < cantTotal) {
            setErrorMsg(`Stock insuficiente de '${prod.nombre}'. Disponibles: ${prod.cantidad}, solicitados: ${cantTotal}.`);
            return;
        }

        if (idx >= 0) {
            nuevos[idx].cantidad = cantTotal;
            nuevos[idx].precio_unitario = prec;
        } else {
            nuevos.push({
                producto_id: prod.id,
                descripcion: prod.nombre,
                cantidad: cant,
                precio_unitario: prec,
                alicuota_iva: 21.0
            });
        }

        setDetalles(reordenarDetalles(nuevos));
        setProdId(''); setProdCant(1); setProdPrecio('');
    };

    const agregarManoObra = () => {
        setErrorMsg(null);
        const precioMO = Number(moPrecio);
        if (moPrecio === '' || isNaN(precioMO) || precioMO <= 0) {
            setErrorMsg("El precio de mano de obra debe ser un monto mayor a 0.");
            return;
        }

        const nuevos = [...detalles];
        const idx = nuevos.findIndex(d => !d.producto_id && d.descripcion === 'Mano de Obra');
        
        if (idx >= 0) {
            nuevos[idx].precio_unitario += precioMO;
        } else {
            nuevos.push({
                producto_id: null,
                descripcion: 'Mano de Obra',
                cantidad: 1,
                precio_unitario: precioMO,
                alicuota_iva: 21.0
            });
        }

        setDetalles(reordenarDetalles(nuevos));
        setMoPrecio('');
    };

    const quitarDetalle = (index: number) => {
        const nuevos = [...detalles];
        nuevos.splice(index, 1);
        setDetalles(reordenarDetalles(nuevos));
    };

    const totalGeneral = detalles.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio_unitario)), 0);

    const formatearMoneda = (monto: number) => {
        return monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (vehiculoId === 0 || clienteId === 0) {
            setErrorMsg("Debes buscar y seleccionar un cliente y vehículo válidos.");
            return;
        }
        if (detalles.length === 0) {
            setErrorMsg("El comprobante debe tener al menos un ítem.");
            return;
        }
        if (Number(numeroComprobante) <= 0) {
            setErrorMsg("El número de comprobante debe ser mayor a 0.");
            return;
        }

        if (cargando) return;
        setCargando(true);

        const facturaData: FacturaCreate = {
            vehiculo_id: vehiculoId,
            cliente_id: clienteId,
            mecanico_id: Boolean(mecanicoId) && mecanicoId !== '0' ? mecanicoId : undefined,
            tipo_comprobante: tipoComprobante,
            punto_venta: puntoVenta,
            condicion_venta: condicionVenta,
            detalles: detalles
        };

        try {
            await createFactura(facturaData);
            onFacturaSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al emitir:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorMsg(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join("\n"));
            } else {
                setErrorMsg(detail || "Hubo un error al emitir el comprobante.");
            }
        } finally {
            setCargando(false);
        }
    };

    const isRemito = tipoComprobante === 'Remito';

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title>Emitir Comprobante</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                
                {/* Cartel rojo integrado en lugar del pop-up gris */}
                {errorMsg && (
                    <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
                        {errorMsg}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit} id="facturaForm">
                    
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Tipo</Form.Label>
                                <Form.Select value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)}>
                                    <option value="Factura A">Factura A</option>
                                    <option value="Factura B">Factura B</option>
                                    <option value="Remito">Remito (X)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Punto Venta</Form.Label>
                                <Form.Control type="text" value={puntoVenta} disabled className="bg-light" />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Nº Correlativo</Form.Label>
                                <Form.Control type="number" min="1" value={numeroComprobante} onChange={(e) => setNumeroComprobante(Number(e.target.value))} required />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Condición Venta</Form.Label>
                                <Form.Select value={condicionVenta} onChange={(e) => setCondicionVenta(e.target.value)}>
                                    <option value="Contado">Contado</option>
                                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                                    <option value="Transferencia">Transferencia</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Mecánico</Form.Label>
                                <Form.Select value={mecanicoId} onChange={(e) => setMecanicoId(Number(e.target.value))}>
                                    <option value={0}>Sin asignar</option>
                                    {empleados.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3 p-3 bg-light rounded border mx-0">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Cliente (Facturar a) *</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    list="clientes-list" 
                                    placeholder="Escribí el nombre o CUIT..." 
                                    value={clienteSearch} 
                                    onChange={(e) => handleClienteSearch(e.target.value)} 
                                    required 
                                />
                                <datalist id="clientes-list">
                                    {clientes.map(c => <option key={c.id} value={`${c.nombre} (CUIT: ${c.cuit || 'Sin CUIT'})`} />)}
                                </datalist>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Vehículo Asociado *</Form.Label>
                                {clienteIdValido && vehiculosDisponibles.length > 1 ? (
                                    <Form.Select 
                                        value={vehiculoSearch} 
                                        onChange={(e) => handleVehiculoSearch(e.target.value)} 
                                        required
                                    >
                                        <option value="">Tiene varios vehículos. Seleccionar uno...</option>
                                        {vehiculosDisponibles.map(v => (
                                            <option key={v.id} value={`${v.patente} - ${v.marca} ${v.modelo}`}>
                                                {v.patente} - {v.marca} {v.modelo}
                                            </option>
                                        ))}
                                    </Form.Select>
                                ) : (
                                    <>
                                        <Form.Control 
                                            type="text" 
                                            list="vehiculos-list" 
                                            placeholder="Escribí la patente o modelo..." 
                                            value={vehiculoSearch} 
                                            onChange={(e) => handleVehiculoSearch(e.target.value)} 
                                            required 
                                            readOnly={clienteIdValido && vehiculosDisponibles.length === 1}
                                            className={clienteIdValido && vehiculosDisponibles.length === 1 ? "bg-white fw-bold" : ""}
                                        />
                                        <datalist id="vehiculos-list">
                                            {vehiculosDisponibles.map(v => <option key={v.id} value={`${v.patente} - ${v.marca} ${v.modelo}`} />)}
                                        </datalist>
                                    </>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>

                    {!isRemito && (
                        <div className="border p-2 rounded bg-white mb-3 shadow-sm">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="text-secondary mb-0 px-2">Datos AFIP</h6>
                                <Button variant="outline-secondary" size="sm" onClick={() => setMostrarCAE(!mostrarCAE)}>
                                    {mostrarCAE ? 'Quitar CAE' : 'Cargar CAE (Opcional)'}
                                </Button>
                            </div>
                            
                            {mostrarCAE && (
                                <Row className="mt-3 px-2">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small">Nº de CAE</Form.Label>
                                            <Form.Control type="text" value={cae} onChange={(e) => setCae(e.target.value)} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small">Vencimiento</Form.Label>
                                            <Form.Control type="text" placeholder="DD/MM/AAAA" value={caeVencimiento} onChange={(e) => setCaeVencimiento(e.target.value)} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            )}
                        </div>
                    )}

                    <div className="border p-3 rounded bg-white mb-3 shadow-sm">
                        <Row className="align-items-end mb-3 border-bottom pb-3">
                            <Col md={5}>
                                <Form.Label className="small fw-bold text-primary">Añadir Repuesto</Form.Label>
                                <Form.Select value={prodId} onChange={(e) => handleProductoSelect(e.target.value)}>
                                    <option value="">Seleccionar del inventario...</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.cantidad})</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small">Cant.</Form.Label>
                                <Form.Control type="number" min="1" value={prodCant} onChange={(e) => setProdCant(Number(e.target.value))} />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small">Precio Unit.</Form.Label>
                                <Form.Control type="number" step="0.01" value={prodPrecio} onChange={(e) => setProdPrecio(e.target.value)} />
                            </Col>
                            <Col md={3}>
                                <Button variant="outline-primary" className="w-100 fw-bold" onClick={agregarRepuesto} disabled={!prodId}>
                                    + Repuesto
                                </Button>
                            </Col>
                        </Row>

                        <Row className="align-items-end mt-2">
                            <Col md={9}>
                                <Form.Label className="small fw-bold text-success">Añadir Mano de Obra</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>$</InputGroup.Text>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01" 
                                        min="0" 
                                        placeholder="Ingrese el precio de la mano de obra..." 
                                        value={moPrecio} 
                                        onChange={(e) => setMoPrecio(e.target.value)} 
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={3}>
                                <Button variant="outline-success" className="w-100 fw-bold" onClick={agregarManoObra} disabled={!moPrecio}>
                                    + Mano de Obra
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {detalles.length > 0 && (
                        <Table size="sm" striped bordered hover className="align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Detalle</th>
                                    <th className="text-center">Cant.</th>
                                    <th className="text-end">Precio Unit.</th>
                                    <th className="text-end">Subtotal</th>
                                    <th className="text-center">X</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalles.map((d, index) => (
                                    <tr key={index}>
                                        <td className={d.producto_id ? "" : "text-success fw-bold"}>{d.descripcion}</td>
                                        <td className="text-center">{d.cantidad}</td>
                                        <td className="text-end">${formatearMoneda(d.precio_unitario)}</td>
                                        <td className="text-end fw-bold">${formatearMoneda(d.cantidad * d.precio_unitario)}</td>
                                        <td className="text-center">
                                            <Button variant="danger" size="sm" onClick={() => quitarDetalle(index)}>X</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="text-end fw-bold fs-5">TOTAL GENERAL:</td>
                                    <td className="text-end fw-bold fs-5 text-primary">${formatearMoneda(totalGeneral)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </Table>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="dark" type="submit" form="facturaForm" disabled={cargando} className="px-4">
                    {cargando ? 'Generando...' : 'Emitir Comprobante'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}