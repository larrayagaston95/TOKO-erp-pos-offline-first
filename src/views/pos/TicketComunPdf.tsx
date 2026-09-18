import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { VentaRealizada } from '../../models';

// Tamaño de hoja térmica 80mm ancho (226 points)
const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dashed',
    paddingBottom: 10,
    marginBottom: 10
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: 5,
    objectFit: 'contain'
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 8,
    textAlign: 'center'
  },
  infoSection: {
    marginBottom: 10
  },
  textLine: {
    marginBottom: 2
  },
  table: {
    width: '100%',
    marginBottom: 10
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dashed',
    paddingBottom: 2,
    marginBottom: 4,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 3
  },
  colQty: { width: '15%' },
  colDesc: { width: '50%' },
  colPrice: { width: '35%', textAlign: 'right' },
  totals: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'dashed',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: 12
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    fontSize: 8,
    fontStyle: 'italic'
  }
});

interface Props {
  venta: VentaRealizada;
}

export const TicketComunPdf: React.FC<Props> = ({ venta }) => {
  return (
    <Document>
      <Page size={[226, 800]} style={styles.page}>
        <View style={styles.header}>
          <Image src="https://via.placeholder.com/200x80.png?text=TOKO+ERP" style={styles.logo} />
          <Text style={styles.title}>TICKET X - USO INTERNO</Text>
          <Text style={styles.subtitle}>DOCUMENTO NO VÁLIDO COMO FACTURA</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.textLine}>FECHA: {new Date(venta.fechaHora).toLocaleString('es-AR')}</Text>
          <Text style={styles.textLine}>TICKET: {venta.numeroTicket}</Text>
          <Text style={styles.textLine}>CAJERO: {venta.vendedor}</Text>
          <Text style={styles.textLine}>CLIENTE: {venta.cliente.nombre}</Text>
          <Text style={styles.textLine}>PAGO: {venta.metodoPago}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colQty}>CANT</Text>
            <Text style={styles.colDesc}>DESCRIPCION</Text>
            <Text style={styles.colPrice}>TOTAL</Text>
          </View>
          {venta.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.colQty}>{item.cantidad}</Text>
              <Text style={styles.colDesc}>{item.producto.nombre.substring(0, 15)}</Text>
              <Text style={styles.colPrice}>${item.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text>TOTAL ARS:</Text>
          <Text>${venta.total.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>¡GRACIAS POR SU COMPRA!</Text>
          <Text>TOKO ERP S.A.</Text>
        </View>
      </Page>
    </Document>
  );
};
