const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('Paith SAJAG.XLSX');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

// Get column headers
const headers = Object.keys(data[0]);

console.log('Excel Column Headers:');
console.log(headers);

// Print first row as sample
console.log('\nSample Row:');
console.log(data[0]);
