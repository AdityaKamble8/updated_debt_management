import React, { useState, useRef } from 'react';
import { Button, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { requiredColumns, columnMapping } from '../utils/sampleData';

const ExcelUpload = ({ onDataUpload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateExcelData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Excel file is empty or invalid');
    }

    // Get the first row that's not empty
    const firstDataRow = data.find(row => 
      Object.values(row).some(value => value && value.toString().trim() !== '')
    );

    if (!firstDataRow) {
      throw new Error('No data found in Excel file');
    }

    // Check if all required columns are present
    const missingColumns = requiredColumns.filter(
      col => !(col in firstDataRow)
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return true;
  };

  const processExcelFile = async (file) => {
    setLoading(true);
    setError('');
    try {
      const data = await readExcelFile(file);
      
      // Remove header rows (first row with column names)
      const dataRows = data.filter(row => 
        row['Annexure-I'] && 
        row['Annexure-I'].toString().trim() !== 'Sr No.' &&
        !isNaN(row['Annexure-I'])
      );
      
      validateExcelData(dataRows);
      
      // Transform data to match our internal format
      const transformedData = dataRows.map(row => {
        const transformedRow = {};
        Object.entries(columnMapping).forEach(([excelCol, internalCol]) => {
          transformedRow[internalCol] = row[excelCol]?.toString() || '';
        });
        return transformedRow;
      });

      onDataUpload(transformedData);
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error.message);
    }
    setLoading(false);
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: '' // Set default value for empty cells
          });
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Failed to parse Excel file: ' + error.message));
        }
      };
      
      reader.onerror = (error) => {
        reject(new Error('Failed to read file: ' + error.message));
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/i)) {
        setError('Please upload only Excel files (.xlsx or .xls)');
        return;
      }
      processExcelFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const downloadSampleFile = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create headers row using required columns
      const sampleData = [
        {
          'Annexure-I': 'Sr No.',
          '__EMPTY': 'Branch Name',
          '__EMPTY_1': 'Cust Id',
          '__EMPTY_2': 'A/c Number',
          '__EMPTY_3': 'A/c Name',
          '__EMPTY_4': 'Scheme Code',
          '__EMPTY_5': 'Product Type',
          '__EMPTY_6': 'Sanction Limit',
          '__EMPTY_7': 'Date of NPA',
          '__EMPTY_8': 'O/s Bal.',
          '__EMPTY_9': 'Principle Overdue',
          '__EMPTY_10': 'Interest Overdue',
          '__EMPTY_11': 'Net Balance',
          '__EMPTY_12': 'Provision',
          '__EMPTY_13': 'Anomalies',
          '__EMPTY_14': 'Asset Classification',
          '__EMPTY_15': 'Asset Tagging Type',
          '__EMPTY_16': 'Contact No.',
          '__EMPTY_17': 'Communication Address'
        },
        {
          'Annexure-I': '1',
          '__EMPTY': 'Main Branch',
          '__EMPTY_1': 'C001',
          '__EMPTY_2': '191467310000967',
          '__EMPTY_3': 'John Doe',
          '__EMPTY_4': 'PL001',
          '__EMPTY_5': 'Personal Loan',
          '__EMPTY_6': '800000',
          '__EMPTY_7': '2024-01-15',
          '__EMPTY_8': '711618.08',
          '__EMPTY_9': '650000',
          '__EMPTY_10': '61618.08',
          '__EMPTY_11': '711618.08',
          '__EMPTY_12': '10%',
          '__EMPTY_13': 'None',
          '__EMPTY_14': 'NPA',
          '__EMPTY_15': 'Type A',
          '__EMPTY_16': '9876543210',
          '__EMPTY_17': 'Sample Address'
        }
      ];
      
      // Create a worksheet with sample data
      const ws = XLSX.utils.json_to_sheet(sampleData, { skipHeader: true });
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      // Save the file
      XLSX.writeFile(wb, 'debt_recovery_template.xlsx');
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to download template: ' + error.message);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <input
        ref={fileInputRef}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        id="excel-upload"
        type="file"
        onChange={handleFileUpload}
      />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleButtonClick}
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          disabled={loading}
        >
          Upload Excel
        </Button>
        <Button
          variant="outlined"
          onClick={downloadSampleFile}
          disabled={loading}
        >
          Download Template
        </Button>
      </Box>
      {loading && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Processing file...
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ExcelUpload;
