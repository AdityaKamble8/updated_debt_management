import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const CustomerAssignment = () => {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [failedEntries, setFailedEntries] = useState([]);
  const fileInputRef = React.useRef(null);
  const { user } = useAuth();

  // Handler for file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/i)) {
      setError('Please upload only Excel files (.xlsx or .xls)');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
          localStorage.setItem('excelData', JSON.stringify(jsonData));
          setError('');
          loadExcelData();
        } catch (error) {
          setError('Failed to parse Excel file: ' + error.message);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = (error) => {
        setError('Failed to read file: ' + error.message);
        setLoading(false);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Error uploading file: ' + err.message);
      setLoading(false);
    }
  };

  // Handler to open file input
  const handleUploadButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  useEffect(() => {
    // Fetch users and load Excel data when component mounts
    fetchUsers();
    loadExcelData();
  }, []);

  useEffect(() => {
    // Filter customers based on search term and selected branch
    let filtered = [...customers];
    
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedBranch) {
      filtered = filtered.filter(customer => customer.branch === selectedBranch);
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, selectedBranch]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5002/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      // Filter out admin users
      const filteredUsers = data.filter(user => user.role !== 'admin');
      setUsers(filteredUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExcelData = async () => {
    try {
      setLoading(true);
      setError('');
      // Get Excel data from localStorage
      const savedData = localStorage.getItem('excelData');
      if (!savedData) {
        setError('No Excel data found. Please upload an Excel file first.');
        setCustomers([]);
        setFilteredCustomers([]);
        setBranches([]);
        return;
      }
      const excelData = JSON.parse(savedData);
      // Transform Excel data to match customer format
      const transformedCustomers = excelData.map((item, index) => ({
        _id: `excel_${item.CUST_ID || ''}_${item.ACC_NO || ''}_${index}`,
        customerId: item.CUST_ID || '',
        accountNumber: item.ACC_NO || '',
        customerName: item.CUSTOMER_NAME || '',
        branch: item.BRANCH || 'Unknown',
        outstandingBalance: parseFloat(item.OUTSTANDING_BALANCE) || 0,
        principleOverdue: parseFloat(item.PRINCIPLE_OVERDUE) || 0,
        interestOverdue: parseFloat(item.INTEREST_OVERDUE) || 0,
        productType: item.PRODUCT_TYPE || '',
        dateOfNPA: item.DATE_OF_NPA || '',
        contactNo: item.CONTACT_NO || ''
      }));

      // Fetch assigned customers from backend and filter them out
      const token = localStorage.getItem('authToken');
      let assignedCustomerIds = new Set();
      let assignedAccountNumbers = new Set();
      try {
        const response = await fetch('http://localhost:5002/api/customers?limit=10000', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Only consider customers with assignedTo not null
          (data.customers || []).forEach(c => {
            if (c.assignedTo) {
              if (c.customerId) assignedCustomerIds.add(c.customerId);
              if (c.accountNumber) assignedAccountNumbers.add(c.accountNumber);
            }
          });
        }
      } catch (fetchErr) {
        // Backend fetch error should not block Excel load, just log
        console.error('Error fetching assigned customers:', fetchErr);
      }
      // Filter out already assigned customers
      const unassignedCustomers = transformedCustomers.filter(c =>
        !assignedCustomerIds.has(c.customerId) &&
        !assignedAccountNumbers.has(c.accountNumber)
      );
      setCustomers(unassignedCustomers);
      setFilteredCustomers(unassignedCustomers);
      // Extract unique branches
      const uniqueBranches = [...new Set(unassignedCustomers
        .map(customer => customer.branch)
        .filter(branch => branch && branch !== 'Unknown'))];
      setBranches(uniqueBranches);
    } catch (err) {
      setError('Error loading Excel data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection for a specific customer by unique _id only
  const handleToggleCustomer = (customerId) => {
    setSelectedCustomers(prev => {
      // Only toggle the exact _id, not by name or any other field
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  // Select or deselect all customers by their unique _id
  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer._id));
    }
  };


  const handleAssignCustomers = () => {
    if (!selectedUser || selectedCustomers.length === 0) {
      setError('Please select a user and at least one customer');
      return;
    }
    setConfirmOpen(true);
  };

  const handleAssignBranch = () => {
    if (!selectedUser || !selectedBranch) {
      setError('Please select both a user and a branch');
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setFailedEntries([]);
      const token = localStorage.getItem('authToken');
      
      // Get the selected customer data from the Excel data
      const selectedCustomerData = tabValue === 0
        ? customers.filter(c => selectedCustomers.includes(c._id))
        : customers.filter(c => c.branch === selectedBranch);
      
      if (selectedCustomerData.length === 0) {
        throw new Error('No customers selected');
      }
      
      console.log('Selected customers for assignment:', selectedCustomerData);
      
      // Create customers in the database first without assigning them
      const customersToCreate = selectedCustomerData.map(c => ({
        srNo: c.customerId || c.srNo || `CUST-${Math.floor(Math.random() * 10000)}`,
        branch: c.branch,
        customerId: c.customerId || c.srNo || `CUST-${Math.floor(Math.random() * 10000)}`,
        accountNumber: c.accountNumber || `ACC-${Math.floor(Math.random() * 100000)}`,
        customerName: c.customerName,
        schemeCode: c.schemeCode || 'DEFAULT',
        productType: c.productType || 'Unknown',
        sanctionLimit: c.sanctionLimit || parseFloat(c.outstandingBalance) || 0,
        dateOfNPA: c.dateOfNPA || new Date().toISOString(),
        outstandingBalance: parseFloat(c.outstandingBalance) || 0,
        principleOverdue: parseFloat(c.principleOverdue) || 0,
        interestOverdue: parseFloat(c.interestOverdue) || 0
        // No assignedTo field here - we'll assign in a separate step
      }));
      
      // First create the customers without assignment
      const createResponse = await fetch('http://localhost:5002/api/customers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customersToCreate)
      });
      
      const createData = await createResponse.json();
      if (!createResponse.ok && createResponse.status === 207 && createData.failedEntries) {
        setFailedEntries(createData.failedEntries);
        setError(createData.message || 'Some entries were not processed due to errors');
        return;
      } else if (!createResponse.ok) {
        throw new Error(createData.message || 'Failed to create customers');
      }
      
      // Now assign all the created customers using their IDs
      if (createData.customerIds && createData.customerIds.length > 0) {
        const assignResponse = await fetch('http://localhost:5002/api/customers/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: selectedUser,
            customerIds: createData.customerIds
          })
        });
        
        if (!assignResponse.ok) {
          const errorData = await assignResponse.json();
          throw new Error(errorData.message || 'Failed to assign customers');
        }
        
        const assignData = await assignResponse.json();
        console.log('Assignment result:', assignData);
      }
      
      // Set success message
      const successMessage = tabValue === 0
        ? `Successfully assigned ${selectedCustomerData.length} customers to ${users.find(u => u._id === selectedUser)?.username}`
        : `Successfully assigned all customers from branch ${selectedBranch} to ${users.find(u => u._id === selectedUser)?.username}`;
      
      setSuccess(successMessage);
      setSelectedUser('');
      setSelectedCustomers([]);
      setSelectedBranch('');
      loadExcelData(); // Refresh the Excel data
      
      // Force a refresh of the customer list by triggering a custom event
      const refreshEvent = new CustomEvent('refreshCustomerList');
      window.dispatchEvent(refreshEvent);
    } catch (err) {
      setError(err.message);
      setFailedEntries([]);
      console.error('Error assigning customers:', err);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedCustomers([]);
    setSelectedBranch('');
    setError('');
  };

  if (!user?.isAdmin) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="error">
            Access Denied
          </Typography>
          <Typography variant="body2">
            Only administrators can assign customers to users.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Assign Customers to Users
        </Typography>
        
        {error && (
          error === 'No Excel data found. Please upload an Excel file first.' ? (
            <Alert severity="error" sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleUploadButtonClick}>
                  Upload Excel File
                </Button>
              }
            >
              {error}
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
              {failedEntries.length > 0 && (
                <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="subtitle2">Failed Entries:</Typography>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                    <thead>
                      <tr>
                        <th style={{ borderBottom: '1px solid #ccc', padding: '2px 6px' }}>Name</th>
                        <th style={{ borderBottom: '1px solid #ccc', padding: '2px 6px' }}>Customer ID</th>
                        <th style={{ borderBottom: '1px solid #ccc', padding: '2px 6px' }}>Account #</th>
                        <th style={{ borderBottom: '1px solid #ccc', padding: '2px 6px' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedEntries.map((entry, idx) => (
                        <tr key={idx}>
                          <td style={{ borderBottom: '1px solid #eee', padding: '2px 6px' }}>{entry.customer.customerName}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '2px 6px' }}>{entry.customer.customerId}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '2px 6px' }}>{entry.customer.accountNumber}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '2px 6px', color: '#b71c1c' }}>{entry.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </Alert>
          )
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="user-select-label">Select User</InputLabel>
          <Select
            labelId="user-select-label"
            id="user-select"
            value={selectedUser}
            label="Select User"
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loading}
          >
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.username} ({user.branch})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="assignment tabs"
          >
            <Tab label="Assign Individual Customers" />
            <Tab label="Assign by Branch" />
          </Tabs>
        </Box>
        
        {tabValue === 0 ? (
          // Individual customer assignment tab
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Search Customers"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="branch-filter-label">Filter by Branch</InputLabel>
                <Select
                  labelId="branch-filter-label"
                  id="branch-filter"
                  value={selectedBranch}
                  label="Filter by Branch"
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Branches</em>
                  </MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      {branch}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Paper sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < filteredCustomers.length}
                      onChange={handleSelectAll}
                      disabled={filteredCustomers.length === 0}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="subtitle2">Select All ({filteredCustomers.length})</Typography>} 
                  />
                </ListItem>
                
                <Divider />
                
                {filteredCustomers.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No customers found" />
                  </ListItem>
                ) : (
                  filteredCustomers.map((customer) => (
                    <ListItem key={customer._id} button onClick={() => handleToggleCustomer(customer._id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedCustomers.includes(customer._id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={customer.customerName}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              ID: {customer.customerId} | Account: {customer.accountNumber}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Branch: {customer.branch} | Outstanding: ₹{customer.outstandingBalance.toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {selectedCustomers.length} customers selected
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleAssignCustomers}
                disabled={loading || !selectedUser || selectedCustomers.length === 0}
              >
                {loading ? <CircularProgress size={24} /> : 'Assign Selected Customers'}
              </Button>
            </Box>
          </Box>
        ) : (
          // Branch assignment tab
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="branch-select-label">Select Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                id="branch-select"
                value={selectedBranch}
                label="Select Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={loading}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAssignBranch}
                disabled={loading || !selectedUser || !selectedBranch}
              >
                {loading ? <CircularProgress size={24} /> : 'Assign Branch to User'}
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
      
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Assignment</DialogTitle>
        <DialogContent>
          {tabValue === 0 ? (
            <>
              <Typography>
                Are you sure you want to assign <strong>{selectedCustomers.length}</strong> selected customers to user <strong>{users.find(u => u._id === selectedUser)?.username}</strong>?
              </Typography>
              
              {/* Display list of selected customers */}
              <Paper sx={{ maxHeight: 200, overflow: 'auto', mt: 2 }}>
                <List dense>
                  {selectedCustomers.map(customerId => {
                    const customer = customers.find(c => c._id === customerId);
                    if(customer) {
                      return (
                        <ListItem key={customer._id}>
                          <ListItemText
                            primary={customer.customerName}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  ID: {customer.customerId} | Account: {customer.accountNumber}
                                </Typography>
                                <br />
                                <Typography variant="body2" component="span">
                                  Branch: {customer.branch} | Outstanding: ₹{customer.outstandingBalance.toLocaleString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      );
                    } else {
                      return null;
                    }
                  })}
                </List>
              </Paper>
            </>
          ) : (
            <Typography>
              Are you sure you want to assign all customers from branch <strong>{selectedBranch}</strong> to user <strong>{users.find(u => u._id === selectedUser)?.username}</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmAssignment} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CustomerAssignment;
