const fs = require('fs');

try {
  const allData = JSON.parse(fs.readFileSync('excel_all_data.json', 'utf8'));
  const cleanInventory = [];
  
  const categories = ['Maquinas', 'Ferramentas', 'Insumos', 'EPIs'];
  
  categories.forEach(category => {
    const rawData = allData[category];
    if (!rawData) return;
    
    // The first few rows usually contain instructions or headers.
    // Let's find the row that has 'Quantidade' or 'Valor unitário' to identify the structure
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
       const row = rawData[i];
       const values = Object.values(row).map(v => String(v).toLowerCase());
       if (values.includes('quantidade')) {
           headerRowIndex = i;
           break;
       }
    }
    
    if (headerRowIndex === -1) {
        console.log(`Could not find header row for ${category}`);
        return;
    }
    
    const headers = rawData[headerRowIndex];
    let nameKey, qtyKey, unitPriceKey, subtotalKey, acquiredKey, codeKey;
    
    for (const [key, value] of Object.entries(headers)) {
        const valStr = String(value).toLowerCase();
        if (valStr.includes('nome')) nameKey = key;
        else if (valStr.includes('quantidade')) qtyKey = key;
        else if (valStr.includes('valor unitário')) unitPriceKey = key;
        else if (valStr.includes('subtotal')) subtotalKey = key;
        else if (valStr.includes('adquirido')) acquiredKey = key;
        else if (valStr.includes('código')) codeKey = key;
    }
    
    // Process items
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Check if it's the "Total" row or empty row
        const nameVal = row[nameKey];
        if (!nameVal || String(nameVal).toLowerCase() === 'total' || nameVal === 0) continue;
        
        const item = {
            id: `${category}-${i}`,
            category,
            name: nameVal,
            quantity: Number(row[qtyKey]) || 0,
            unitPrice: Number(row[unitPriceKey]) || 0,
            subtotal: Number(row[subtotalKey]) || 0,
            acquiredByFIEMG: row[acquiredKey] ? String(row[acquiredKey]) : '',
            productCode: row[codeKey] ? String(row[codeKey]) : ''
        };
        
        // Add if it has a valid quantity or it is an important item
        if (item.quantity > 0 || String(nameVal).trim() !== '') {
            cleanInventory.push(item);
        }
    }
  });

  fs.writeFileSync('robotics_inventory.json', JSON.stringify(cleanInventory, null, 2));
  console.log(`Cleaned ${cleanInventory.length} items to robotics_inventory.json`);

} catch (e) {
  console.error(e);
}
