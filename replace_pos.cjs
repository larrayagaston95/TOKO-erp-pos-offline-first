const fs = require('fs');

const path = 'src/views/pos/PosView.tsx';
let c = fs.readFileSync(path, 'utf8');

const pattern = /<select[\s\S]*?id=\"pos-select-cliente\"[\s\S]*?<\/select>/;

const replacement = `          <div className="relative" ref={clienteWrapperRef}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI/CUIT..."
                value={mostrarDropdownClientes ? busquedaCliente : (controlador.clienteSeleccionado?.nombre || 'Consumidor Final')}
                onFocus={() => {
                  setBusquedaCliente('');
                  setMostrarDropdownClientes(true);
                }}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setMostrarDropdownClientes(true);
                }}
                className="w-full pl-9 pr-8 bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl p-3 text-xs font-bold font-sans outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs"
              />
              {controlador.clienteSeleccionado && controlador.clienteSeleccionado.id !== 'cli-001' && (
                <button
                  type="button"
                  onClick={() => {
                    const consumidorFinal = controlador.clientes.find(c => c.id === 'cli-001' || c.nombre === 'Consumidor Final Mostrador');
                    if (consumidorFinal) {
                      controlador.setClienteSeleccionado(consumidorFinal);
                    }
                    setBusquedaCliente('');
                    setMostrarDropdownClientes(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Volver a Consumidor Final"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {mostrarDropdownClientes && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden flex flex-col p-1 animate-in fade-in slide-in-from-top-1">
                {clientesFiltrados.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 font-bold">
                    No se encontraron clientes.
                  </div>
                ) : (
                  clientesFiltrados.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        controlador.setClienteSeleccionado(c);
                        const esAnonimo = c.id === 'cli-001' || c.nombre === 'Consumidor Final Mostrador' || c.nombre === 'Consumidor Final';
                        if (esAnonimo && controlador.metodoPago === 'CUENTA_CORRIENTE') {
                          controlador.setMetodoPago('EFECTIVO');
                        }
                        setBusquedaCliente('');
                        setMostrarDropdownClientes(false);
                      }}
                      className="text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-700 group-hover:text-teal-800 truncate">
                          {c.nombre}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {c.tipo} {c.documento ? \`• \${c.documento}\` : ''}
                        </span>
                      </div>
                      {c.saldoCuentaCorriente < 0 && (
                        <span className="shrink-0 ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-black">
                          Deuda: \${Math.abs(c.saldoCuentaCorriente)}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>`;

c = c.replace(pattern, replacement);
fs.writeFileSync(path, c);
console.log('Replaced successfully');
