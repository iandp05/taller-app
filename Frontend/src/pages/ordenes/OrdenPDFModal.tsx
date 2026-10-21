// Frontend/src/pages/ordenes/OrdenPDFModal.tsx
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
                const ordenData = await getOrdenById(ordenId as any);
                setOrdenCompleta(ordenData);

                const [vehiculosData, clientesData, configData] = await Promise.all([
                    getVehiculos(),
                    getClientes(),
                    getConfiguracion()
                ]);

                if (configData) setConfigTaller(formatEmpresaConfig(configData));

                let v = (Array.isArray(vehiculosData) ? vehiculosData : []).find((veh: any) => String(veh.id) === String(ordenData.vehiculo_id));
                setVehiculo(v || null);

                let c = (Array.isArray(clientesData) ? clientesData : []).find((cli: any) => String(cli.id) === String(ordenData.cliente_id));
                if (!c && v && v.cliente_id) {
                    c = (Array.isArray(clientesData) ? clientesData : []).find((cli: any) => String(cli.id) === String(v.cliente_id));
                }
                setCliente(c || null);

            } catch (error) {
                console.error("Error al generar el PDF de la Orden:", error);
            } finally {
                setCargandoPDF(false);
            }
        };

        if (show) {
            cargarDatosOrden();
        }
    }, [show, ordenId]);

    const handleImprimirPagina = () => {
        window.print();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered bodyClassName="p-0">
            <Modal.Header closeButton>
                <Modal.Title>Comprobante de Orden de Trabajo #{ordenCompleta?.id ? String(ordenCompleta.id).slice(0, 8) : ''}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ height: '75vh' }}>
                {cargandoPDF || !ordenCompleta || !vehiculo || !cliente ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <p>Generando vista previa del documento...</p>
                    </div>
                ) : (
                    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                        <OrdenReparacionTemplate
                            planilla={ordenCompleta}
                            vehiculo={vehiculo}
                            cliente={cliente}
                            empresaConfig={configTaller}
                        />
                    </PDFViewer>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cerrar
                </Button>
                <Button variant="info" onClick={handleImprimirPagina} disabled={cargandoPDF || !ordenCompleta}>
                    Imprimir Documento
                </Button>
                {ordenCompleta && vehiculo && cliente && (
                    <PDFDownloadLink
                        document={
                            <OrdenReparacionTemplate
                                planilla={ordenCompleta}
                                vehiculo={vehiculo}
                                cliente={cliente}
                                empresaConfig={configTaller}
                            />
                        }
                        fileName={`Orden_${ordenCompleta.id}.pdf`}
                    >
                        {({ loading }) => (
                            <Button variant="primary" disabled={loading}>
                                {loading ? 'Preparando...' : 'Descargar Archivo PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                )}
            </Modal.Footer>
        </Modal>
    );
}
