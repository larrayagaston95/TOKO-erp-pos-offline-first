/**
 * ============================================================================
 * COMPONENTE PDF: ARQUEO DE CAJA (ArqueoPdf.tsx)
 * ============================================================================
 * Genera el PDF de cierre de turno (Arqueo X o Arqueo Z) usando @react-pdf/renderer.
 * Soporta impresión en papel térmico 80mm (ticket) y A4.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import { TurnoCaja } from '../../models';

// Paleta de colores
const COLORES = {
  oscuro: '#0f172a',
  teal: '#0d9488',
  tealClaro: '#ccfbf1',
  gris: '#64748b',
  grisClaro: '#f1f5f9',
  borde: '#e2e8f0',
  rojo: '#dc2626',
  verde: '#16a34a',
  blanco: '#ffffff',
};

// ─── Estilos A4 ──────────────────────────────────────────────────────────────
const estilosA4 = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORES.oscuro,
    backgroundColor: COLORES.blanco,
    padding: '30pt 40pt',
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `2pt solid ${COLORES.teal}`,
  },
  titulo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.oscuro,
  },
  subtitulo: {
    fontSize: 9,
    color: COLORES.gris,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORES.teal,
    color: COLORES.blanco,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    letterSpacing: 1,
  },
  seccion: {
    marginBottom: 14,
  },
  seccionTitulo: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    borderBottom: `0.5pt solid ${COLORES.borde}`,
    paddingBottom: 3,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  filaImpar: {
    backgroundColor: COLORES.grisClaro,
    borderRadius: 2,
  },
  etiqueta: {
    color: COLORES.gris,
    fontSize: 8.5,
  },
  valor: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: COLORES.oscuro,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORES.oscuro,
    color: COLORES.blanco,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  totalEtiqueta: {
    color: COLORES.tealClaro,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValor: {
    color: COLORES.blanco,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  diferenciaNegativa: { color: COLORES.rojo, fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  diferenciaPositiva: { color: COLORES.verde, fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  pie: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTop: `0.5pt solid ${COLORES.borde}`,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pieTexto: {
    fontSize: 7,
    color: COLORES.gris,
  },
});

// ─── Estilos Ticket 80mm ──────────────────────────────────────────────────────
const estilosTicket = StyleSheet.create({
  pagina: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#000',
    backgroundColor: '#fff',
    padding: '8pt 6pt',
    width: '226.77pt', // 80mm
  },
  titulo: {
    fontSize: 10,
    fontFamily: 'Courier-Bold',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 7,
    textAlign: 'center',
    color: '#555',
    marginBottom: 4,
  },
  separador: {
    borderBottom: '1pt dashed #ccc',
    marginVertical: 4,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  etiqueta: { fontSize: 7.5, color: '#333' },
  valor: { fontSize: 7.5, fontFamily: 'Courier-Bold' },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 3,
    borderTop: '1pt solid #000',
  },
  totalEtq: { fontSize: 8.5, fontFamily: 'Courier-Bold' },
  totalVal: { fontSize: 10, fontFamily: 'Courier-Bold' },
  pie: { fontSize: 7, textAlign: 'center', color: '#555', marginTop: 8 },
});

// ─── Utilidades de formato ────────────────────────────────────────────────────

/**
 * Formatea un número como moneda ARS.
 */
const formatearMoneda = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Formatea una fecha ISO a formato legible en Argentina.
 */
const formatearFecha = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('es-AR') : '—';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ResumenArqueo {
  ventasEfectivo: number;
  ventasDebito: number;
  ventasCredito: number;
  ventasQr: number;
  ventasCuentaCorriente: number;
  retiros: number;
  cobrosCC: number;
  totalVentas: number;
  cantidadTickets: number;
}

interface ArqueoPdfProps {
  turno: TurnoCaja;
  resumen: ResumenArqueo;
  /** 'ticket' = 80mm | 'a4' = carta completa */
  formato: 'ticket' | 'a4';
}

// ─── COMPONENTE A4 ────────────────────────────────────────────────────────────

/**
 * Renderiza el PDF de arqueo en formato A4.
 */
