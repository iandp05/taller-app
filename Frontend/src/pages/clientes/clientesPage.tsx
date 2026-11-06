// Frontend/src/pages/clientes/clientesPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert, Modal, ListGroup } from 'react-bootstrap';
import { Cliente } from '../../types';
import { getClientes, deleteCliente } from '../../api/clientesApi';
import ClienteModal from './clienteModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idClienteAEliminar, setIdClienteAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estado para ver el detalle en Bottom Sheet/Modal Móvil (Estilo App Bancaria)
    const [clienteDetalleMobile, setClienteDetalleMobile] = useState<Cliente | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarClientes = async () => {
        try {
            const data = await getClientes();
            setClientes([...data].reverse());
        } catch (error) {
            console.error("Error al obtener clientes:", error);
        }
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.telefono && c.telefono.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.cuit && c.cuit.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const clientesPaginados = clientesFiltrados.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(clientesFiltrados.length / itemsPorPagina);

    const handleNuevoCliente = () => { setClienteSeleccionado(null); setShowModal(true); };
    const handleEditarCliente = (cliente: Cliente) => { setClienteSeleccionado(cliente); setShowModal(true); };
    
    const handleEliminarClienteClick = (id: string | number) => {
        setIdClienteAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (idClienteAEliminar === null) return;
        
        try {
            await deleteCliente(idClienteAEliminar);
            setShowConfirmModal(false);
            setIdClienteAEliminar(null);
            cargarClientes();
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            setErrorMsg(error.response?.data?.detail || "No se pudo eliminar el cliente.");
            setShowConfirmModal(false);
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Gestión de Clientes</h2>
                <Button variant="success" onClick={handleNuevoCliente} className="w-100 w-sm-auto">
                    Nuevo Cliente
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
                                    placeholder="Nombre, CUIT, teléfono o email..."
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
                                    <th>Nombre / Razón Social</th>
                                    <th>CUIT / DNI</th>
                                    <th>Teléfono</th>
                                    <th>Condición IVA</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientesPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-muted">
                                            No se encontraron clientes que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    clientesPaginados.map((cliente) => (
                                        <tr key={cliente.id}>
                                            <td className="fw-bold">{cliente.nombre}</td>
                                            <td className="font-monospace">{cliente.cuit || 'Sin CUIT'}</td>
                                            <td>{cliente.telefono || '-'}</td>
                                            <td>
                                                <Badge bg="secondary">{cliente.condicion_iva || 'Consumidor Final'}</Badge>
                                            </td>
                                            <td>
                                                <Button variant="outline-primary" size="sm" className="me-2 mb-1" onClick={() => handleEditarCliente(cliente)}>Editar</Button>
                                                <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarClienteClick(cliente.id)}>Eliminar</Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* VISTA MÓVIL (< 768px): Lista Compacta 1 Línea Estilo App Bancaria */}
                    <div className="d-md-none">
                        {clientesPaginados.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                No se encontraron clientes.
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {clientesPaginados.map((cliente) => (
                                    <ListGroup.Item
                                        key={cliente.id}
                                        action
                                        onClick={() => setClienteDetalleMobile(cliente)}
                                        className="d-flex align-items-center justify-content-between py-3 px-2 border-bottom cursor-pointer"
                                    >
                                        <div className="text-truncate me-2" style={{ maxWidth: '65%' }}>
                                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                {cliente.nombre}
                                            </div>
                                            <div className="text-muted small text-truncate">
                                                {cliente.telefono || cliente.cuit || 'Sin datos de contacto'}
                                            </div>
                                        </div>

                                        <div className="text-end flex-shrink-0 d-flex align-items-center gap-2">
                                            <Badge bg="secondary">{cliente.condicion_iva || 'Consumidor Final'}</Badge>
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
                show={!!clienteDetalleMobile}
                onHide={() => setClienteDetalleMobile(null)}
                centered
            >
                {clienteDetalleMobile && (
                    <>
                        <Modal.Header closeButton className="bg-dark text-white">
                            <Modal.Title className="fs-5 fw-bold">
                                Ficha de Cliente
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-3">
                            <div className="p-3 bg-light border rounded mb-3">
                                <h5 className="fw-bold text-dark mb-1">{clienteDetalleMobile.nombre}</h5>
                                <Badge bg="primary">{clienteDetalleMobile.condicion_iva || 'Consumidor Final'}</Badge>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted d-block">CUIT / DNI:</small>
                                <strong className="font-monospace text-dark">{clienteDetalleMobile.cuit || 'Sin CUIT registrado'}</strong>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted d-block">Teléfono / WhatsApp:</small>
                                <span className="text-dark">{clienteDetalleMobile.telefono || 'Sin teléfono'}</span>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted d-block">Email de contacto:</small>
                                <span className="text-dark">{clienteDetalleMobile.email || 'Sin email'}</span>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted d-block">Domicilio:</small>
                                <span className="text-dark">{clienteDetalleMobile.domicilio || 'Sin domicilio'}</span>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="d-flex flex-column gap-2">
                            <Button
                                variant="primary"
                                className="w-100 py-2 fw-bold"
                                onClick={() => {
                                    const c = clienteDetalleMobile;
                                    setClienteDetalleMobile(null);
                                    handleEditarCliente(c);
                                }}
                            >
                                Editar Datos del Cliente
                            </Button>
                            <Button
                                variant="outline-danger"
                                className="w-100 py-2 fw-semibold"
                                onClick={() => {
                                    const id = clienteDetalleMobile.id;
                                    setClienteDetalleMobile(null);
                                    handleEliminarClienteClick(id);
                                }}
                            >
                                Eliminar Cliente
                            </Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            <ClienteModal show={showModal} handleClose={() => setShowModal(false)} onClientSaved={cargarClientes} clienteEditando={clienteSeleccionado} />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar este cliente?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
