import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from '../components/DashboardScreen';
import ChartsScreen from '../components/ChartsScreen';
import ProfileScreen from '../components/ProfileScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

const AppNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color }) => {
        let iconName;
        const iconSize = 24;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
            break;
          case 'Analytics':
            iconName = focused ? 'chart-box' : 'chart-box-outline';
            break;
          case 'Budget':
            iconName = focused ? 'wallet' : 'wallet-outline';
            break;
          case 'Profile':
            iconName = focused ? 'account' : 'account-outline';
            break;
        }

        return (
          <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
            <MaterialCommunityIcons 
              name={iconName} 
              size={iconSize} 
              color={color} 
            />
          </View>
        );
      },
      tabBarActiveTintColor: '#3498db',
      tabBarInactiveTintColor: '#95a5a6',
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.label,
      tabBarItemStyle: styles.tabItem,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Analytics" component={ChartsScreen} />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStack}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    borderTopWidth: 0,
    backgroundColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  tabItem: {
    height: 60,
    paddingVertical: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
  },
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
});

export default AppNavigator;