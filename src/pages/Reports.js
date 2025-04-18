import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRecovery } from '../context/RecoveryContext';

const Reports = () => {
  const { recoveredLoans, recoveryStats } = useRecovery();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recovery Reports
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Total Recovered
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(recoveryStats.totalRecovered)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Cases Recovered
                </Typography>
                <Typography variant="h4">
                  {recoveryStats.recoveredCases}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Recovery Rate
                </Typography>
                <Typography variant="h4">
                  {((recoveryStats.recoveredCases / (recoveryStats.recoveredCases + recoveryStats.pendingCases)) * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recovered Loans Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="recovered loans table">
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Account No.</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Product Type</TableCell>
                  <TableCell>Recovered Amount</TableCell>
                  <TableCell>Date of NPA</TableCell>
                  <TableCell>Contact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recoveredLoans.map((loan) => (
                  <TableRow hover key={loan.SR_NO}>
                    <TableCell>{loan.CUSTOMER_NAME}</TableCell>
                    <TableCell>{loan.ACC_NO}</TableCell>
                    <TableCell>{loan.BRANCH}</TableCell>
                    <TableCell>{loan.PRODUCT_TYPE}</TableCell>
                    <TableCell>{formatCurrency(loan.NET_BALANCE)}</TableCell>
                    <TableCell>{formatDate(loan.DATE_OF_NPA)}</TableCell>
                    <TableCell>{loan.CONTACT_NO}</TableCell>
                  </TableRow>
                ))}
                {recoveredLoans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No recovered loans yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </motion.div>
  );
};

export default Reports;
