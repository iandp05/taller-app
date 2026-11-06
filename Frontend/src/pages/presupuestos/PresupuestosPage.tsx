// Frontend/src/pages/presupuestos/PresupuestosPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert, Modal, ListGroup } from 'react-bootstrap';
import { Presupuesto, Vehiculo, Cliente } from '../../types';
import { getPresupuestos, deletePresupuesto } from '../../api/presupuestosApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import PresupuestoModal from './PresupuestoModal';
import PresupuestoPDFModal from './PresupuestoPDFModal'; 
import ConfirmModal from '../../components/ConfirmModal';

export default function PresupuestosPage() {
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    
    const [showModal, setShowModal] = useState(false);
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<Presupuesto | null>(null);

    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfPresupuestoId, setPdfPresupuestoId] = useState<string | number | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [presupuestoIdAEliminar, setPresupuestoIdAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estado para ver el detalle en Bottom Sheet/Modal Móvil (Estilo App Bancaria)
    const [presupuestoDetalleMobile, setPresupuestoDetalleMobile] = useState<Presupuesto | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarDatos = async () => {
        try {
            const [presupuestosData, vehiculosData, clientesData] = await Promise.all([
                getPresupuestos(),
                getVehiculos(),
                getClientes()
            ]);
            setPresupuestos([...presupuestosData].reverse());
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
    }, [busqueda]);

    const getVehiculo = (id: string | number) => vehiculos.find(v => String(v.id) === String(id));
    const getCliente = (presupuesto: Presupuesto) => {
        if (presupuesto.cliente) return presupuesto.cliente;
        if (presupuesto.cliente_id) return clientes.find(c => String(c.id) === String(presupuesto.cliente_id));
        const v = getVehiculo(presupuesto.vehiculo_id);
        if (v) return clientes.find(c => String(c.id) === String(v.cliente_id));
        return null;
    };

    const presupuestosFiltrados = presupuestos.filter(p => {
        const termino = busqueda.toLowerCase();
        const vehiculo = getVehiculo(p.vehiculo_id);
        const cliente = getCliente(p);

        const matchId = p.id.toString().toLowerCase().includes(termino);
        const matchEstado = p.estado.toLowerCase().includes(termino);
        const matchPatente = vehiculo ? vehiculo.patente.toLowerCase().includes(termino) : false;
        const matchCliente = cliente ? cliente.nombre.toLowerCase().includes(termino) : false;

        return matchId || matchEstado || matchPatente || matchCliente;
    });

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const presupuestosPaginados = presupuestosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(presupuestosFiltrados.length / itemsPorPagina);

    const handleNuevo = () => { setPresupuestoSeleccionado(null); setShowModal(true); };
    const handleEditar = (presupuesto: Presupuesto) => { setPresupuestoSeleccionado(presupuesto); setShowModal(true); };
    
    const handleVerPDF = (id: string | number) => {
        setPdfPresupuestoId(id);
        setShowPDFModal(true);
    };

    const handleEliminarClick = (id: string | number) => {
        setPresupuestoIdAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (presupuestoIdAEliminar === null) return;
        try {
            await deletePresupuesto(presupuestoIdAEliminar);
            setShowConfirmModal(false);
            setPresupuestoIdAEliminar(null);
            cargarDatos();
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            setErrorMsg(error.response?.data?.detail || "No se pudo eliminar el presupuesto.");
            setShowConfirmModal(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Emitido': return <Badge bg="warning" text="dark">Emitido</Badge>;
            case 'Aprobado': return <Badge bg="success">Aprobado</Badge>;
            case 'Rechazado': return <Badge bg="danger">Rechazado</Badge>;
            default: return <Badge bg="secondary">{estado}</Badge>;
        }
    };

    const formatearIdPresupuesto = (id: string | number) => {
        const idStr = id.toString();
        if (idStr.length > 10) return `#${idStr.slice(0, 6).toUpperCase()}`;
        return `#${idStr.padStart(4, '0')}`;
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Presupuestos y Cotizaciones</h2>
                <Button variant="success" onClick={handleNuevo} className="w-100 w-sm-auto">
                    Nuevo Presupuesto
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
                                    placeholder="Nº presupuesto, patente, cliente o estado..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    {/* ESCRITORIO (>= 768px): Tabla Clásica Bootstrap */}
                    <div className="d-none d-md-block">
                        <Table striped hover responsive className="mb-0 align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Nº Presupuesto</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Vehículo</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {presupuestosPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            No se encontraron presupuestos que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    presupuestosPaginados.map((presupuesto) => {
                                        const vehiculo = getVehiculo(presupuesto.vehiculo_id);
                                        const cliente = getCliente(presupuesto);

                                        return (
                                            <tr key={presupuesto.id}>
                                                <td className="fw-bold">{formatearIdPresupuesto(presupuesto.id)}</td>
                                                <td>{new Date(presupuesto.fecha_creacion).toLocaleDateString()}</td>

                                                <td className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>
                                                    {cliente?.nombre || 'Sin Cliente'}
                                                </td>

                                                <td>
                                                    {vehiculo ? (
                                                        <div>
                                                            <Badge bg="secondary" className="me-1">{vehiculo.patente}</Badge>
                                                            <small className="text-muted d-block">{vehiculo.marca} {vehiculo.modelo}</small>
                                                        </div>
                                                    ) : 'Desconocido'}
                                                </td>

                                                <td className="fw-bold text-success">
                                                    ${presupuesto.total.toLocaleString()}
                                                </td>

                                                <td>{getEstadoBadge(presupuesto.estado)}</td>

                                                <td>
                                                    <Button variant="outline-success" size="sm" className="me-2 mb-1" onClick={() => handleVerPDF(presupuesto.id)}>Imprimir</Button>
                                                    <Button variant="outline-primary" size="sm" className="me-2 mb-1" onClick={() => handleEditar(presupuesto)}>Ver / Editar</Button>
                                                    <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarClick(presupuesto.id)}>Eliminar</Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* MÓVIL (< 768px): Lista Compacta 1 Línea Estilo App Bancaria */}
                    <div className="d-md-none">
                        {presupuestosPaginados.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                No se encontraron presupuestos.
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {presupuestosPaginados.map((presupuesto) => {
                                    const vehiculo = getVehiculo(presupuesto.vehiculo_id);
                                    const cliente = getCliente(presupuesto);

                                    return (
                                        <ListGroup.Item
                                            key={presupuesto.id}
                                            action
                                            onClick={() => setPresupuestoDetalleMobile(presupuesto)}
                                            className="d-flex align-items-center justify-content-between py-3 px-2 border-bottom cursor-pointer"
                                        >
                                            <div className="text-truncate me-2" style={{ maxWidth: '65%' }}>
                                                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                    {formatearIdPresupuesto(presupuesto.id)} • {cliente?.nombre || 'Sin Cliente'}
                                                </div>
                                                <div className="text-muted small text-truncate">
                                                    {vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Cotización General'}
                                                </div>
                                            </div>

                                            <div className="text-end flex-shrink-0 d-flex align-items-center gap-2">
                                                <div>
                                                    <div className="fw-bold text-success" style={{ fontSize: '0.92rem' }}>
                                                        ${presupuesto.total.toLocaleString()}
                                                    </div>
                                                    <div>{getEstadoBadge(presupuesto.estado)}</div>
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

            {/* Bottom Sheet Modal Móvil */}
            <Modal
                show={!!presupuestoDetalleMobile}
                onHide={() => setPresupuestoDetalleMobile(null)}
                centered
            >
                {presupuestoDetalleMobile && (() => {
                    const vehiculo = getVehiculo(presupuestoDetalleMobile.vehiculo_id);
                    const cliente = getCliente(presupuestoDetalleMobile);

                    return (
                        <>
                            <Modal.Header closeButton className="bg-dark text-white">
                                <Modal.Title className="fs-5 fw-bold">
                                    Presupuesto {formatearIdPresupuesto(presupuestoDetalleMobile.id)}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="p-3">
                                <div className="p-3 bg-light border rounded mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small">Estado Actual:</span>
                                        <div>{getEstadoBadge(presupuestoDetalleMobile.estado)}</div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted small">Total Cotizado:</span>
                                        <span className="fw-bold text-success fs-5">${presupuestoDetalleMobile.total.toLocaleString()}</span>
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
                                    ) : <span className="text-muted">Desconocido</span>}
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Fecha de Emisión:</small>
                                    <span className="text-dark">{new Date(presupuestoDetalleMobile.fecha_creacion).toLocaleDateString()}</span>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="d-flex flex-column gap-2">
                                <Button
                                    variant="primary"
                                    className="w-100 py-2 fw-bold"
                                    onClick={() => {
                                        const p = presupuestoDetalleMobile;
                                        setPresupuestoDetalleMobile(null);
                                        handleEditar(p);
                                    }}
                                >
                                    Ver / Editar Presupuesto
                                </Button>
                                <Button
                                    variant="outline-success"
                                    className="w-100 py-2 fw-semibold"
                                    onClick={() => {
                                        const id = presupuestoDetalleMobile.id;
                                        setPresupuestoDetalleMobile(null);
                                        handleVerPDF(id);
                                    }}
                                >
                                    Imprimir Documento PDF
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    className="w-100 py-2 fw-semibold"
                                    onClick={() => {
                                        const id = presupuestoDetalleMobile.id;
                                        setPresupuestoDetalleMobile(null);
                                        handleEliminarClick(id);
                                    }}
                                >
                                    Eliminar Presupuesto
                                </Button>
                            </Modal.Footer>
                        </>
                    );
                })()}
            </Modal>

            <PresupuestoModal show={showModal} handleClose={() => setShowModal(false)} onPresupuestoSaved={cargarDatos} presupuestoEditando={presupuestoSeleccionado} />
            <PresupuestoPDFModal show={showPDFModal} handleClose={() => setShowPDFModal(false)} presupuestoId={pdfPresupuestoId} />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar este presupuesto?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