const ArqueoA4: React.FC<ArqueoPdfProps> = ({ turno, resumen }) => {
  const tipoCierre = turno.tipoCierre === 'FINAL' ? 'ARQUEO Z — CIERRE FINAL DEL DÍA' : 'ARQUEO X — CIERRE PARCIAL DE TURNO';
  const diferencia = (turno.montoFinalReal ?? 0) - (turno.montoFinalEsperado ?? resumen.ventasEfectivo + turno.montoInicial - resumen.retiros);

  return (
    <Page size="A4" style={estilosA4.pagina}>
      {/* Encabezado */}
      <View style={estilosA4.encabezado}>
        <View>
          <Text style={estilosA4.titulo}>TOKO ERP</Text>
          <Text style={estilosA4.subtitulo}>Sistema Offline-First para Distribuidoras</Text>
          <Text style={{ ...estilosA4.subtitulo, marginTop: 4 }}>
            Cajero: {turno.cajero}  •  Apertura: {formatearFecha(turno.fechaApertura)}
          </Text>
          {turno.fechaCierre && (
            <Text style={estilosA4.subtitulo}>Cierre: {formatearFecha(turno.fechaCierre)}</Text>
          )}
        </View>
        <Text style={estilosA4.badge}>{turno.tipoCierre === 'FINAL' ? 'ARQUEO Z' : 'ARQUEO X'}</Text>
      </View>

      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 12, color: COLORES.oscuro }}>
        {tipoCierre}
      </Text>

      {/* Resumen de ventas por método de pago */}
      <View style={estilosA4.seccion}>
        <Text style={estilosA4.seccionTitulo}>Detalle de Ventas por Método de Pago</Text>
        {[
          { label: 'Efectivo', valor: resumen.ventasEfectivo },
          { label: 'Débito', valor: resumen.ventasDebito },
          { label: 'Crédito', valor: resumen.ventasCredito },
          { label: 'QR / Transferencia', valor: resumen.ventasQr },
          { label: 'Cuenta Corriente (fiado)', valor: resumen.ventasCuentaCorriente },
        ].map((fila, i) => (
          <View key={fila.label} style={[estilosA4.fila, i % 2 !== 0 ? estilosA4.filaImpar : {}]}>
            <Text style={estilosA4.etiqueta}>{fila.label}</Text>
            <Text style={estilosA4.valor}>{formatearMoneda(fila.valor)}</Text>
          </View>
        ))}
      </View>

      {/* Movimientos de caja */}
      <View style={estilosA4.seccion}>
        <Text style={estilosA4.seccionTitulo}>Movimientos de Caja</Text>
        <View style={estilosA4.fila}>
          <Text style={estilosA4.etiqueta}>Fondo inicial (apertura)</Text>
          <Text style={estilosA4.valor}>{formatearMoneda(turno.montoInicial)}</Text>
        </View>
        <View style={[estilosA4.fila, estilosA4.filaImpar]}>
          <Text style={estilosA4.etiqueta}>Cobros de Cuenta Corriente</Text>
          <Text style={estilosA4.valor}>{formatearMoneda(resumen.cobrosCC)}</Text>
        </View>
        <View style={estilosA4.fila}>
          <Text style={estilosA4.etiqueta}>Retiros de efectivo</Text>
          <Text style={{ ...estilosA4.valor, color: COLORES.rojo }}>-{formatearMoneda(resumen.retiros)}</Text>
        </View>
        <View style={estilosA4.fila}>
          <Text style={estilosA4.etiqueta}>Tickets emitidos</Text>
          <Text style={estilosA4.valor}>{turno.cantidad_ventas || (turno as any).cantidad_tickets || 0}</Text>
        </View>
      </View>

      {/* Resumen del cierre */}
      <View style={estilosA4.seccion}>
        <Text style={estilosA4.seccionTitulo}>Balance del Cierre</Text>
        <View style={estilosA4.fila}>
          <Text style={estilosA4.etiqueta}>Total esperado por sistema</Text>
          <Text style={estilosA4.valor}>{formatearMoneda(turno.montoFinalEsperado ?? 0)}</Text>
        </View>
        <View style={[estilosA4.fila, estilosA4.filaImpar]}>
          <Text style={estilosA4.etiqueta}>Monto físico contado</Text>
          <Text style={estilosA4.valor}>{formatearMoneda(turno.montoFinalReal ?? 0)}</Text>
        </View>
        <View style={estilosA4.fila}>
          <Text style={estilosA4.etiqueta}>Diferencia (± desvío)</Text>
          <Text style={diferencia >= 0 ? estilosA4.diferenciaPositiva : estilosA4.diferenciaNegativa}>
            {diferencia >= 0 ? '+' : ''}{formatearMoneda(diferencia)}
          </Text>
        </View>
        {turno.notas && (
          <View style={[estilosA4.fila, { marginTop: 4 }]}>
            <Text style={{ ...estilosA4.etiqueta, fontStyle: 'italic' }}>Notas: {turno.notas}</Text>
          </View>
        )}
      </View>

      {/* Desglose de Efectivo */}
      {turno.detalle_billetes && (
        <View style={estilosA4.seccion}>
          <Text style={estilosA4.seccionTitulo}>Desglose de Efectivo</Text>
          {[
            { clave: 'billetesDiezMil', valor: 10000 },
            { clave: 'billetesDosMil', valor: 2000 },
            { clave: 'billetesMil', valor: 1000 },
            { clave: 'billetesQuinientos', valor: 500 },
            { clave: 'billetesDoscientos', valor: 200 },
            { clave: 'billetesCien', valor: 100 },
            { clave: 'monedasYOtros', valor: 1 }
          ]
            .filter(d => (turno.detalle_billetes?.[d.clave] || 0) > 0)
            .map((fila, i) => {
              const cantidad = turno.detalle_billetes?.[fila.clave] || 0;
              const subtotal = cantidad * fila.valor;
              return (
                <View key={fila.clave} style={[estilosA4.fila, i % 2 !== 0 ? estilosA4.filaImpar : {}]}>
                  <Text style={estilosA4.etiqueta}>{`${cantidad} x $${fila.valor}`}</Text>
                  <Text style={estilosA4.valor}>{formatearMoneda(subtotal)}</Text>
                </View>
              );
            })
          }
        </View>
      )}

      {/* Total recaudado */}
      <View style={estilosA4.filaTotal}>
        <Text style={estilosA4.totalEtiqueta}>Total Recaudado</Text>
        <Text style={estilosA4.totalValor}>{formatearMoneda(resumen.totalVentas)}</Text>
      </View>

      {/* Firma */}
      <View style={{ marginTop: 28, flexDirection: 'row', gap: 40 }}>
        <View style={{ flex: 1, borderTop: '1pt solid #000', paddingTop: 4 }}>
          <Text style={{ fontSize: 7.5, color: COLORES.gris }}>Firma del Cajero: {turno.cajero}</Text>
        </View>
        <View style={{ flex: 1, borderTop: '1pt solid #000', paddingTop: 4 }}>
          <Text style={{ fontSize: 7.5, color: COLORES.gris }}>Autorizado por (Admin):</Text>
        </View>
      </View>

      {/* Pie de página */}
      <View style={estilosA4.pie}>
        <Text style={estilosA4.pieTexto}>TOKO ERP — Sistema Offline-First v3.0 PRO</Text>
        <Text style={estilosA4.pieTexto}>Turno ID: {turno.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={estilosA4.pieTexto}>Impreso: {formatearFecha(new Date().toISOString())}</Text>
      </View>
    </Page>
  );
};

