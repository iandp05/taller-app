// Frontend/src/pages/clientes/clientesPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Alert } from 'react-bootstrap';
import { Cliente } from '../../types';
import { getClientes, deleteCliente } from '../../api/clientesApi';
import ClienteModal from './clienteModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idClienteAEliminar, setIdClienteAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarClientes = useCallback(async () => {
        try {
            const data = await getClientes();
            setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener clientes:", error);
        }
    }, []);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    useAutoRefresh(cargarClientes, 5000);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const listaClientes = Array.isArray(clientes) ? clientes : [];
    const clientesFiltrados = listaClientes.filter(c =>
        (c.nombre && c.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.telefono && c.telefono.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(busqueda.toLowerCase()))
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
        } catch (error) {
            console.error("Error al eliminar:", error);
            setErrorMsg("No se pudo eliminar el cliente.");
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
                    <Row className="mb-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>Buscar</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nombre, teléfono o email..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientesPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-muted">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            ) : (
                                clientesPaginados.map((cliente) => (
                                    <tr key={cliente.id}>
                                        <td>{String(cliente.id).slice(0, 8)}</td>
                                        <td className="fw-bold">{cliente.nombre}</td>
                                        <td>{cliente.telefono}</td>
                                        <td>{cliente.email || '-'}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditarCliente(cliente)}>Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleEliminarClienteClick(cliente.id)}>Eliminar</Button>
                                        </td>
                                    </tr>
                                ))
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
