// Frontend/src/components/FacturaTemplate.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Factura, Vehiculo, Cliente, ConfiguracionTaller } from '../types';
import { formatEmpresaConfig } from '../config/empresaConfig';

// Formateador robusto: Convierte a número seguro y evita crasheos
const formatCurrency = (monto: any) => {
    const num = Number(monto);
    if (isNaN(num)) return "0,00";
    return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const styles = StyleSheet.create({
    page: { padding: 25, fontFamily: 'Helvetica', fontSize: 8, color: '#000' },
    
    // Contenedor principal que envuelve TODO como en AFIP
    mainBox: { borderWidth: 1, borderColor: '#000', width: '100%', minHeight: '100%', position: 'relative' },
    
    // --- TOP HEADER ---
    topRow: { borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 3, alignItems: 'center', backgroundColor: '#f4f4f4' },
    topRowText: { fontFamily: 'Helvetica-Bold', fontSize: 10, letterSpacing: 1 },

    // --- ENCABEZADO (Taller, Letra, Comprobante) ---
    headerContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    headerLeft: { width: '45%', padding: 10 },
    headerCenter: { width: '10%', alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#000' },
    headerRight: { width: '45%', padding: 10 },

    companyTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
    textNormal: { fontSize: 7, marginBottom: 3 },
    textBold: { fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
    
    // Caja Letra Central
    letterBox: { width: '100%', height: 40, borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'center', justifyContent: 'center' },
    letter: { fontSize: 26, fontFamily: 'Helvetica-Bold' },
    letterCode: { fontSize: 6, fontFamily: 'Helvetica-Bold', marginTop: 4 },

    // Datos Factura Derecha
    invoiceTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
    invoiceDataRow: { flexDirection: 'row', marginBottom: 3 },

    // --- PERÍODO FACTURADO ---
    periodBox: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', padding: 5, backgroundColor: '#f4f4f4', justifyContent: 'space-between' },

    // --- DATOS DEL CLIENTE ---
    clientBox: { borderBottomWidth: 1, borderBottomColor: '#000', padding: 8 },
    clientGrid: { flexDirection: 'row', marginBottom: 4 },
    colClientLeft: { width: '45%' },
    colClientRight: { width: '55%' },

    // --- TABLA DE ÍTEMS ---
    tableContainer: { flexGrow: 1 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f4f4f4', borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 },
    tableRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 2 },
    
    // Anchos de columnas AFIP
    col1: { width: '7%', textAlign: 'center', fontSize: 6 }, // Código
    col2: { width: '33%', fontSize: 7, paddingLeft: 4 },       // Producto / Servicio
    col3: { width: '8%', textAlign: 'right', fontSize: 7 },   // Cantidad
    col4: { width: '8%', textAlign: 'center', fontSize: 6 },  // U. medida
    col5: { width: '11%', textAlign: 'right', fontSize: 7 },  // Precio Unit
    col6: { width: '6%', textAlign: 'right', fontSize: 6 },   // % Bonif
    col7: { width: '10%', textAlign: 'right', fontSize: 7 },  // Subtotal
    col8: { width: '7%', textAlign: 'center', fontSize: 6 },  // Alicuota
    col9: { width: '10%', textAlign: 'right', fontSize: 7, paddingRight: 4 }, // Subtotal c/IVA

    // --- TOTALES ---
    totalsBox: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000', padding: 10, minHeight: 120 },
    totalsLeft: { width: '50%' },
    totalsRight: { width: '50%', alignItems: 'flex-end' },
    totalLineRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: 3 },
    totalLineLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginRight: 15 },
    totalLineValue: { fontSize: 7, width: 60, textAlign: 'right' },
    totalFinalRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 5 },
    totalFinalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, marginRight: 15 },
    totalFinalValue: { fontFamily: 'Helvetica-Bold', fontSize: 9, width: 60, textAlign: 'right' },

    // --- FOOTER AFIP ---
    footerBox: { borderTopWidth: 1, borderTopColor: '#000', padding: 10, flexDirection: 'row', alignItems: 'center' },
    footerLeft: { width: '35%', flexDirection: 'row', alignItems: 'center' },
    qrPlaceholder: { width: 50, height: 50, backgroundColor: '#e2e8f0', marginRight: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#94a3b8' },
    afipText: { fontFamily: 'Helvetica-Bold', fontSize: 16, letterSpacing: -1 },
    afipSub: { fontSize: 6, fontFamily: 'Helvetica-Bold', marginTop: 2 },
    afipLegales: { fontSize: 5, marginTop: 2 },
    
    footerCenter: { width: '30%', alignItems: 'center' },
    pageText: { fontFamily: 'Helvetica-Bold', fontSize: 8 },

    footerRight: { width: '35%', alignItems: 'flex-end' },
    caeLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 2 },
    caeValue: { fontSize: 8, fontFamily: 'Helvetica' }
});