// ─── COMPONENTE TICKET 80mm ───────────────────────────────────────────────────

/**
 * Renderiza el PDF de arqueo en formato ticket térmico 80mm.
 */
const ArqueoTicket: React.FC<ArqueoPdfProps> = ({ turno, resumen }) => {
  const diferencia = (turno.montoFinalReal ?? 0) - (turno.montoFinalEsperado ?? 0);

  return (
    <Page size={[226.77, 841.89]} style={estilosTicket.pagina}>
      <Text style={estilosTicket.titulo}>TOKO ERP</Text>
      <Text style={estilosTicket.subtitulo}>ARQUEO {turno.tipoCierre === 'FINAL' ? 'Z' : 'X'}</Text>
      <Text style={estilosTicket.subtitulo}>{turno.cajero}</Text>
      <Text style={estilosTicket.subtitulo}>{formatearFecha(turno.fechaApertura)}</Text>

      <View style={estilosTicket.separador} />

      {[
        { l: 'Efectivo', v: resumen.ventasEfectivo },
        { l: 'Débito', v: resumen.ventasDebito },
        { l: 'Crédito', v: resumen.ventasCredito },
        { l: 'QR/Transf.', v: resumen.ventasQr },
        { l: 'Cta. Cte.', v: resumen.ventasCuentaCorriente },
        { l: 'Retiros', v: -resumen.retiros },
      ].map(f => (
        <View key={f.l} style={estilosTicket.fila}>
          <Text style={estilosTicket.etiqueta}>{f.l}</Text>
          <Text style={estilosTicket.valor}>{formatearMoneda(f.v)}</Text>
        </View>
      ))}

      <View style={estilosTicket.separador} />
      <View style={estilosTicket.fila}>
        <Text style={estilosTicket.etiqueta}>Esperado:</Text>
        <Text style={estilosTicket.valor}>{formatearMoneda(turno.montoFinalEsperado ?? 0)}</Text>
      </View>
      <View style={estilosTicket.fila}>
        <Text style={estilosTicket.etiqueta}>Físico:</Text>
        <Text style={estilosTicket.valor}>{formatearMoneda(turno.montoFinalReal ?? 0)}</Text>
      </View>
      <View style={estilosTicket.fila}>
        <Text style={estilosTicket.etiqueta}>Diferencia:</Text>
        <Text style={{ ...estilosTicket.valor, color: diferencia >= 0 ? '#16a34a' : '#dc2626' }}>
          {diferencia >= 0 ? '+' : ''}{formatearMoneda(diferencia)}
        </Text>
      </View>

      {/* Desglose de Efectivo */}
      {turno.detalle_billetes && (
        <>
          <View style={estilosTicket.separador} />
          <Text style={{ ...estilosTicket.subtitulo, textAlign: 'left', fontFamily: 'Courier-Bold', color: '#000' }}>
            DESGLOSE DE EFECTIVO
          </Text>
          {[
            { clave: 'billetesDiezMil', valor: 10000 },
            { clave: 'billetesDosMil', valor: 2000 },
            { clave: 'billetesMil', valor: 1000 },
            { clave: 'billetesQuinientos', valor: 500 },
            { clave: 'billetesDoscientos', valor: 200 },
            { clave: 'billetesCien', valor: 100 },
            { clave: 'monedasYOtros', valor: 1 }
          ]
            .filter(d => (turno.detalle_billetes?.[d.clave] || 0) > 0)
            .map((fila) => {
              const cantidad = turno.detalle_billetes?.[fila.clave] || 0;
              const subtotal = cantidad * fila.valor;
              return (
                <View key={fila.clave} style={estilosTicket.fila}>
                  <Text style={estilosTicket.etiqueta}>{`${cantidad} x $${fila.valor}`}</Text>
                  <Text style={estilosTicket.valor}>{formatearMoneda(subtotal)}</Text>
                </View>
              );
            })
          }
        </>
      )}

      <View style={estilosTicket.totalFila}>
        <Text style={estilosTicket.totalEtq}>TOTAL:</Text>
        <Text style={estilosTicket.totalVal}>{formatearMoneda(resumen.totalVentas)}</Text>
      </View>
      <Text style={estilosTicket.pie}>Tickets: {turno.cantidad_ventas || (turno as any).cantidad_tickets || 0}</Text>
      <Text style={estilosTicket.pie}>Cierre: {formatearFecha(turno.fechaCierre)}</Text>
      <Text style={estilosTicket.pie}>TOKO ERP v3.0 PRO</Text>
    </Page>
  );
};

// ─── Componente principal exportado ──────────────────────────────────────────

/**
 * Documento PDF de arqueo. Selecciona el formato (ticket o A4) según la prop `formato`.
 */
export const ArqueoPdf: React.FC<ArqueoPdfProps> = (props) => (
  <Document>
    {props.formato === 'a4'
      ? <ArqueoA4 {...props} />
      : <ArqueoTicket {...props} />
    }
  </Document>
);
