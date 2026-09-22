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

const estilos = StyleSheet.create({
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
    fontSize: 12,
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

const formatearPeso = (monto: number) => `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
const formatearFecha = (iso?: string) => iso ? new Date(iso).toLocaleString('es-AR') : '—';

export interface ReporteCajasPdfProps {
  turnos: TurnoCaja[];
  kpisCajas: { totalEsperado: number; totalFisico: number; diferenciaTotal: number };
  filtroFechaStr: string;
  filtroTipoCierreStr: string;
}

export const ReporteCajasPdf: React.FC<ReporteCajasPdfProps> = ({ turnos, kpisCajas, filtroFechaStr, filtroTipoCierreStr }) => {
  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        
        {/* ENCABEZADO */}
        <View style={estilos.encabezado}>
          <View>
            <Text style={estilos.titulo}>Resumen General de Cajas</Text>
            <Text style={estilos.subtitulo}>Documento de control y auditoría</Text>
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
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Indicadores Globales del Período</Text>
          <View style={estilos.kpiContainer}>
            <View style={estilos.kpiBox}>
              <Text style={estilos.kpiLabel}>Total Esperado Acumulado</Text>
              <Text style={estilos.kpiValue}>{formatearPeso(kpisCajas.totalEsperado)}</Text>
            </View>
            <View style={estilos.kpiBox}>
              <Text style={estilos.kpiLabel}>Total Físico Rendido</Text>
              <Text style={estilos.kpiValue}>{formatearPeso(kpisCajas.totalFisico)}</Text>
            </View>
            <View style={estilos.kpiBox}>
              <Text style={estilos.kpiLabel}>Descuadre / Diferencia</Text>
              <Text style={[
                estilos.kpiValue,
                { color: kpisCajas.diferenciaTotal < 0 ? COLORES.rojo : kpisCajas.diferenciaTotal > 0 ? COLORES.verde : COLORES.oscuro }
              ]}>
                {kpisCajas.diferenciaTotal > 0 ? '+' : ''}{formatearPeso(kpisCajas.diferenciaTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* TABLA DE TURNOS */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Detalle de Cajas Rendidas ({turnos.length} registros)</Text>
          
          <View style={estilos.tabla}>
            <View style={estilos.filaCabecera}>
              <Text style={[estilos.textoCabecera, { flex: 1.5 }]}>Fecha Cierre</Text>
              <Text style={[estilos.textoCabecera, { flex: 1 }]}>Cajero</Text>
              <Text style={[estilos.textoCabecera, { flex: 0.8 }]}>Tipo</Text>
              <Text style={[estilos.textoCabecera, { flex: 1, textAlign: 'right' }]}>Inicial</Text>
              <Text style={[estilos.textoCabecera, { flex: 1, textAlign: 'right' }]}>Esperado</Text>
              <Text style={[estilos.textoCabecera, { flex: 1, textAlign: 'right' }]}>Físico</Text>
              <Text style={[estilos.textoCabecera, { flex: 1, textAlign: 'right' }]}>Diferencia</Text>
            </View>

            {turnos.map(turno => {
              const esperado = turno.montoFinalEsperado || 0;
              const fisico = turno.montoFinalReal || 0;
              const diferencia = fisico - esperado;

              return (
                <View key={turno.id} style={estilos.filaDatos}>
                  <Text style={[estilos.textoDato, { flex: 1.5 }]}>{formatearFecha(turno.fechaCierre)}</Text>
                  <Text style={[estilos.textoDatoBold, { flex: 1 }]}>{turno.usuario}</Text>
                  <Text style={[estilos.textoDato, { flex: 0.8 }]}>{turno.tipoCierre === 'FINAL' ? 'Cierre Z' : 'Cierre X'}</Text>
                  <Text style={[estilos.textoDato, { flex: 1, textAlign: 'right' }]}>{formatearPeso(turno.montoInicial)}</Text>
                  <Text style={[estilos.textoDato, { flex: 1, textAlign: 'right' }]}>{formatearPeso(esperado)}</Text>
                  <Text style={[estilos.textoDatoBold, { flex: 1, textAlign: 'right' }]}>{formatearPeso(fisico)}</Text>
                  <Text style={[
                    estilos.textoDatoBold,
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
        <View style={estilos.firmaBloque}>
          <View style={estilos.firmaLinea}></View>
          <Text style={estilos.firmaTexto}>Firma de Auditor / Supervisor</Text>
        </View>

      </Page>
    </Document>
  );
};
