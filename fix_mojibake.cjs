const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { search: /Ã¡/g, replace: 'á' },
  { search: /Ã©/g, replace: 'é' },
  { search: /Ã­/g, replace: 'í' },
  { search: /Ã³/g, replace: 'ó' },
  { search: /Ãº/g, replace: 'ú' },
  { search: /Ã±/g, replace: 'ñ' },
  { search: /Ã‘/g, replace: 'Ñ' },
  { search: /Ã /g, replace: 'Á' }, // Like in TÃ CTILES -> TÁCTILES ? Wait. "TÃ CTILES" has a space? It's probably Ã  (A with grave?) Let's explicitly replace the words.
  { search: /LÃ SER/g, replace: 'LÁSER' },
  { search: /TÃ CTILES/g, replace: 'TÁCTILES' },
  { search: /RÃ PIDOS/g, replace: 'RÁPIDOS' },
  { search: /lÃ³gica/g, replace: 'lógica' },
  { search: /cÃ³digo/g, replace: 'código' },
  { search: /lÃ¡ser/g, replace: 'láser' },
  { search: /BÃºsqueda/g, replace: 'Búsqueda' },
  { search: /adiciÃ³n/g, replace: 'adición' },
  { search: /eliminaciÃ³n/g, replace: 'eliminación' },
  { search: /CÃ¡lculo/g, replace: 'Cálculo' },
  { search: /ValidaciÃ³n/g, replace: 'Validación' },
  { search: /EmisiÃ³n/g, replace: 'Emisión' },
  { search: /CatÃ¡logo/g, replace: 'Catálogo' },
  { search: /aÃºn/g, replace: 'aún' },
  { search: /Ã tems/g, replace: 'Ítems' },
  { search: /TÃ©rmino/g, replace: 'Término' },
  { search: /bÃºsqueda/g, replace: 'búsqueda' },
  { search: /cÃ¡lculo/g, replace: 'cálculo' },
  { search: /automÃ¡tico/g, replace: 'automático' },
  { search: /Ãšltimo/g, replace: 'Último' },
  { search: /visualizaciÃ³n/g, replace: 'visualización' },
  { search: /impresiÃ³n/g, replace: 'impresión' },
  { search: /notificaciÃ³n/g, replace: 'notificación' },
  { search: /segÃºn/g, replace: 'según' },
  { search: /rÃ¡pido/g, replace: 'rápido' },
  { search: /estÃ¡/g, replace: 'está' },
  { search: /Ã­tem/g, replace: 'ítem' },
  { search: /numÃ©rico/g, replace: 'numérico' },
  { search: /especÃ­fico/g, replace: 'específico' },
  { search: /TransacciÃ³n/g, replace: 'Transacción' },
  { search: /atÃ³mica/g, replace: 'atómica' },
  { search: /fÃ­sico/g, replace: 'físico' },
  { search: /diÃ¡logo/g, replace: 'diálogo' },
  { search: /LiquidaciÃ³n/g, replace: 'Liquidación' },
  { search: /â€¢/g, replace: '•' },
  { search: /âš ï¸ /g, replace: '' },
  { search: /âš ï¸/g, replace: '' },
  { search: /ðŸ”/g, replace: '' },
  { search: /ðŸ”Ž/g, replace: '' },
  { search: /ðŸ’µ/g, replace: '' } // Money emoji sometimes corrupt
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
      }
      
      // Also catch any lingering single "Ã" that didn't match the specific words
      // But we must be careful not to corrupt already correct Ã (though unlikely in spanish, only Ã¡ Ã© etc)
      // We will skip a generic Ã replace just in case, since we did the specific words.
      // Wait, there are many others like "vacÃ­o", "AÃ±adir", etc.
      // Let's do the generic character replacements again after words:
      content = content.replace(/Ã¡/g, 'á')
                       .replace(/Ã©/g, 'é')
                       .replace(/Ã­/g, 'í')
                       .replace(/Ã³/g, 'ó')
                       .replace(/Ãº/g, 'ú')
                       .replace(/Ã±/g, 'ñ')
                       .replace(/Ã‘/g, 'Ñ');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed mojibake in: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Global Mojibake scan and replace completed.');
