// Frontend/src/pages/vehiculos/vehiculosPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Alert, Modal, ListGroup, Badge } from 'react-bootstrap';
import { Vehiculo, Cliente } from '../../types';
import { getVehiculos, deleteVehiculo } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import VehiculosModal from './vehiculosModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function VehiculosPage() {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idVehiculoAEliminar, setIdVehiculoAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estado para ver el detalle en Bottom Sheet/Modal Móvil (Estilo App Bancaria)
    const [vehiculoDetalleMobile, setVehiculoDetalleMobile] = useState<Vehiculo | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarVehiculos = async () => {
        try {
            const [vehData, cliData] = await Promise.all([
                getVehiculos(),
                getClientes()
            ]);
            setVehiculos([...vehData].reverse());
            setClientes(cliData);
        } catch (error) {
            console.error("Error al obtener datos:", error);
        }
    };

    useEffect(() => {
        cargarVehiculos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const getCliente = (clienteId: string | number) => clientes.find(c => String(c.id) === String(clienteId));

    const vehiculosFiltrados = vehiculos.filter(v =>
        v.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.vin && v.vin.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const vehiculosPaginados = vehiculosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(vehiculosFiltrados.length / itemsPorPagina);

    const handleNuevoVehiculo = () => { setVehiculoSeleccionado(null); setShowModal(true); };
    const handleEditarVehiculo = (vehiculo: Vehiculo) => { setVehiculoSeleccionado(vehiculo); setShowModal(true); };
    
    const handleEliminarVehiculoClick = (id: string | number) => {
        setIdVehiculoAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (idVehiculoAEliminar === null) return;

        try {
            await deleteVehiculo(idVehiculoAEliminar);
            setShowConfirmModal(false);
            setIdVehiculoAEliminar(null);
            cargarVehiculos();
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            setErrorMsg(error.response?.data?.detail || "No se pudo eliminar el vehículo.");
            setShowConfirmModal(false);
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Gestión de Vehículos</h2>
                <Button variant="success" onClick={handleNuevoVehiculo} className="w-100 w-sm-auto">
                    Nuevo Vehículo
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
                                    placeholder="Patente, marca o modelo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    {/* VISTA ESCRITORIO (>= 768px): Tabla Clásica Bootstrap */}
                    <div className="d-none d-md-block">
                        <Table striped hover responsive className="mb-0 align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Patente</th>
                                    <th>Marca y Modelo</th>
                                    <th>Año</th>
                                    <th>VIN / Chasis</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehiculosPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-muted">
                                            No se encontraron vehículos.
                                        </td>
                                    </tr>
                                ) : (
                                    vehiculosPaginados.map((vehiculo) => (
                                        <tr key={vehiculo.id}>
                                            <td>
                                                <Badge bg="dark" className="font-monospace fs-6">{vehiculo.patente || 'S/P'}</Badge>
                                            </td>
                                            <td className="fw-bold">{vehiculo.marca} {vehiculo.modelo}</td>
                                            <td>{vehiculo.anio || '---'}</td>
                                            <td className="font-monospace text-muted">{vehiculo.vin || '---'}</td>
                                            <td>
                                                <Button variant="outline-primary" size="sm" className="me-2 mb-1" onClick={() => handleEditarVehiculo(vehiculo)}>Editar</Button>
                                                <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarVehiculoClick(vehiculo.id)}>Eliminar</Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* VISTA MÓVIL (< 768px): Lista Compacta 1 Línea Estilo App Bancaria */}
                    <div className="d-md-none">
                        {vehiculosPaginados.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                No se encontraron vehículos.
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {vehiculosPaginados.map((vehiculo) => (
                                    <ListGroup.Item
                                        key={vehiculo.id}
                                        action
                                        onClick={() => setVehiculoDetalleMobile(vehiculo)}
                                        className="d-flex align-items-center justify-content-between py-3 px-2 border-bottom cursor-pointer"
                                    >
                                        <div className="text-truncate me-2" style={{ maxWidth: '65%' }}>
                                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                {vehiculo.patente} • {vehiculo.marca} {vehiculo.modelo}
                                            </div>
                                            <div className="text-muted small text-truncate">
                                                Año {vehiculo.anio || 'N/A'} {vehiculo.vin ? `• VIN: ${vehiculo.vin}` : ''}
                                            </div>
                                        </div>

                                        <div className="text-end flex-shrink-0 d-flex align-items-center gap-2">
                                            <Badge bg="dark" className="font-monospace">{vehiculo.patente}</Badge>
                                            <span className="text-muted fw-bold fs-5">›</span>
                                        </div>
                                    </ListGroup.Item>
                                ))}
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
                show={!!vehiculoDetalleMobile}
                onHide={() => setVehiculoDetalleMobile(null)}
                centered
            >
                {vehiculoDetalleMobile && (() => {
                    const cliente = getCliente(vehiculoDetalleMobile.cliente_id);

                    return (
                        <>
                            <Modal.Header closeButton className="bg-dark text-white">
                                <Modal.Title className="fs-5 fw-bold">
                                    Vehículo {vehiculoDetalleMobile.patente}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="p-3">
                                <div className="p-3 bg-light border rounded mb-3">
                                    <Badge bg="dark" className="font-monospace fs-5 mb-1">{vehiculoDetalleMobile.patente}</Badge>
                                    <h5 className="fw-bold text-dark mb-0">{vehiculoDetalleMobile.marca} {vehiculoDetalleMobile.modelo}</h5>
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Año de Fabricación:</small>
                                    <strong className="text-dark">{vehiculoDetalleMobile.anio || 'Sin año registrado'}</strong>
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Dueño del Vehículo (Cliente):</small>
                                    <strong className="text-dark">{cliente?.nombre || 'Cliente no asignado'}</strong>
                                    {cliente?.telefono && <span className="text-muted small ms-2">({cliente.telefono})</span>}
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted d-block">Número de Chasis / VIN:</small>
                                    <span className="font-monospace text-dark">{vehiculoDetalleMobile.vin || 'Sin VIN registrado'}</span>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="d-flex flex-column gap-2">
                                <Button
                                    variant="primary"
                                    className="w-100 py-2 fw-bold"
                                    onClick={() => {
                                        const v = vehiculoDetalleMobile;
                                        setVehiculoDetalleMobile(null);
                                        handleEditarVehiculo(v);
                                    }}
                                >
                                    Editar Vehículo
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    className="w-100 py-2 fw-semibold"
                                    onClick={() => {
                                        const id = vehiculoDetalleMobile.id;
                                        setVehiculoDetalleMobile(null);
                                        handleEliminarVehiculoClick(id);
                                    }}
                                >
                                    Eliminar Vehículo
                                </Button>
                            </Modal.Footer>
                        </>
                    );
                })()}
            </Modal>

            <VehiculosModal show={showModal} handleClose={() => setShowModal(false)} onVehiculoSaved={cargarVehiculos} vehiculoEditando={vehiculoSeleccionado} />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar este vehículo?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
