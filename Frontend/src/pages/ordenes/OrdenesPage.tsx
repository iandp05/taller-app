// Frontend/src/pages/ordenes/OrdenesPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
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
            setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
            setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
            setClientes(Array.isArray(clientesData) ? clientesData : []);
        } catch (error) {
            console.error("Error al obtener los datos:", error);
            setOrdenes([]);
            setVehiculos([]);
            setClientes([]);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, mostrarEntregados]);

    const getVehiculo = (id: string | number) => (Array.isArray(vehiculos) ? vehiculos : []).find(v => String(v.id) === String(id));
    const getCliente = (orden: OrdenTrabajo) => {
        if (orden.cliente) return orden.cliente;
        if (orden.cliente_id) return (Array.isArray(clientes) ? clientes : []).find(c => String(c.id) === String(orden.cliente_id));
        const v = getVehiculo(orden.vehiculo_id);
        if (v && v.cliente_id) return (Array.isArray(clientes) ? clientes : []).find(c => String(c.id) === String(v.cliente_id));
        return null;
    };

    const getBadgeVariant = (estado: string) => {
        switch (estado) {
            case 'En Recepción': return 'secondary';
            case 'En Diagnóstico': return 'info';
            case 'En Reparación': return 'warning';
            case 'Listo para Entregar': return 'success';
            case 'Entregado': return 'dark';
            case 'Cancelado': return 'danger';
            default: return 'primary';
        }
    };

    const listaOrdenes = Array.isArray(ordenes) ? ordenes : [];
    const ordenesFiltradas = listaOrdenes.filter(o => {
        const v = getVehiculo(o.vehiculo_id);
        const c = getCliente(o);
        const term = busqueda.toLowerCase();

        const coincideBusqueda =
            String(o.id).toLowerCase().includes(term) ||
            o.descripcion_falla.toLowerCase().includes(term) ||
            o.estado.toLowerCase().includes(term) ||
            (v && (v.patente.toLowerCase().includes(term) || v.modelo.toLowerCase().includes(term))) ||
            (c && c.nombre.toLowerCase().includes(term));

        if (!mostrarEntregados && o.estado === 'Entregado') return false;
        return coincideBusqueda;
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
        setShowStockModal(true);
    };

    const handleRespuestaStockModal = (reponerStock: boolean) => {
        setShowStockModal(false);
        setShowConfirmModal(true);
        (window as any)._reponerStockSeleccionado = reponerStock;
    };

    const handleConfirmarEliminacion = async () => {
        if (ordenIdAEliminar === null) return;
        const reponer = (window as any)._reponerStockSeleccionado ?? true;

        try {
            await deleteOrden(ordenIdAEliminar as any, reponer);
            setShowConfirmModal(false);
            setOrdenIdAEliminar(null);
            cargarDatos();
        } catch (error) {
            console.error("Error al eliminar la orden:", error);
            setErrorMsg("Ocurrió un problema al intentar eliminar la orden.");
        }
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
                        <Col md={6} className="mb-2 mb-md-0">
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
                        <Col md={6} className="d-flex justify-content-md-end">
                            <Form.Check 
                                type="switch"
                                id="custom-switch"
                                label="Mostrar historial archivado"
                                checked={mostrarEntregados}
                                onChange={(e) => setMostrarEntregados(e.target.checked)}
                            />
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Nº Orden</th>
                                <th>Fecha Ingreso</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Mecánico</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesPaginadas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-muted">
                                        No se encontraron órdenes de trabajo.
                                    </td>
                                </tr>
                            ) : (
                                ordenesPaginadas.map((orden) => {
                                    const vehiculo = getVehiculo(orden.vehiculo_id);
                                    const cliente = getCliente(orden);
                                    return (
                                        <tr key={orden.id}>
                                            <td className="fw-bold">#{String(orden.id).slice(0, 8)}</td>
                                            <td>{new Date(orden.fecha_ingreso).toLocaleDateString()}</td>
                                            <td>{cliente ? cliente.nombre : 'Cliente Desconocido'}</td>
                                            <td>{vehiculo ? `${vehiculo.patente} - ${vehiculo.marca} ${vehiculo.modelo}` : 'Vehículo no asignado'}</td>
                                            <td>{orden.mecanico ? orden.mecanico.nombre : 'Sin asignar'}</td>
                                            <td>
                                                <Badge bg={getBadgeVariant(orden.estado)}>
                                                    {orden.estado}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button variant="outline-info" size="sm" className="me-1 mb-1 me-sm-2 mb-sm-0" onClick={() => handleVerPdf(orden.id)}>
                                                    Imprimir PDF
                                                </Button>
                                                <Button variant="outline-primary" size="sm" className="me-1 mb-1 me-sm-2 mb-sm-0" onClick={() => handleEditarOrden(orden)}>
                                                    Editar
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="mb-1 mb-sm-0" onClick={() => handleEliminarClick(orden.id)}>
                                                    Eliminar
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>

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

            <OrdenModal show={showModal} handleClose={() => setShowModal(false)} onOrdenSaved={cargarDatos} ordenEditando={ordenSeleccionada} />
            <OrdenPdfModal show={showPdfModal} handleClose={() => setShowPdfModal(false)} ordenId={pdfOrdenId as any} />

            <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Baja de Orden de Trabajo</Modal.Title></Modal.Header>
                <Modal.Body><p>¿Deseas devolver los repuestos utilizados en esta orden al inventario?</p></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => handleRespuestaStockModal(false)}>No, ignorar stock</Button>
                    <Button variant="primary" onClick={() => handleRespuestaStockModal(true)}>Sí, devolver repuestos</Button>
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar permanentemente esta orden de trabajo?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
