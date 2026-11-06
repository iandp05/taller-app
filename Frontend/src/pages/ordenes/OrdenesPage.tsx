// Frontend/src/pages/ordenes/OrdenesPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Modal, Alert, ListGroup } from 'react-bootstrap';
import { OrdenTrabajo, Vehiculo, Cliente } from '../../types';
import { getOrdenes, deleteOrden } from '../../api/ordenesApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import OrdenModal from './OrdenModal';
import OrdenPdfModal from './OrdenPDFModal'; 
import ConfirmModal from '../../components/ConfirmModal';

export default function OrdenesPage() {
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    
    const [showModal, setShowModal] = useState(false);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null);

    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfOrdenId, setPdfOrdenId] = useState<string | number | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [ordenIdAEliminar, setOrdenIdAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estado para ver el detalle en Bottom Sheet/Modal Móvil (Estilo App Bancaria)
    const [ordenDetalleMobile, setOrdenDetalleMobile] = useState<OrdenTrabajo | null>(null);

    // Búsqueda y Paginación
    const [busqueda, setBusqueda] = useState('');
    const [mostrarEntregados, setMostrarEntregados] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarDatos = async () => {
        try {
            const [ordenesData, vehiculosData, clientesData] = await Promise.all([
                getOrdenes(),
                getVehiculos(),
                getClientes()
            ]);
            setOrdenes([...ordenesData].reverse());
            setVehiculos(vehiculosData);
            setClientes(clientesData);
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, mostrarEntregados]);

    const getVehiculo = (id: string | number) => vehiculos.find(v => String(v.id) === String(id));
    const getCliente = (orden: OrdenTrabajo) => {
        if (orden.cliente) return orden.cliente;
        if (orden.cliente_id) return clientes.find(c => String(c.id) === String(orden.cliente_id));
        const v = getVehiculo(orden.vehiculo_id);
        return v?.cliente_id ? clientes.find(c => String(c.id) === String(v.cliente_id)) : undefined;
    };

    const ordenesFiltradas = ordenes.filter(orden => {
        if (!mostrarEntregados && orden.estado === 'Entregado') return false;

        const termino = busqueda.toLowerCase();
        const vehiculo = getVehiculo(orden.vehiculo_id);
        const cliente = getCliente(orden);

        const matchId = orden.id.toString().toLowerCase().includes(termino);
        const matchEstado = orden.estado.toLowerCase().includes(termino);
        const matchFalla = orden.descripcion_falla.toLowerCase().includes(termino);
        const matchPatente = vehiculo ? vehiculo.patente.toLowerCase().includes(termino) : false;
        const matchCliente = cliente ? cliente.nombre.toLowerCase().includes(termino) : false;

        return matchId || matchEstado || matchFalla || matchPatente || matchCliente;
    });

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const ordenesPaginadas = ordenesFiltradas.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(ordenesFiltradas.length / itemsPorPagina);

    const handleNuevaOrden = () => { setOrdenSeleccionada(null); setShowModal(true); };
    const handleEditarOrden = (orden: OrdenTrabajo) => { setOrdenSeleccionada(orden); setShowModal(true); };

    const handleVerPdf = (id: string | number) => {
        setPdfOrdenId(id);
        setShowPdfModal(true);
    };

    const handleEliminarClick = (id: string | number) => {
        setOrdenIdAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacionOrden = () => {
        setShowConfirmModal(false);
        setShowStockModal(true);
    };

    const handleEjecutarEliminacion = async (reponerStock: boolean) => {
        if (ordenIdAEliminar === null) return;
        try {
            await deleteOrden(ordenIdAEliminar, reponerStock);
            setShowStockModal(false);
            setOrdenIdAEliminar(null);
            cargarDatos();
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            setErrorMsg(error.response?.data?.detail || "No se pudo eliminar la orden de trabajo.");
            setShowStockModal(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Ingresado':
            case 'Pendiente': return <Badge bg="warning" text="dark">Ingresado</Badge>;
            case 'En Reparación':
            case 'En Taller': return <Badge bg="primary">En Reparación</Badge>;
            case 'Listo para Entregar':
            case 'Terminado': return <Badge bg="success">Listo p/ Entregar</Badge>;
            case 'Entregado': return <Badge bg="secondary">Entregado</Badge>;
            default: return <Badge bg="secondary">{estado}</Badge>;
        }
    };

    const formatearIdOrden = (id: string | number) => {
        const idStr = id.toString();
        if (idStr.length > 10) {
            return `#${idStr.slice(0, 6).toUpperCase()}`;
        }
        return `#${idStr.padStart(4, '0')}`;
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Órdenes de Trabajo</h2>
                <Button variant="success" onClick={handleNuevaOrden} className="w-100 w-sm-auto">
                    Nueva Orden
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    <Row className="mb-3 align-items-center">
                        <Col md={8}>
                            <InputGroup>
                                <InputGroup.Text>Buscar</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nº orden, patente, cliente, estado o descripción..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4} className="text-end mt-2 mt-md-0">
                            <Form.Check
                                type="switch"
                                id="mostrar-entregados"
                                label="Mostrar historial archivado"
                                checked={mostrarEntregados}
                                onChange={(e) => setMostrarEntregados(e.target.checked)}
                                className="text-muted d-inline-block"
                            />
                        </Col>
                    </Row>

                    {/* VISTA ESCRITORIO (>= 768px): Tabla Clásica Bootstrap */}
                    <div className="d-none d-md-block">
                        <Table striped hover responsive className="mb-0 align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Nº Orden</th>
                                    <th>Fecha Ingreso</th>
                                    <th>Cliente</th>
                                    <th>Vehículo</th>
                                    <th>Estado</th>
                                    <th>Total</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenesPaginadas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            No se encontraron órdenes de trabajo que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    ordenesPaginadas.map((orden) => {
                                        const vehiculo = getVehiculo(orden.vehiculo_id);
                                        const cliente = getCliente(orden);
                                        const esEliminable = orden.estado === 'Ingresado' || orden.estado === 'Pendiente';

                                        return (
                                            <tr key={orden.id}>
                                                <td className="fw-bold">{formatearIdOrden(orden.id)}</td>
                                                <td>{new Date(orden.fecha_ingreso).toLocaleDateString()}</td>

                                                <td className="fw-semibold text-truncate" style={{ maxWidth: '160px' }}>
                                                    <div>{cliente?.nombre || 'Sin Cliente'}</div>
                                                    {cliente?.telefono && <small className="text-muted d-block">{cliente.telefono}</small>}
                                                </td>

                                                <td>
                                                    {vehiculo ? (
                                                        <div>
                                                            <Badge bg="secondary" className="me-1">{vehiculo.patente}</Badge>
                                                            <small className="text-muted d-block">{vehiculo.marca} {vehiculo.modelo}</small>
                                                        </div>
                                                    ) : 'Desconocido'}
                                                </td>

                                                <td>{getEstadoBadge(orden.estado)}</td>

                                                <td className="fw-bold text-success">
                                                    ${orden.total.toLocaleString()}
                                                </td>

                                                <td>
                                                    <Button variant="outline-primary" size="sm" className="me-2 mb-1" onClick={() => handleEditarOrden(orden)}>Ver / Editar</Button>
                                                    <Button variant="outline-danger" size="sm" className="me-2 mb-1" onClick={() => handleVerPdf(orden.id)}>PDF</Button>
                                                    {esEliminable && (
                                                        <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarClick(orden.id)}>Eliminar</Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* VISTA MÓVIL (< 768px): Lista Compacta 1 Línea Estilo App Bancaria */}
                    <div className="d-md-none">
                        {ordenesPaginadas.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                No se encontraron órdenes de trabajo.
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {ordenesPaginadas.map((orden) => {
                                    const vehiculo = getVehiculo(orden.vehiculo_id);
                                    const cliente = getCliente(orden);

                                    return (
                                        <ListGroup.Item
                                            key={orden.id}
                                            action
                                            onClick={() => setOrdenDetalleMobile(orden)}
                                            className="d-flex align-items-center justify-content-between py-3 px-2 border-bottom cursor-pointer"
                                        >
                                            <div className="text-truncate me-2" style={{ maxWidth: '65%' }}>
                                                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                    {formatearIdOrden(orden.id)} • {cliente?.nombre || 'Sin Cliente'}
                                                </div>
                                                <div className="text-muted small text-truncate">
                                                    {vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : orden.descripcion_falla}
                                                </div>
                                            </div>

                                            <div className="text-end flex-shrink-0 d-flex align-items-center gap-2">
                                                <div>
                                                    <div className="fw-bold text-success" style={{ fontSize: '0.92rem' }}>
                                                        ${orden.total.toLocaleString()}
                                                    </div>
                                                    <div>{getEstadoBadge(orden.estado)}</div>
                                                </div>
                                                <span className="text-muted fw-bold fs-5">›</span>
                                            </div>
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        )}
                    </div>

                    {totalPaginas > 1 && (
                        <div className="d-flex justify-content-end mt-3">
                            <Pagination>
                                <Pagination.Prev disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)} />
                                {[...Array(totalPaginas)].map((_, index) => (
                                    <Pagination.Item key={index + 1} active={index + 1 === paginaActual} onClick={() => setPaginaActual(index + 1)}>
                                        {index + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)} />
                            </Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Bottom Sheet / Modal Móvil de Detalle con Botones Táctiles Grandes (Estilo Bancario) */}
            <Modal
                show={!!ordenDetalleMobile}
                onHide={() => setOrdenDetalleMobile(null)}
                centered
                dialogClassName="modal-bottom-sheet"
            >
                {ordenDetalleMobile && (() => {
                    const vehiculo = getVehiculo(ordenDetalleMobile.vehiculo_id);
                    const cliente = getCliente(ordenDetalleMobile);
                    const esEliminable = ordenDetalleMobile.estado === 'Ingresado' || ordenDetalleMobile.estado === 'Pendiente';

                    return (
                        <>
                            <Modal.Header closeButton className="bg-dark text-white">
                                <Modal.Title className="fs-5 fw-bold">
                                    Detalle de Orden {formatearIdOrden(ordenDetalleMobile.id)}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="p-3">
                                <div className="p-3 bg-light border rounded mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small">Estado Actual:</span>
                                        <div>{getEstadoBadge(ordenDetalleMobile.estado)}</div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted small">Monto Total:</span>
                                        <span className="fw-bold text-success fs-5">${ordenDetalleMobile.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Cliente:</small>
                                    <strong className="text-dark">{cliente?.nombre || 'Sin cliente'}</strong>
                                    {cliente?.telefono && <span className="text-muted small ms-2">({cliente.telefono})</span>}
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Vehículo:</small>
                                    {vehiculo ? (
                                        <strong className="text-dark">{vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}</strong>
                                    ) : <span className="text-muted">Sin datos</span>}
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Fecha de Ingreso:</small>
                                    <span className="text-dark">{new Date(ordenDetalleMobile.fecha_ingreso).toLocaleDateString()}</span>
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Descripción / Falla:</small>
                                    <p className="text-secondary small bg-light p-2 border rounded mb-0">
                                        {ordenDetalleMobile.descripcion_falla || 'Sin observaciones'}
                                    </p>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="d-flex flex-column gap-2">
                                <Button
                                    variant="primary"
                                    className="w-100 py-2 fw-bold"
                                    onClick={() => {
                                        const ord = ordenDetalleMobile;
                                        setOrdenDetalleMobile(null);
                                        handleEditarOrden(ord);
                                    }}
                                >
                                    Ver / Editar Orden
                                </Button>
                                <Button
                                    variant="outline-success"
                                    className="w-100 py-2 fw-semibold"
                                    onClick={() => {
                                        const id = ordenDetalleMobile.id;
                                        setOrdenDetalleMobile(null);
                                        handleVerPdf(id);
                                    }}
                                >
                                    Imprimir Documento PDF
                                </Button>
                                {esEliminable && (
                                    <Button
                                        variant="outline-danger"
                                        className="w-100 py-2 fw-semibold"
                                        onClick={() => {
                                            const id = ordenDetalleMobile.id;
                                            setOrdenDetalleMobile(null);
                                            handleEliminarClick(id);
                                        }}
                                    >
                                        Eliminar Orden
                                    </Button>
                                )}
                            </Modal.Footer>
                        </>
                    );
                })()}
            </Modal>

            <OrdenModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                ordenEditando={ordenSeleccionada}
                onOrdenSaved={cargarDatos}
            />

            {pdfOrdenId && (
                <OrdenPdfModal
                    show={showPdfModal}
                    handleClose={() => {
                        setShowPdfModal(false);
                        setPdfOrdenId(null);
                    }}
                    ordenId={pdfOrdenId}
                />
            )}

            <ConfirmModal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacionOrden}
                title="Confirmar eliminación"
                message="¿Estás seguro de que deseas eliminar esta orden de trabajo?"
            />

            <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reponer Stock de Repuestos</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Deseas devolver al inventario los repuestos que estaban reservados o utilizados en esta orden de trabajo?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => handleEjecutarEliminacion(false)}>
                        No reponer stock
                    </Button>
                    <Button variant="success" onClick={() => handleEjecutarEliminacion(true)}>
                        Sí, reponer stock
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
