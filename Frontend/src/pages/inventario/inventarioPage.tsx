// Frontend/src/pages/inventario/inventarioPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { Producto } from '../../types';
import { getProductos, deleteProducto } from '../../api/inventarioApi';
import InventarioModal from './inventarioModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function InventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idProductoAEliminar, setIdProductoAEliminar] = useState<string | number | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [soloBajoStock, setSoloBajoStock] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarProductos = async () => {
        try {
            const data = await getProductos();
            setProductos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener inventario:", error);
            setProductos([]);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaFiltro, soloBajoStock]);

    const listaProductos = Array.isArray(productos) ? productos : [];
    const categoriasDisponibles = ['Todas', ...Array.from(new Set(listaProductos.map(p => p.categoria)))];

    const productosFiltrados = listaProductos.filter(p => {
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                                 (p.codigo && p.codigo.toLowerCase().includes(busqueda.toLowerCase()));

        const coincideCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
        const coincideStockBajo = !soloBajoStock || p.cantidad <= p.stock_critico;

        return coincideBusqueda && coincideCategoria && coincideStockBajo;
    });

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
            cargarProductos();
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    return (
        <div>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Inventario y Repuestos</h2>
                <Button variant="success" onClick={handleNuevoProducto}>
                    + Nuevo Repuesto
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    <Row className="mb-3 g-2 align-items-center">
                        <Col md={5}>
                            <InputGroup>
                                <InputGroup.Text>Buscar</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nombre o código SKU..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                                {categoriasDisponibles.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4} className="d-flex justify-content-md-end">
                            <Form.Check
                                type="switch"
                                id="stock-switch"
                                label="Solo bajo stock crítico"
                                checked={soloBajoStock}
                                onChange={(e) => setSoloBajoStock(e.target.checked)}
                            />
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Código / SKU</th>
                                <th>Nombre del Repuesto</th>
                                <th>Categoría</th>
                                <th>Precio Unitario</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-muted">
                                        No se encontraron repuestos registrados.
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

            <InventarioModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                onProductoSaved={cargarProductos}
                productoEditando={productoSeleccionado}
            />

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar este repuesto del inventario?"
                confirmText="Sí, Eliminar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
