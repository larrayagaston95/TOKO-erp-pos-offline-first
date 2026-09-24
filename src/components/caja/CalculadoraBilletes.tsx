import React, { useState, useEffect } from 'react';

// ============================================================================
// ARCHIVO: src/components/caja/CalculadoraBilletes.tsx
// RESPONSABILIDAD: Renderizar la interfaz para contar billetes físicos,
// calcular el subtotal por denominación y el total general en tiempo real.
// LÍMITE DE LÍNEAS Y RESPONSABILIDAD ÚNICA: Componente aislado (Vista).
// No contiene peticiones de red ni acceso a base de datos.
// ============================================================================

// Estructura de datos para manejar las cantidades ingresadas por cada denominación
export interface CantidadesBilletes {
    billetesDiezMil: number;
    billetesDosMil: number;
    billetesMil: number;
    billetesQuinientos: number;
    billetesDoscientos: number;
    billetesCien: number;
    monedasYOtros: number;
}

// Interfaz para las propiedades (props) que recibe el componente desde el exterior
interface PropiedadesCalculadoraBilletes {
    // Función que se dispara cuando el usuario confirma el arqueo
    onTotalCalculado: (totalGeneral: number, desglose: CantidadesBilletes) => void;
    // Función para cerrar el modal actual
    onClose: () => void;
}

