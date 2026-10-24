import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert } from 'react-bootstrap';
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

    // Estado único para la búsqueda global
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

    // Volver a la página 1 si se modifica la búsqueda
    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const getVehiculo = (id: string | number) => vehiculos.find(v => v.id === id);
    const getCliente = (presupuesto: Presupuesto) => {
        if (presupuesto.cliente) return presupuesto.cliente;
        if (presupuesto.cliente_id) return clientes.find(c => c.id === presupuesto.cliente_id);
        const v = getVehiculo(presupuesto.vehiculo_id);
        if (v) return clientes.find(c => c.id === v.cliente_id);
        return null;
    };

    // Lógica de filtrado unificada
    const presupuestosFiltrados = presupuestos.filter(p => {
        const termino = busqueda.toLowerCase();
        const vehiculo = getVehiculo(p.vehiculo_id);
        const cliente = getCliente(p);

        const matchId = p.id.toString().includes(termino);
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
        } catch (error) {
            console.error("Error al eliminar:", error);
            setErrorMsg("No se pudo eliminar el presupuesto.");
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
                    
                    {/* ZONA DE BÚSQUEDA UNIFICADA */}
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
                                            <td className="fw-bold">#{presupuesto.id.toString().padStart(4, '0')}</td>
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