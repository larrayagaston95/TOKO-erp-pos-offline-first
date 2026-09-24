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
  seccion: {
    marginBottom: 16,
  },
  tituloSeccion: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.teal,
    borderBottom: `1pt solid ${COLORES.borde}`,
    paddingBottom: 4,
    marginBottom: 8,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORES.grisClaro,
    padding: 8,
    borderRadius: 4,
    border: `1pt solid ${COLORES.borde}`,
  },
  kpiLabel: {
    fontSize: 7,
    color: COLORES.gris,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  tabla: {
    width: '100%',
    flexDirection: 'column',
    marginTop: 8,
  },
  filaCabecera: {
    flexDirection: 'row',
    backgroundColor: COLORES.grisClaro,
    borderBottom: `1pt solid ${COLORES.borde}`,
    borderTop: `1pt solid ${COLORES.borde}`,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  filaDatos: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${COLORES.borde}`,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textoCabecera: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.gris,
    flex: 1,
  },
  textoDato: {
    fontSize: 8,
    flex: 1,
  },
  textoDatoBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  firmaBloque: {
    marginTop: 40,
    width: 200,
    alignSelf: 'center',
    alignItems: 'center',
  },
  firmaLinea: {
    width: '100%',
    borderTop: `1pt solid ${COLORES.oscuro}`,
    marginBottom: 4,
  },
  firmaTexto: {
    fontSize: 8,
    color: COLORES.gris,
  }
});

// ─── Estilos Ticket 80mm ─────────────────────────────────────────────────────
const estilosTicket = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORES.oscuro,
    backgroundColor: COLORES.blanco,
    padding: '10pt',
  },
  centrado: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 8,
  },
  tituloTicket: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  subtituloTicket: {
    fontSize: 8,
    color: COLORES.gris,
  },
  divisor: {
    borderBottom: `1pt dashed ${COLORES.oscuro}`,
    marginVertical: 6,
    width: '100%',
  },
  filaBloque: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  etiquetaTicket: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  valorTicket: {
    fontSize: 8,
  },
  valorTicketBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  turnoItem: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1pt solid ${COLORES.grisClaro}`,
  },
  firmaBloque: {
    marginTop: 20,
    alignItems: 'center',
  },
  firmaLinea: {
    width: '80%',
    borderTop: `1pt solid ${COLORES.oscuro}`,
    marginBottom: 2,
  },
});

