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
    const [pdfOrdenId, setPdfOrdenId] = useState<number | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [ordenIdAEliminar, setOrdenIdAEliminar] = useState<number | null>(null);
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
            setOrdenes(ordenesData);
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

    const getVehiculo = (id: number) => vehiculos.find(v => v.id === id);
    const getCliente = (orden: OrdenTrabajo) => {
        if (orden.cliente) return orden.cliente;
        if (orden.cliente_id) return clientes.find(c => c.id === orden.cliente_id);
        const v = getVehiculo(orden.vehiculo_id);
        if (v) return clientes.find(c => c.id === v.cliente_id);
        return null;
    };

    const ordenesFiltradas = ordenes.filter(o => {
        if (!mostrarEntregados && o.estado === 'Entregado') {
            return false;
        }

        const termino = busqueda.toLowerCase();
        const vehiculo = getVehiculo(o.vehiculo_id);
        const cliente = getCliente(o);

        const matchId = o.id.toString().includes(termino);
        const matchEstado = o.estado.toLowerCase().includes(termino);
        const matchFalla = o.descripcion_falla.toLowerCase().includes(termino);
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
    
    const handleVerPdf = (id: number) => {
        setPdfOrdenId(id);
        setShowPdfModal(true);
    };

    const handleEliminarOrdenClick = (id: number) => {
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
        } catch (error) {
            console.error("Error al eliminar:", error);
            setErrorMsg("No se pudo eliminar la orden de trabajo.");
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
                        <Col md={4} className="text-end">
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

                    <Table striped hover responsive className="mb-0 align-middle">
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
                                    
                                    const esEliminable = orden.estado === 'Ingresado' || orden.estado === 'Pendiente';

                                    return (
                                        <tr key={orden.id}>
                                            <td className="fw-bold">#{orden.id.toString().padStart(4, '0')}</td>
                                            <td>{new Date(orden.fecha_ingreso).toLocaleDateString()}</td>
                                            
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

                                            <td>
                                                {orden.mecanico?.nombre ? (
                                                    <Badge bg="info" text="dark" className="fw-bold border border-info">
                                                        {orden.mecanico.nombre}
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="secondary" className="fw-normal">
                                                        Sin Asignar
                                                    </Badge>
                                                )}
                                            </td>
                                            
                                            <td>{getEstadoBadge(orden.estado)}</td>
                                            
                                            <td>
                                                <Button variant="outline-success" size="sm" className="me-2 mb-1" onClick={() => handleVerPdf(orden.id)}>Imprimir</Button>
                                                <Button variant="outline-primary" size="sm" className="me-2 mb-1" onClick={() => handleEditarOrden(orden)}>Ver / Editar</Button>
                                                
                                                <Button 
                                                    variant={esEliminable ? "outline-danger" : "outline-secondary"} 
                                                    size="sm" 
                                                    className="mb-1" 
                                                    onClick={() => handleEliminarOrdenClick(orden.id)}
                                                    disabled={!esEliminable}
                                                    title={!esEliminable ? "No se puede eliminar una orden en curso" : ""}
                                                >
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
            <OrdenPdfModal show={showPdfModal} handleClose={() => setShowPdfModal(false)} ordenId={pdfOrdenId} />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas ELIMINAR esta orden de trabajo?"
                confirmText="Sí, Continuar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacionOrden}
            />

            <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>Gestión de Inventario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">¿Deseas DEVOLVER los repuestos de esta orden al inventario?</p>
                </Modal.Body>
                <Modal.Footer className="justify-content-between">
                    <Button variant="secondary" onClick={() => setShowStockModal(false)}>
                        Cancelar
                    </Button>
                    <div>
                        <Button variant="outline-danger" className="me-2" onClick={() => handleEjecutarEliminacion(false)}>
                            No, solo borrar
                        </Button>
                        <Button variant="success" onClick={() => handleEjecutarEliminacion(true)}>
                            Sí, devolver repuestos
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
}