// Frontend/src/components/Sidebar.tsx
import { useContext, useEffect, useState } from 'react';
import { Nav, Button, Badge, Offcanvas } from 'react-bootstrap';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
    FaBars,
    FaChevronDown,
    FaChevronRight,
    FaChevronLeft,
    FaTachometerAlt,
    FaClipboardList,
    FaCalculator,
    FaReceipt,
    FaBoxes,
    FaUsers,
    FaCar,
    FaUserTie,
    FaCogs,
    FaSignOutAlt
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { EMPRESA_CONFIG, formatEmpresaConfig } from '../config/empresaConfig';
import { getConfiguracion } from '../api/configuracionApi';

interface SidebarProps {
    isCollapsedDesktop?: boolean;
    onToggleDesktopCollapse?: () => void;
}

export default function Sidebar({ isCollapsedDesktop = false, onToggleDesktopCollapse }: SidebarProps) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [config, setConfig] = useState(EMPRESA_CONFIG);
    const [showMobile, setShowMobile] = useState(false);

    // Estados para las 3 secciones colapsables (Acordeón)
    const [openOperativa, setOpenOperativa] = useState(true);
    const [openAdmin, setOpenAdmin] = useState(true);
    const [openAjustes, setOpenAjustes] = useState(true);

    useEffect(() => {
        if (user) {
            getConfiguracion()
                .then(data => setConfig(formatEmpresaConfig(data)))
                .catch(() => setConfig(EMPRESA_CONFIG));
        }
    }, [user]);

    const handleLogout = () => {
        setShowMobile(false);
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        setShowMobile(false);
    };

    const renderMenuBody = (isCollapsed: boolean) => (
        <div
            className="d-flex flex-column h-100 bg-dark text-white p-2 p-md-3 shadow border-end border-secondary no-scrollbar"
            style={{
                width: isCollapsed ? '75px' : '250px',
                minHeight: '100vh',
                transition: 'width 0.25s ease-in-out',
                overflowX: 'hidden'
            }}
        >
            {/* Cabecera / Marca Limpia */}
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-secondary">
                {!isCollapsed ? (
                    <>
                        <Link to="/" onClick={handleNavClick} className="d-flex align-items-center gap-2 text-decoration-none text-white overflow-hidden">
                            <img
                                src={config.logo}
                                alt={config.altLogo}
                                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                            />
                            <div className="text-truncate">
                                <h6 className="fw-bold mb-0 text-white fs-6">{config.nombreComercial}</h6>
                                <small className="text-secondary small d-block" style={{ fontSize: '0.7rem' }}>PATAGONIA</small>
                            </div>
                        </Link>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={onToggleDesktopCollapse}
                            title="Contraer menú"
                            className="p-1 px-2 border-0 text-secondary ms-auto"
                        >
                            <FaChevronLeft className="fs-6" />
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onToggleDesktopCollapse}
                        title="Expandir menú"
                        className="p-1 px-2 border-0 text-light mx-auto"
                    >
                        <FaBars className="fs-5" />
                    </Button>
                )}
            </div>

            {/* Navegación Principal Dividida en 3 Secciones sin scrollbars feas */}
            <div className="flex-grow-1 overflow-y-auto no-scrollbar pe-1">

                {/* SECCIÓN 1: GESTIÓN OPERATIVA */}
                <div className="mb-3">
                    {!isCollapsed ? (
                        <div
                            className="d-flex align-items-center justify-content-between text-uppercase text-secondary fw-bold mb-2 px-2 cursor-pointer select-none"
                            onClick={() => setOpenOperativa(!openOperativa)}
                            style={{ cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.5px' }}
                        >
                            <span>Gestión Operativa</span>
                            {openOperativa ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                        </div>
                    ) : (
                        <div className="border-bottom border-secondary my-2 opacity-50" />
                    )}

                    {(openOperativa || isCollapsed) && (
                        <Nav className="flex-column gap-1">
                            <Nav.Link as={NavLink} to="/" end onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Panel General">
                                <FaTachometerAlt className="fs-5 flex-shrink-0 text-info" />
                                {!isCollapsed && <span className="text-truncate">Panel General</span>}
                            </Nav.Link>

                            <Nav.Link as={NavLink} to="/ordenes" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Órdenes de Trabajo">
                                <FaClipboardList className="fs-5 flex-shrink-0 text-warning" />
                                {!isCollapsed && <span className="text-truncate">Órdenes de Trabajo</span>}
                            </Nav.Link>

                            <Nav.Link as={NavLink} to="/presupuestos" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Presupuestos">
                                <FaCalculator className="fs-5 flex-shrink-0 text-success" />
                                {!isCollapsed && <span className="text-truncate">Presupuestos</span>}
                            </Nav.Link>

                            <Nav.Link as={NavLink} to="/facturas" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Facturación">
                                <FaReceipt className="fs-5 flex-shrink-0 text-primary" />
                                {!isCollapsed && <span className="text-truncate">Facturación</span>}
                            </Nav.Link>
                        </Nav>
                    )}
                </div>

                {/* SECCIÓN 2: ADMINISTRACIÓN */}
                <div className="mb-3">
                    {!isCollapsed ? (
                        <div
                            className="d-flex align-items-center justify-content-between text-uppercase text-secondary fw-bold mb-2 px-2 cursor-pointer select-none"
                            onClick={() => setOpenAdmin(!openAdmin)}
                            style={{ cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.5px' }}
                        >
                            <span>Administración</span>
                            {openAdmin ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                        </div>
                    ) : (
                        <div className="border-bottom border-secondary my-2 opacity-50" />
                    )}

                    {(openAdmin || isCollapsed) && (
                        <Nav className="flex-column gap-1">
                            <Nav.Link as={NavLink} to="/inventario" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Inventario">
                                <FaBoxes className="fs-5 flex-shrink-0 text-warning" />
                                {!isCollapsed && <span className="text-truncate">Inventario</span>}
                            </Nav.Link>

                            <Nav.Link as={NavLink} to="/empleados" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Personal">
                                <FaUsers className="fs-5 flex-shrink-0 text-info" />
                                {!isCollapsed && <span className="text-truncate">Personal</span>}
                            </Nav.Link>

                            <Nav.Link as={NavLink} to="/vehiculos" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Vehículos">
                                <FaCar className="fs-5 flex-shrink-0 text-danger" />
                                {!isCollapsed && <span className="text-truncate">Vehículos</span>}
                            </Nav.Link>

                            <Nav.Link as={NavLink} to="/clientes" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Clientes">
                                <FaUserTie className="fs-5 flex-shrink-0 text-success" />
                                {!isCollapsed && <span className="text-truncate">Clientes</span>}
                            </Nav.Link>
                        </Nav>
                    )}
                </div>

                {/* SECCIÓN 3: AJUSTES */}
                <div className="mb-3">
                    {!isCollapsed ? (
                        <div
                            className="d-flex align-items-center justify-content-between text-uppercase text-secondary fw-bold mb-2 px-2 cursor-pointer select-none"
                            onClick={() => setOpenAjustes(!openAjustes)}
                            style={{ cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.5px' }}
                        >
                            <span>Ajustes</span>
                            {openAjustes ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                        </div>
                    ) : (
                        <div className="border-bottom border-secondary my-2 opacity-50" />
                    )}

                    {(openAjustes || isCollapsed) && (
                        <Nav className="flex-column gap-1">
                            <Nav.Link as={NavLink} to="/configuracion" onClick={handleNavClick} className="sidebar-link rounded px-3 py-2 text-light d-flex align-items-center gap-3" title="Ajustes">
                                <FaCogs className="fs-5 flex-shrink-0 text-secondary" />
                                {!isCollapsed && <span className="text-truncate">Ajustes</span>}
                            </Nav.Link>
                        </Nav>
                    )}
                </div>

            </div>

            {/* Pie de Usuario y Estado */}
            {user && (
                <div className="pt-3 border-top border-secondary mt-auto">
                    {!isCollapsed ? (
                        <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="text-white small fw-bold text-truncate" style={{ maxWidth: '140px' }}>
                                    {user.nombre}
                                </span>
                                {isOnline ? (
                                    <Badge bg="success" className="px-2 py-1 font-monospace" style={{ fontSize: '0.65rem' }}>En Línea</Badge>
                                ) : (
                                    <Badge bg="warning" text="dark" className="px-2 py-1 font-monospace" style={{ fontSize: '0.65rem' }}>Local</Badge>
                                )}
                            </div>
                            <Button variant="outline-danger" size="sm" onClick={handleLogout} className="w-100 fw-semibold d-flex align-items-center justify-content-center gap-2">
                                <FaSignOutAlt />
                                <span>Cerrar Sesión</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Button variant="outline-danger" size="sm" onClick={handleLogout} title="Cerrar Sesión" className="p-2">
                                <FaSignOutAlt />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Header móvil para pantallas pequeñas (< 768px) */}
            <div className="d-md-none bg-dark text-white p-2 d-flex align-items-center justify-content-between border-bottom shadow-sm">
                <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none text-white">
                    <img src={config.logo} alt={config.altLogo} style={{ height: '32px', width: 'auto' }} />
                    <span className="fw-bold fs-6">{config.nombreComercial}</span>
                </Link>
                <Button variant="outline-light" size="sm" onClick={() => setShowMobile(true)}>
                    <FaBars className="fs-5" />
                </Button>
            </div>

            {/* Drawer Offcanvas Móvil */}
            <Offcanvas show={showMobile} onHide={() => setShowMobile(false)} className="bg-dark text-white" style={{ width: '250px' }}>
                <Offcanvas.Body className="p-0">
                    {renderMenuBody(false)}
                </Offcanvas.Body>
            </Offcanvas>

            {/* Sidebar Fijo de Escritorio con Colapso Adaptativo */}
            <div className="d-none d-md-block flex-shrink-0" style={{ position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}>
                {renderMenuBody(isCollapsedDesktop)}
            </div>
        </>
    );
}
