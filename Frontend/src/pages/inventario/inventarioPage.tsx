// Frontend/src/pages/inventario/inventarioPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Badge, Form, InputGroup, Pagination, Row, Col, Modal, Alert } from 'react-bootstrap';
import { Producto } from '../../types';
import { getProductos, deleteProducto, updateProducto } from '../../api/inventarioApi';
import InventarioModal from './inventarioModal';
import ConfirmModal from '../../components/ConfirmModal';

function SimuladorEscaner({ productos, onActualizar }: { productos: Producto[], onActualizar: () => void }) {
    const [codigoLeido, setCodigoLeido] = useState('');
    
    const [showCantidadModal, setShowCantidadModal] = useState(false);
    const [productoEscaneado, setProductoEscaneado] = useState<Producto | null>(null);
    const [cantidadModificar, setCantidadModificar] = useState<string>("1");
    const [errorMsg, setErrorMsg] = useState('');

    const handleEscanearSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 
        if (!codigoLeido) return;
        
        const productoEncontrado = productos.find(p => p.codigo === codigoLeido);
        
        if (!productoEncontrado) {
            setErrorMsg(`Código no reconocido: ${codigoLeido}. Si es un repuesto nuevo, primero debes crearlo con el botón Nuevo Producto.`);
            setCodigoLeido(''); 
            return;
        }
        
        setProductoEscaneado(productoEncontrado);
        setCantidadModificar("1");
        setErrorMsg('');
        setShowCantidadModal(true);
        setCodigoLeido(''); 
    };

    const confirmarCambioStock = async () => {
        if (!productoEscaneado) return;

        const cantidadNum = parseInt(cantidadModificar, 10);
        if (isNaN(cantidadNum)) {
            setErrorMsg('Por favor, ingresa un número válido.');
            return;
        }

        const nuevoStock = productoEscaneado.cantidad + cantidadNum;
        if (nuevoStock < 0) {
            setErrorMsg('Error: El stock no puede quedar en negativo.');
            return;
        }

        try {
            const datosActualizados = {
                nombre: productoEscaneado.nombre,
                codigo: productoEscaneado.codigo || undefined,
                categoria: productoEscaneado.categoria,
                precio: Number(productoEscaneado.precio),
                cantidad: nuevoStock,
                stock_critico: Number(productoEscaneado.stock_critico)
            };
            await updateProducto(productoEscaneado.id, datosActualizados);
            setShowCantidadModal(false);
            setProductoEscaneado(null);
            onActualizar(); 
        } catch (error) {
            console.error(error);
            setErrorMsg('Hubo un error de conexión al actualizar el stock.');
        }
    };

    return (
        <>
            <div className="p-3 mb-4 bg-dark text-white rounded shadow-sm">
                <h5>Ingreso y Egreso Rápido por Escáner</h5>
                <Form onSubmit={handleEscanearSubmit}>
                    <InputGroup>
                        <Form.Control 
                            type="text" 
                            placeholder="Esperando código de barras..." 
                            value={codigoLeido} 
                            onChange={(e) => setCodigoLeido(e.target.value)} 
                            autoFocus 
                        />
                        <Button type="submit" variant="success">Procesar Código</Button>
                    </InputGroup>
                </Form>
            </div>

            <Modal show={showCantidadModal} onHide={() => setShowCantidadModal(false)} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>Actualizar Stock por Escáner</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {productoEscaneado && (
                        <div>
                            <p className="mb-1"><strong>Producto:</strong> {productoEscaneado.nombre}</p>
                            <p className="mb-3"><strong>Stock actual:</strong> {productoEscaneado.cantidad} unidades</p>
                            
                            <Form.Group>
                                <Form.Label>Unidades a sumar (Usa número negativo para restar):</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={cantidadModificar} 
                                    onChange={(e) => setCantidadModificar(e.target.value)}
                                    autoFocus
                                />
                            </Form.Group>

                            {errorMsg && <p className="text-danger mt-2 small mb-0">{errorMsg}</p>}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCantidadModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={confirmarCambioStock}>Aplicar Cambio</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default function InventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idProductoAEliminar, setIdProductoAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5; 

    const cargarInventario = async () => {
        try {
            const data = await getProductos();
            setProductos(data);
        } catch (error) {
            console.error("Error al obtener el inventario:", error);
        }
    };

    useEffect(() => {
        cargarInventario();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const productosPaginados = productosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);

    const handleNuevoProducto = () => { setProductoSeleccionado(null); setShowModal(true); };
    const handleEditarProducto = (producto: Producto) => { setProductoSeleccionado(producto); setShowModal(true); };
    
    const handleEliminarProductoClick = (id: string | number) => {
        setIdProductoAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (idProductoAEliminar === null) return;
        
        try {
            await deleteProducto(idProductoAEliminar);
            setShowConfirmModal(false);
            setIdProductoAEliminar(null);
            cargarInventario();
        } catch (error) {
            console.error("Error al eliminar:", error);
            setErrorMsg("No se pudo eliminar el producto.");
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg('')} className="mb-3">{errorMsg}</Alert>}
            <SimuladorEscaner productos={productos} onActualizar={cargarInventario} />

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4 mt-4">
                <h2 className="mb-0">Control de Inventario</h2>
                <Button variant="success" onClick={handleNuevoProducto} className="w-100 w-sm-auto">Nuevo Producto</Button>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>Buscar</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nombre, código o categoría..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock Actual</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-muted">
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            ) : (
                                productosPaginados.map((producto) => (
                                    <tr key={producto.id}>
                                        <td className="fw-bold">{producto.codigo || '-'}</td>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.categoria}</td>
                                        <td>${producto.precio.toFixed(2)}</td>
                                        <td>
                                            <span className="me-2">{producto.cantidad}</span>
                                            {producto.cantidad <= producto.stock_critico && (
                                                <Badge bg="danger">Stock Bajo</Badge>
                                            )}
                                        </td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditarProducto(producto)}>Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleEliminarProductoClick(producto.id)}>Eliminar</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                    
                    {totalPaginas > 1 && (
                        <div className="d-flex justify-content-end mt-3">
                            <Pagination>
                                <Pagination.Prev 
                                    disabled={paginaActual === 1} 
                                    onClick={() => setPaginaActual(paginaActual - 1)} 
                                />
                                {[...Array(totalPaginas)].map((_, index) => (
                                    <Pagination.Item 
                                        key={index + 1} 
                                        active={index + 1 === paginaActual}
                                        onClick={() => setPaginaActual(index + 1)}
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next 
                                    disabled={paginaActual === totalPaginas} 
                                    onClick={() => setPaginaActual(paginaActual + 1)} 
                                />
                            </Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <InventarioModal show={showModal} handleClose={() => setShowModal(false)} onProductoSaved={cargarInventario} productoEditando={productoSeleccionado} />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar este producto?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}