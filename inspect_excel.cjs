const xlsx = require('xlsx');

const workbook = xlsx.readFile('C:\\Users\\keine\\.gemini\\antigravity\\scratch\\Listado de productos Entrenamiento IA.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

console.log(JSON.stringify(data.slice(0, 15), null, 2));
