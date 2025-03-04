import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingScreen = () => {
  const navigation = useNavigation();

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    navigation.navigate('App');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Our App!</Text>
      <Text style={styles.text}>Discover amazing features...</Text>
      <Button
        title="Get Started"
        onPress={handleFinishOnboarding}
        color="#3498db"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
});

export default OnboardingScreen;