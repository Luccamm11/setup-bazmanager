const XLSX = require('xlsx');
const fs = require('fs');

try {
  const workbook = XLSX.readFile('../02-Inventário de Equipamentos - 2026.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  fs.writeFileSync('excel_data.json', JSON.stringify(data, null, 2));
  console.log('Saved to excel_data.json. Total rows:', data.length);
} catch(e) {
  console.error(e);
}
