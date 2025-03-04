import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';


const TransactionItem = ({ 
  item, 
  deleteTransaction,
  currency
}: { 
  item: Transaction,
  deleteTransaction: (id: string) => void,
  currency: 'GBP' | 'NGN' | 'USD' // Add currency prop
}) => {
  const transactionDate = new Date(item.date);
  
  // Format time as HH:MM AM/PM
  const formattedTime = transactionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get relative date label
  const getDateLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(transactionDate);
    dateToCheck.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateToCheck.getTime() === today.getTime()) return 'Today';
    if (dateToCheck.getTime() === yesterday.getTime()) return 'Yesterday';
    
    return dateToCheck.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={item.type === 'income' ? 'arrow-upward' : 'arrow-downward'} 
          size={20} 
          color={item.type === 'income' ? '#2ecc71' : '#e74c3c'} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.time}>
          {getDateLabel()}, {formattedTime}
        </Text>
      </View>
      <Text style={[
        styles.amount,
        { color: item.type === 'income' ? '#2ecc71' : '#e74c3c' }
      ]}>
        {formatCurrency(item.amount, currency)}
      </Text>
      <TouchableOpacity 
        onPress={() => deleteTransaction(item.id)}
        style={styles.deleteButton}
      >
        <MaterialIcons name="delete-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );
};

// Keep the same styles as before
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  time: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  deleteButton: {
    padding: 8,
  },
});

export default TransactionItem;