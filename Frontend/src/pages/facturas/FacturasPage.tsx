// Frontend/src/pages/facturas/FacturasPage.tsx
import { useEffect, useState } from 'react';
import { Button, Table, Card, Form, InputGroup, Pagination, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Factura, Vehiculo, Cliente, ConfiguracionTaller } from '../../types';
import { getFacturas, deleteFactura } from '../../api/facturasApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';
import { getConfiguracion } from '../../api/configuracionApi';
import FacturaEmisionModal from './FacturaEmisionModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function FacturasPage() {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [, setConfigTaller] = useState<ConfiguracionTaller | null>(null);

    const [showEmisionModal, setShowEmisionModal] = useState(false);
    
    const [facturaIdAEliminar, setFacturaIdAEliminar] = useState<string | number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
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
            const lista = Array.isArray(facturasData) ? facturasData : [];
            setFacturas(lista.sort((a, b) => String(b.id).localeCompare(String(a.id))));
            setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
            setClientes(Array.isArray(clientesData) ? clientesData : []);
            setConfigTaller(configData);
        } catch (error) {
            console.error("Error al obtener facturas:", error);
            setFacturas([]);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const getVehiculo = (id: string | number) => (Array.isArray(vehiculos) ? vehiculos : []).find(v => String(v.id) === String(id));
    const getCliente = (id: string | number) => (Array.isArray(clientes) ? clientes : []).find(c => String(c.id) === String(id));

    const listaFacturas = Array.isArray(facturas) ? facturas : [];
    const facturasFiltradas = listaFacturas.filter(f => {
        const v = getVehiculo(f.vehiculo_id);
        const c = getCliente(f.cliente_id);
        const term = busqueda.toLowerCase();

        return (
            String(f.numero_comprobante).includes(term) ||
            f.tipo_comprobante.toLowerCase().includes(term) ||
            f.condicion_venta.toLowerCase().includes(term) ||
            (v && (v.patente.toLowerCase().includes(term) || v.modelo.toLowerCase().includes(term))) ||
            (c && c.nombre.toLowerCase().includes(term))
        );
    });

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const facturasPaginadas = facturasFiltradas.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina);

    const handleNuevaFactura = () => setShowEmisionModal(true);

    const handleEliminarClick = (id: string | number) => {
        setFacturaIdAEliminar(id);
        setShowConfirmModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (facturaIdAEliminar === null) return;

        try {
            await deleteFactura(facturaIdAEliminar, false);
            setShowConfirmModal(false);
            setFacturaIdAEliminar(null);
            cargarDatos();
        } catch (error) {
            console.error("Error al eliminar la factura:", error);
            setErrorMsg("No se pudo anular el comprobante.");
        }
    };

    return (
        <div>
            {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="mb-3">{errorMsg}</Alert>}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 mb-md-4">
                <h2 className="mb-0">Facturación y Remitos</h2>
                <Button variant="success" onClick={handleNuevaFactura} className="w-100 w-sm-auto">
                    + Emitir Comprobante
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
                                    placeholder="Nº comprobante, cliente, patente, tipo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                    <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Tipo</th>
                                <th>Nº Comprobante</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Condición</th>
                                <th className="text-end">Total</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturasPaginadas.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">
                                        No se encontraron comprobantes emitidos.
                                    </td>
                                </tr>
                            ) : (
                                facturasPaginadas.map((factura) => {
                                    const vehiculo = getVehiculo(factura.vehiculo_id);
                                    const cliente = getCliente(factura.cliente_id);
                                    return (
                                        <tr key={factura.id}>
                                            <td className="fw-bold">
                                                <Badge bg={factura.tipo_comprobante === 'Remito' ? 'info' : 'primary'}>
                                                    {factura.tipo_comprobante}
                                                </Badge>
                                            </td>
                                            <td className="fw-bold">{factura.punto_venta}-{factura.numero_comprobante}</td>
                                            <td>{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                                            <td>{cliente ? cliente.nombre : 'S/N'}</td>
                                            <td>{vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'S/V'}</td>
                                            <td>{factura.condicion_venta}</td>
                                            <td className="text-end fw-bold">${factura.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                            <td className="text-center">
                                                <Button variant="outline-danger" size="sm" className="mb-1" onClick={() => handleEliminarClick(factura.id)}>
                                                    Anular
                                                </Button>
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

            <ConfirmModal
                show={showConfirmModal}
                title="Confirmar Anulación de Comprobante"
                message="¿Estás seguro de que deseas anular este comprobante emitido?"
                confirmText="Sí, Anular Comprobante"
                confirmVariant="danger"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmarEliminacion}
            />
        </div>
    );
}
