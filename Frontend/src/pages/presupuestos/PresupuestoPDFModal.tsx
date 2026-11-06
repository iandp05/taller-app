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

const VEHICULO_FALLBACK: Vehiculo = {
    id: '0',
    patente: 'S/P',
    marca: 'Vehículo',
    modelo: 'General',
    anio: 2024,
    cliente_id: '0'
};

const CLIENTE_FALLBACK: Cliente = {
    id: '0',
    nombre: 'Cliente General',
    telefono: 'Sin Teléfono',
    email: '',
    cuit: '',
    domicilio: 'Sin domicilio'
};

export default function PresupuestoPDFModal({ show, handleClose, presupuestoId }: PresupuestoPDFModalProps) {
    const [presupuestoCompleto, setPresupuestoCompleto] = useState<Presupuesto | null>(null);
    const [vehiculo, setVehiculo] = useState<Vehiculo>(VEHICULO_FALLBACK);
    const [cliente, setCliente] = useState<Cliente>(CLIENTE_FALLBACK);
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

                const vehiculoEncontrado = vehiculosData.find(v => String(v.id) === String(presData.vehiculo_id)) || VEHICULO_FALLBACK;
                setVehiculo(vehiculoEncontrado);

                const idDueño = presData.cliente_id ? presData.cliente_id : vehiculoEncontrado.cliente_id;
                const clienteEncontrado = clientesData.find(c => String(c.id) === String(idDueño)) || CLIENTE_FALLBACK;
                setCliente(clienteEncontrado);

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
            setVehiculo(VEHICULO_FALLBACK);
            setCliente(CLIENTE_FALLBACK);
        }
    }, [show, presupuestoId]);

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title>Cotización PDF</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" style={{ height: '70vh' }}>
                {!cargandoPDF && presupuestoCompleto ? (
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
                        <p className="text-muted">Generando documento en formato PDF...</p>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                {!cargandoPDF && presupuestoCompleto && (() => {
                    const clienteNombre = (cliente?.nombre || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
                    const numCorto = presupuestoCompleto.id.toString().length > 10 ? presupuestoCompleto.id.toString().slice(0, 6).toUpperCase() : presupuestoCompleto.id;
                    const nombreArchivo = `Presupuesto_${numCorto}_${clienteNombre}.pdf`;

                    return (
                        <PDFDownloadLink
                            document={<PresupuestoTemplate presupuesto={presupuestoCompleto} vehiculo={vehiculo} cliente={cliente} empresaConfig={configTaller} />}
                            fileName={nombreArchivo}
                            className="btn btn-primary fw-semibold px-4"
                        >
                            {({ loading }) => (loading ? 'Preparando...' : 'Descargar PDF')}
                        </PDFDownloadLink>
                    );
                })()}
            </Modal.Footer>
        </Modal>
    );
}
