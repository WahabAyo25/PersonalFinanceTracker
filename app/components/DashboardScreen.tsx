import React, { useState, useMemo, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Keyboard, Modal } from 'react-native';
import { AppContext, Transaction } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatCurrency';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AddTransactionModal from './AddTransactionModal';
import TransactionItem from './TransactionItem';
import { LinearGradient } from 'expo-linear-gradient';

type Category = 'Food' | 'Transport' | 'Housing' | 'Entertainment' | 'Utilities';

const DashboardScreen = () => {
  const { transactions, addTransaction, deleteTransaction } = useContext(AppContext);
  const { settings } = useSettings();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  
  const [formState, setFormState] = useState({
    title: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: 'Food' as Category,
    date: new Date()
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const typeMatch = selectedType === 'all' || t.type === selectedType;
      const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;
      return typeMatch && categoryMatch;
    });
  }, [transactions, selectedType, selectedCategory]);

  const { totalIncome, totalExpense, balance } = useMemo(() => ({
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    balance: transactions.reduce(
      (sum, t) => (t.type === 'income' ? sum + t.amount : sum - t.amount),
      0
    ),
  }), [transactions]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌞';
    if (hour < 18) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  const getBalanceStatus = () => {
    if (balance > 0) return "You're doing great!";
    if (balance < 0) return "Let's work on this together!";
    return "Fresh start! Ready to track?";
  };

  const handleAddTransaction = () => {
    const amountNumber = Number(formState.amount);
    if (!formState.amount || isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Oops!', 'Please enter a valid amount to continue');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...formState,
      amount: amountNumber,
      date: formState.date.toISOString(),
    };

    addTransaction(newTransaction);
    setShowAddModal(false);
    setFormState(prev => ({
      ...prev,
      title: '',
      amount: '',
      type: 'income',
      category: 'Food',
      date: new Date()
    }));
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Friendly Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
      </View>

      {/* Balance Card */}
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>Current Balance</Text>
          <FontAwesome5 name="coins" size={20} color="rgba(255,255,255,0.8)" />
        </View>
        
        <Text style={[styles.balance, { color: '#fff' }]}>
          {formatCurrency(balance, settings.currency)}
        </Text>
        <Text style={styles.balanceStatus}>{getBalanceStatus()}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statBadge}>
              <Ionicons name="trending-up" size={16} color="#2ecc71" />
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <Text style={styles.statText}>{formatCurrency(totalIncome, settings.currency)}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.statItem}>
            <View style={styles.statBadge}>
              <Ionicons name="trending-down" size={16} color="#e74c3c" />
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <Text style={styles.statText}>{formatCurrency(totalExpense, settings.currency)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Transaction Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterText}>View Options</Text>
          <MaterialIcons name="tune" size={18} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TransactionItem 
            item={item} 
            deleteTransaction={deleteTransaction}
            currency={settings.currency}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <MaterialIcons 
              name="savings" 
              size={48} 
              color="#bdc3c7" 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyList}>
              {transactions.length === 0 ? 'Nothing to show yet!' : 'No transactions match the filters'}
            </Text>
            <Text style={styles.emptySubtext}>
              {transactions.length === 0 
                ? 'Start your financial journey by adding your first transaction'
                : 'Try adjusting your filters to see more'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.transactionList}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Transaction Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#3498db', '#2980b9']}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialIcons name="add" size={30} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddModal}
        formState={formState}
        setFormState={setFormState}
        onSubmit={handleAddTransaction}
        onClose={() => {
          setShowAddModal(false);
          Keyboard.dismiss();
        }}
        currency={settings.currency}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>View Options</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
              <View style={styles.filterOptions}>
                {['all', 'income', 'expense'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButtonOption,
                      selectedType === type && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedType(type as 'all' | 'income' | 'expense')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedType === type && styles.selectedFilterOptionText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                {['all', 'Food', 'Transport', 'Housing', 'Entertainment', 'Utilities'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterButtonOption,
                      selectedCategory === category && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedCategory(category as Category | 'all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCategory === category && styles.selectedFilterOptionText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  balanceStatus: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  statText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  filterText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyListContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
    padding: 20,
  },
  emptyIcon: {
    opacity: 0.3,
  },
  emptyList: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  transactionList: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    width: 80,
    height: 65,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButtonOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedFilterOption: {
    backgroundColor: '#3498db',
  },
  filterOptionText: {
    color: '#2c3e50',
    fontSize: 14,
  },
  selectedFilterOptionText: {
    color: 'white',
  },
});

export default DashboardScreen;