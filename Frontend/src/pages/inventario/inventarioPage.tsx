// Frontend/src/pages/inventario/inventarioPage.tsx
import { useEffect, useState, useRef } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { Producto } from '../../types';
import { getProductos, deleteProducto, updateProducto } from '../../api/inventarioApi';
import InventarioModal from './inventarioModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function InventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [idProductoAEliminar, setIdProductoAEliminar] = useState<string | number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [soloBajoStock, setSoloBajoStock] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const [modoEscaner, setModoEscaner] = useState(false);
    const [codigoEscaneado, setCodigoEscaneado] = useState('');
    const [productoEscaneado, setProductoEscaneado] = useState<Producto | null>(null);
    const [cantModalEscaner, setCantModalEscaner] = useState<number>(1);
    const inputEscanerRef = useRef<HTMLInputElement>(null);

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
        if (modoEscaner && inputEscanerRef.current) {
            inputEscanerRef.current.focus();
        }
    }, [modoEscaner]);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaFiltro, soloBajoStock]);

    const handleKeyEscaner = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const codigo = codigoEscaneado.trim();
            if (!codigo) return;

            const prodEncontrado = (Array.isArray(productos) ? productos : []).find(p => p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase());

            if (prodEncontrado) {
                setProductoEscaneado(prodEncontrado);
                setCantModalEscaner(1);
            } else {
                setErrorMsg(`No se encontró ningún repuesto con el código/SKU "${codigo}".`);
            }
            setCodigoEscaneado('');
        }
    };

    const handleConfirmarModificacionStock = async (operacion: 'sumar' | 'restar') => {
        if (!productoEscaneado) return;

        const nuevaCantidad = operacion === 'sumar'
            ? productoEscaneado.cantidad + cantModalEscaner
            : Math.max(0, productoEscaneado.cantidad - cantModalEscaner);

        try {
            const datosActualizados = {
                nombre: productoEscaneado.nombre,
                codigo: productoEscaneado.codigo || undefined,
                categoria: productoEscaneado.categoria,
                precio: productoEscaneado.precio,
                cantidad: nuevaCantidad,
                stock_critico: productoEscaneado.stock_critico
            };

            await updateProducto(productoEscaneado.id, datosActualizados);
            setProductoEscaneado(null);
            cargarProductos();
        } catch (error: any) {
            console.error("Error al actualizar stock desde escáner:", error);
            setErrorMsg(error.response?.data?.detail || "No se pudo actualizar el stock del repuesto.");
        }
    };

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
            setErrorMsg("No se puede eliminar este repuesto porque ya fue utilizado en órdenes de trabajo o comprobantes.");
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Inventario y Repuestos</h2>
                <div className="d-flex gap-2 w-100 w-sm-auto">
                    <Button
                        variant={modoEscaner ? "warning" : "outline-primary"}
                        onClick={() => setModoEscaner(!modoEscaner)}
                        className="w-50 w-sm-auto"
                    >
                        {modoEscaner ? 'Modo Normal' : 'Modo Escáner Barcode'}
                    </Button>
                    <Button variant="success" onClick={handleNuevoProducto} className="w-50 w-sm-auto">
                        + Nuevo Repuesto
                    </Button>
                </div>
            </div>

            {modoEscaner && (
                <Card className="mb-4 border-warning bg-light shadow-sm">
                    <Card.Body>
                        <h5 className="fw-bold text-dark mb-2">Escáner de Código de Barras Activo</h5>
                        <p className="text-muted small mb-3">Escanea el producto con la lectora USB o escribe el código SKU y presiona Enter.</p>
                        <InputGroup>
                            <InputGroup.Text className="bg-warning text-dark fw-bold">Escanear SKU</InputGroup.Text>
                            <Form.Control
                                ref={inputEscanerRef}
                                type="text"
                                placeholder="Apunta el lector aquí..."
                                value={codigoEscaneado}
                                onChange={(e) => setCodigoEscaneado(e.target.value)}
                                onKeyDown={handleKeyEscaner}
                                autoFocus
                            />
                        </InputGroup>
                    </Card.Body>
                </Card>
            )}

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

            <Modal show={!!productoEscaneado} onHide={() => setProductoEscaneado(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Repuesto Detectado por Escáner</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {productoEscaneado && (
                        <div>
                            <h5 className="fw-bold text-primary">{productoEscaneado.nombre}</h5>
                            <p className="mb-1"><strong>SKU:</strong> {productoEscaneado.codigo || 'S/N'}</p>
                            <p className="mb-3"><strong>Stock Actual en Taller:</strong> <Badge bg="info">{productoEscaneado.cantidad} unidades</Badge></p>

                            <Form.Group className="mb-3">
                                <Form.Label>Unidades a modificar:</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={cantModalEscaner}
                                    onChange={(e) => setCantModalEscaner(Math.max(1, Number(e.target.value)))}
                                />
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="danger" onClick={() => handleConfirmarModificacionStock('restar')}>
                        - Descontar del Stock
                    </Button>
                    <Button variant="success" onClick={() => handleConfirmarModificacionStock('sumar')}>
                        + Ingresar al Stock
                    </Button>
                </Modal.Footer>
            </Modal>

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
