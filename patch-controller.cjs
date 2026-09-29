const fs = require('fs');
let text = fs.readFileSync('src/controllers/usePosController.ts', 'utf8');

// Add vueltoCalculado and saldoCC, and new fields to nuevoTicket
const oldBlock = `    // Generaci`;
const newPrefix = `    // Cálculo de vuelto y saldo a CC
    const vueltoCalculado = montoAbonado > totalVenta ? montoAbonado - totalVenta : 0;
    const saldoCC = montoAbonado < totalVenta && clienteSelecc.tipo !== 'CONSUMIDOR_FINAL'
      ? totalVenta - montoAbonado
      : 0;

    // Generaci`;

text = text.replace(oldBlock, newPrefix);

// Now add the new fields after metodoPago line in nuevoTicket
text = text.replace(
  /metodoPago,\n      tipoComprobante: 'TICKET_X',/,
  `metodoPago,\n      montoAbonado,\n      vuelto: vueltoCalculado,\n      saldoAfectadoCC: saldoCC,\n      tipoComprobante: 'TICKET_X',`
);

fs.writeFileSync('src/controllers/usePosController.ts', text, 'utf8');
console.log('Done: usePosController.ts updated');
