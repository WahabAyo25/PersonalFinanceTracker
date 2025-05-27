// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator, // For loading state
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons for avatar fallback
// import { useSettings } from '../context/SettingsContext'; // Keep if you use it
import { useNavigation } from '@react-navigation/native';

import { auth } from '../utils/firebase'; // Or '../utils/firebase' - Path to your Firebase config
import { signOut } from 'firebase/auth';

const ProfileScreen = () => {
  const navigation = useNavigation();
  // const { settings, updateSettings } = useSettings(); // Keep if used

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // To handle async user data fetching

  useEffect(() => {
    // Get the current Firebase user
    const user = auth.currentUser;
    if (user) {
      setCurrentUser({
        uid: user.uid,
        name: user.displayName || 'User', // Fallback if displayName is not set
        email: user.email,
        // 'joined' date needs to be fetched from Firestore if you stored it there
        // For now, we'll use a placeholder or metadata if available
        joined: user.metadata?.creationTime
          ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : 'N/A',
      });
    } else {
      // This case should ideally be handled by RootNavigator,
      // but as a fallback, navigate to Auth if no user.
      console.warn("ProfileScreen: No authenticated user found. Navigating to Auth.");
      // navigation.replace('AuthFlow'); // Or your main Auth route
    }
    setIsLoading(false);
  }, []); // Runs once on mount

  const getInitials = (name) => {
    if (!name) return <MaterialCommunityIcons name="account" size={36} color="#ffffff" />; // Fallback icon
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('User signed out successfully');
              // RootNavigator's onAuthStateChanged will handle navigation to AuthFlow
              // No need for navigation.replace() here.
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'settings',
      title: 'Settings',
      onPress: () => navigation.navigate('Settings'), // Ensure 'Settings' screen exists in your ProfileStack or AppNavigator
    },
    {
      icon: 'help-outline', // Changed icon for better fit
      title: 'Help & Support',
      onPress: () => Alert.alert('Help & Support', 'Contact support@example.com for assistance.'), // Example action
    },
    // Add more items as needed
    // {
    //   icon: 'account-circle',
    //   title: 'Edit Profile',
    //   onPress: () => navigation.navigate('EditProfile'),
    // },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    // This view is shown if user becomes null after initial load (e.g. token expired, account deleted elsewhere)
    // Or if the initial check in useEffect somehow misses.
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>User not found. Please sign in again.</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => {/* Optionally navigate to Auth here if RootNavigator doesn't catch it */}}>
            <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{getInitials(currentUser.name)}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
          <Text style={styles.joined}>Member since {currentUser.joined}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <MaterialIcons name={item.icon} size={22} color="#555" />
              <Text style={styles.menuText}>{item.title}</Text>
              <MaterialIcons name="chevron-right" size={22} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={22} color="#e74c3c" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Lighter background for overall app consistency
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
      backgroundColor: '#3498db',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
  },
  signInButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  content: {
    padding: 20, // Consistent padding
    paddingBottom: 40, // More space at bottom
  },
  header: {
    alignItems: 'center',
    marginBottom: 30, // Reduced margin
    paddingVertical: 20,
    backgroundColor: '#ffffff', // Card-like background for header
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 88, // Slightly larger
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffffff', // White border around avatar
  },
  initials: {
    fontSize: 30, // Adjusted size
    fontWeight: '600',
    color: '#ffffff',
  },
  name: {
    fontSize: 22, // Adjusted size
    fontWeight: 'bold', // Bolder
    color: '#2c3e50',
    marginBottom: 4,
  },
  email: {
    fontSize: 15, // Adjusted size
    color: '#7f8c8d',
    marginBottom: 8,
  },
  joined: {
    fontSize: 13, // Adjusted size
    color: '#95a5a6',
  },
  menu: {
    marginBottom: 30,
    backgroundColor: '#ffffff', // Card-like background for menu
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden', // To clip borderBottom of last item if needed
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18, // Increased padding
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Lighter border
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333', // Darker text for better readability
    marginLeft: 20, // Increased margin
  },
  logoutButton: { // Changed from logout to logoutButton for clarity
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff', // Card-like background
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e74c3c20' // Subtle border matching text color
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600', // Bolder logout text
  },
});

export default ProfileScreen;