interface FacturaTemplateProps {
    factura: Factura;
    vehiculo: Vehiculo;
    cliente: Cliente;
    empresaConfig?: ConfiguracionTaller | null;
}

export default function FacturaTemplate({ factura, vehiculo, cliente, empresaConfig }: FacturaTemplateProps) {
    const config = formatEmpresaConfig(empresaConfig);
    // 1. VALIDACIÓN MAESTRA: Evita pantalla en blanco si no llegan los datos a tiempo
    if (!factura) {
        return (
            <Document>
                <Page size="A4" style={{ padding: 30 }}>
                    <Text>Cargando información del comprobante...</Text>
                </Page>
            </Document>
        );
    }

    // 2. TIPO DE COMPROBANTE SEGURO
    const tipo = factura.tipo_comprobante || 'Remito';
    const isFacturaA = tipo === 'Factura A';
    const isFacturaB = tipo === 'Factura B';
    const isRemito = tipo === 'Remito';

    const tipoLetra = isFacturaA ? 'A' : isFacturaB ? 'B' : 'X';
    const codAfip = isFacturaA ? 'COD. 01' : isFacturaB ? 'COD. 06' : '00';

    // 3. PARSEO SEGURO DE FECHA
    let fechaFormat = '---';
    if (factura.fecha_emision) {
        const fechaStr = String(factura.fecha_emision);
        const fechaUTC = fechaStr.endsWith('Z') ? fechaStr : fechaStr + 'Z';
        fechaFormat = new Date(fechaUTC).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // 4. PARSEO SEGURO DE NÚMEROS DE COMPROBANTE
    const ptVenta = String(factura.punto_venta || '1').padStart(5, '0');
    const nroComp = String(factura.numero_comprobante || '1').padStart(8, '0');
    const compNum = `${ptVenta}    Comp. Nro: ${nroComp}`;

    // 5. CÁLCULOS MATEMÁTICOS SEGUROS
    const detallesSeguros = Array.isArray(factura.detalles) ? factura.detalles : [];
    const totalMonto = Number(factura.total) || 0;
    const netoGravado = isFacturaA ? (Number(factura.neto_gravado) || (totalMonto / 1.21)) : totalMonto;
    const iva21 = isFacturaA ? (Number(factura.iva_21) || (totalMonto - netoGravado)) : 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.mainBox}>
                    
                    {/* ORIGINAL TAG */}
                    <View style={styles.topRow}>
                        <Text style={styles.topRowText}>ORIGINAL</Text>
                    </View>

                    {/* ENCABEZADO TALLER Y FACTURA */}
                    <View style={styles.headerContainer}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.companyTitle}>{config.nombreComercial.toUpperCase()}</Text>
                            <Text style={styles.textBold}>Razón Social: {config.razonSocial}</Text>
                            <Text style={styles.textNormal}>Domicilio Comercial: {config.domicilioCompleto}</Text>
                            <Text style={[styles.textBold, { marginTop: 4 }]}>Condición frente al IVA: {config.condicionIva}</Text>
                        </View>

                        <View style={styles.headerCenter}>
                            <View style={styles.letterBox}>
                                <Text style={styles.letter}>{tipoLetra}</Text>
                            </View>
                            {!isRemito && <Text style={styles.letterCode}>COD. {codAfip}</Text>}
                        </View>

                        <View style={styles.headerRight}>
                            <Text style={styles.invoiceTitle}>{isRemito ? 'REMITO' : 'FACTURA'}</Text>
                            <View style={styles.invoiceDataRow}>
                                <Text style={styles.textBold}>Punto de Venta: </Text>
                                <Text style={styles.textNormal}>{compNum}</Text>
                            </View>
                            <View style={styles.invoiceDataRow}>
                                <Text style={styles.textBold}>Fecha de Emisión: </Text>
                                <Text style={styles.textNormal}>{fechaFormat}</Text>
                            </View>
                            <View style={[styles.invoiceDataRow, { marginTop: 6 }]}>
                                <Text style={styles.textBold}>CUIT: </Text>
                                <Text style={styles.textNormal}>{config.cuit}</Text>
                            </View>
                            <View style={styles.invoiceDataRow}>
                                <Text style={styles.textBold}>Ingresos Brutos: </Text>
                                <Text style={styles.textNormal}>{config.ingresosBrutos}</Text>
                            </View>
                            <View style={styles.invoiceDataRow}>
                                <Text style={styles.textBold}>Fecha de Inicio de Actividades: </Text>
                                <Text style={styles.textNormal}>{config.inicioActividades}</Text>
                            </View>
                        </View>
                    </View>

                    {/* PERÍODO FACTURADO */}
                    <View style={styles.periodBox}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.textBold}>Período Facturado Desde: </Text>
                            <Text style={styles.textNormal}>{fechaFormat}</Text>
                            <Text style={[styles.textBold, { marginLeft: 15 }]}>Hasta: </Text>
                            <Text style={styles.textNormal}>{fechaFormat}</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.textBold}>Fecha de Vto. para el pago: </Text>
                            <Text style={styles.textNormal}>{factura.cae_vencimiento || fechaFormat}</Text>
                        </View>
                    </View>

                    {/* DATOS DEL CLIENTE */}
                    <View style={styles.clientBox}>
                        <View style={styles.clientGrid}>
                            <View style={styles.colClientLeft}>
                                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                                    <Text style={styles.textBold}>CUIT: </Text>
                                    <Text style={styles.textNormal}>{cliente?.cuit || '00-00000000-0'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                                    <Text style={styles.textBold}>Condición frente al IVA: </Text>
                                    <Text style={styles.textNormal}>{cliente?.condicion_iva || 'Consumidor Final'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.textBold}>Condición de venta: </Text>
                                    <Text style={styles.textNormal}>{factura.condicion_venta || '---'}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.colClientRight}>
                                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                                    <Text style={styles.textBold}>Apellido y Nombre / Razón Social: </Text>
                                    <Text style={styles.textNormal}>{cliente?.nombre || 'Consumidor Final'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                                    <Text style={styles.textBold}>Domicilio Comercial: </Text>
                                    <Text style={styles.textNormal}>{cliente?.domicilio || '---'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.textBold}>Vehículo: </Text>
                                    <Text style={styles.textNormal}>{vehiculo?.marca || '---'} {vehiculo?.modelo || ''} {vehiculo?.patente ? `(${vehiculo.patente})` : ''}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* TABLA DE ÍTEMS */}
                    <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>Código</Text>
                            <Text style={styles.col2}>Producto / Servicio</Text>
                            <Text style={styles.col3}>Cantidad</Text>
                            <Text style={styles.col4}>U. medida</Text>
                            <Text style={styles.col5}>Precio Unit.</Text>
                            <Text style={styles.col6}>% Bonif</Text>
                            <Text style={styles.col7}>Subtotal</Text>
                            <Text style={styles.col8}>Alícuota IVA</Text>
                            <Text style={styles.col9}>Subtotal c/IVA</Text>
                        </View>

                        {detallesSeguros.map((detalle, idx) => {
                            // Cálculos matemáticos seguros
                            const cantidadNum = Number(detalle.cantidad) || 0;
                            const precioOrig = Number(detalle.precio_unitario) || 0;
                            
                            const precioUnitarioItem = isFacturaA ? (precioOrig / 1.21) : precioOrig;
                            const subtotalItem = precioUnitarioItem * cantidadNum;
                            const subtotalConIva = isFacturaA ? (subtotalItem * 1.21) : subtotalItem;

                            return (
                                <View style={styles.tableRow} key={idx}>
                                    <Text style={styles.col1}>-</Text>
                                    <Text style={styles.col2}>{detalle.descripcion || '---'}</Text>
                                    <Text style={styles.col3}>{cantidadNum.toFixed(2)}</Text>
                                    <Text style={styles.col4}>unidades</Text>
                                    <Text style={styles.col5}>{formatCurrency(precioUnitarioItem)}</Text>
                                    <Text style={styles.col6}>0,00</Text>
                                    <Text style={styles.col7}>{formatCurrency(subtotalItem)}</Text>
                                    <Text style={styles.col8}>{isFacturaA ? '21%' : '0%'}</Text>
                                    <Text style={styles.col9}>{formatCurrency(subtotalConIva)}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* TOTALES */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalsLeft}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.totalLineLabel}>Importe Otros Tributos: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                        </View>
                        
                        <View style={styles.totalsRight}>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>Importe Neto Gravado: $</Text>
                                <Text style={styles.totalLineValue}>{formatCurrency(netoGravado)}</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>IVA 27%: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>IVA 21%: $</Text>
                                <Text style={styles.totalLineValue}>{formatCurrency(iva21)}</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>IVA 10.5%: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>IVA 5%: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>IVA 2.5%: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>IVA 0%: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                            <View style={styles.totalLineRow}>
                                <Text style={styles.totalLineLabel}>Importe Otros Tributos: $</Text>
                                <Text style={styles.totalLineValue}>0,00</Text>
                            </View>
                            <View style={styles.totalFinalRow}>
                                <Text style={styles.totalFinalLabel}>Importe Total: $</Text>
                                <Text style={styles.totalFinalValue}>{formatCurrency(totalMonto)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* FOOTER AFIP - ZONA PARA FUTURA API */}
                    <View style={styles.footerBox}>
                        <View style={styles.footerLeft}>
                            {/* Espacio reservado para inyectar el QR real de la API de AFIP en el futuro */}
                            <View style={styles.qrPlaceholder}>
                                <Text style={{ fontSize: 5, textAlign: 'center', color: '#64748b' }}>ESPACIO{'\n'}QR AFIP</Text>
                            </View>
                            <View>
                                <Text style={styles.afipText}>AFIP</Text>
                                <Text style={styles.afipSub}>Comprobante Autorizado</Text>
                                <Text style={styles.afipLegales}>Esta Administración Federal no se responsabiliza por los datos{'\n'}ingresados en el detalle de la operación</Text>
                            </View>
                        </View>

                        <View style={styles.footerCenter}>
                            <Text style={styles.pageText}>Pág. 1/1</Text>
                        </View>

                        <View style={styles.footerRight}>
                            {!isRemito ? (
                                <>
                                    <Text style={styles.caeLabel}>CAE N°: <Text style={styles.caeValue}>{factura.cae || '---------------------'}</Text></Text>
                                    <Text style={styles.caeLabel}>Fecha de Vto. de CAE: <Text style={styles.caeValue}>{factura.cae_vencimiento || '--/--/----'}</Text></Text>
                                </>
                            ) : (
                                <Text style={styles.caeLabel}>DOCUMENTO INTERNO NO VÁLIDO COMO FACTURA</Text>
                            )}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}