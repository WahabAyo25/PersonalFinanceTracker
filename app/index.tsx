// Ensure Firebase is initialized globally before any other app code runs
import './utils/firebase'; // <<< CRITICAL: Import for side effects (initialization)

import React, { useState, useEffect } from 'react';
import { AppContext, loadTransactions, saveTransactions, Transaction } from './context/AppContext'; // Assuming Transaction type is exported
import RootNavigator from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SettingsProvider } from './context/SettingsContext';
import { Platform, UIManager } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const App = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Added type for transactions

  useEffect(() => {
    const initializeTransactions = async () => {
      const loadedTransactions = await loadTransactions();
      setTransactions(loadedTransactions);
    };
    initializeTransactions();
  }, []);

  const appContextValue = {
    transactions,
    addTransaction: (transaction: Transaction) => { // Added type for transaction parameter
      const updatedTransactions = [...transactions, transaction];
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
    },
    deleteTransaction: (id: string | number) => { // Assuming id can be string or number
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContext.Provider value={appContextValue}>
          <RootNavigator />
        </AppContext.Provider>
      </GestureHandlerRootView>
    </SettingsProvider>
  );
};

export default App;