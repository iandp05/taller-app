import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'; 
import PresupuestoTemplate from '../../components/PresupuestoTemplate';
import { getPresupuestoById } from '../../api/presupuestosApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi'; 
import { getConfiguracion } from '../../api/configuracionApi';
import { Presupuesto, Vehiculo, Cliente, ConfiguracionTaller } from '../../types';

interface PresupuestoPDFModalProps {
    show: boolean;
    handleClose: () => void;
    presupuestoId: string | number | null;
}

export default function PresupuestoPDFModal({ show, handleClose, presupuestoId }: PresupuestoPDFModalProps) {
    const [presupuestoCompleto, setPresupuestoCompleto] = useState<Presupuesto | null>(null);
    const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [configTaller, setConfigTaller] = useState<ConfiguracionTaller | null>(null);
    const [cargandoPDF, setCargandoPDF] = useState(true);

    useEffect(() => {
        const cargarDatosDocumento = async () => {
            if (!presupuestoId) return;
            setCargandoPDF(true); 

            try {
                const [presData, vehiculosData, clientesData, configData] = await Promise.all([
                    getPresupuestoById(presupuestoId),
                    getVehiculos(),
                    getClientes(),
                    getConfiguracion().catch(() => null)
                ]);

                setConfigTaller(configData);

                const vehiculoEncontrado = vehiculosData.find(v => v.id === presData.vehiculo_id) || null;
                setVehiculo(vehiculoEncontrado);

                if (vehiculoEncontrado) {
                    const idDueño = presData.cliente_id ? presData.cliente_id : vehiculoEncontrado.cliente_id;
                    const clienteEncontrado = clientesData.find(c => c.id === idDueño) || null;
                    setCliente(clienteEncontrado);
                }

                setPresupuestoCompleto(presData);
            } catch (error) {
                console.error("Error cargando datos del documento", error);
            } finally {
                setCargandoPDF(false);
            }
        };

        if (show) {
            cargarDatosDocumento();
        } else {
            setPresupuestoCompleto(null);
            setVehiculo(null);
            setCliente(null);
        }
    }, [show, presupuestoId]);

    // Función para formatear el ID con 8 ceros
    const numeroPresupuestoStr = presupuestoId ? presupuestoId.toString().padStart(8, '0') : '';

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title>Cotización PDF</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" style={{ height: '70vh' }}>
                {!cargandoPDF && presupuestoCompleto && cliente && vehiculo ? (
                    <PDFViewer width="100%" height="100%">
                        <PresupuestoTemplate 
                            presupuesto={presupuestoCompleto} 
                            vehiculo={vehiculo} 
                            cliente={cliente} 
                            empresaConfig={configTaller}
                        />
                    </PDFViewer>
                ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 flex-column">
                        <div className="spinner-border text-primary mb-3" role="status"></div>
                        <p className="text-muted">Recolectando datos y generando documento...</p>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                {!cargandoPDF && presupuestoCompleto && vehiculo && cliente && (
                    <PDFDownloadLink
                        document={<PresupuestoTemplate presupuesto={presupuestoCompleto} vehiculo={vehiculo} cliente={cliente} empresaConfig={configTaller} />}
                        fileName={`Presupuesto_${numeroPresupuestoStr}.pdf`}
                        className="btn btn-primary"
                    >
                        {({ loading }) => (loading ? 'Preparando...' : 'Descargar PDF')}
                    </PDFDownloadLink>
                )}
            </Modal.Footer>
        </Modal>
    );
}