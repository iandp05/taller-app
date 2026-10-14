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
    id: number;
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
            cargarHistorialEmpleado();
        } else {
            setDocumentos([]);
            setBusqueda('');
            setFiltroEstado('Todos');
            setFiltroTipo('Todos');
        }
    }, [show, empleado]);

    const cargarHistorialEmpleado = async () => {
        if (!empleado) return;
        setCargando(true);

        try {
            const [ordenesData, presupuestosData, facturasData, vehiculosData, clientesData] = await Promise.all([
                getOrdenes(),
                getPresupuestos(),
                getFacturas(),
                getVehiculos(),
                getClientes()
            ]);

            const getVehiculoObj = (vehiculoId: number) => vehiculosData.find(v => v.id === vehiculoId);
            const getClienteObj = (clienteId?: number, vehiculoId?: number) => {
                if (clienteId) return clientesData.find(c => c.id === clienteId);
                if (vehiculoId) {
                    const v = getVehiculoObj(vehiculoId);
                    if (v) return clientesData.find(c => c.id === v.cliente_id);
                }
                return null;
            };

            // 1. Filtrar Órdenes de Trabajo del Mecánico
            const ordenesMecanico = ordenesData.filter(
                o => o.mecanico_id === empleado.id || o.mecanico?.id === empleado.id
            );

            const vehiculoIdsDelMecanico = new Set(ordenesMecanico.map(o => o.vehiculo_id));
            const clienteIdsDelMecanico = new Set(
                ordenesMecanico.map(o => o.cliente_id || getVehiculoObj(o.vehiculo_id)?.cliente_id).filter(Boolean)
            );

            // 2. Filtrar Presupuestos asociados directamente al mecánico o a sus vehículos/clientes
            const presupuestosMecanico = presupuestosData.filter(
                p => p.mecanico_id === empleado.id || p.mecanico?.id === empleado.id || vehiculoIdsDelMecanico.has(p.vehiculo_id) || clienteIdsDelMecanico.has(p.cliente_id)
            );

            // 3. Filtrar Facturas asociadas directamente al mecánico o a sus vehículos/clientes
            const facturasMecanico = facturasData.filter(
                f => f.mecanico_id === empleado.id || f.mecanico?.id === empleado.id || vehiculoIdsDelMecanico.has(f.vehiculo_id) || clienteIdsDelMecanico.has(f.cliente_id)
            );

            const listaConsolidada: DocumentoHistorial[] = [];

            // A. Procesar Órdenes
            ordenesMecanico.forEach(o => {
                const vehiculo = getVehiculoObj(o.vehiculo_id);
                const cliente = getClienteObj(o.cliente_id, o.vehiculo_id);
                const esCerrado = o.estado === 'Entregado';
                const fechaObj = new Date(o.fecha_ingreso);

                listaConsolidada.push({
                    idKey: `orden_${o.id}`,
                    id: o.id,
                    tipo: 'Orden de Trabajo',
                    referencia: `#${o.id.toString().padStart(4, '0')}`,
                    fecha: fechaObj,
                    fechaStr: fechaObj.toLocaleDateString(),
                    clienteNombre: cliente?.nombre || 'Sin Cliente',
                    vehiculoInfo: vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Desconocido',
                    estado: o.estado,
                    esCerrado,
                    montoTotal: o.total || 0
                });
            });

            // B. Procesar Presupuestos
            presupuestosMecanico.forEach(p => {
                const vehiculo = getVehiculoObj(p.vehiculo_id);
                const cliente = getClienteObj(p.cliente_id, p.vehiculo_id);
                const esCerrado = p.estado === 'Aprobado' || p.estado === 'Rechazado';
                const fechaObj = new Date(p.fecha_creacion);

                listaConsolidada.push({
                    idKey: `presupuesto_${p.id}`,
                    id: p.id,
                    tipo: 'Presupuesto',
                    referencia: `Cotización #${p.id.toString().padStart(4, '0')}`,
                    fecha: fechaObj,
                    fechaStr: fechaObj.toLocaleDateString(),
                    clienteNombre: cliente?.nombre || 'Sin Cliente',
                    vehiculoInfo: vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Desconocido',
                    estado: p.estado,
                    esCerrado,
                    montoTotal: p.total || 0
                });
            });

            // C. Procesar Facturas
            facturasMecanico.forEach(f => {
                const vehiculo = getVehiculoObj(f.vehiculo_id);
                const cliente = getClienteObj(f.cliente_id, f.vehiculo_id);
                const fechaObj = new Date(f.fecha_emision);
                const ptoVenta = String(f.punto_venta || 1).padStart(5, '0');
                const nroComp = String(f.numero_comprobante || 1).padStart(8, '0');

                listaConsolidada.push({
                    idKey: `factura_${f.id}`,
                    id: f.id,
                    tipo: 'Factura',
                    referencia: `${f.tipo_comprobante} ${ptoVenta}-${nroComp}`,
                    fecha: fechaObj,
                    fechaStr: fechaObj.toLocaleDateString(),
                    clienteNombre: cliente?.nombre || 'Sin Cliente',
                    vehiculoInfo: vehiculo ? `${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})` : 'Desconocido',
                    estado: 'Emitido',
                    esCerrado: true,
                    montoTotal: f.total || 0
                });
            });

            // Ordenar de más reciente a más antigua
            listaConsolidada.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

            setDocumentos(listaConsolidada);

        } catch (error) {
            console.error("Error al cargar historial del empleado:", error);
        } finally {
            setCargando(false);
        }
    };

    // Filtrado por texto, estado y tipo
    const documentosFiltrados = documentos.filter(doc => {
        // 1. Filtro por Estado (Activo vs Cerrado)
        if (filtroEstado === 'Activo' && doc.esCerrado) return false;
        if (filtroEstado === 'Cerrado' && !doc.esCerrado) return false;

        // 2. Filtro por Tipo de Documento
        if (filtroTipo === 'Orden' && doc.tipo !== 'Orden de Trabajo') return false;
        if (filtroTipo === 'Presupuesto' && doc.tipo !== 'Presupuesto') return false;
        if (filtroTipo === 'Factura' && doc.tipo !== 'Factura') return false;

        // 3. Buscador por Texto
        const termino = busqueda.toLowerCase().trim();
        if (!termino) return true;

        const matchTipo = doc.tipo.toLowerCase().includes(termino);
        const matchRef = doc.referencia.toLowerCase().includes(termino);
        const matchCliente = doc.clienteNombre.toLowerCase().includes(termino);
        const matchVehiculo = doc.vehiculoInfo.toLowerCase().includes(termino);
        const matchEstado = doc.estado.toLowerCase().includes(termino);
        const matchFecha = doc.fechaStr.includes(termino);

        return matchTipo || matchRef || matchCliente || matchVehiculo || matchEstado || matchFecha;
    });

    const totalRegistros = documentos.length;
    const totalActivos = documentos.filter(d => !d.esCerrado).length;
    const totalCerrados = documentos.filter(d => d.esCerrado).length;
    const montoAcumulado = documentos.reduce((sum, d) => sum + d.montoTotal, 0);

    const getEstadoBadge = (doc: DocumentoHistorial) => {
        if (doc.tipo === 'Factura') {
            return <Badge bg="dark">Comprobante Emitido</Badge>;
        }
        if (doc.tipo === 'Presupuesto') {
            if (doc.estado === 'Aprobado') return <Badge bg="success">Aprobado</Badge>;
            if (doc.estado === 'Rechazado') return <Badge bg="danger">Rechazado</Badge>;
            return <Badge bg="warning" text="dark">Cotizado</Badge>;
        }
        // Orden de Trabajo
        switch (doc.estado) {
            case 'Ingresado':
            case 'Pendiente': return <Badge bg="warning" text="dark">Ingresado</Badge>;
            case 'En Reparación':
            case 'En Taller': return <Badge bg="primary">En Reparación</Badge>;
            case 'Listo para Entregar':
            case 'Terminado': return <Badge bg="success">Listo p/ Entregar</Badge>;
            case 'Entregado': return <Badge bg="secondary">Entregado</Badge>;
            default: return <Badge bg="secondary">{doc.estado}</Badge>;
        }
    };

    const getTipoBadge = (tipo: DocumentoHistorial['tipo']) => {
        switch (tipo) {
            case 'Orden de Trabajo': return <Badge bg="primary">Orden de Trabajo</Badge>;
            case 'Presupuesto': return <Badge bg="info" text="dark">Presupuesto</Badge>;
            case 'Factura': return <Badge bg="dark">Factura</Badge>;
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="fw-bold">
                    Historial de Trabajo: {empleado?.nombre} <small className="text-muted">({empleado?.rol})</small>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">

                {/* Resumen de Métrica del Empleado */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="shadow-sm border-primary text-center">
                            <Card.Body className="py-2">
                                <small className="text-muted text-uppercase fw-bold">Total Trabajos</small>
                                <h4 className="fw-bold text-primary my-1">{totalRegistros}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="shadow-sm border-warning text-center">
                            <Card.Body className="py-2">
                                <small className="text-muted text-uppercase fw-bold">En Curso (Activos)</small>
                                <h4 className="fw-bold text-warning my-1">{totalActivos}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="shadow-sm border-secondary text-center">
                            <Card.Body className="py-2">
                                <small className="text-muted text-uppercase fw-bold">Finalizados (Cerrados)</small>
                                <h4 className="fw-bold text-secondary my-1">{totalCerrados}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="shadow-sm border-success text-center">
                            <Card.Body className="py-2">
                                <small className="text-muted text-uppercase fw-bold">Total Monetario</small>
                                <h4 className="fw-bold text-success my-1">${montoAcumulado.toLocaleString()}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filtros y Buscador */}
                <Row className="mb-3 align-items-center">
                    <Col md={5}>
                        <InputGroup>
                            <InputGroup.Text>Buscar</InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Referencia, cliente, vehículo o estado..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </InputGroup>
                    </Col>

                    <Col md={7} className="d-flex justify-content-end gap-2">
                        <Form.Select
                            style={{ width: '180px' }}
                            value={filtroEstado}
                            onChange={(e: any) => setFiltroEstado(e.target.value)}
                        >
                            <option value="Todos">Estado: Todos</option>
                            <option value="Activo">Solo En Curso / Activos</option>
                            <option value="Cerrado">Solo Cerrados / Finalizados</option>
                        </Form.Select>

                        <Form.Select
                            style={{ width: '180px' }}
                            value={filtroTipo}
                            onChange={(e: any) => setFiltroTipo(e.target.value)}
                        >
                            <option value="Todos">Tipo: Todos</option>
                            <option value="Orden">Solo Órdenes de Trabajo</option>
                            <option value="Presupuesto">Solo Presupuestos</option>
                            <option value="Factura">Solo Facturas</option>
                        </Form.Select>
                    </Col>
                </Row>

                {/* Tabla de Documentos Históricos */}
                {cargando ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <Spinner animation="border" variant="primary" className="me-2" />
                        <span>Cargando historial de trabajo...</span>
                    </div>
                ) : (
                    <Table striped hover responsive className="align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Tipo</th>
                                <th>Referencia</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Estado</th>
                                <th className="text-end">Monto Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documentosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-muted">
                                        No se encontraron registros de trabajo para los criterios seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                documentosFiltrados.map((doc) => (
                                    <tr key={doc.idKey}>
                                        <td>{getTipoBadge(doc.tipo)}</td>
                                        <td className="fw-bold">{doc.referencia}</td>
                                        <td>{doc.fechaStr}</td>
                                        <td className="fw-semibold">{doc.clienteNombre}</td>
                                        <td>{doc.vehiculoInfo}</td>
                                        <td>{getEstadoBadge(doc)}</td>
                                        <td className="text-end fw-bold text-success">
                                            ${doc.montoTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
}
