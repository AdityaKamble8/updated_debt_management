import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRecovery } from '../context/RecoveryContext';
import { useAuth } from '../context/AuthContext';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { recoveredLoans, addRecoveredLoan, removeRecoveredLoan, updateTotalStats } = useRecovery();
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm]);
  
  // Listen for the custom refresh event to reload customer list when assignments change
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Refreshing customer list due to assignment changes');
      fetchCustomers();
    };
    
    window.addEventListener('refreshCustomerList', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshCustomerList', handleRefresh);
    };
  }, []);
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      // Build query parameters
      const params = new URLSearchParams({
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      // For regular users, show all assigned entries (including duplicate names)
      // For admin/manager, show all customers as usual
      let url = `http://localhost:5002/api/customers?${params}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      // Filter out assigned customers: regular users see only their assignments, admins see only unassigned
      let filteredCustomers = [];
      if (user && user.role === 'user') {
        filteredCustomers = data.customers.filter(c => c.assignedTo && c.assignedTo._id === user.id);
      } else {
        filteredCustomers = data.customers.filter(c => !c.assignedTo);
      }
      setCustomers(filteredCustomers);
      // Update pagination counts based on filtered list
      setTotalCustomers(filteredCustomers.length);
      setTotalPages(Math.ceil(filteredCustomers.length / rowsPerPage));
      updateTotalStats(filteredCustomers);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleRecoveryToggle = (customer) => {
    // Check if the customer is already marked as recovered
    const isRecovered = recoveredLoans.some(loan => 
      (loan.customerId && loan.customerId === customer.customerId) || 
      (loan._id && loan._id === customer._id)
    );
    
    if (isRecovered) {
      // Remove from recovered loans
      const idToRemove = customer.customerId || customer._id;
      removeRecoveredLoan(idToRemove);
    } else {
      // Add to recovered loans
      addRecoveredLoan(customer);
    }
  };
  
  const handleSelectAllRecovery = () => {
    // If all visible customers are already recovered, unmark all
    const allRecovered = customers.every(customer => 
      recoveredLoans.some(loan => 
        (loan.customerId && loan.customerId === customer.customerId) || 
        (loan._id && loan._id === customer._id)
      )
    );
    
    if (allRecovered) {
      // Remove all visible customers from recovered loans
      customers.forEach(customer => {
        const idToRemove = customer.customerId || customer._id;
        removeRecoveredLoan(idToRemove);
      });
    } else {
      // Add all visible customers to recovered loans
      customers.forEach(customer => {
        // Only add if not already recovered
        const isAlreadyRecovered = recoveredLoans.some(loan => 
          (loan.customerId && loan.customerId === customer.customerId) || 
          (loan._id && loan._id === customer._id)
        );
        
        if (!isAlreadyRecovered) {
          addRecoveredLoan(customer);
        }
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ width: '100%' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Search Customers"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Box display="flex" alignItems="center">
                      <Checkbox
                        color="primary"
                        onChange={handleSelectAllRecovery}
                        checked={
                          customers.length > 0 &&
                          customers.every(customer => 
                            recoveredLoans.some(loan => 
                              (loan.customerId && loan.customerId === customer.customerId) || 
                              (loan._id && loan._id === customer._id)
                            )
                          )
                        }
                        indeterminate={
                          customers.some(customer => 
                            recoveredLoans.some(loan => 
                              (loan.customerId && loan.customerId === customer.customerId) || 
                              (loan._id && loan._id === customer._id)
                            )
                          ) && 
                          !customers.every(customer => 
                            recoveredLoans.some(loan => 
                              (loan.customerId && loan.customerId === customer.customerId) || 
                              (loan._id && loan._id === customer._id)
                            )
                          )
                        }
                      />
                      <Typography variant="subtitle2">Recovered</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">Customer ID</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">Customer Name</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">Account Number</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">Branch</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">Product Type</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">Outstanding</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">Principle</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">Interest</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Pending"
                      color="error"
                      size="small"
                    />
                  </TableCell>
                  {user?.isAdmin && (
                    <TableCell>
                      <Chip 
                        label="Unassigned" 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={user?.isAdmin ? 11 : 10} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Loading customers...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.isAdmin ? 11 : 10} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1">
                        No customers found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {searchTerm ? 'Try a different search term' : 'No customers have been assigned yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => {
                    const isRecovered = recoveredLoans.some(loan => 
                      (loan.customerId && loan.customerId === customer.customerId) || 
                      (loan._id && loan._id === customer._id) || 
                      (loan.SR_NO && loan.SR_NO === customer.SR_NO) || 
                      (loan.accountNumber && loan.accountNumber === customer.accountNumber)
                    );
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={customer._id}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isRecovered}
                            onChange={() => handleRecoveryToggle(customer)}
                          />
                        </TableCell>
                        <TableCell>{customer.customerId}</TableCell>
                        <TableCell>{customer.customerName}</TableCell>
                        <TableCell>{customer.accountNumber}</TableCell>
                        <TableCell>{customer.branch}</TableCell>
                        <TableCell>{customer.productType}</TableCell>
                        <TableCell align="right">
                          {parseFloat(customer.outstandingBalance || 0).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(customer.principleOverdue || 0).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(customer.interestOverdue || 0).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isRecovered ? 'Recovered' : 'Pending'}
                            color={isRecovered ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        {user?.isAdmin && (
                          <TableCell>
                            <Chip 
                              label="Unassigned" 
                              variant="outlined" 
                              size="small" 
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCustomers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </motion.div>
  );
};

export default CustomerList;
