// Frontend/src/App.tsx
import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importamos el Escudo de Captura de Errores Global
import ErrorBoundary from './components/ErrorBoundary';

// Importamos el Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';

// Importamos la barra de navegación
import Navbar from './components/Navbar';

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

    return (
        <ErrorBoundary>
            {/* Solo mostramos la barra superior si el usuario está logueado */}
            {user && <Navbar />}
            
            {/* Contenedor adaptativo */}
            <div className={user ? "app-main-container px-2 px-sm-3 px-md-4 my-2 my-md-4" : ""}>
                <Routes>
                    {/* RUTA PÚBLICA */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* RUTAS PRIVADAS Y BLINDADAS */}
                    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
                    <Route path="/vehiculos" element={<ProtectedRoute><VehiculosPage /></ProtectedRoute>} />
                    <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
                    <Route path="/ordenes" element={<ProtectedRoute><OrdenesPage /></ProtectedRoute>} />
                    <Route path="/empleados" element={<ProtectedRoute><EmpleadosPage /></ProtectedRoute>} />
                    <Route path="/presupuestos" element={<ProtectedRoute><PresupuestosPage /></ProtectedRoute>} />
                    <Route path="/facturas" element={<ProtectedRoute><FacturasPage /></ProtectedRoute>} />
                    <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
                </Routes>
            </div>
        </ErrorBoundary>
    );
}

// 3. Componente Principal: Envuelve toda la app con el escudo de seguridad
function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
