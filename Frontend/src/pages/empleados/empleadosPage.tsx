// Frontend/src/pages/empleados/empleadosPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Usuario } from '../../types';
import { getUsuarios, deleteUsuario } from '../../api/usuariosApi';
import EmpleadosModal from './empleadosModal';
import EmpleadoHistorialModal from './EmpleadoHistorialModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function EmpleadosPage() {
    const [empleados, setEmpleados] = useState<Usuario[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Usuario | null>(null);

    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [empleadoHistorial, setEmpleadoHistorial] = useState<Usuario | null>(null);

    // Estados para controlar el modal flotante de confirmación
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idEmpleadoAEliminar, setIdEmpleadoAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarEmpleados = async () => {
        try {
            const data = await getUsuarios();
            setEmpleados(data);
        } catch (error) {
            console.error("Error al obtener empleados:", error);
        }
    };

    useEffect(() => {
        cargarEmpleados();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const empleadosFiltrados = empleados.filter(e => 
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.username.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.rol.toLowerCase().includes(busqueda.toLowerCase())
    );

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const empleadosPaginados = empleadosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(empleadosFiltrados.length / itemsPorPagina);

    const handleNuevoEmpleado = () => { setEmpleadoSeleccionado(null); setShowModal(true); };
    const handleEditarEmpleado = (empleado: Usuario) => { setEmpleadoSeleccionado(empleado); setShowModal(true); };
    
    const handleVerHistorial = (empleado: Usuario) => {
        setEmpleadoHistorial(empleado);
        setShowHistorialModal(true);
    };

    const handleEliminarEmpleadoClick = (id: string | number) => {
        setIdEmpleadoAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (idEmpleadoAEliminar === null) return;
        
        try {
            await deleteUsuario(idEmpleadoAEliminar);
            setShowConfirmModal(false);
            setIdEmpleadoAEliminar(null);
            cargarEmpleados();
        } catch (error) {
            console.error("Error al eliminar:", error);
            setErrorMsg("No se pudo eliminar el empleado.");
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Directorio de Personal</h2>
                <Button variant="success" onClick={handleNuevoEmpleado} className="w-100 w-sm-auto">
                    Registrar Empleado
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
                                    placeholder="Nombre, usuario o rol..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0 align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Usuario (Login)</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empleadosPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-muted">
                                        No hay empleados registrados.
                                    </td>
                                </tr>
                            ) : (
                                empleadosPaginados.map((empleado) => (
                                    <tr key={empleado.id}>
                                        <td className="fw-bold">{empleado.id}</td>
                                        <td>{empleado.nombre}</td>
                                        <td className="text-primary fw-medium">{empleado.username}</td>
                                        <td>
                                            <Badge bg={empleado.rol === 'Administrador' ? 'danger' : (empleado.rol === 'Jefe de Taller' ? 'warning' : 'secondary')} className="text-dark">
                                                {empleado.rol}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button variant="outline-info" size="sm" className="me-2 mb-1" onClick={() => handleVerHistorial(empleado)}>
                                                Historial
                                            </Button>
                                            <Button variant="outline-primary" size="sm" className="me-2 mb-1" onClick={() => handleEditarEmpleado(empleado)}>
                                                Editar
                                            </Button>
                                            <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarEmpleadoClick(empleado.id)}>
                                                Eliminar
                                            </Button>
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

            <EmpleadosModal show={showModal} handleClose={() => setShowModal(false)} onEmpleadoSaved={cargarEmpleados} empleadoEditando={empleadoSeleccionado} />

            <EmpleadoHistorialModal show={showHistorialModal} handleClose={() => setShowHistorialModal(false)} empleado={empleadoHistorial} />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Desvinculación"
                message="¿Estás seguro de que deseas desvincular a este empleado del sistema?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
