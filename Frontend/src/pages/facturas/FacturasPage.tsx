// Frontend/src/pages/facturas/FacturasPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Factura, Vehiculo, Cliente, ConfiguracionTaller } from '../../types';
import { getFacturas, deleteFactura } from '../../api/facturasApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import { getConfiguracion } from '../../api/configuracionApi';
import FacturaEmisionModal from './FacturaEmisionModal';
import FacturaTemplate from '../../components/FacturaTemplate';
import ConfirmModal from '../../components/ConfirmModal';

export default function FacturasPage() {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    
    const [showEmisionModal, setShowEmisionModal] = useState(false);
    
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [facturaSeleccionadaPdf, setFacturaSeleccionadaPdf] = useState<Factura | null>(null);
    const [configTaller, setConfigTaller] = useState<ConfiguracionTaller | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [facturaIdAEliminar, setFacturaIdAEliminar] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    const cargarDatos = async () => {
        try {
            const [facturasData, vehiculosData, clientesData, configData] = await Promise.all([
                getFacturas(),
                getVehiculos(),
                getClientes(),
                getConfiguracion().catch(() => null)
            ]);
            setFacturas(facturasData.sort((a, b) => b.id - a.id));
            setVehiculos(vehiculosData);
            setClientes(clientesData);
            setConfigTaller(configData);
        } catch (error) {
            console.error("Error al obtener facturas:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const getVehiculo = (id: number) => vehiculos.find(v => v.id === id);
    const getCliente = (id: number) => clientes.find(c => c.id === id);

    const facturasFiltradas = facturas.filter(f => {
        const termino = busqueda.toLowerCase();
        const vehiculo = getVehiculo(f.vehiculo_id);
        const cliente = getCliente(f.cliente_id);

        const matchId = f.id.toString().includes(termino);
        const matchTipo = f.tipo_comprobante.toLowerCase().includes(termino);
        const matchNro = f.numero_comprobante.toString().includes(termino);
        const matchPatente = vehiculo ? vehiculo.patente.toLowerCase().includes(termino) : false;
        const matchCliente = cliente ? cliente.nombre.toLowerCase().includes(termino) : false;

        return matchId || matchTipo || matchNro || matchPatente || matchCliente;
    });

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const facturasPaginadas = facturasFiltradas.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina);

    const handleVerPdf = (factura: Factura) => {
        setFacturaSeleccionadaPdf(factura);
        setShowPdfModal(true);
    };

    const handleEliminarClick = (id: number) => {
        setFacturaIdAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = () => {
        setShowConfirmModal(false);
        setShowStockModal(true);
    };

    const handleEjecutarBaja = async (reponerStock: boolean) => {
        if (facturaIdAEliminar === null) return;
        try {
            await deleteFactura(facturaIdAEliminar, reponerStock);
            setShowStockModal(false);
            setFacturaIdAEliminar(null);
            cargarDatos();
        } catch (error) {
            console.error("Error al eliminar factura:", error);
            setErrorMsg("No se pudo eliminar el comprobante.");
        }
    };

    const getTipoBadge = (tipo: string) => {
        if (tipo.includes('A')) return <Badge bg="dark">Factura A</Badge>;
        if (tipo.includes('B')) return <Badge bg="primary">Factura B</Badge>;
        return <Badge bg="secondary">Remito</Badge>;
    };

    const formatearMoneda = (monto: number) => {
        return monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatearFecha = (fechaISO: string) => {
        const fechaUTC = fechaISO.endsWith('Z') ? fechaISO : fechaISO + 'Z';
        return new Date(fechaUTC).toLocaleDateString('es-AR');
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Facturación y Remitos</h2>
                <Button variant="success" onClick={() => setShowEmisionModal(true)} className="w-100 w-sm-auto">
                    Emitir Comprobante
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
                                    placeholder="Tipo, número, patente o cliente..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0 align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Comprobante</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Total</th>
                                <th>CAE / Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturasPaginadas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-muted">
                                        No se encontraron comprobantes emitidos.
                                    </td>
                                </tr>
                            ) : (
                                facturasPaginadas.map((factura) => {
                                    const vehiculo = getVehiculo(factura.vehiculo_id);
                                    const cliente = getCliente(factura.cliente_id);
                                    const nroCompleto = `${factura.punto_venta}-${factura.numero_comprobante.toString().padStart(8, '0')}`;

                                    return (
                                        <tr key={factura.id}>
                                            <td>
                                                <div>
                                                    {getTipoBadge(factura.tipo_comprobante)}
                                                    <span className="ms-2 fw-bold">{nroCompleto}</span>
                                                </div>
                                            </td>
                                            <td>{formatearFecha(factura.fecha_emision)}</td>
                                            <td className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>
                                                {cliente?.nombre || 'Consumidor Final'}
                                            </td>
                                            <td>
                                                {vehiculo ? (
                                                    <div>
                                                        <Badge bg="secondary" className="me-1">{vehiculo.patente}</Badge>
                                                        <small className="text-muted d-block">{vehiculo.marca} {vehiculo.modelo}</small>
                                                    </div>
                                                ) : '---'}
                                            </td>
                                            <td className="fw-bold text-success">${formatearMoneda(factura.total)}</td>
                                            <td>
                                                {factura.cae ? (
                                                    <Badge bg="success" className="px-2 py-1">CAE Asignado</Badge>
                                                ) : (
                                                    <Badge bg="light" text="secondary" className="border px-2 py-1">Interno / Sin CAE</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Button variant="outline-success" size="sm" className="me-2 mb-1" onClick={() => handleVerPdf(factura)}>Imprimir</Button>
                                                <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarClick(factura.id)}>Eliminar</Button>
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

            <FacturaEmisionModal 
                show={showEmisionModal} 
                handleClose={() => setShowEmisionModal(false)} 
                onFacturaSaved={cargarDatos} 
                facturasExistentes={facturas}
            />

            <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} size="xl" centered>
                <Modal.Header closeButton className="bg-dark text-white">
                    <Modal.Title>Comprobante Fiscal PDF</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ height: '70vh' }}>
                    {facturaSeleccionadaPdf && (
                        <PDFViewer width="100%" height="100%">
                            <FacturaTemplate 
                                factura={facturaSeleccionadaPdf} 
                                vehiculo={getVehiculo(facturaSeleccionadaPdf.vehiculo_id)!} 
                                cliente={getCliente(facturaSeleccionadaPdf.cliente_id)!} 
                                empresaConfig={configTaller}
                            />
                        </PDFViewer>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPdfModal(false)}>Cerrar</Button>
                    {facturaSeleccionadaPdf && (
                        <PDFDownloadLink
                            document={
                                <FacturaTemplate 
                                    factura={facturaSeleccionadaPdf} 
                                    vehiculo={getVehiculo(facturaSeleccionadaPdf.vehiculo_id)!} 
                                    cliente={getCliente(facturaSeleccionadaPdf.cliente_id)!} 
                                    empresaConfig={configTaller}
                                />
                            }
                            fileName={`${facturaSeleccionadaPdf.tipo_comprobante.replace(' ', '_')}_${facturaSeleccionadaPdf.punto_venta}-${facturaSeleccionadaPdf.numero_comprobante.toString().padStart(8, '0')}.pdf`}
                            className="btn btn-primary"
                        >
                            {({ loading }) => (loading ? 'Preparando...' : 'Descargar PDF')}
                        </PDFDownloadLink>
                    )}
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que deseas eliminar este comprobante?"
                confirmText="Sí, Continuar"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />

            <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>Gestión de Inventario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">¿Deseas DEVOLVER los repuestos de este comprobante al inventario?</p>
                </Modal.Body>
                <Modal.Footer className="justify-content-between">
                    <Button variant="secondary" onClick={() => setShowStockModal(false)}>Cancelar</Button>
                    <div>
                        <Button variant="outline-danger" className="me-2" onClick={() => handleEjecutarBaja(false)}>No, solo borrar</Button>
                        <Button variant="success" onClick={() => handleEjecutarBaja(true)}>Sí, devolver repuestos</Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
}