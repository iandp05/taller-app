// Frontend/src/pages/presupuestos/PresupuestosPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Presupuesto, Vehiculo, Cliente } from '../../types';
import { getPresupuestos, deletePresupuesto } from '../../api/presupuestosApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import PresupuestoModal from './PresupuestoModal';
import PresupuestoPdfModal from './PresupuestoPDFModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

export default function PresupuestosPage() {
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    
    const [showModal, setShowModal] = useState(false);
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<Presupuesto | null>(null);

    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfPresupuestoId, setPdfPresupuestoId] = useState<string | number | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [presupuestoIdAEliminar, setPresupuestoIdAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarDatos = useCallback(async () => {
        try {
            const [presupuestosData, vehiculosData, clientesData] = await Promise.all([
                getPresupuestos(),
                getVehiculos(),
                getClientes()
            ]);
            const lista = Array.isArray(presupuestosData) ? presupuestosData : [];
            setPresupuestos(lista.sort((a, b) => String(b.id).localeCompare(String(a.id))));
            setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
            setClientes(Array.isArray(clientesData) ? clientesData : []);
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    useAutoRefresh(cargarDatos, 5000);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const getVehiculo = (id: string | number) => (Array.isArray(vehiculos) ? vehiculos : []).find(v => String(v.id) === String(id));
    const getCliente = (id: string | number) => (Array.isArray(clientes) ? clientes : []).find(c => String(c.id) === String(id));

    const getBadgeVariant = (estado: string) => {
        switch (estado) {
            case 'Emitido': return 'primary';
            case 'Aprobado': return 'success';
            case 'Rechazado': return 'danger';
            default: return 'secondary';
        }
    };

    const listaPresupuestos = Array.isArray(presupuestos) ? presupuestos : [];
    const presupuestosFiltrados = listaPresupuestos.filter(p => {
        const v = getVehiculo(p.vehiculo_id);
        const c = getCliente(p.cliente_id);
        const term = busqueda.toLowerCase();

        return (
            String(p.id).toLowerCase().includes(term) ||
            p.estado.toLowerCase().includes(term) ||
            (v && (v.patente.toLowerCase().includes(term) || v.modelo.toLowerCase().includes(term))) ||
            (c && c.nombre.toLowerCase().includes(term))
        );
    });

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const presupuestosPaginados = presupuestosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(presupuestosFiltrados.length / itemsPorPagina);

    const handleNuevoPresupuesto = () => { setPresupuestoSeleccionado(null); setShowModal(true); };
    const handleEditarPresupuesto = (presupuesto: Presupuesto) => { setPresupuestoSeleccionado(presupuesto); setShowModal(true); };
    
    const handleVerPDF = (id: string | number) => {
        setPdfPresupuestoId(id);
        setShowPdfModal(true);
    };

    const handleWhatsApp = (presupuesto: Presupuesto) => {
        const cliente = getCliente(presupuesto.cliente_id);
        const vehiculo = getVehiculo(presupuesto.vehiculo_id);
        const telefono = cliente?.telefono?.replace(/[^0-9]/g, '') || '';
        const mensaje = encodeURIComponent(
            `Hola ${cliente?.nombre || 'Cliente'}, te enviamos el Presupuesto #${String(presupuesto.id).slice(0, 8)} para tu vehículo ${vehiculo ? vehiculo.marca + ' ' + vehiculo.modelo : ''} (${vehiculo?.patente || ''}) por un monto total de $${presupuesto.total.toLocaleString('es-AR')}. ¡Quedamos atentos a tus comentarios!`
        );
        window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
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
            console.error("Error al eliminar el presupuesto:", error);
            setErrorMsg("No se pudo eliminar el presupuesto.");
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Gestión de Presupuestos</h2>
                <Button variant="success" onClick={handleNuevoPresupuesto} className="w-100 w-sm-auto">
                    Nuevo Presupuesto
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>Buscar</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nº presupuesto, cliente, patente o estado..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Nº Presupuesto</th>
                                <th>Fecha Emisión</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Estado</th>
                                <th className="text-end">Monto Total</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {presupuestosPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-muted">
                                        No se encontraron presupuestos registrados.
                                    </td>
                                </tr>
                            ) : (
                                presupuestosPaginados.map((presupuesto) => {
                                    const vehiculo = getVehiculo(presupuesto.vehiculo_id);
                                    const cliente = getCliente(presupuesto.cliente_id);
                                    return (
                                        <tr key={presupuesto.id}>
                                            <td className="fw-bold">#{String(presupuesto.id).slice(0, 8)}</td>
                                            <td>{new Date(presupuesto.fecha_creacion).toLocaleDateString()}</td>
                                            <td>{cliente ? cliente.nombre : 'Cliente Desconocido'}</td>
                                            <td>{vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Vehículo no asignado'}</td>
                                            <td>
                                                <Badge bg={getBadgeVariant(presupuesto.estado)}>
                                                    {presupuesto.estado}
                                                </Badge>
                                            </td>
                                            <td className="text-end fw-bold">${presupuesto.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                            <td className="text-center">
                                                <Button variant="outline-success" size="sm" className="me-1 mb-1" onClick={() => handleWhatsApp(presupuesto)} title="Enviar por WhatsApp">
                                                    📱 WhatsApp
                                                </Button>
                                                <Button variant="outline-dark" size="sm" className="me-1 mb-1" onClick={() => handleVerPDF(presupuesto.id)}>Imprimir</Button>
                                                <Button variant="outline-primary" size="sm" className="me-1 mb-1" onClick={() => handleEditarPresupuesto(presupuesto)}>Editar</Button>
                                                <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarClick(presupuesto.id)}>Borrar</Button>
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

            <PresupuestoModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                onPresupuestoSaved={cargarDatos}
                presupuestoEditando={presupuestoSeleccionado}
            />

            <PresupuestoPdfModal
                show={showPdfModal}
                handleClose={() => setShowPdfModal(false)}
                presupuestoId={pdfPresupuestoId as any}
            />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar permanentemente este presupuesto?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
