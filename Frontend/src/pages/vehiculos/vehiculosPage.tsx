// Frontend/src/pages/vehiculos/vehiculosPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Alert } from 'react-bootstrap';
import { Vehiculo } from '../../types';
import { getVehiculos, deleteVehiculo } from '../../api/vehiculosApi';
import VehiculoModal from './vehiculosModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function VehiculosPage() {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idVehiculoAEliminar, setIdVehiculoAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarVehiculos = async () => {
        try {
            const data = await getVehiculos();
            // Aseguramos que data sea un array válido, por si falla la red
            setVehiculos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener vehículos:", error);
        }
    };

    useEffect(() => {
        cargarVehiculos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    // BLINDAJE DE SEGURIDAD: Evita pantalla en blanco si marca, modelo o patente son undefined
    const vehiculosFiltrados = vehiculos.filter(v => {
        const termino = busqueda.toLowerCase();
        const pat = v.patente ? v.patente.toLowerCase() : '';
        const mar = v.marca ? v.marca.toLowerCase() : '';
        const mod = v.modelo ? v.modelo.toLowerCase() : '';
        return pat.includes(termino) || mar.includes(termino) || mod.includes(termino);
    });

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

    // BLINDAJE DE ERRORES: Muestra el mensaje exacto que manda FastAPI (Ej: "Está atado a una orden")
    const handleConfirmarEliminacion = async () => {
        if (idVehiculoAEliminar === null) return;

        try {
            await deleteVehiculo(idVehiculoAEliminar);
            setShowConfirmModal(false);
            setIdVehiculoAEliminar(null);
            cargarVehiculos();
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            const mensajeError = error.response?.data?.detail || "No se pudo eliminar el vehículo.";
            setErrorMsg(mensajeError);
            setShowConfirmModal(false);
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Directorio de Vehículos</h2>
                <Button variant="success" onClick={handleNuevoVehiculo} className="w-100 w-sm-auto">
                    Registrar Vehículo
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
                                    placeholder="Patente, marca o modelo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
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
                                        <td className="fw-bold text-uppercase">{vehiculo.patente || '---'}</td>
                                        <td className="text-capitalize">{vehiculo.marca || '---'} {vehiculo.modelo || ''}</td>
                                        <td>{vehiculo.anio || '---'}</td>
                                        <td className="text-uppercase">{vehiculo.vin || '---'}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditarVehiculo(vehiculo)}>Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleEliminarVehiculoClick(vehiculo.id)}>Eliminar</Button>
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

            <VehiculoModal 
                show={showModal} 
                handleClose={() => setShowModal(false)} 
                onVehiculoSaved={cargarVehiculos} 
                vehiculoEditando={vehiculoSeleccionado} 
            />

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