// screens/DashboardScreen.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';

// *** ENSURE THIS IMPORT IS CORRECT AND THE PACKAGE IS INSTALLED ***
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports
import { auth, db } from '../utils/firebase'; // Adjust path
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc, // Import getDoc for fetching a single document
} from 'firebase/firestore';

// Context and Utils
import { useSettings } from '../context/SettingsContext'; // Adjust path
import { formatCurrency } from '../utils/formatCurrency';   // Adjust path

// Icons
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

// Components
import AddTransactionModal from './AddTransactionModal'; // Adjust path
import TransactionItem from './TransactionItem';     // Adjust path

// --- Shared Types (Inline for this example, ideally from a central types.ts) ---
export type TransactionType = 'income' | 'expense';

export type IncomeCategoryName =
  | 'Part-time Job' | 'Allowance' | 'Scholarship' | 'Tutoring' | 'Selling Stuff'
  | 'Gifts Received' | 'Side Hustle' | 'Other Income';

export type ExpenseCategoryName =
  | 'Food & Snacks' | 'Books & Supplies' | 'Transport' | 'Entertainment' | 'Social Outings'
  | 'Subscriptions' | 'Rent/Dorm' | 'Phone/Internet' | 'Clothing' | 'Personal Care'
  | 'Study Tools' | 'Fees (Uni/College)' | 'Savings Contribution' | 'Other Expense';

export type Category = IncomeCategoryName | ExpenseCategoryName;

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: Date;
  createdAt?: Timestamp | Date;
}

export type Currency = 'GBP' | 'NGN' | 'USD';