const formatearPeso = (monto: number) => `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
const formatearFecha = (iso?: string) => iso ? new Date(iso).toLocaleString('es-AR') : '—';
const formatearFechaCorta = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-AR') + ' ' + new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—';

export interface ReporteCajasPdfProps {
  turnos: TurnoCaja[];
  kpisCajas: { totalEsperado: number; totalFisico: number; diferenciaTotal: number, totalVentas: number, totalInicial: number };
  filtroFechaStr: string;
  filtroTipoCierreStr: string;
  formato: 'a4' | 'ticket';
}

export const ReporteCajasPdf: React.FC<ReporteCajasPdfProps> = ({ turnos, kpisCajas, filtroFechaStr, filtroTipoCierreStr, formato }) => {
  if (formato === 'ticket') {
    return (
      <Document>
        <Page size={[226, 'auto']} style={estilosTicket.pagina}>
          
          <View style={estilosTicket.centrado}>
            <Text style={estilosTicket.tituloTicket}>BALANCE DE CAJAS</Text>
            <Text style={estilosTicket.subtituloTicket}>Comprobante de Auditoría</Text>
          </View>
          
          <View style={estilosTicket.divisor} />
          
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Período:</Text>
            <Text style={estilosTicket.valorTicket}>{filtroFechaStr}</Text>
          </View>
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Filtro:</Text>
            <Text style={estilosTicket.valorTicket}>{filtroTipoCierreStr}</Text>
          </View>
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Emisión:</Text>
            <Text style={estilosTicket.valorTicket}>{new Date().toLocaleString('es-AR')}</Text>
          </View>
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Registros:</Text>
            <Text style={estilosTicket.valorTicket}>{turnos.length}</Text>
          </View>
          
          <View style={estilosTicket.divisor} />
          
          <Text style={[estilosTicket.tituloTicket, { fontSize: 10, marginBottom: 4, textAlign: 'center' }]}>TOTALES CONSOLIDADOS</Text>
          
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Total Ventas:</Text>
            <Text style={estilosTicket.valorTicket}>{formatearPeso(kpisCajas.totalVentas)}</Text>
          </View>
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Inicial Acumulado:</Text>
            <Text style={estilosTicket.valorTicket}>{formatearPeso(kpisCajas.totalInicial)}</Text>
          </View>
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Total Esperado:</Text>
            <Text style={estilosTicket.valorTicket}>{formatearPeso(kpisCajas.totalEsperado)}</Text>
          </View>
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>Físico Rendido:</Text>
            <Text style={estilosTicket.valorTicketBold}>{formatearPeso(kpisCajas.totalFisico)}</Text>
          </View>
          
          <View style={estilosTicket.divisor} />
          
          <View style={estilosTicket.filaBloque}>
            <Text style={estilosTicket.etiquetaTicket}>DIFERENCIA NETA:</Text>
            <Text style={[
              estilosTicket.valorTicketBold,
              { color: kpisCajas.diferenciaTotal < 0 ? COLORES.rojo : kpisCajas.diferenciaTotal > 0 ? COLORES.verde : COLORES.oscuro }
            ]}>
              {kpisCajas.diferenciaTotal > 0 ? '+' : ''}{formatearPeso(kpisCajas.diferenciaTotal)}
            </Text>
          </View>
          
          <View style={estilosTicket.divisor} />
          
          <Text style={[estilosTicket.etiquetaTicket, { marginBottom: 4 }]}>DETALLE DE TURNOS:</Text>
          
          {turnos.map((turno, index) => {
            const esperado = turno.montoFinalEsperado || 0;
            const fisico = turno.montoFinalReal || 0;
            const diferencia = fisico - esperado;
            return (
              <View key={turno.id} style={estilosTicket.turnoItem}>
                <Text style={estilosTicket.etiquetaTicket}># {turnos.length - index} | {formatearFechaCorta(turno.fechaCierre)}</Text>
                <View style={estilosTicket.filaBloque}>
                  <Text style={estilosTicket.valorTicket}>Cajero:</Text>
                  <Text style={estilosTicket.valorTicket}>{turno.cajero || (turno as any).usuario}</Text>
                </View>
                <View style={estilosTicket.filaBloque}>
                  <Text style={estilosTicket.valorTicket}>Tipo:</Text>
                  <Text style={estilosTicket.valorTicket}>{turno.tipoCierre === 'FINAL' ? 'Z' : 'X'}</Text>
                </View>
                <View style={estilosTicket.filaBloque}>
                  <Text style={estilosTicket.valorTicket}>Físico:</Text>
                  <Text style={estilosTicket.valorTicketBold}>{formatearPeso(fisico)}</Text>
                </View>
                <View style={estilosTicket.filaBloque}>
                  <Text style={estilosTicket.valorTicket}>Dif:</Text>
                  <Text style={[
                    estilosTicket.valorTicketBold,
                    { color: diferencia < 0 ? COLORES.rojo : diferencia > 0 ? COLORES.verde : COLORES.oscuro }
                  ]}>
                    {diferencia > 0 ? '+' : ''}{formatearPeso(diferencia)}
                  </Text>
                </View>
              </View>
            )
          })}
          
          <View style={estilosTicket.firmaBloque}>
            <View style={estilosTicket.firmaLinea}></View>
            <Text style={[estilosTicket.valorTicket, { color: COLORES.gris }]}>Firma Auditor</Text>
          </View>
          
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 6, color: COLORES.gris }}>Sistema POS - TOKO ERP</Text>
          </View>
        </Page>
      </Document>
    );
  }

  // --- Renderizado A4 ---
  return (
    <Document>
      <Page size="A4" style={estilosA4.pagina}>
        
        {/* ENCABEZADO */}
        <View style={estilosA4.encabezado}>
          <View>
            <Text style={estilosA4.titulo}>Resumen General de Cajas</Text>
            <Text style={estilosA4.subtitulo}>Documento de control y auditoría</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: COLORES.gris, marginBottom: 2 }}>
              Período: <Text style={{ fontFamily: 'Helvetica-Bold', color: COLORES.oscuro }}>{filtroFechaStr}</Text>
            </Text>
            <Text style={{ fontSize: 8, color: COLORES.gris, marginBottom: 2 }}>
              Tipo de Cierres: <Text style={{ fontFamily: 'Helvetica-Bold', color: COLORES.oscuro }}>{filtroTipoCierreStr}</Text>
            </Text>
            <Text style={{ fontSize: 8, color: COLORES.gris }}>
              Fecha Emisión: {new Date().toLocaleString('es-AR')}
            </Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={estilosA4.seccion}>
          <Text style={estilosA4.tituloSeccion}>Indicadores Globales del Período</Text>
          <View style={estilosA4.kpiContainer}>
            <View style={estilosA4.kpiBox}>
              <Text style={estilosA4.kpiLabel}>Total Ventas</Text>
              <Text style={estilosA4.kpiValue}>{formatearPeso(kpisCajas.totalVentas)}</Text>
            </View>
            <View style={estilosA4.kpiBox}>
              <Text style={estilosA4.kpiLabel}>Inicial Acumulado</Text>
              <Text style={estilosA4.kpiValue}>{formatearPeso(kpisCajas.totalInicial)}</Text>
            </View>
            <View style={estilosA4.kpiBox}>
              <Text style={estilosA4.kpiLabel}>Total Esperado</Text>
              <Text style={estilosA4.kpiValue}>{formatearPeso(kpisCajas.totalEsperado)}</Text>
            </View>
            <View style={estilosA4.kpiBox}>
              <Text style={estilosA4.kpiLabel}>Total Físico Rendido</Text>
              <Text style={estilosA4.kpiValue}>{formatearPeso(kpisCajas.totalFisico)}</Text>
            </View>
            <View style={estilosA4.kpiBox}>
              <Text style={estilosA4.kpiLabel}>Diferencia Neta</Text>
              <Text style={[
                estilosA4.kpiValue,
                { color: kpisCajas.diferenciaTotal < 0 ? COLORES.rojo : kpisCajas.diferenciaTotal > 0 ? COLORES.verde : COLORES.oscuro }
              ]}>
                {kpisCajas.diferenciaTotal > 0 ? '+' : ''}{formatearPeso(kpisCajas.diferenciaTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* TABLA DE TURNOS */}
        <View style={estilosA4.seccion}>
          <Text style={estilosA4.tituloSeccion}>Detalle de Cajas Rendidas ({turnos.length} registros)</Text>
          
          <View style={estilosA4.tabla}>
            <View style={estilosA4.filaCabecera}>
              <Text style={[estilosA4.textoCabecera, { flex: 1.5 }]}>Fecha Cierre</Text>
              <Text style={[estilosA4.textoCabecera, { flex: 1 }]}>Cajero</Text>
              <Text style={[estilosA4.textoCabecera, { flex: 0.8 }]}>Tipo</Text>
              <Text style={[estilosA4.textoCabecera, { flex: 1, textAlign: 'right' }]}>Inicial</Text>
              <Text style={[estilosA4.textoCabecera, { flex: 1, textAlign: 'right' }]}>Esperado</Text>
              <Text style={[estilosA4.textoCabecera, { flex: 1, textAlign: 'right' }]}>Físico</Text>
              <Text style={[estilosA4.textoCabecera, { flex: 1, textAlign: 'right' }]}>Diferencia</Text>
            </View>

            {turnos.map(turno => {
              const esperado = turno.montoFinalEsperado || 0;
              const fisico = turno.montoFinalReal || 0;
              const diferencia = fisico - esperado;

              return (
                <View key={turno.id} style={estilosA4.filaDatos}>
                  <Text style={[estilosA4.textoDato, { flex: 1.5 }]}>{formatearFecha(turno.fechaCierre)}</Text>
                  <Text style={[estilosA4.textoDatoBold, { flex: 1 }]}>{turno.cajero || (turno as any).usuario}</Text>
                  <Text style={[estilosA4.textoDato, { flex: 0.8 }]}>{turno.tipoCierre === 'FINAL' ? 'Cierre Z' : 'Cierre X'}</Text>
                  <Text style={[estilosA4.textoDato, { flex: 1, textAlign: 'right' }]}>{formatearPeso(turno.montoInicial)}</Text>
                  <Text style={[estilosA4.textoDato, { flex: 1, textAlign: 'right' }]}>{formatearPeso(esperado)}</Text>
                  <Text style={[estilosA4.textoDatoBold, { flex: 1, textAlign: 'right' }]}>{formatearPeso(fisico)}</Text>
                  <Text style={[
                    estilosA4.textoDatoBold,
                    { flex: 1, textAlign: 'right', color: diferencia < 0 ? COLORES.rojo : diferencia > 0 ? COLORES.verde : COLORES.oscuro }
                  ]}>
                    {diferencia > 0 ? '+' : ''}{formatearPeso(diferencia)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ESPACIO PARA FIRMA */}
        <View style={estilosA4.firmaBloque}>
          <View style={estilosA4.firmaLinea}></View>
          <Text style={estilosA4.firmaTexto}>Firma de Auditor / Supervisor</Text>
        </View>

      </Page>
    </Document>
  );
};
