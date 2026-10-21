// Frontend/src/pages/empleados/EmpleadoHistorialModal.tsx
import { useEffect, useState } from 'react';
import { Modal, Button, Table, Badge, Form, InputGroup, Row, Col, Card, Spinner } from 'react-bootstrap';
import { Usuario } from '../../types';
import { getOrdenes } from '../../api/ordenesApi';
import { getPresupuestos } from '../../api/presupuestosApi';
import { getFacturas } from '../../api/facturasApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi';

interface EmpleadoHistorialModalProps {
    show: boolean;
    handleClose: () => void;
    empleado: Usuario | null;
}

export interface DocumentoHistorial {
    idKey: string;
    id: string | number;
    tipo: 'Orden de Trabajo' | 'Presupuesto' | 'Factura';
    referencia: string;
    fecha: Date;
    fechaStr: string;
    clienteNombre: string;
    vehiculoInfo: string;
    estado: string;
    esCerrado: boolean;
    montoTotal: number;
}

export default function EmpleadoHistorialModal({ show, handleClose, empleado }: EmpleadoHistorialModalProps) {
    const [cargando, setCargando] = useState(true);
    const [documentos, setDocumentos] = useState<DocumentoHistorial[]>([]);

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activo' | 'Cerrado'>('Todos');
    const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'Orden' | 'Presupuesto' | 'Factura'>('Todos');

    useEffect(() => {
        if (show && empleado) {
            cargarHistorialCompleto();
        }
    }, [show, empleado]);

    const cargarHistorialCompleto = async () => {
        if (!empleado) return;
        setCargando(true);

        try {
            const [ordenes, presupuestos, facturas, vehiculos, clientes] = await Promise.all([
                getOrdenes(),
                getPresupuestos(),
                getFacturas(),
                getVehiculos(),
                getClientes()
            ]);

            const listaOrdenes = Array.isArray(ordenes) ? ordenes : [];
            const listaPresupuestos = Array.isArray(presupuestos) ? presupuestos : [];
            const listaFacturas = Array.isArray(facturas) ? facturas : [];
            const listaVehiculos = Array.isArray(vehiculos) ? vehiculos : [];
            const listaClientes = Array.isArray(clientes) ? clientes : [];

            const getVehiculoObj = (id?: string | number) => id ? listaVehiculos.find(v => String(v.id) === String(id)) : undefined;
            const getClienteObj = (clienteId?: string | number, vehiculoId?: string | number) => {
                if (clienteId) {
                    const c = listaClientes.find(cli => String(cli.id) === String(clienteId));
                    if (c) return c;
                }
                if (vehiculoId) {
                    const v = getVehiculoObj(vehiculoId);
                    if (v && v.cliente_id) return listaClientes.find(cli => String(cli.id) === String(v.cliente_id));
                }
                return undefined;
            };

            const ordenesMecanico = listaOrdenes.filter(o => String(o.mecanico_id) === String(empleado.id));
            const presupuestosMecanico = listaPresupuestos.filter(p => String(p.mecanico_id) === String(empleado.id));
            const facturasMecanico = listaFacturas.filter(f => String(f.mecanico_id) === String(empleado.id));

            const docsMap: DocumentoHistorial[] = [];

            ordenesMecanico.forEach(o => {
                const vehiculo = getVehiculoObj(o.vehiculo_id);
                const cliente = getClienteObj(o.cliente_id, o.vehiculo_id);
                const fecha = new Date(o.fecha_ingreso);
                const esCerrado = o.estado === 'Entregado' || o.estado === 'Cancelado';

                docsMap.push({
                    idKey: `ORD-${o.id}`,
                    id: o.id,
                    tipo: 'Orden de Trabajo',
                    referencia: `OT #${String(o.id).slice(0, 8)} - ${o.descripcion_falla || 'Sin detalle'}`,
                    fecha,
                    fechaStr: fecha.toLocaleDateString(),
                    clienteNombre: cliente ? cliente.nombre : 'Cliente Desconocido',
                    vehiculoInfo: vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Sin Vehículo',
                    estado: o.estado,
                    esCerrado,
                    montoTotal: o.total || 0
                });
            });

            presupuestosMecanico.forEach(p => {
                const vehiculo = getVehiculoObj(p.vehiculo_id);
                const cliente = getClienteObj(p.cliente_id, p.vehiculo_id);
                const fecha = new Date(p.fecha_creacion);
                const esCerrado = p.estado === 'Aprobado' || p.estado === 'Rechazado';

                docsMap.push({
                    idKey: `PRES-${p.id}`,
                    id: p.id,
                    tipo: 'Presupuesto',
                    referencia: `Presupuesto #${String(p.id).slice(0, 8)} - Validez: ${p.validez_dias || '15 días'}`,
                    fecha,
                    fechaStr: fecha.toLocaleDateString(),
                    clienteNombre: cliente ? cliente.nombre : 'Cliente Desconocido',
                    vehiculoInfo: vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Sin Vehículo',
                    estado: p.estado,
                    esCerrado,
                    montoTotal: p.total || 0
                });
            });

            facturasMecanico.forEach(f => {
                const vehiculo = getVehiculoObj(f.vehiculo_id);
                const cliente = getClienteObj(f.cliente_id, f.vehiculo_id);
                const fecha = new Date(f.fecha_emision);

                docsMap.push({
                    idKey: `FAC-${f.id}`,
                    id: f.id,
                    tipo: 'Factura',
                    referencia: `${f.tipo_comprobante || 'Comprobante'} Nº ${f.punto_venta}-${f.numero_comprobante}`,
                    fecha,
                    fechaStr: fecha.toLocaleDateString(),
                    clienteNombre: cliente ? cliente.nombre : 'Cliente Desconocido',
                    vehiculoInfo: vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Sin Vehículo',
                    estado: 'Emitida',
                    esCerrado: true,
                    montoTotal: f.total || 0
                });
            });

            docsMap.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
            setDocumentos(docsMap);

        } catch (error) {
            console.error("Error al cargar el historial del empleado:", error);
        } finally {
            setCargando(false);
        }
    };

    const docsFiltrados = documentos.filter(doc => {
        const term = busqueda.toLowerCase();
        const coincideBusqueda =
            String(doc.id).toLowerCase().includes(term) ||
            doc.referencia.toLowerCase().includes(term) ||
            doc.clienteNombre.toLowerCase().includes(term) ||
            doc.vehiculoInfo.toLowerCase().includes(term) ||
            doc.estado.toLowerCase().includes(term);

        if (!coincideBusqueda) return false;

        if (filtroEstado === 'Activo' && doc.esCerrado) return false;
        if (filtroEstado === 'Cerrado' && !doc.esCerrado) return false;

        if (filtroTipo === 'Orden' && doc.tipo !== 'Orden de Trabajo') return false;
        if (filtroTipo === 'Presupuesto' && doc.tipo !== 'Presupuesto') return false;
        if (filtroTipo === 'Factura' && doc.tipo !== 'Factura') return false;

        return true;
    });

    const getBadgeVariant = (doc: DocumentoHistorial) => {
        if (doc.tipo === 'Orden de Trabajo') {
            if (doc.estado === 'Entregado') return 'dark';
            if (doc.estado === 'Listo para Entregar') return 'success';
            if (doc.estado === 'En Reparación') return 'warning';
            return 'info';
        }
        if (doc.tipo === 'Presupuesto') {
            if (doc.estado === 'Aprobado') return 'success';
            if (doc.estado === 'Rechazado') return 'danger';
            return 'primary';
        }
        return 'success';
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered backdrop="static">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    Historial de Trabajo de <span className="text-primary">{empleado?.nombre}</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ minHeight: '60vh', maxHeight: '75vh', overflowY: 'auto' }}>
                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">Cargando intervenciones del empleado...</p>
                    </div>
                ) : (
                    <>
                        <Card className="mb-3 border-0 bg-light shadow-sm">
                            <Card.Body>
                                <Row className="g-2">
                                    <Col md={5}>
                                        <InputGroup>
                                            <InputGroup.Text>Buscar</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Nº, cliente, patente, trabajo..."
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)}>
                                            <option value="Todos">Todos los Documentos</option>
                                            <option value="Orden">Órdenes de Trabajo</option>
                                            <option value="Presupuesto">Presupuestos</option>
                                            <option value="Factura">Facturas</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)}>
                                            <option value="Todos">Todos los Estados (Activos y Cerrados)</option>
                                            <option value="Activo">Solo Trabajos Activos / En Curso</option>
                                            <option value="Cerrado">Solo Archivados / Completados</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Table striped hover responsive className="align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Detalle / Referencia</th>
                                    <th>Cliente</th>
                                    <th>Vehículo</th>
                                    <th>Estado</th>
                                    <th className="text-end">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docsFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            No se encontraron registros de trabajo asignados a este empleado.
                                        </td>
                                    </tr>
                                ) : (
                                    docsFiltrados.map((doc) => (
                                        <tr key={doc.idKey}>
                                            <td className="fw-bold">{doc.tipo}</td>
                                            <td>{doc.fechaStr}</td>
                                            <td>{doc.referencia}</td>
                                            <td>{doc.clienteNombre}</td>
                                            <td><code>{doc.vehiculoInfo}</code></td>
                                            <td>
                                                <Badge bg={getBadgeVariant(doc)}>
                                                    {doc.estado}
                                                </Badge>
                                            </td>
                                            <td className="text-end fw-bold">
                                                ${doc.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
