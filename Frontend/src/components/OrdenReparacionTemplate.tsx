// Frontend/src/components/OrdenReparacionTemplate.tsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Planilla, Vehiculo, Cliente, ConfiguracionTaller } from '../types';
import { formatEmpresaConfig } from '../config/empresaConfig';

// Estilos del documento PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        paddingBottom: 200, // Aumentamos un poquito para darle espacio a las observaciones
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    mainContainer: {
        borderWidth: 1,
        borderColor: '#000',
    },
    // --- Cabecera ---
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    logoSection: {
        width: '30%',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderColor: '#000',
    },
    logo: {
        width: 80,
    },
    companySection: {
        width: '35%',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderColor: '#000',
    },
    titleSection: {
        width: '35%',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    companySubtitle: {
        fontSize: 8,
        color: '#444',
    },
    orderTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dateBox: {
        borderWidth: 1,
        borderColor: '#000',
        width: 25,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
    },
    
    // --- Títulos de sección ---
    sectionTitleRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
    },
    sectionTitleText: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 3,
    },
    
    // --- Datos de Cliente, Vehículo y Combustible ---
    dataRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    clientSection: {
        width: '50%',
        padding: 5,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    vehicleSection: {
        width: '30%',
        padding: 5,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    fuelSection: {
        width: '20%',
        padding: 5,
        alignItems: 'center',
    },
    dataText: {
        fontSize: 9,
        marginBottom: 4,
    },
    bold: {
        fontWeight: 'bold',
    },
    fuelBoxContainer: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 5,
    },
    fuelBox: {
        borderWidth: 1,
        borderColor: '#000',
        width: 15,
        height: 15,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
    },

    // --- Checklist de Accesorios ---
    checklistRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        padding: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 9,
    },

    // --- Descripción ---
    descriptionSection: {
        padding: 10,
        minHeight: 400, // Ajustado sutilmente para balancear visualmente
    },
    descriptionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 10,
        lineHeight: 1.5,
    },
    renglon: {
        borderBottomWidth: 1,
        borderBottomStyle: 'dotted',
        borderColor: '#999',
        marginTop: 22, 
    },

    // --- PIE DE PÁGINA (OBSERVACIONES, FIRMAS Y LEGALES) ---
    footerWrapper: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
    },
    observacionesContainer: {
        paddingHorizontal: 20,
        marginBottom: 30, // Espacio antes de la firma
    },
    observacionesLinea: {
        borderBottomWidth: 1,
        borderBottomStyle: 'dotted',
        borderColor: '#999',
        marginTop: 18,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderColor: '#000',
        width: 200,
        marginBottom: 5,
    },
    signatureText: {
        fontSize: 9,
    },
    legalesTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    legalesText: {
        fontSize: 7,
        color: '#555',
        textAlign: 'justify',
        lineHeight: 1.3,
    }
});

