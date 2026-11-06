// Frontend/src/App.tsx
import { useContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importamos el Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';

// Importamos el Sidebar lateral y el modal de actualización
import Sidebar from './components/Sidebar';
import UpdateModal from './components/UpdateModal';

// Importamos todas tus páginas
import LoginPage from './pages/auth/LoginPage';
import ClientesPage from './pages/clientes/clientesPage';
import VehiculosPage from './pages/vehiculos/vehiculosPage';
import InventarioPage from './pages/inventario/inventarioPage';
import OrdenesPage from './pages/ordenes/OrdenesPage';
import EmpleadosPage from './pages/empleados/empleadosPage'; 
import DashboardPage from './pages/dashboard/DashboardPage';
import PresupuestosPage from './pages/presupuestos/PresupuestosPage';
import FacturasPage from './pages/facturas/FacturasPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';
import VersionPage from './pages/version/VersionPage';

// 1. Componente Guardián: Expulsa a los usuarios no identificados
function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user } = useContext(AuthContext);
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

// 2. Componente de Enrutamiento: Controla qué partes de la interfaz se dibujan
function AppContent() {
    const { user } = useContext(AuthContext);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <div className="d-flex flex-column flex-md-row min-vh-100 bg-light">
            {/* Sidebar Lateral Fijo */}
            <Sidebar
                isCollapsedDesktop={isCollapsed}
                onToggleDesktopCollapse={() => setIsCollapsed(!isCollapsed)}
            />
            <UpdateModal />

            {/* Contenedor Principal Adaptativo */}
            <div className="flex-grow-1 p-3 p-md-4 overflow-x-hidden" style={{ minWidth: 0 }}>
                <Routes>
                    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
                    <Route path="/vehiculos" element={<ProtectedRoute><VehiculosPage /></ProtectedRoute>} />
                    <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
                    <Route path="/ordenes" element={<ProtectedRoute><OrdenesPage /></ProtectedRoute>} />
                    <Route path="/empleados" element={<ProtectedRoute><EmpleadosPage /></ProtectedRoute>} />
                    <Route path="/presupuestos" element={<ProtectedRoute><PresupuestosPage /></ProtectedRoute>} />
                    <Route path="/facturas" element={<ProtectedRoute><FacturasPage /></ProtectedRoute>} />
                    <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
                    <Route path="/version" element={<ProtectedRoute><VersionPage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </div>
    );
}

// 3. Componente Principal: Envuelve toda la app con el escudo de seguridad
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;