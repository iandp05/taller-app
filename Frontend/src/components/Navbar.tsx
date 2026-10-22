// Frontend/src/components/AppNavbar.tsx
import { useContext, useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

// 1. Importamos la configuración y API
import { EMPRESA_CONFIG, formatEmpresaConfig } from '../config/empresaConfig';
import { getConfiguracion } from '../api/configuracionApi';

export default function AppNavbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [config, setConfig] = useState(EMPRESA_CONFIG);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (user) {
            getConfiguracion()
                .then(data => setConfig(formatEmpresaConfig(data)))
                .catch(() => setConfig(EMPRESA_CONFIG));
        }
    }, [user]);

    const handleLogout = () => {
        setExpanded(false);
        logout();
        navigate('/login');
    };

    const handleNavLinkClick = () => {
        setExpanded(false);
    };

    return (
        <Navbar bg="light" variant="light" expand="lg" expanded={expanded} onToggle={setExpanded} className="mb-3 mb-md-4 shadow-sm py-1 border-bottom">
            <Container fluid className="px-3 px-md-4">
                <Navbar.Brand as={Link} to="/" onClick={handleNavLinkClick} className="d-flex align-items-center gap-2 gap-sm-3">
                    <img 
                        src={config.logo}
                        alt={config.altLogo}
                        style={{ 
                            height: '50px',
                            width: 'auto',
                            marginTop: '-5px',
                            marginBottom: '-5px',
                            objectFit: 'contain' 
                        }} 
                    />
                    <span className="fw-bold fs-5 text-dark text-truncate" style={{ maxWidth: '200px' }}>{config.nombreComercial}</span>
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto my-2 my-lg-0">
                        <Nav.Link as={NavLink} to="/" className="px-3" end onClick={handleNavLinkClick}>
                            Dashboard
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/ordenes" className="px-3" onClick={handleNavLinkClick}>
                            Órdenes de Trabajo
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/clientes" className="px-3" onClick={handleNavLinkClick}>
                            Clientes
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/vehiculos" className="px-3" onClick={handleNavLinkClick}>
                            Vehículos
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/inventario" className="px-3" onClick={handleNavLinkClick}>
                            Inventario
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/empleados" className="px-3" onClick={handleNavLinkClick}>
                            Personal
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/presupuestos" className="px-3 fw-semibold" onClick={handleNavLinkClick}>
                            Presupuestos
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/facturas" className="px-3" onClick={handleNavLinkClick}>
                            Facturación
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/configuracion" className="px-3" onClick={handleNavLinkClick}>
                            Ajustes
                        </Nav.Link>
                    </Nav>

                    {/* Zona del usuario conectado y botón de cerrar sesión */}
                    {user && (
                        <Nav className="ms-auto align-items-center gap-2 gap-md-3 mt-2 mt-lg-0">
                            {isOnline ? (
                                <Badge bg="success" className="px-2 py-1 fw-medium">En Línea</Badge>
                            ) : (
                                <Badge bg="warning" text="dark" className="px-2 py-1 fw-bold">Modo Local / Sin Conexión</Badge>
                            )}
                            <span className="text-secondary small">
                                Conectado: <strong className="text-dark">{user.nombre}</strong> <span className="text-muted">({user.rol})</span>
                            </span>
                            <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                                Cerrar Sesión
                            </Button>
                        </Nav>
                    )}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}