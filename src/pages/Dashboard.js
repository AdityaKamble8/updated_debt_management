import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import ExcelUpload from '../components/ExcelUpload';
import CustomerAssignment from '../components/CustomerAssignment';
import { useAuth } from '../context/AuthContext';
import { useRecovery } from '../context/RecoveryContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalOutstanding: 0,
    totalPrincipleOverdue: 0,
    totalInterestOverdue: 0,
    pendingCases: 0,
    highRiskAccounts: 0,
    monthlyNPA: [],
    productTypeDistribution: [],
    branchPerformance: [],
    assetClassification: [],
    anomaliesDistribution: []
  });

  const { recoveryStats } = useRecovery();

  useEffect(() => {
    const savedData = localStorage.getItem('excelData');
    if (savedData) {
      processExcelData(JSON.parse(savedData));
    }
  }, []);

  const processExcelData = (data) => {
    localStorage.setItem('excelData', JSON.stringify(data));

    // Calculate total amounts
    const totalOutstanding = data.reduce((sum, row) => sum + (parseFloat(row.OUTSTANDING_BALANCE) || 0), 0);
    const totalPrincipleOverdue = data.reduce((sum, row) => sum + (parseFloat(row.PRINCIPLE_OVERDUE) || 0), 0);
    const totalInterestOverdue = data.reduce((sum, row) => sum + (parseFloat(row.INTEREST_OVERDUE) || 0), 0);
    
    // Count cases
    const pendingCases = data.length;
    
    // Count high risk accounts (based on Asset Classification)
    const highRiskAccounts = data.filter(row => 
      row.ASSET_CLASSIFICATION?.toLowerCase().includes('npa')
    ).length;
    
    // Process monthly NPA data
    const monthlyData = {};
    data.forEach(row => {
      if (row.DATE_OF_NPA) {
        const date = new Date(row.DATE_OF_NPA);
        const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + (parseFloat(row.NET_BALANCE) || 0);
      }
    });

    // Product type distribution
    const productTypes = {};
    data.forEach(row => {
      const type = row.PRODUCT_TYPE || 'Unknown';
      productTypes[type] = (productTypes[type] || 0) + (parseFloat(row.NET_BALANCE) || 0);
    });

    // Branch performance
    const branches = {};
    data.forEach(row => {
      const branch = row.BRANCH || 'Unknown';
      branches[branch] = (branches[branch] || 0) + (parseFloat(row.NET_BALANCE) || 0);
    });

    // Asset Classification distribution
    const assetClasses = {};
    data.forEach(row => {
      const classification = row.ASSET_CLASSIFICATION || 'Unclassified';
      assetClasses[classification] = (assetClasses[classification] || 0) + (parseFloat(row.NET_BALANCE) || 0);
    });

    // Anomalies distribution
    const anomalies = {};
    data.forEach(row => {
      const anomaly = row.ANOMALIES || 'None';
      if (!anomalies[anomaly]) {
        anomalies[anomaly] = { count: 0, amount: 0 };
      }
      anomalies[anomaly].count += 1;
      anomalies[anomaly].amount += parseFloat(row.NET_BALANCE) || 0;
    });

    setDashboardData({
      totalOutstanding,
      totalPrincipleOverdue,
      totalInterestOverdue,
      pendingCases,
      highRiskAccounts,
      monthlyNPA: Object.entries(monthlyData).map(([name, amount]) => ({
        name,
        amount,
      })),
      productTypeDistribution: Object.entries(productTypes).map(([name, value]) => ({
        name,
        value,
      })),
      branchPerformance: Object.entries(branches)
        .map(([name, amount]) => ({
          name,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount),
      assetClassification: Object.entries(assetClasses).map(([name, value]) => ({
        name,
        value,
      })),
      anomaliesDistribution: Object.entries(anomalies).map(([name, data]) => ({
        name,
        count: data.count,
        amount: data.amount,
      }))
    });
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
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Outstanding
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(dashboardData.totalOutstanding)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Principle: {formatCurrency(dashboardData.totalPrincipleOverdue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interest: {formatCurrency(dashboardData.totalInterestOverdue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recovery Status
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(recoveryStats.totalRecovered)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recovered Amount
                </Typography>
                <Typography variant="h6" color="error" sx={{ mt: 1 }}>
                  {formatCurrency(recoveryStats.totalPending)} Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Case Summary
                </Typography>
                <Typography variant="h4" color="success.main">
                  {recoveryStats.recoveredCases}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cases Recovered
                </Typography>
                <Typography variant="h6" color="error" sx={{ mt: 1 }}>
                  {recoveryStats.pendingCases} Cases Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly NPA Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.monthlyNPA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.productTypeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => entry.name}
                      >
                        {dashboardData.productTypeDistribution.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch Performance
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.branchPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Asset Classification
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.assetClassification}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${((entry.value / dashboardData.totalOutstanding) * 100).toFixed(1)}%`}
                      >
                        {dashboardData.assetClassification.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Data Management - Role-based */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Management
                </Typography>
                
                {user?.isAdmin ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Admin sees both Excel Upload and Customer Assignment */}
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Upload Customer Data
                      </Typography>
                      <ExcelUpload onDataUpload={processExcelData} />
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Assign Customers to Users
                      </Typography>
                      <CustomerAssignment />
                    </Box>
                  </Box>
                ) : user?.isManager ? (
                  <Box>
                    {/* Managers can upload Excel data */}
                    <Typography variant="subtitle1" gutterBottom>
                      Upload Customer Data
                    </Typography>
                    <ExcelUpload onDataUpload={processExcelData} />
                  </Box>
                ) : (
                  <Box>
                    {/* Regular users see a message about their assigned customers */}
                    <Typography variant="body1">
                      You can view and manage the customers assigned to you. Contact your manager or admin if you need access to additional customers.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default Dashboard;