const ALL_INCOME_CATEGORIES: IncomeCategoryName[] = [
  'Part-time Job', 'Allowance', 'Scholarship', 'Tutoring', 'Selling Stuff',
  'Gifts Received', 'Side Hustle', 'Other Income'
];
const ALL_EXPENSE_CATEGORIES: ExpenseCategoryName[] = [
  'Food & Snacks', 'Books & Supplies', 'Transport', 'Entertainment', 'Social Outings',
  'Subscriptions', 'Rent/Dorm', 'Phone/Internet', 'Clothing', 'Personal Care',
  'Study Tools', 'Fees (Uni/College)', 'Savings Contribution', 'Other Expense'
];
const ALL_CATEGORIES_FOR_FILTER: Category[] = [...ALL_INCOME_CATEGORIES, ...ALL_EXPENSE_CATEGORIES];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DashboardScreen = () => {
  const { settings } = useSettings();
  const currentCurrency = settings.currency as Currency || 'USD';

  const [userName, setUserName] = useState<string | null>(null); // State for user's name
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingUserDetails, setLoadingUserDetails] = useState(true); // State for loading user details
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const initialModalFormState = useMemo(() => ({
    title: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Food & Snacks' as ExpenseCategoryName,
    date: new Date(),
  }), []);
  const [formState, setFormState] = useState(initialModalFormState);


  // Effect to fetch user details (name)
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (user && user.uid) {
        setLoadingUserDetails(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // *** THIS LINE IS UPDATED TO USE fullName ***
            setUserName(userData.fullName || null);
          } else {
            console.log("DashboardScreen: No user document found for UID:", user.uid);
            setUserName(null); // Explicitly set to null if not found
          }
        } catch (error) {
          console.error("DashboardScreen: Error fetching user details:", error);
          setUserName(null); // Set to null on error
        } finally {
          setLoadingUserDetails(false);
        }
      } else {
        setUserName(null);
        setLoadingUserDetails(false);
      }
    };

    fetchUserDetails();
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserDetails();
        } else {
            setUserName(null);
            setLoadingUserDetails(false);
        }
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch transactions
  useEffect(() => {
    const user = auth.currentUser;
    let unsubscribeTransactions: (() => void) | undefined;

    if (user && user.uid) {
      setLoadingTransactions(true);
      setFirebaseError(null);
      const userTransactionsCollection = collection(db, "users", user.uid, "transactions");
      const q = query(userTransactionsCollection, orderBy("date", "desc"));

      unsubscribeTransactions = onSnapshot(q, (querySnapshot) => {
        const fetchedTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const transactionDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
          const createdAtDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined);
          fetchedTransactions.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            amount: Number(data.amount) || 0,
            type: data.type as TransactionType,
            category: data.category as Category,
            date: transactionDate,
            createdAt: createdAtDate,
          });
        });
        setTransactions(fetchedTransactions);
        setLoadingTransactions(false);
      }, (error) => {
        console.error("DashboardScreen: Error fetching transactions:", error);
        setFirebaseError("Failed to load transactions.");
        setLoadingTransactions(false);
      });
    } else {
      setTransactions([]);
      setLoadingTransactions(false);
    }
    return () => { if (unsubscribeTransactions) unsubscribeTransactions(); };
  }, [auth.currentUser?.uid]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  const filteredTransactions = useMemo(() => (
    transactions.filter(t =>
      (selectedType === 'all' || t.type === selectedType) &&
      (selectedCategory === 'all' || t.category === selectedCategory)
    )
  ), [transactions, selectedType, selectedCategory]);

  const handleAddTransactionToFirebase = useCallback(async (
    transactionData: { title: string; amount: number; type: TransactionType; category: Category; date: Date; }
  ) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication Error", "Please sign in.");
      return Promise.reject(new Error("User not authenticated"));
    }
    try {
      const userTransactionsCollection = collection(db, "users", user.uid, "transactions");
      await addDoc(userTransactionsCollection, {
        userId: user.uid,
        title: transactionData.title.trim() === '' ? transactionData.category : transactionData.title.trim(),
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        date: Timestamp.fromDate(transactionData.date),
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Transaction added!");
    } catch (e) {
      console.error("Error adding transaction:", e);
      Alert.alert("Save Error", "Failed to save transaction.");
      throw e;
    }
  }, []);

  const handleDeleteTransactionFromFirebase = useCallback(async (transactionId: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication Error", "Please sign in.");
      return;
    }
    Alert.alert('Confirm Deletion', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const transactionDocRef = doc(db, "users", user.uid, "transactions", transactionId);
            await deleteDoc(transactionDocRef);
            Alert.alert("Deleted", "Transaction removed.");
          } catch (e) {
            console.error("Error deleting transaction:", e);
            Alert.alert("Delete Error", "Failed to delete transaction.");
          }
        },
      },
    ]);
  }, []);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';

    const emoji = hour < 12 ? '🌞' : hour < 18 ? '☀️' : '🌙';
    
    if (loadingUserDetails) return `${greeting}! ${emoji}`;
    
    return userName ? `${greeting}, ${userName}! ${emoji}` : `${greeting}! ${emoji}`;
  };

  const getBalanceStatusText = () => {
    if (balance > 500) return "You're doing great!";
    if (balance < 0) return "Let's get back on track!";
    if (transactions.length === 0 && !loadingTransactions && !firebaseError) return "Ready to track your first transaction?";
    return "Keep up the good work!";
  };

  const isLoading = loadingTransactions || loadingUserDetails;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
      </View>

      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>Current Balance</Text>
          <FontAwesome5 name="wallet" size={20} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.balanceValue}>{formatCurrency(balance, currentCurrency)}</Text>
        <Text style={styles.balanceStatus}>{getBalanceStatusText()}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statBadge}><Ionicons name="arrow-up-circle" size={16} color="#2ecc71" /><Text style={styles.statLabel}>Income</Text></View>
            <Text style={styles.statText}>{formatCurrency(totalIncome, currentCurrency)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statBadge}><Ionicons name="arrow-down-circle" size={16} color="#e74c3c" /><Text style={styles.statLabel}>Expense</Text></View>
            <Text style={styles.statText}>{formatCurrency(totalExpense, currentCurrency)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity style={styles.filterButtonOuter} activeOpacity={0.7} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterText}>Filter</Text>
          <MaterialIcons name="tune" size={18} color="#3498db" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" color="#3498db" /><Text style={styles.messageText}>Loading dashboard...</Text></View>
      ) : firebaseError ? (
        <View style={styles.centeredMessageContainer}><MaterialIcons name="error-outline" size={30} color="#e74c3c" /><Text style={[styles.messageText, {color: '#e74c3c'}]}>{firebaseError}</Text></View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              deleteTransaction={handleDeleteTransactionFromFirebase}
              currency={currentCurrency}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Ionicons name="file-tray-stacked-outline" size={screenWidth * 0.12} color="#bdc3c7" style={styles.emptyIcon}/>
              <Text style={styles.emptyListText}>
                {transactions.length === 0 ? 'No transactions yet.' : 'No transactions match filters.'}
              </Text>
              <Text style={styles.emptySubtext}>
                {transactions.length === 0 ? "Tap the '+' button to add your first one!" : "Try adjusting your filter options."}
              </Text>
            </View>
          }
          contentContainerStyle={styles.transactionListContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => { setFormState(initialModalFormState); setShowAddModal(true); }}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#3498db', '#2980b9']} style={styles.addButtonGradient}>
          <MaterialIcons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      <AddTransactionModal
        visible={showAddModal}
        formState={formState}
        setFormState={setFormState}
        onSubmit={handleAddTransactionToFirebase}
        onClose={() => { setShowAddModal(false); Keyboard.dismiss(); }}
      />

      <Modal visible={showFilterModal} animationType="slide" transparent={true} onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}><Ionicons name="close-circle" size={28} color="#7f8c8d" /></TouchableOpacity>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Type:</Text>
              <View style={styles.filterOptionsContainer}>
                {(['all', 'income', 'expense'] as const).map(type => (
                  <TouchableOpacity key={type} style={[styles.filterOptionButton, selectedType === type && styles.filterOptionSelected]} onPress={() => setSelectedType(type)}>
                    <Text style={[styles.filterOptionText, selectedType === type && styles.filterOptionTextSelected]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptionsContainerScroll}>
                {(['all', ...ALL_CATEGORIES_FOR_FILTER] as const).map(category => (
                  <TouchableOpacity key={category} style={[styles.filterOptionButton, styles.filterCategoryButton, selectedCategory === category && styles.filterOptionSelected]} onPress={() => setSelectedCategory(category)}>
                    <Text style={[styles.filterOptionText, selectedCategory === category && styles.filterOptionTextSelected]}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.applyFilterButton} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.applyFilterButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: screenWidth > 380 ? 26 : 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  balanceCard: {
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#2980b9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: screenWidth > 380 ? 36 : 30,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'left',
  },
  balanceStatus: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'left',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'flex-start',
    flex: 1,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  statText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  filterButtonOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#eaf2f8',
  },
  filterText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: screenHeight * 0.05,
  },
  emptyIcon: {
    marginBottom: 15,
    opacity: 0.5,
  },
  emptyListText: {
    fontSize: 17,
    color: '#546e7a',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#78909c',
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionListContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 25,
    right: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 12,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOptionsContainerScroll: {
    flexDirection: 'row',
    paddingBottom: 10,
    gap: 10,
  },
  filterOptionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#d3dce6',
  },
  filterCategoryButton: {
      paddingHorizontal: 15,
  },
  filterOptionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  filterOptionText: {
    color: '#4a5568',
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  applyFilterButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  applyFilterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default DashboardScreen;