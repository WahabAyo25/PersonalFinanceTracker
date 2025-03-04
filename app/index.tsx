import React, { useState, useEffect } from 'react';
import { AppContext, loadTransactions, saveTransactions } from './context/AppContext';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SettingsProvider } from './context/SettingsContext';

const App = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const initializeTransactions = async () => {
      const loadedTransactions = await loadTransactions();
      setTransactions(loadedTransactions);
    };
    initializeTransactions();
  }, []);

  const appContextValue = {
    transactions,
    addTransaction: (transaction: any) => {
      const updatedTransactions = [...transactions, transaction];
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
    },
    deleteTransaction: (id: any) => {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
    },
    clearAllTransactions: () => {
      setTransactions([]);
      saveTransactions([]);
    },
  };

  return (
    <SettingsProvider>
    <GestureHandlerRootView style={{ flex: 1 }}> {/* Wrap your root component */}
    <AppContext.Provider value={appContextValue}>
      <AppNavigator />
    </AppContext.Provider>
    </GestureHandlerRootView>
    </SettingsProvider> 

  );
};

export default App;