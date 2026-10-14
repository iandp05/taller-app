import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { api } from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { EMPRESA_CONFIG } from '../../config/empresaConfig';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const response = await api.post('/usuarios/login', { username, password });
            login(response.data); // Guardamos al usuario en el contexto
            navigate('/'); // Lo mandamos al Dashboard
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Usuario o contraseña incorrectos');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow-lg border-0 rounded-3">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h3>{EMPRESA_CONFIG.nombreComercial}</h3>
                                <p className="text-muted">Acceso al Sistema ERP</p>
                            </div>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Usuario</Form.Label>
                                    <Form.Control type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label>Contraseña</Form.Label>
                                    <Form.Control type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                </Form.Group>
                                
                                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={cargando}>
                                    {cargando ? 'Verificando...' : 'Iniciar Sesión'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}