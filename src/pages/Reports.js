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
  <TableCell>Assigned To</TableCell>
  <TableCell>Details</TableCell>
</TableRow>
              </TableHead>
              <TableBody>
                {recoveredLoans.map((loan, idx) => {
  // Fallback for both camelCase and UPPERCASE fields
  const customerName = loan.customerName || loan.CUSTOMER_NAME || loan.name || 'N/A';
  const accountNumber = loan.accountNumber || loan.ACC_NO || loan.accountNo || 'N/A';
  const branch = loan.branch || loan.BRANCH || 'N/A';
  const productType = loan.productType || loan.PRODUCT_TYPE || 'N/A';
  const recoveredAmount = loan.outstandingBalance || loan.NET_BALANCE || loan.recoveredAmount || 0;
  const dateOfNPA = loan.dateOfNPA || loan.DATE_OF_NPA || loan.npaDate || loan.recoveredDate || '';
  const contact = loan.contactNo || loan.CONTACT_NO || loan.phone || loan.mobile || 'N/A';
  const assignedTo = loan.assignedTo?.name || loan.assignedToName || loan.ASSIGNED_TO || 'Unassigned';
  // Details expand
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment key={loan._id || loan.SR_NO || idx}>
      <TableRow hover>
        <TableCell>{customerName}</TableCell>
        <TableCell>{accountNumber}</TableCell>
        <TableCell>{branch}</TableCell>
        <TableCell>{productType}</TableCell>
        <TableCell>{formatCurrency(recoveredAmount)}</TableCell>
        <TableCell>{formatDate(dateOfNPA)}</TableCell>
        <TableCell>{contact}</TableCell>
        <TableCell>{
          loan.assignedTo?.name ||
          loan.assignedTo?.username ||
          loan.assignedToName ||
          loan.ASSIGNED_TO ||
          loan.userName ||
          loan.user ||
          'Unassigned'
        }</TableCell>
        <TableCell>
          <button onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Details'}</button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={9}>
            <Box sx={{ p: 3, background: '#fffde7', borderRadius: 2, border: '3px solid rgb(241, 150, 13)', boxShadow: 3, color: '#111' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}><b>Customer Name:</b> {loan.customerName || loan.CUSTOMER_NAME || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Account No:</b> {loan.accountNumber || loan.ACC_NO || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Branch:</b> {loan.branch || loan.BRANCH || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Product Type:</b> {loan.productType || loan.PRODUCT_TYPE || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Outstanding:</b> {formatCurrency(loan.outstandingBalance || loan.OUTSTANDING_BALANCE || 0)}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Interest Overdue:</b> {formatCurrency(loan.interestOverdue || loan.INTEREST_OVERDUE || 0)}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Principle Overdue:</b> {formatCurrency(loan.principleOverdue || loan.PRINCIPLE_OVERDUE || 0)}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Date of NPA:</b> {formatDate(loan.dateOfNPA || loan.DATE_OF_NPA)}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Contact:</b> {loan.contactNo || loan.CONTACT_NO || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Scheme Code:</b> {loan.schemeCode || loan.SCHEME_CODE || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Sanction Limit:</b> {formatCurrency(loan.sanctionLimit || loan.SANCTION_LIMIT || 0)}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Anomalies:</b> {loan.anomalies || loan.ANOMALIES || 'N/A'}</Grid>
                <Grid item xs={12} sm={6} md={4}><b>Assigned User:</b> {loan.assignedTo?.name || loan.assignedTo?.username || loan.assignedToName || loan.ASSIGNED_TO || 'Unassigned'}</Grid>
                {loan.assignedTo && (
                  <Grid item xs={12} sm={6} md={4}>
                    <b style={{color:'#ff9800', fontWeight:700}}>Assigned User Details:</b><br />
                    Name: {loan.assignedTo.name || loan.assignedTo.username}<br />
                    Username: {loan.assignedTo.username}<br />
                    Role: {loan.assignedTo.role}<br />
                    Branch: {loan.assignedTo.branch}
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box mt={2} display="flex" gap={2}>
  <button style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:4,padding:'8px 20px',fontWeight:600,cursor:'pointer'}}>Add Visit</button>
  <button
    style={{background:'#388e3c',color:'#fff',border:'none',borderRadius:4,padding:'8px 20px',fontWeight:600,cursor:'pointer'}}
    onClick={async () => {
      if (!loan._id) return alert('Customer ID missing');
      if (!navigator.geolocation) return alert('Geolocation is not supported');
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const token = localStorage.getItem('authToken');
          const res = await fetch(`http://localhost:5002/api/customers/${loan._id}/location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ lat, lng })
          });
          
          const data = await res.json();
          console.log(res);
          if (res.ok) {
            alert(`Location saved!\nLat: ${lat}\nLng: ${lng}`);
          } else {
            alert('Failed to save location: ' + (data.message || 'Unknown error'));
          }
        } catch (err) {
          alert('Error saving location: ' + err.message);
        }
      }, (err) => {
        alert('Could not get location: ' + err.message);
      });
    }}
  >Location</button>
</Box>
                </Grid>
              </Grid>
            </Box>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
})}
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
