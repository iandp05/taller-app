// Frontend/src/pages/ordenes/OrdenPdfModal.tsx
import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'; 
import OrdenReparacionTemplate from '../../components/OrdenReparacionTemplate';
import { getOrdenById } from '../../api/ordenesApi';
import { getVehiculos } from '../../api/vehiculosApi';
import { getClientes } from '../../api/clientesApi'; 
import { getConfiguracion } from '../../api/configuracionApi';
import { formatEmpresaConfig } from '../../config/empresaConfig';

interface OrdenPdfModalProps {
    show: boolean;
    handleClose: () => void;
    ordenId: string | number | null;
}

export default function OrdenPdfModal({ show, handleClose, ordenId }: OrdenPdfModalProps) {
    const [ordenCompleta, setOrdenCompleta] = useState<any>(null);
    const [vehiculo, setVehiculo] = useState<any>(null);
    const [cliente, setCliente] = useState<any>(null);
    const [configTaller, setConfigTaller] = useState<any>(null);
    const [cargandoPDF, setCargandoPDF] = useState(true);

    useEffect(() => {
        const cargarDatosOrden = async () => {
            if (!ordenId) return;
            
            setCargandoPDF(true);

            try {
                const [ordenData, vehiculosData, clientesData, configData] = await Promise.all([
                    getOrdenById(ordenId),
                    getVehiculos(),
                    getClientes(),
                    getConfiguracion().catch(() => null)
                ]);

                setConfigTaller(configData);

                const vehiculoEncontrado = vehiculosData.find(v => v.id === ordenData.vehiculo_id);
                setVehiculo(vehiculoEncontrado);

                if (vehiculoEncontrado) {
                    const idDuenoOrden = ordenData.cliente_id ? ordenData.cliente_id : vehiculoEncontrado.cliente_id;
                    const clienteEncontrado = clientesData.find(c => c.id === idDuenoOrden);
                    setCliente(clienteEncontrado);
                }

                setOrdenCompleta(ordenData);
                setCargandoPDF(false);

            } catch (error) {
                console.error("Error cargando datos del documento", error);
                setCargandoPDF(false);
            }
        };

        if (show) {
            cargarDatosOrden();
        } else {
            setOrdenCompleta(null);
            setVehiculo(null);
            setCliente(null);
        }
    }, [show, ordenId]);

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title>Orden de Reparación PDF</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" style={{ height: '70vh' }}>
                {!cargandoPDF && ordenCompleta && cliente && vehiculo ? (
                    <PDFViewer width="100%" height="100%">
                        <OrdenReparacionTemplate 
                            planilla={ordenCompleta} 
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
                {!cargandoPDF && ordenCompleta && (
                    <PDFDownloadLink
                        document={<OrdenReparacionTemplate planilla={ordenCompleta} vehiculo={vehiculo} cliente={cliente} empresaConfig={configTaller} />}
                        fileName={`${formatEmpresaConfig(configTaller).pdfFileNamePrefix}_Orden_${ordenId}.pdf`}
                        className="btn btn-primary"
                    >
                        {({ loading }) => (loading ? 'Preparando...' : 'Descargar PDF')}
                    </PDFDownloadLink>
                )}
            </Modal.Footer>
        </Modal>
    );
}