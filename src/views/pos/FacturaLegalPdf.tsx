import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { VentaRealizada } from '../../models';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 8,
    backgroundColor: '#ffffff'
  },
  headerBox: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
    marginBottom: 10,
    position: 'relative'
  },
  letterBox: {
    position: 'absolute',
    left: '50%',
    marginLeft: -25,
    top: -5,
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  letterText: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  codeText: {
    fontSize: 8,
    marginTop: 2
  },
  emisorBox: {
    width: '45%',
    paddingRight: 10
  },
  comprobanteBox: {
    width: '45%',
    paddingLeft: 10,
    marginLeft: 'auto'
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  textLine: {
    marginBottom: 3
  },
  boldText: {
    fontWeight: 'bold'
  },
  receptorBox: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
    marginBottom: 10
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 8,
    minHeight: 18,
    alignItems: 'center',
  },
  colCode: { width: '23%', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colDesc: { width: '32%', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colQty: { width: '10%', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
  colPrice: { width: '17%', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
  colTotal: { width: '18%', paddingHorizontal: 6, paddingVertical: 4, textAlign: 'right' },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerBox: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#000',
    padding: 8
  },
  copyText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 10
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 5,
    objectFit: 'contain'
  },
  cutLineVertical: {
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'dashed',
    marginHorizontal: 10,
    position: 'relative'
  },
  scissorIconVertical: {
    position: 'absolute',
    top: '50%',
    right: -6,
    marginTop: -10,
    fontSize: 12,
    backgroundColor: '#fff',
    paddingVertical: 5
  }
});

interface Props {
  venta: VentaRealizada;
  modoMediaHoja?: boolean;
}

const FacturaContenido = ({ venta, copia, compacto }: { venta: VentaRealizada, copia: string, compacto: boolean }) => (
  <View style={compacto ? { padding: 15, width: '50%', flex: 1 } : { padding: 30, flex: 1 }}>
    {/* Cabecera Principal */}
    <View style={styles.headerBox}>
      {/* Cuadro Central con Letra */}
      <View style={styles.letterBox}>
        <Text style={styles.letterText}>B</Text>
        <Text style={styles.codeText}>CÓD. 06</Text>
      </View>

      {/* Datos Emisor (Izquierda) */}
      <View style={styles.emisorBox}>
        <Image src="https://via.placeholder.com/240x80.png?text=TOKO+ERP" style={styles.logo} />
        <Text style={styles.title}>TOKO ERP S.A.</Text>
        <Text style={styles.textLine}>Razón Social: TOKO ERP S.A.</Text>
        <Text style={styles.textLine}>Domicilio: Av. Falsa 123, CABA</Text>
        <Text style={styles.textLine}>Teléfono: 011-4567-8901</Text>
        <Text style={[styles.textLine, styles.boldText]}>IVA RESPONSABLE INSCRIPTO</Text>
      </View>

      {/* Datos Comprobante (Derecha) */}
      <View style={styles.comprobanteBox}>
        <Text style={styles.title}>FACTURA</Text>
        <Text style={styles.textLine}>N° 0001-{venta.numeroTicket.split('-')[1] || '0000123'}</Text>
        <Text style={styles.textLine}>Fecha: {new Date(venta.fechaHora).toLocaleDateString('es-AR')}</Text>
        <Text style={styles.textLine}>CUIT: 30-12345678-9</Text>
        <Text style={styles.textLine}>Ingresos Brutos: 1234567-01</Text>
        <Text style={styles.textLine}>Inicio Actividades: 01/01/2026</Text>
      </View>
    </View>

    {/* Datos del Cliente */}
    <View style={styles.receptorBox}>
      <Text style={styles.textLine}><Text style={styles.boldText}>CUIT/DNI:</Text> {venta.cliente.nombre === 'Consumidor Final' ? '00000000' : (venta.cliente.documento || '20-12345678-9')}</Text>
      <Text style={styles.textLine}><Text style={styles.boldText}>Razón Social/Nombre:</Text> {venta.cliente.nombre}</Text>
      <Text style={styles.textLine}><Text style={styles.boldText}>Condición IVA:</Text> Consumidor Final</Text>
      <Text style={styles.textLine}><Text style={styles.boldText}>Domicilio:</Text> -</Text>
      <Text style={styles.textLine}><Text style={styles.boldText}>Condición Venta:</Text> {venta.metodoPago}</Text>
    </View>

    {/* Tabla de Artículos */}
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.colCode}>CÓDIGO</Text>
        <Text style={styles.colDesc}>DESCRIPCIÓN</Text>
        <Text style={styles.colQty}>CANT</Text>
        <Text style={styles.colPrice}>PRECIO UNIT.</Text>
        <Text style={styles.colTotal}>IMPORTE</Text>
      </View>
      {venta.items.map((item, index) => (
        <View style={styles.tableRow} key={index}>
          <Text style={styles.colCode}>{item.producto.codigoBarras}</Text>
          <Text style={styles.colDesc}>{item.producto.nombre}</Text>
          <Text style={styles.colQty}>{item.cantidad}</Text>
          <Text style={styles.colPrice}>${item.precioUnitario.toFixed(2)}</Text>
          <Text style={styles.colTotal}>${item.subtotal.toFixed(2)}</Text>
        </View>
      ))}
    </View>

    {/* Pie de Factura / Desglose Fiscal */}
    <View style={styles.footer}>
      <View style={styles.footerBox}>
        <Text style={styles.textLine}><Text style={styles.boldText}>CAE:</Text> PENDIENTE DE AUTORIZACIÓN</Text>
        <Text style={styles.textLine}><Text style={styles.boldText}>VTO. CAE:</Text> PENDIENTE</Text>
        <Text style={[styles.textLine, { marginTop: 10, fontSize: 8 }]}>COMPROBANTE GENERADO EN MODO OFFLINE</Text>
      </View>
      <View style={styles.footerBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text style={{ flex: 1, paddingRight: 5 }}>IMPORTE NETO GRAVADO:</Text>
          <Text style={{ textAlign: 'right' }}>${(venta.total / 1.21).toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text style={{ flex: 1, paddingRight: 5 }}>IVA 21%:</Text>
          <Text style={{ textAlign: 'right' }}>${(venta.total - (venta.total / 1.21)).toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }}>
          <Text style={[styles.boldText, { flex: 1, paddingRight: 5 }]}>IMPORTE TOTAL:</Text>
          <Text style={[styles.boldText, { textAlign: 'right' }]}>${venta.total.toFixed(2)}</Text>
        </View>
      </View>
    </View>

    <Text style={styles.copyText}>{copia}</Text>
  </View>
);

export const FacturaLegalPdf: React.FC<Props> = ({ venta, modoMediaHoja = false }) => {
  if (modoMediaHoja) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={[styles.page, { padding: 0, flexDirection: 'row' }]}>
          <FacturaContenido venta={venta} copia="ORIGINAL" compacto={true} />
          <View style={styles.cutLineVertical}>
            <Text style={styles.scissorIconVertical}>✂️</Text>
          </View>
          <FacturaContenido venta={venta} copia="DUPLICADO" compacto={true} />
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <FacturaContenido venta={venta} copia="ORIGINAL" compacto={false} />
      </Page>
      <Page size="A4" style={styles.page}>
        <FacturaContenido venta={venta} copia="DUPLICADO" compacto={false} />
      </Page>
    </Document>
  );
};
