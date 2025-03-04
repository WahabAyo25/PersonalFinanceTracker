import { createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
};

type AppContextType = {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

const STORAGE_KEY = '@transactions';

export const loadTransactions = async () => {
  try {
    const savedTransactions = await AsyncStorage.getItem(STORAGE_KEY);
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return [];
  }
};

export const saveTransactions = async (transactions: Transaction[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions:', error);
  }
};