export const CalculadoraBilletes: React.FC<PropiedadesCalculadoraBilletes> = ({ 
    onTotalCalculado, 
    onClose 
}) => {
    // ------------------------------------------------------------------------
    // ESTADO DEL COMPONENTE
    // ------------------------------------------------------------------------
    // Guardamos la cantidad de billetes ingresados por el usuario para cada denominación.
    // Todas las cantidades inician en cero.
    const [cantidadesBilletes, establecerCantidadesBilletes] = useState<CantidadesBilletes>({
        billetesDiezMil: 0,
        billetesDosMil: 0,
        billetesMil: 0,
        billetesQuinientos: 0,
        billetesDoscientos: 0,
        billetesCien: 0,
        monedasYOtros: 0,
    });

    // Guardamos el total general calculado, reaccionando en tiempo real a los cambios.
    const [totalGeneralCalculado, establecerTotalGeneralCalculado] = useState<number>(0);

    // ------------------------------------------------------------------------
    // EFECTOS (REACCIONES A CAMBIOS)
    // ------------------------------------------------------------------------
    // Recorremos el dato: Cada vez que el usuario modifica un input en la Vista (cantidadesBilletes),
    // este efecto actúa como Controlador local y procesa el nuevo cálculo.
    useEffect(() => {
        try {
            calcularTotalGeneral();
        } catch (error) {
            console.error(`Error en CalculadoraBilletes.tsx -> useEffect: ${error}`);
        }
    }, [cantidadesBilletes]);

    // ------------------------------------------------------------------------
    // FUNCIONES DE LÓGICA DE NEGOCIO (CONTROLADOR DE LA VISTA)
    // ------------------------------------------------------------------------

    // Calcula el total monetario multiplicando la cantidad de billetes por su denominación
    const calcularTotalGeneral = () => {
        const subtotalDiezMil = cantidadesBilletes.billetesDiezMil * 10000;
        const subtotalDosMil = cantidadesBilletes.billetesDosMil * 2000;
        const subtotalMil = cantidadesBilletes.billetesMil * 1000;
        const subtotalQuinientos = cantidadesBilletes.billetesQuinientos * 500;
        const subtotalDoscientos = cantidadesBilletes.billetesDoscientos * 200;
        const subtotalCien = cantidadesBilletes.billetesCien * 100;
        // Para "Monedas y Otros", asumimos que el usuario ingresa directamente el monto monetario total,
        // por lo tanto, el multiplicador es 1.
        const subtotalMonedas = cantidadesBilletes.monedasYOtros * 1; 

        const sumatoriaTotal = 
            subtotalDiezMil + 
            subtotalDosMil + 
            subtotalMil + 
            subtotalQuinientos + 
            subtotalDoscientos + 
            subtotalCien + 
            subtotalMonedas;

        establecerTotalGeneralCalculado(sumatoriaTotal);
    };

    // Recibe la acción del usuario desde la Vista (escribir en un input numérico)
    // y actualiza el Modelo de estado local correspondiente.
    const manejarCambioDeCantidad = (denominacion: keyof CantidadesBilletes, valorIngresado: string) => {
        try {
            // Convertimos el valor de texto a número entero. Si está vacío o es texto inválido, asignamos 0.
            const cantidadNumerica = parseInt(valorIngresado, 10);
            const cantidadLimpia = isNaN(cantidadNumerica) ? 0 : cantidadNumerica;

            establecerCantidadesBilletes((cantidadesAnteriores) => ({
                ...cantidadesAnteriores,
                [denominacion]: cantidadLimpia
            }));
        } catch (error) {
            console.error(`Error en CalculadoraBilletes.tsx -> manejarCambioDeCantidad: ${error}`);
        }
    };

    // Recibe la acción final del usuario desde la Vista (clic en "Confirmar Arqueo")
    // y emite el resultado al componente padre.
    const manejarConfirmacionDeArqueo = () => {
        try {
            // Emitimos el total general calculado y el desglose hacia el nivel superior
            onTotalCalculado(totalGeneralCalculado, cantidadesBilletes);
            // Cerramos este modal de arqueo
            onClose();
        } catch (error) {
            console.error(`Error en CalculadoraBilletes.tsx -> manejarConfirmacionDeArqueo: ${error}`);
        }
    };

    // Función auxiliar para modularizar el renderizado de cada fila de billetes.
    // Esto evita repetición de código y mantiene el bloque JSX limpio.
    const renderizarFilaDeDenominacion = (etiquetaVisible: string, llaveDenominacion: keyof CantidadesBilletes, valorMultiplicador: number) => {
        const cantidadIngresada = cantidadesBilletes[llaveDenominacion];
        const subtotalCalculado = cantidadIngresada * valorMultiplicador;

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ width: '150px', fontWeight: 'bold', color: '#333' }}>
                    {etiquetaVisible}:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input 
                        type="number" 
                        min="0"
                        value={cantidadIngresada === 0 ? '' : cantidadIngresada} 
                        onChange={(evento) => manejarCambioDeCantidad(llaveDenominacion, evento.target.value)}
                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        placeholder="0"
                    />
                    <span style={{ width: '150px', textAlign: 'right', color: '#555' }}>
                        {cantidadIngresada} x ${valorMultiplicador} = <strong>${subtotalCalculado}</strong>
                    </span>
                </div>
            </div>
        );
    };

    // ------------------------------------------------------------------------
    // RENDERIZADO DE LA VISTA
    // ------------------------------------------------------------------------
    return (
        <div style={{ padding: '25px', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                Calculadora de Arqueo de Caja
            </h2>
            
            {/* Contenedor de las filas de denominaciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {renderizarFilaDeDenominacion('Billetes $10.000', 'billetesDiezMil', 10000)}
                {renderizarFilaDeDenominacion('Billetes $2.000', 'billetesDosMil', 2000)}
                {renderizarFilaDeDenominacion('Billetes $1.000', 'billetesMil', 1000)}
                {renderizarFilaDeDenominacion('Billetes $500', 'billetesQuinientos', 500)}
                {renderizarFilaDeDenominacion('Billetes $200', 'billetesDoscientos', 200)}
                {renderizarFilaDeDenominacion('Billetes $100', 'billetesCien', 100)}
                {renderizarFilaDeDenominacion('Monedas / Otros ($)', 'monedasYOtros', 1)}
            </div>

            <hr style={{ margin: '25px 0', borderTop: '1px solid #ecf0f1' }} />

            {/* Bloque destacado con el TOTAL GENERAL actualizado en tiempo real */}
            <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', textAlign: 'center', border: '1px solid #c3e6cb' }}>
                <h3 style={{ margin: 0, color: '#155724', fontSize: '24px' }}>
                    TOTAL GENERAL: ${totalGeneralCalculado}
                </h3>
            </div>

            {/* Controles de Acción Principal */}
            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button 
                    onClick={onClose} 
                    style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Cancelar
                </button>
                <button 
                    onClick={manejarConfirmacionDeArqueo}
                    style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Confirmar Arqueo
                </button>
            </div>
        </div>
    );
};

export default CalculadoraBilletes;
