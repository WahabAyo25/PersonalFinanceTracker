import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { AppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import { parseISO, format } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForLabels: {
    fontWeight: '600',
  }
};

const ChartsScreen = () => {
  const { transactions } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate totals with validation
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.max(t.amount, 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.max(t.amount, 0), 0);

  // Data processing with validation
  const processCategoryData = (type: 'income' | 'expense') => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.max(t.amount, 0));
      });

    return Array.from(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount: Math.max(amount, 0),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
      .filter(item => item.amount > 0);
  };

  const processDailyData = () => {
    const dailyData = new Map<string, { income: number; expense: number }>();
    
    transactions.forEach(t => {
      const date = format(parseISO(t.date), 'yyyy-MM-dd');
      const current = dailyData.get(date) || { income: 0, expense: 0 };
      const amount = Math.max(t.amount, 0);
      
      if(t.type === 'income') current.income += amount;
      else current.expense += amount;
      
      dailyData.set(date, current);
    });

    return Array.from(dailyData)
      .map(([date, values]) => ({
        date,
        income: Math.max(values.income, 0),
        expense: Math.max(values.expense, 0)
      }))
      .filter(d => d.income > 0 || d.expense > 0);
  };

  const processMonthlyData = () => {
    const monthlyData = new Map<string, { income: number; expense: number }>();
    
    transactions.forEach(t => {
      const month = format(parseISO(t.date), 'MMM yyyy');
      const current = monthlyData.get(month) || { income: 0, expense: 0 };
      const amount = Math.max(t.amount, 0);
      
      if(t.type === 'income') current.income += amount;
      else current.expense += amount;
      
      monthlyData.set(month, current);
    });

    return Array.from(monthlyData)
      .map(([month, values]) => ({
        month,
        income: Math.max(values.income, 0),
        expense: Math.max(values.expense, 0)
      }))
      .filter(m => m.income > 0 || m.expense > 0);
  };

  // Chart rendering with error handling
  const renderOverviewChart = () => {
    const hasData = totalIncome > 0 || totalExpenses > 0;
    const chartData = [
      { name: 'Income', amount: totalIncome, color: '#2ecc71' },
      { name: 'Expenses', amount: totalExpenses, color: '#e74c3c' },
    ].filter(item => item.amount > 0);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Income vs Expenses</Text>
        {hasData ? (
          <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text style={styles.noDataText}>No financial data available</Text>
        )}
      </View>
    );
  };

  const renderCategoryChart = () => {
    const categoryData = processCategoryData('expense');
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Expense Categories</Text>
        {categoryData.length > 0 ? (
          <BarChart
            data={{
              labels: categoryData.map(c => c.name),
              datasets: [{ data: categoryData.map(c => c.amount) }]
            }}
            width={screenWidth - 40}
            height={300}
            yAxisLabel="$"
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero
          />
        ) : (
          <Text style={styles.noDataText}>No expense categories to display</Text>
        )}
      </View>
    );
  };

  const renderMonthlyTrendChart = () => {
    const monthlyData = processMonthlyData();
    const chartData = monthlyData.map(m => {
      const value = m.income - m.expense;
      return isFinite(value) ? value : 0;
    });

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Cash Flow</Text>
        {monthlyData.length > 0 ? (
          <LineChart
            data={{
              labels: monthlyData.map(m => m.month),
              datasets: [{
                data: chartData,
                color: (opacity) => `rgba(46, 204, 113, ${opacity})`,
              }]
            }}
            width={screenWidth - 40}
            height={300}
            chartConfig={chartConfig}
            bezier
          />
        ) : (
          <Text style={styles.noDataText}>No monthly data available</Text>
        )}
      </View>
    );
  };

  const renderDailyTrendChart = () => {
    const dailyData = processDailyData();

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Trends</Text>
        {dailyData.length > 0 ? (
          <LineChart
            data={{
              labels: dailyData.map(d => format(parseISO(d.date), 'dd MMM')),
              datasets: [
                {
                  data: dailyData.map(d => d.income),
                  color: (opacity) => `rgba(46, 204, 113, ${opacity})`,
                  label: 'Income'
                },
                {
                  data: dailyData.map(d => d.expense),
                  color: (opacity) => `rgba(231, 76, 60, ${opacity})`,
                  label: 'Expenses'
                }
              ]
            }}
            width={screenWidth - 40}
            height={300}
            chartConfig={chartConfig}
            bezier
          />
        ) : (
          <Text style={styles.noDataText}>No daily transactions to display</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Financial Analytics</Text>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['overview', 'categories', 'daily', 'monthly'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charts based on active tab */}
        {activeTab === 'overview' && (
          <>
            {renderOverviewChart()}
            {renderMonthlyTrendChart()}
          </>
        )}

        {activeTab === 'categories' && renderCategoryChart()}
        {activeTab === 'daily' && renderDailyTrendChart()}
        {activeTab === 'monthly' && renderMonthlyTrendChart()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  noDataText: {
    textAlign: 'center',
    color: '#95a5a6',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default ChartsScreen;