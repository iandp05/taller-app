// Frontend/src/pages/inventario/inventarioModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Producto, ProductoCreate } from '../../types';
import { createProducto, updateProducto } from '../../api/inventarioApi';

interface InventarioModalProps {
    show: boolean;
    handleClose: () => void;
    onProductoSaved: () => void;
    productoEditando: Producto | null;
}

interface ProductoFormInputs {
    nombre: string;
    codigo?: string;
    categoria: string;
    precio: number | string;
    cantidad: number | string;
    stock_critico: number | string;
}

export default function InventarioModal({ show, handleClose, onProductoSaved, productoEditando }: InventarioModalProps) {
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ProductoFormInputs>({
        defaultValues: {
            nombre: '',
            codigo: '',
            categoria: 'Repuestos',
            precio: '',
            cantidad: '',
            stock_critico: 5
        }
    });

    useEffect(() => {
        if (show) {
            setErrorMsg(null);
        }
    }, [show]);

    useEffect(() => {
        if (productoEditando) {
            reset({
                nombre: productoEditando.nombre || '',
                codigo: productoEditando.codigo || '',
                categoria: productoEditando.categoria || 'Repuestos',
                precio: productoEditando.precio ?? '',
                cantidad: productoEditando.cantidad ?? '',
                stock_critico: productoEditando.stock_critico ?? 5
            });
        } else {
            reset({
                nombre: '',
                codigo: '',
                categoria: 'Repuestos',
                precio: '',
                cantidad: '',
                stock_critico: 5
            });
        }
    }, [productoEditando, show, reset]);

    const onSubmit = async (data: ProductoFormInputs) => {
        setCargando(true);
        setErrorMsg(null);

        const productoData: ProductoCreate = {
            nombre: data.nombre.trim(),
            codigo: data.codigo?.trim() || undefined,
            categoria: data.categoria,
            precio: Number(data.precio),
            cantidad: Number(data.cantidad),
            stock_critico: Number(data.stock_critico)
        };

        try {
            if (productoEditando) {
                await updateProducto(productoEditando.id, productoData);
            } else {
                await createProducto(productoData);
            }
            onProductoSaved();
            handleClose();
        } catch (error: any) {
            console.error("Error al guardar el producto:", error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                setErrorMsg(detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(" | "));
            } else if (typeof detail === 'string') {
                setErrorMsg(detail);
            } else {
                setErrorMsg("Hubo un error al guardar el producto.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorMsg && (
                    <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
                        {errorMsg}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)} id="inventarioForm" noValidate>
                    <Row className="mb-3">
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Nombre del Repuesto/Insumo *</Form.Label>
                                <Form.Control
                                    type="text"
                                    isInvalid={!!errors.nombre}
                                    {...register('nombre', {
                                        required: "El nombre del repuesto o insumo es obligatorio.",
                                        minLength: { value: 2, message: "Debe tener al menos 2 caracteres." }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.nombre?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Código (SKU)</Form.Label>
                                <Form.Control
                                    type="text"
                                    {...register('codigo')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Categoría *</Form.Label>
                                <Form.Select {...register('categoria')}>
                                    <option value="Repuestos">Repuestos</option>
                                    <option value="Fluidos">Fluidos (Aceites/Líquidos)</option>
                                    <option value="Filtros">Filtros</option>
                                    <option value="Herramientas">Herramientas</option>
                                    <option value="Otros">Otros</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Precio ($) *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    isInvalid={!!errors.precio}
                                    {...register('precio', {
                                        required: "El precio unitario es obligatorio.",
                                        validate: value => (!isNaN(Number(value)) && Number(value) >= 0) || "El precio no puede ser negativo."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.precio?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Stock Actual *</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    isInvalid={!!errors.cantidad}
                                    {...register('cantidad', {
                                        required: "El stock actual es obligatorio.",
                                        validate: value => (!isNaN(Number(value)) && Number(value) >= 0) || "El stock no puede ser negativo."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.cantidad?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Stock Crítico *</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    isInvalid={!!errors.stock_critico}
                                    {...register('stock_critico', {
                                        required: "El stock crítico es obligatorio.",
                                        validate: value => (!isNaN(Number(value)) && Number(value) >= 0) || "El stock crítico no puede ser negativo."
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.stock_critico?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose} disabled={cargando}>Cancelar</Button>
                <Button variant="primary" type="submit" form="inventarioForm" disabled={cargando}>
                    {cargando ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
