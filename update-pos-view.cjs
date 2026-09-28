const fs = require('fs');
let text = fs.readFileSync('src/views/pos/PosView.tsx', 'utf8');

text = text.replace("{ id: 'CUENTA_CORRIENTE' as MetodoPago, label: 'Cta. Corriente', icon: FileText }", "");
// Remove empty comma from array trailing elements if left
text = text.replace(/,\s*\]/, "]");

text = text.replace("pago.id === 'CUENTA_CORRIENTE' ? 'col-span-2' : ''", "''");

const calcRegex = /\{\/\*\s*CALCULADORA DE VUELTO[\s\S]*?(?=\s*<\/div>\s*\{\/\*\s*======+)/m;
const newCalc = `{/* INGRESO DE MONTO DESTACADO */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-slate-700 font-sans text-xs font-bold uppercase tracking-wider block mb-2">
              Monto que entrega el cliente ($):
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-xl">$</span>
              <input
                type="number"
                value={montoAbonado}
                onChange={(e) => setMontoAbonado(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-300 rounded-xl text-right font-mono font-black text-slate-900 text-2xl outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-inner transition-all"
              />
            </div>
          </div>
          
          {/* Mostrar error si lo hay */}
          {errorCobro && (
            <div className="mt-2 text-rose-600 text-xs font-bold text-center bg-rose-50 p-2 rounded-lg border border-rose-200">
              {errorCobro}
            </div>
          )}`;
text = text.replace(calcRegex, newCalc);

const btnRegex = /onClick=\{\(\) => \{\s*const totalFactura = controlador\.calculosFinancieros\?\.total \?\? 0;\s*const abonado = montoAbonado === '' \? 0 : Number\(montoAbonado\);\s*const cliente = controlador\.clienteSeleccionado;\s*const esConsumidorFinal = !cliente \|\| cliente\.tipo === 'CONSUMIDOR_FINAL';[\s\S]*?setErrorCobro\(''\);\s*\}\}/m;
const newBtn = `onClick={() => {
            const totalFactura = controlador.calculosFinancieros?.total ?? 0;
            const abonado = montoAbonado === '' ? 0 : Number(montoAbonado);
            const cliente = controlador.clienteSeleccionado;
            const esConsumidorFinal = !cliente || cliente.tipo === 'CONSUMIDOR_FINAL';

            // REGLA 1: Consumidor Final no puede deber plata
            if (esConsumidorFinal && abonado < totalFactura) {
              setErrorCobro('Debe abonar el monto de la factura para poder emitir la factura.');
              return;
            }

            // REGLA 2: Cliente registrado asume deuda automáticamente si paga menos
            // La función procesarVenta ya envía los items, fecha y calcula el saldo negativo en CC.
            controlador.procesarVenta(cliente?.id ?? 'CONSUMIDOR_FINAL', abonado, totalFactura);
            setMontoAbonado('');
            setErrorCobro('');
          }}`;

text = text.replace(btnRegex, newBtn);

fs.writeFileSync('src/views/pos/PosView.tsx', text, 'utf8');
console.log("Done");
