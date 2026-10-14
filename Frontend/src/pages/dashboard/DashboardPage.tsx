// Frontend/src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { getOrdenes } from '../../api/ordenesApi';
import { getProductos } from '../../api/inventarioApi';
import { OrdenTrabajo, Producto } from '../../types';

export default function DashboardPage() {
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);

    useEffect(() => {
        getOrdenes().then(setOrdenes).catch(console.error);
        getProductos().then(setProductos).catch(console.error);
    }, []);

    const ingresados = ordenes.filter(o => o.estado === 'Ingresado').length;
    const enReparacion = ordenes.filter(o => o.estado === 'En Reparación').length;
    const listosParaEntregar = ordenes.filter(o => o.estado === 'Listo para Entregar').length;
    
    const repuestosCriticos = productos.filter(p => p.cantidad <= p.stock_critico);

    return (
        <div>
            <h2 className="mb-4">Panel de Control General</h2>
            
            <Row className="mb-3 mb-md-4 g-3">
                <Col xs={12} sm={4}>
                    <Card className="shadow-sm border-warning h-100">
                        <Card.Body>
                            <h6 className="text-muted text-uppercase mb-2 small fw-bold">Ingresos Recientes</h6>
                            <h2 className="display-6 fw-bold text-warning mb-0">{ingresados}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={4}>
                    <Card className="shadow-sm border-primary h-100">
                        <Card.Body>
                            <h6 className="text-muted text-uppercase mb-2 small fw-bold">En Reparación</h6>
                            <h2 className="display-6 fw-bold text-primary mb-0">{enReparacion}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={4}>
                    <Card className="shadow-sm border-success h-100">
                        <Card.Body>
                            <h6 className="text-muted text-uppercase mb-2 small fw-bold">Listos para Entregar</h6>
                            <h2 className="display-6 fw-bold text-success mb-0">{listosParaEntregar}</h2>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-danger text-white fw-bold">
                            Alertas de Reposición de Inventario
                        </Card.Header>
                        <Card.Body className="p-0">
                            {repuestosCriticos.length === 0 ? (
                                <div className="p-4 text-center text-muted">
                                    Todos los repuestos cuentan con stock suficiente.
                                </div>
                            ) : (
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Repuesto / Pieza</th>
                                            <th>Categoría</th>
                                            <th>Stock Actual</th>
                                            <th>Mínimo Requerido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repuestosCriticos.map(p => (
                                            <tr key={p.id}>
                                                <td className="fw-bold">{p.nombre}</td>
                                                <td>{p.categoria}</td>
                                                <td>
                                                    <Badge bg="danger" className="fs-6 px-3">{p.cantidad}</Badge>
                                                </td>
                                                <td className="text-muted">{p.stock_critico}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}