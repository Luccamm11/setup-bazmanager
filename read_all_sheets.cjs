const XLSX = require('xlsx');
const fs = require('fs');

try {
  const workbook = XLSX.readFile('../02-Inventário de Equipamentos - 2026.xlsx');
  const allData = {};
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    allData[sheetName] = XLSX.utils.sheet_to_json(sheet);
  });

  fs.writeFileSync('excel_all_data.json', JSON.stringify(allData, null, 2));
  console.log('Saved to excel_all_data.json. Sheets:', workbook.SheetNames);
} catch(e) {
  console.error(e);
}
