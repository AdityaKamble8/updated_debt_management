import React, { createContext, useContext, useState } from 'react';

const RecoveryContext = createContext();

export const useRecovery = () => {
  const context = useContext(RecoveryContext);
  if (!context) {
    throw new Error('useRecovery must be used within a RecoveryProvider');
  }
  return context;
};

export const RecoveryProvider = ({ children }) => {
  const [recoveredLoans, setRecoveredLoans] = useState(() => {
    const saved = localStorage.getItem('recoveredLoans');
    return saved ? JSON.parse(saved) : [];
  });
  const [recoveryStats, setRecoveryStats] = useState({
    totalRecovered: 0,
    totalPending: 0,
    recoveredCases: 0,
    pendingCases: 0
  });

  const addRecoveredLoan = (loan) => {
    setRecoveredLoans(prev => {
      const updated = [...prev, loan];
      localStorage.setItem('recoveredLoans', JSON.stringify(updated));
      updateRecoveryStats(updated);
      return updated;
    });
  };

  const removeRecoveredLoan = (loanId) => {
    setRecoveredLoans(prev => {
      const updated = prev.filter(loan => 
        (loan.SR_NO !== loanId) && 
        (loan.customerId !== loanId) && 
        (loan._id !== loanId)
      );
      localStorage.setItem('recoveredLoans', JSON.stringify(updated));
      updateRecoveryStats(updated);
      return updated;
    });
  };

  const updateRecoveryStats = (currentRecoveredLoans) => {
    const totalRecovered = currentRecoveredLoans.reduce((sum, loan) => {
      // Handle both old and new data formats
      const amount = loan.NET_BALANCE || loan.outstandingBalance || 0;
      return sum + parseFloat(amount);
    }, 0);

    setRecoveryStats({
      totalRecovered,
      recoveredCases: currentRecoveredLoans.length,
      totalPending: 0, // This will be updated when we get all loans data
      pendingCases: 0  // This will be updated when we get all loans data
    });
  };

  const updateTotalStats = (allLoans) => {
    const totalAmount = allLoans.reduce((sum, loan) => {
      // Handle both old and new data formats
      const amount = loan.NET_BALANCE || loan.outstandingBalance || 0;
      return sum + parseFloat(amount);
    }, 0);

    setRecoveryStats(prev => ({
      ...prev,
      totalPending: totalAmount - prev.totalRecovered,
      pendingCases: allLoans.length - prev.recoveredCases
    }));
  };

  // Keep stats updated if recoveredLoans changes (e.g. on reload)
  React.useEffect(() => {
    updateRecoveryStats(recoveredLoans);
  }, [recoveredLoans]);

  return (
    <RecoveryContext.Provider value={{
      recoveredLoans,
      recoveryStats,
      addRecoveredLoan,
      removeRecoveredLoan,
      updateTotalStats
    }}>
      {children}
    </RecoveryContext.Provider>
  );
};
