// Frontend/src/pages/empleados/empleadosPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert, Modal, ListGroup } from 'react-bootstrap';
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

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idEmpleadoAEliminar, setIdEmpleadoAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estado para ver el detalle en Bottom Sheet/Modal Móvil (Estilo App Bancaria)
    const [empleadoDetalleMobile, setEmpleadoDetalleMobile] = useState<Usuario | null>(null);

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

    const getRolBadge = (rol: string) => {
        if (rol === 'Administrador') return <Badge bg="danger">Administrador</Badge>;
        if (rol === 'Jefe de Taller') return <Badge bg="warning" text="dark">Jefe de Taller</Badge>;
        return <Badge bg="secondary">Mecánico / Personal</Badge>;
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

                    {/* VISTA ESCRITORIO (>= 768px): Tabla Clásica Bootstrap */}
                    <div className="d-none d-md-block">
                        <Table striped hover responsive className="mb-0 align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>Usuario (Login)</th>
                                    <th>Rol</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleadosPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-muted">
                                            No hay empleados registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    empleadosPaginados.map((empleado) => (
                                        <tr key={empleado.id}>
                                            <td className="fw-bold">{empleado.nombre}</td>
                                            <td className="text-primary fw-medium font-monospace">@{empleado.username}</td>
                                            <td>{getRolBadge(empleado.rol)}</td>
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
                    </div>

                    {/* VISTA MÓVIL (< 768px): Lista Compacta 1 Línea Estilo App Bancaria */}
                    <div className="d-md-none">
                        {empleadosPaginados.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                No hay empleados registrados.
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {empleadosPaginados.map((empleado) => (
                                    <ListGroup.Item
                                        key={empleado.id}
                                        action
                                        onClick={() => setEmpleadoDetalleMobile(empleado)}
                                        className="d-flex align-items-center justify-content-between py-3 px-2 border-bottom cursor-pointer"
                                    >
                                        <div className="text-truncate me-2" style={{ maxWidth: '65%' }}>
                                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                {empleado.nombre}
                                            </div>
                                            <div className="text-muted small text-truncate">
                                                @{empleado.username}
                                            </div>
                                        </div>

                                        <div className="text-end flex-shrink-0 d-flex align-items-center gap-2">
                                            {getRolBadge(empleado.rol)}
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
                show={!!empleadoDetalleMobile}
                onHide={() => setEmpleadoDetalleMobile(null)}
                centered
            >
                {empleadoDetalleMobile && (
                    <>
                        <Modal.Header closeButton className="bg-dark text-white">
                            <Modal.Title className="fs-5 fw-bold">
                                Ficha de Empleado
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-3">
                            <div className="p-3 bg-light border rounded mb-3">
                                <h5 className="fw-bold text-dark mb-1">{empleadoDetalleMobile.nombre}</h5>
                                <div className="mt-1">{getRolBadge(empleadoDetalleMobile.rol)}</div>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted d-block">Usuario de Inicio de Sesión:</small>
                                <strong className="font-monospace text-primary">@{empleadoDetalleMobile.username}</strong>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted d-block">Rol de Usuario:</small>
                                <span className="text-dark">{empleadoDetalleMobile.rol}</span>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="d-flex flex-column gap-2">
                            <Button
                                variant="info"
                                className="w-100 py-2 fw-bold text-white"
                                onClick={() => {
                                    const emp = empleadoDetalleMobile;
                                    setEmpleadoDetalleMobile(null);
                                    handleVerHistorial(emp);
                                }}
                            >
                                Ver Historial de Trabajos
                            </Button>
                            <Button
                                variant="primary"
                                className="w-100 py-2 fw-bold"
                                onClick={() => {
                                    const emp = empleadoDetalleMobile;
                                    setEmpleadoDetalleMobile(null);
                                    handleEditarEmpleado(emp);
                                }}
                            >
                                Editar Datos del Empleado
                            </Button>
                            <Button
                                variant="outline-danger"
                                className="w-100 py-2 fw-semibold"
                                onClick={() => {
                                    const id = empleadoDetalleMobile.id;
                                    setEmpleadoDetalleMobile(null);
                                    handleEliminarEmpleadoClick(id);
                                }}
                            >
                                Desvincular Empleado
                            </Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

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
