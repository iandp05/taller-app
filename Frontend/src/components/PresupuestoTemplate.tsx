// Frontend/src/components/PresupuestoTemplate.tsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Presupuesto, Vehiculo, Cliente, ConfiguracionTaller } from '../types';
import { formatEmpresaConfig } from '../config/empresaConfig';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    mainContainer: {
        borderWidth: 1,
        borderColor: '#000',
        minHeight: '100%',
    },
    // --- Cabecera ---
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    logoSection: {
        width: '40%',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderColor: '#000',
    },
    logo: { width: 80, marginBottom: 5 },
    companyName: { fontSize: 10, fontWeight: 'bold' },
    companyInfo: { fontSize: 8, textAlign: 'center' },
    
    titleSection: {
        width: '60%',
        padding: 10,
        alignItems: 'center',
    },
    titleBox: {
        borderWidth: 1,
        borderColor: '#000',
        width: '80%',
        alignItems: 'center',
        padding: 5,
        borderRadius: 5,
        marginBottom: 10,
    },
    orderTitle: { fontSize: 14, fontWeight: 'bold' },
    orderNumber: { fontSize: 10, marginTop: 3 },
    
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dateBox: {
        borderWidth: 1,
        borderColor: '#000',
        width: 30,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
    },

    // --- Filas Cliente y Vehículo ---
    infoRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#e6e6e6',
    },
    infoCellLeft: {
        width: '60%',
        padding: 6,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    infoCellRight: {
        width: '40%',
        padding: 6,
    },
    infoText: { fontSize: 10, fontWeight: 'bold' },
    infoValue: { fontWeight: 'normal' },

    // --- Tabla de Detalles ---
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
    },
    thDesc: { width: '55%', padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 9, fontWeight: 'bold' },
    thCant: { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
    thPrecio: { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
    thSub: { width: '15%', padding: 5, fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
    
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomStyle: 'dotted',
        borderColor: '#999',
    },
    tdDesc: { width: '55%', padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 9 },
    tdCant: { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 9, textAlign: 'center' },
    tdPrecio: { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 9, textAlign: 'right' },
    tdSub: { width: '15%', padding: 5, fontSize: 9, textAlign: 'right' },

    itemsContainer: {
        minHeight: 350,
    },

    // --- Pie del Presupuesto ---
    footerSection: {
        borderTopWidth: 1,
        borderColor: '#000',
        padding: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#e6e6e6',
    },
    footerLine: {
        fontSize: 10,
        marginBottom: 8,
    },
    totalContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10,
    },
    totalBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#000',
        paddingHorizontal: 15,
        paddingVertical: 5,
        fontSize: 12,
        fontWeight: 'bold',
    }
});

interface Props {
    presupuesto: Presupuesto;
    vehiculo: Vehiculo;
    cliente: Cliente;
    empresaConfig?: ConfiguracionTaller | null;
}

export default function PresupuestoTemplate({ presupuesto, vehiculo, cliente, empresaConfig }: Props) {
    const config = formatEmpresaConfig(empresaConfig);
    const fecha = new Date(presupuesto.fecha_creacion);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString().slice(-2); 

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.mainContainer}>
                    
                    <View style={styles.headerRow} fixed>
                        <View style={styles.logoSection}>
                            <Image src={config.logo} style={styles.logo} />
                            <Text style={styles.companyName}>{(config.nombreComercial || '').toUpperCase()}</Text>
                            <Text style={styles.companyInfo}>Cel: {config.telefono} - {(config.domicilio || '').toUpperCase()}</Text>
                            <Text style={styles.companyInfo}>{config.condicionIvaPresupuesto}</Text>
                        </View>
                        <View style={styles.titleSection}>
                            <View style={styles.titleBox}>
                                <Text style={styles.orderTitle}>PRESUPUESTO</Text>
                                <Text style={styles.orderNumber}>Nº {presupuesto.id.toString().padStart(8, '0')}</Text>
                            </View>
                            <View style={styles.dateContainer}>
                                <Text style={{ fontSize: 10, marginRight: 5, fontWeight: 'bold' }}>FECHA</Text>
                                <View style={styles.dateBox}><Text>{dia}</Text></View>
                                <View style={styles.dateBox}><Text>{mes}</Text></View>
                                <View style={styles.dateBox}><Text>{anio}</Text></View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoRow} fixed>
                        <View style={styles.infoCellLeft}>
                            <Text style={styles.infoText}>SEÑOR: <Text style={styles.infoValue}>{cliente.nombre}</Text></Text>
                        </View>
                        <View style={styles.infoCellRight}>
                            <Text style={styles.infoText}>TEL: <Text style={styles.infoValue}>{cliente.telefono}</Text></Text>
                        </View>
                    </View>

                    <View style={styles.infoRow} fixed>
                        <View style={styles.infoCellLeft}>
                            <Text style={styles.infoText}>VEHÍCULO: <Text style={styles.infoValue}>{vehiculo.marca} {vehiculo.modelo}</Text></Text>
                        </View>
                        <View style={styles.infoCellRight}>
                            <Text style={styles.infoText}>PATENTE N°: <Text style={styles.infoValue}>{vehiculo.patente}</Text></Text>
                        </View>
                    </View>

                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={styles.thDesc}>Detalle</Text>
                        <Text style={styles.thCant}>Cantidad</Text>
                        <Text style={styles.thPrecio}>Precio Unit.</Text>
                        <Text style={styles.thSub}>Subtotal</Text>
                    </View>

                    <View style={styles.itemsContainer}>
                        {presupuesto.detalles.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.tdDesc}>{item.descripcion}</Text>
                                <Text style={styles.tdCant}>{item.cantidad}</Text>
                                <Text style={styles.tdPrecio}>${item.precio_unitario.toLocaleString()}</Text>
                                <Text style={styles.tdSub}>${(item.cantidad * item.precio_unitario).toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.footerSection} fixed>
                        <Text style={styles.footerLine}>Validez del Presupuesto: <Text style={{ fontWeight: 'bold' }}>{presupuesto.validez_dias}</Text></Text>
                        <Text style={styles.footerLine}>Condiciones de Pago: <Text style={{ fontWeight: 'bold' }}>{presupuesto.condiciones_pago}</Text></Text>
                        
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalText}>TOTAL $</Text>
                            <View style={styles.totalBox}>
                                <Text>{presupuesto.total.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}