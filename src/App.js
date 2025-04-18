import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import theme from './styles/theme';
import { RecoveryProvider } from './context/RecoveryContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import BranchManagement from './pages/BranchManagement';
import CustomerList from './pages/CustomerList';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

// Import components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <AnimatePresence mode='wait'>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="branches" element={<BranchManagement />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RecoveryProvider>
          <Router>
            <AppContent />
          </Router>
        </RecoveryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