const CheckBox = ({ checked, label }: { checked: boolean, label: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Text>{label}: </Text>
        <Text>SI {checked ? '(X)' : '( )'}</Text>
        <Text> - NO {!checked ? '(X)' : '( )'}</Text>
    </View>
);

interface Props {
    planilla: Planilla;
    vehiculo: Vehiculo;
    cliente: Cliente;
    empresaConfig?: ConfiguracionTaller | null;
}

export default function OrdenReparacionTemplate({ planilla, vehiculo, cliente, empresaConfig }: Props) {
    const config = formatEmpresaConfig(empresaConfig);
    const fecha = new Date(planilla.fecha_ingreso);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString().slice(-2); 
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.mainContainer}>
                    
                    {/* CABECERA */}
                    <View style={styles.headerRow} fixed>
                        <View style={styles.logoSection}>
                            <Image src={config.logo} style={styles.logo} />
                        </View>
                        <View style={styles.companySection}>
                            <Text style={styles.companyName}>{(config.nombreComercial || '').toUpperCase()}</Text>
                            <Text style={styles.companySubtitle}>{config.subtitulo}</Text>
                            <Text style={styles.companySubtitle}>Cel: {config.telefono}</Text>
                            <Text style={styles.companySubtitle}>{config.domicilio}</Text>
                        </View>
                        <View style={styles.titleSection}>
                            <Text style={styles.orderTitle}>ORDEN DE INGRESO</Text>
                            <View style={styles.dateContainer}>
                                <Text style={{ fontSize: 9, marginRight: 4 }}>FECHA</Text>
                                <View style={styles.dateBox}><Text>{dia}</Text></View>
                                <View style={styles.dateBox}><Text>{mes}</Text></View>
                                <View style={styles.dateBox}><Text>{anio}</Text></View>
                            </View>
                            <Text style={{ fontSize: 9, marginTop: 10 }}>Orden Nº: {planilla.id.toString().padStart(5, '0')}</Text>
                        </View>
                    </View>

                    {/* TÍTULOS DE DATOS */}
                    <View style={styles.sectionTitleRow} fixed>
                        <View style={[styles.clientSection, { padding: 2, borderRightWidth: 1 }]}><Text style={styles.sectionTitleText}>Datos del Cliente</Text></View>
                        <View style={[styles.vehicleSection, { padding: 2, borderRightWidth: 1 }]}><Text style={styles.sectionTitleText}>Datos del Vehículo</Text></View>
                        <View style={[styles.fuelSection, { padding: 2 }]}><Text style={styles.sectionTitleText}>Combustible</Text></View>
                    </View>

                    {/* DATOS */}
                    <View style={styles.dataRow} fixed>
                        <View style={styles.clientSection}>
                            <Text style={styles.dataText}><Text style={styles.bold}>Nombre / Razón Social: </Text>{cliente.nombre}</Text>
                            <Text style={styles.dataText}><Text style={styles.bold}>Teléfono: </Text>{cliente.telefono}</Text>
                        </View>
                        
                        <View style={styles.vehicleSection}>
                            <Text style={styles.dataText}><Text style={styles.bold}>Modelo: </Text>{vehiculo.marca} {vehiculo.modelo}</Text>
                            <Text style={styles.dataText}><Text style={styles.bold}>Dominio: </Text>{vehiculo.patente}</Text>
                            <Text style={styles.dataText}><Text style={styles.bold}>Kilómetros: </Text>{planilla.kilometros ? `${planilla.kilometros} km` : '---'}</Text>
                        </View>
                        
                        <View style={styles.fuelSection}>
                            <Text style={{ fontSize: 8, marginBottom: 2 }}>Vacío  1/4  1/2  3/4  Lleno</Text>
                            <View style={styles.fuelBoxContainer}>
                                <View style={styles.fuelBox}><Text>{planilla.nivel_combustible === 'Vacío' ? 'X' : ''}</Text></View>
                                <View style={styles.fuelBox}><Text>{planilla.nivel_combustible === '1/4' ? 'X' : ''}</Text></View>
                                <View style={styles.fuelBox}><Text>{planilla.nivel_combustible === '1/2' ? 'X' : ''}</Text></View>
                                <View style={styles.fuelBox}><Text>{planilla.nivel_combustible === '3/4' ? 'X' : ''}</Text></View>
                                <View style={styles.fuelBox}><Text>{planilla.nivel_combustible === 'Lleno' ? 'X' : ''}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* CHECKLIST */}
                    <View style={styles.checklistRow} fixed>
                        <View style={styles.checkItem}>
                            <CheckBox label="Frente de Stereo" checked={Boolean(planilla.frente_stereo) && String(planilla.frente_stereo).toLowerCase() !== 'no'} />
                        </View>
                        <View style={styles.checkItem}>
                            <CheckBox label="Rueda de auxilio" checked={Boolean(planilla.rueda_auxilio) && String(planilla.rueda_auxilio).toLowerCase() !== 'no'} />
                        </View>
                        <View style={styles.checkItem}>
                            <Text>Código de Stereo N°: <Text style={styles.bold}>{planilla.codigo_stereo || '..........'}</Text></Text>
                        </View>
                    </View>

                    {/* DESCRIPCIÓN CON RENGLONES DINÁMICOS */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionTitle}>DESCRIPCIÓN</Text>
                        
                        <Text style={styles.descriptionText}>{planilla.descripcion_falla}</Text>
                    </View>

                </View>

                {/* PIE DE PÁGINA ABSOLUTO (Observaciones + Firmas + Legales) */}
                <View style={styles.footerWrapper} fixed>
                    
                    {/* Espacio para observaciones a mano */}
                    <View style={styles.observacionesContainer}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Observaciones:</Text>
                        <View style={styles.observacionesLinea}></View>
                        <View style={styles.observacionesLinea}></View>
                    </View>

                    {/* Firmas */}
                    <View style={styles.signatureRow}>
                        <View>
                            <View style={styles.signatureLine}></View>
                            <Text style={styles.signatureText}>Firma y Aclaración del Cliente</Text>
                        </View>
                        <View>
                            <Text style={styles.signatureText}>Fecha: _____/_____/_________</Text>
                        </View>
                    </View>
                </View>

            </Page>
        </Document>
    );
}