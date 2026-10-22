// Frontend/src/components/AppNavbar.tsx
import { useContext, useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/axios';

// Importamos la configuración y API
import { EMPRESA_CONFIG, formatEmpresaConfig } from '../config/empresaConfig';
import { getConfiguracion } from '../api/configuracionApi';

export default function AppNavbar() {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [config, setConfig] = useState(EMPRESA_CONFIG);
    const [expanded, setExpanded] = useState(false);
    const [syncPendientes, setSyncPendientes] = useState<number>(0);

    useEffect(() => {
        if (user) {
            getConfiguracion()
                .then(data => setConfig(formatEmpresaConfig(data)))
                .catch(() => setConfig(EMPRESA_CONFIG));
        }
    }, [user]);

    useEffect(() => {
        const checkSyncStatus = async () => {
            try {
                const res = await api.get('/sync/estado');
                if (typeof res.data?.pendientes === 'number') {
                    setSyncPendientes(res.data.pendientes);
                }
            } catch {
                // Ignore network errors
            }
        };

        if (user) {
            checkSyncStatus();
            const timer = setInterval(checkSyncStatus, 5000);
            return () => clearInterval(timer);
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
        <Navbar expand="lg" expanded={expanded} onToggle={setExpanded} className="mb-3 mb-md-4 shadow-sm py-1 border-bottom bg-body-tertiary">
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
                    <span className="fw-bold fs-5 text-truncate" style={{ maxWidth: '200px' }}>{config.nombreComercial}</span>
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

                    {/* Zona del usuario conectado, botones de tema y sincronización */}
                    {user && (
                        <Nav className="ms-auto align-items-center gap-2 gap-md-3 mt-2 mt-lg-0">
                            {/* Toggle Tema Claro / Oscuro */}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={toggleTheme}
                                className="d-flex align-items-center gap-1 border-0"
                                title="Cambiar tema claro/oscuro"
                            >
                                {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
                            </Button>

                            {/* Badge de Sincronización Outbox */}
                            {!isOnline ? (
                                <Badge bg="danger" className="px-2 py-1 fw-bold">🔴 Sin Conexión</Badge>
                            ) : syncPendientes > 0 ? (
                                <Badge bg="warning" text="dark" className="px-2 py-1 fw-bold">🟡 Sincronizando ({syncPendientes})</Badge>
                            ) : (
                                <Badge bg="success" className="px-2 py-1 fw-medium">🟢 Sincronizado</Badge>
                            )}

                            <span className="small">
                                Conectado: <strong>{user.nombre}</strong> <span className="text-muted">({user.rol})</span>
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
