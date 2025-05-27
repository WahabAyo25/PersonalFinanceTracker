import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { parseISO, format } from 'date-fns';

// Firebase imports
import { auth, db } from '../utils/firebase'; // Adjust path
import { onAuthStateChanged, User } from 'firebase/auth'; // Import User type
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

// Context and Utils
import { useSettings } from '../context/SettingsContext'; // Adjust path
import type { Currency } from '../context/SettingsContext'; // Assuming Currency type is exported or accessible

// Icons
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// --- Shared Types (Ideally from a central types.ts) ---
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
  date: Date; // Store as Date object after fetching
  createdAt?: Timestamp | Date;
}
// --- End Shared Types ---

const screenWidth = Dimensions.get('window').width;
// const screenHeight = Dimensions.get('window').height; // Not used, can be removed

const chartConfigBase = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '1',
    stroke: '#2c3e50',
  },
  propsForLabels: {
    fontWeight: '600',
    fontSize: 10,
  },
};

const ChartsScreen = () => {
  const { settings } = useSettings();
  const currentCurrency = (settings.currency as Currency) || 'USD';

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true); // True initially
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const getCurrencySymbol = (currencyCode: Currency): string => {
    switch (currencyCode) {
      case 'GBP': return '£';
      case 'NGN': return '₦';
      case 'USD': return '$';
      default: return '$';
    }
  };
  const currencySymbol = getCurrencySymbol(currentCurrency);

  const chartConfig = {
    ...chartConfigBase,
  };

  // Effect for handling Firebase authentication state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) { // If no user after auth check, stop transaction loading and clear data
        setTransactions([]);
        setLoadingTransactions(false); // Explicitly set loading to false
        setFirebaseError("User not authenticated. Please sign in.");
      }
    });
    return () => unsubscribeAuth(); // Cleanup listener
  }, []);

  // Effect for fetching transactions, dependent on currentUser and authLoading
  useEffect(() => {
    let unsubscribeTransactions: (() => void) | undefined;

    if (!authLoading && currentUser && currentUser.uid) {
      setLoadingTransactions(true); // Start loading transactions
      setFirebaseError(null);
      const userTransactionsCollection = collection(db, 'users', currentUser.uid, 'transactions');
      const q = query(userTransactionsCollection, orderBy('date', 'desc'));

      unsubscribeTransactions = onSnapshot(
        q,
        (querySnapshot) => {
          const fetchedTransactions: Transaction[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const transactionDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
            fetchedTransactions.push({
              id: doc.id,
              userId: data.userId,
              title: data.title,
              amount: Number(data.amount) || 0,
              type: data.type as TransactionType,
              category: data.category as Category,
              date: transactionDate,
            });
          });
          setTransactions(fetchedTransactions);
          setLoadingTransactions(false);
        },
        (error) => {
          console.error('ChartsScreen: Error fetching transactions:', error);
          setFirebaseError('Failed to load transaction data for charts.');
          setLoadingTransactions(false);
        }
      );
    } else if (!authLoading && !currentUser) {
      // This case is handled by the auth useEffect, but good to be explicit
      setTransactions([]);
      setLoadingTransactions(false);
    }
    // If authLoading is true, we wait, so loadingTransactions effectively remains true or its initial state

    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [currentUser, authLoading]); // Re-run if currentUser or authLoading changes

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Math.max(t.amount, 0), 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.max(t.amount, 0), 0),
    [transactions]
  );

  const processCategoryData = (type: 'income' | 'expense') => {
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.max(t.amount, 0));
      });

    return Array.from(categoryMap)
      .map(([name, amount], index) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        amount: Math.max(amount, 0),
        color: `hsl(${(index * 40) % 360}, 70%, 60%)`,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7);
  };

  const processDailyData = () => {
    const dailyData = new Map<string, { income: number; expense: number }>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    transactions
      .filter((t) => t.date >= thirtyDaysAgo)
      .forEach((t) => {
        const dateKey = format(t.date, 'yyyy-MM-dd');
        const current = dailyData.get(dateKey) || { income: 0, expense: 0 };
        const amount = Math.max(t.amount, 0);
        if (t.type === 'income') current.income += amount;
        else current.expense += amount;
        dailyData.set(dateKey, current);
      });

    return Array.from(dailyData)
      .map(([dateString, values]) => ({
        date: dateString,
        income: Math.max(values.income, 0),
        expense: Math.max(values.expense, 0),
      }))
      .filter((d) => d.income > 0 || d.expense > 0)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  };

  const processMonthlyData = () => {
    const monthlyData = new Map<string, { income: number; expense: number }>();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    transactions
      .filter((t) => t.date >= sixMonthsAgo)
      .forEach((t) => {
        const monthKey = format(t.date, 'MMM yyyy');
        const current = monthlyData.get(monthKey) || { income: 0, expense: 0 };
        const amount = Math.max(t.amount, 0);
        if (t.type === 'income') current.income += amount;
        else current.expense += amount;
        monthlyData.set(monthKey, current);
      });

    return Array.from(monthlyData)
      .map(([monthString, values]) => ({
        month: monthString,
        income: Math.max(values.income, 0),
        expense: Math.max(values.expense, 0),
      }))
      .filter((m) => m.income > 0 || m.expense > 0)
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()); // Simpler sort for MMM yyyy
  };

  const renderOverviewChart = () => {
    const hasData = totalIncome > 0 || totalExpenses > 0;
    const chartData = [
      { name: 'Income', amount: totalIncome, color: '#2ecc71', legendFontColor: '#2c3e50', legendFontSize: 14 },
      { name: 'Expenses', amount: totalExpenses, color: '#e74c3c', legendFontColor: '#2c3e50', legendFontSize: 14 },
    ].filter((item) => item.amount > 0);

    if (!hasData && transactions.length > 0) return <Text style={styles.noDataText}>No income or expenses recorded yet for overview.</Text>;
    if (!hasData && transactions.length === 0) return <Text style={styles.noDataText}>No financial data available for overview.</Text>;


    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Income vs Expenses Overview</Text>
        <PieChart
          data={chartData}
          width={screenWidth - (Platform.OS === 'web' ? 80 : 40)}
          height={220}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft={Platform.OS === 'web' ? '40' : '15'}
          absolute
          formatLabel={(value, name) => `${name}: ${currencySymbol}${value.toFixed(0)}`}
        />
      </View>
    );
  };

  const renderCategoryChart = (type: 'income' | 'expense') => {
    const categoryData = processCategoryData(type);
    const title = type === 'income' ? 'Top Income Sources' : 'Top Expense Categories';

    if (categoryData.length === 0 && transactions.length > 0) return <Text style={styles.noDataText}>No {type} data for categories.</Text>;
    if (categoryData.length === 0 && transactions.length === 0) return <Text style={styles.noDataText}>No {type} categories to display.</Text>;


    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <BarChart
          data={{
            labels: categoryData.map((c) => c.name),
            datasets: [{ data: categoryData.map((c) => c.amount) }],
          }}
          width={screenWidth - (Platform.OS === 'web' ? 60 : 40)}
          height={300}
          yAxisLabel={currencySymbol}
          chartConfig={chartConfig}
          verticalLabelRotation={Platform.OS === 'web' ? 45 : 30}
          fromZero
          showValuesOnTopOfBars
          segments={4}
        />
      </View>
    );
  };

  const renderMonthlyTrendChart = () => {
    const monthlyData = processMonthlyData();

    if (monthlyData.length === 0 && transactions.length > 0) return <Text style={styles.noDataText}>Not enough data for monthly trends.</Text>;
    if (monthlyData.length === 0 && transactions.length === 0) return <Text style={styles.noDataText}>No monthly data available.</Text>;


    const chartDataValues = monthlyData.map((m) => {
      const value = m.income - m.expense;
      return isFinite(value) ? value : 0;
    });

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Net Cash Flow (Last 6 Months)</Text>
        <LineChart
          data={{
            labels: monthlyData.map((m) => m.month),
            datasets: [
              {
                data: chartDataValues,
                color: (opacity = 1) =>
                  chartDataValues.reduce((a, b) => a + b, 0) >= 0
                    ? `rgba(46, 204, 113, ${opacity})`
                    : `rgba(231, 76, 60, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={screenWidth - (Platform.OS === 'web' ? 60 : 40)}
          height={300}
          chartConfig={chartConfig}
          bezier
          yAxisLabel={currencySymbol}
          segments={5}
          formatYLabel={(yValue) => `${currencySymbol}${parseFloat(yValue).toFixed(0)}`}
        />
      </View>
    );
  };

  const renderDailyTrendChart = () => {
    const dailyData = processDailyData();

    if (dailyData.length === 0 && transactions.length > 0) return <Text style={styles.noDataText}>Not enough data for daily trends.</Text>;
    if (dailyData.length === 0 && transactions.length === 0) return <Text style={styles.noDataText}>No daily transactions to display (Last 30 Days).</Text>;


    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Trends (Last 30 Days)</Text>
        <LineChart
          data={{
            labels: dailyData.map((d) => format(parseISO(d.date), 'dd')),
            datasets: [
              {
                data: dailyData.map((d) => d.income),
                color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                strokeWidth: 2,
              },
              {
                data: dailyData.map((d) => d.expense),
                color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                strokeWidth: 2,
              },
            ],
            legend: ['Income', 'Expenses'],
          }}
          width={screenWidth - (Platform.OS === 'web' ? 60 : 40)}
          height={300}
          chartConfig={chartConfig}
          bezier
          yAxisLabel={currencySymbol}
          segments={5}
          formatYLabel={(yValue) => `${currencySymbol}${parseFloat(yValue).toFixed(0)}`}
        />
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: '#2ecc71' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </View>
    );
  };

  // Combined loading state for auth and transactions
  if (authLoading || (!authLoading && !currentUser && loadingTransactions) || (currentUser && loadingTransactions) ) {
    return (
      <View style={[styles.container, styles.centeredMessageContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>
          {authLoading ? 'Authenticating...' : 'Loading charts...'}
        </Text>
      </View>
    );
  }

  if (firebaseError) {
    return (
      <View style={[styles.container, styles.centeredMessageContainer]}>
        <MaterialIcons name="error-outline" size={screenWidth * 0.1} color="#e74c3c" />
        <Text style={styles.errorText}>{firebaseError}</Text>
      </View>
    );
  }

  if (!authLoading && !currentUser) { // Explicit check for no user after auth load
    return (
      <View style={[styles.container, styles.centeredMessageContainer]}>
        <MaterialIcons name="person-off" size={screenWidth * 0.15} color="#bdc3c7" />
        <Text style={styles.emptyStateTitle}>Not Authenticated</Text>
        <Text style={styles.emptyStateSubtitle}>Please sign in to view your financial analytics.</Text>
      </View>
    );
  }
  
  // This condition is for when user is authenticated, but no transactions are found
  if (!loadingTransactions && transactions.length === 0 && currentUser) {
    return (
      <View style={[styles.container, styles.centeredMessageContainer]}>
        <Ionicons name="stats-chart-outline" size={screenWidth * 0.15} color="#bdc3c7" />
        <Text style={styles.emptyStateTitle}>No Data for Charts</Text>
        <Text style={styles.emptyStateSubtitle}>Start by adding some transactions to see your financial analytics.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.title}>Financial Analytics</Text>

        <View style={styles.tabContainer}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'expenses', label: 'Expenses' },
            { key: 'income', label: 'Income' },
            { key: 'daily', label: 'Daily' },
            { key: 'monthly', label: 'Monthly' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'overview' && (
          <>
            {renderOverviewChart()}
            {renderMonthlyTrendChart()}
          </>
        )}

        {activeTab === 'expenses' && renderCategoryChart('expense')}
        {activeTab === 'income' && renderCategoryChart('income')}
        {activeTab === 'daily' && renderDailyTrendChart()}
        {activeTab === 'monthly' && renderMonthlyTrendChart()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scrollContentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
    paddingTop: Platform.OS === 'android' ? 15 : 5,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 10,
    marginBottom: 25,
    shadowColor: '#95a5a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    backgroundColor: '#e9edf0',
    borderRadius: 25,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    color: '#546e7a',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: '#ffffff',
  },
  noDataText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginVertical: 30,
    fontStyle: 'italic',
    fontSize: 15,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#546e7a',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#c0392b',
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#546e7a',
  },
});

export default ChartsScreen;