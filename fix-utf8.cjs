const fs = require('fs');
let text = fs.readFileSync('src/views/pos/PosView.tsx', 'utf8');
const replacements = {
  'Ã³': 'ó',
  'Ã±': 'ñ',
  'Ã‘': 'Ñ',
  'Ã­': 'í',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ãº': 'ú',
  'Ãš': 'Ú',
  'Ã ': 'Á',
  'Ã“': 'Ó',
  'Ã‰': 'É',
  'Â': ''
};
for (const [bad, good] of Object.entries(replacements)) {
  text = text.split(bad).join(good);
}
fs.writeFileSync('src/views/pos/PosView.tsx', text, 'utf8');
