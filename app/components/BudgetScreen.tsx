import React, { useEffect, useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';

const BudgetScreen = () => {
  const { transactions } = useContext(AppContext);
  const [budgets, setBudgets] = useState([]);

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Available income after expenses
  const availableIncome = totalIncome - totalExpenses;

  useEffect(() => {
    if (availableIncome > 0) {
      const newBudgets = [
        { 
          id: 1, 
          category: 'Needs', 
          allocated: availableIncome * 0.5, 
          color: '#27ae60',
          icon: 'cart',
          percentage: '50%'
        },
        { 
          id: 2, 
          category: 'Wants', 
          allocated: availableIncome * 0.3, 
          color: '#3498db',
          icon: 'ticket',
          percentage: '30%'
        },
        { 
          id: 3, 
          category: 'Savings', 
          allocated: availableIncome * 0.2, 
          color: '#9b59b6',
          icon: 'piggy-bank',
          percentage: '20%'
        },
      ];
      setBudgets(newBudgets);
    } else {
      setBudgets([]);
    }
  }, [availableIncome]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budget Planner</Text>
          <View style={styles.incomeCard}>
            <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
            <View style={styles.incomeTextContainer}>
              <Text style={styles.incomeLabel}>Available Income</Text>
              <Text style={styles.incomeAmount}>${availableIncome.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Allocation Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>50/30/20 Allocation</Text>
          <View style={styles.gridContainer}>
            {budgets.map(budget => (
              <TouchableOpacity 
                key={budget.id} 
                style={[styles.gridCard, { backgroundColor: budget.color }]}
              >
                <MaterialCommunityIcons 
                  name={budget.icon} 
                  size={28} 
                  color="#fff" 
                  style={styles.gridIcon}
                />
                <Text style={styles.gridPercentage}>{budget.percentage}</Text>
                <Text style={styles.gridCategory}>{budget.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Detailed Allocation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
          {budgets.map(budget => (
            <View key={budget.id} style={styles.allocationCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: budget.color }]} />
                <Text style={styles.categoryName}>{budget.category}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>${budget.allocated.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 24,
  },
  incomeCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  incomeTextContainer: {
    marginLeft: 16,
  },
  incomeLabel: {
    color: '#ecf0f1',
    fontSize: 14,
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '30%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    aspectRatio: 1,
  },
  gridIcon: {
    marginBottom: 8,
  },
  gridPercentage: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  gridCategory: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  allocationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginRight: 8,
  },
});

export default BudgetScreen;