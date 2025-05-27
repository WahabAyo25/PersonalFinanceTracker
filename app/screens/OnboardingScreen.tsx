// screens/OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// AsyncStorage is no longer needed here for setting the flag

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Track Your Expenses',
    description: 'Monitor your daily spending and keep track of where your money goes with detailed expense tracking.',
    icon: 'chart-line',
    color: '#e74c3c',
  },
  {
    id: 2,
    title: 'Budget Management',
    description: 'Set budgets for different categories and get alerts when you\'re close to your limits.',
    icon: 'wallet',
    color: '#2ecc71',
  },
  {
    id: 3,
    title: 'Financial Analytics',
    description: 'Visualize your financial data with beautiful charts and gain insights into your spending patterns.',
    icon: 'chart-donut',
    color: '#3498db',
  },
  {
    id: 4,
    title: 'Achieve Your Goals',
    description: 'Set financial goals and track your progress towards a better financial future.',
    icon: 'target',
    color: '#f39c12',
  },
];

const OnboardingScreen = ({ onFinishOnboarding }) => { // Accept onFinishOnboarding prop
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  console.log('OnboardingScreen rendered, current page:', currentPage);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    console.log('Skip button pressed - OnboardingScreen');
    if (onFinishOnboarding) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        console.log('Calling onFinishOnboarding from Skip');
        onFinishOnboarding(); // Call the callback
      });
    } else {
      console.warn("onFinishOnboarding prop not provided to OnboardingScreen");
      // Fallback: You could navigate directly if the prop isn't there, but it's better if RootNavigator handles it.
      // navigation.replace('AuthFlow', { screen: 'AuthScreen' }); // Example fallback
    }
  };

  const handleGetStarted = () => {
    console.log('Get Started button pressed - OnboardingScreen');
    if (onFinishOnboarding) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        console.log('Calling onFinishOnboarding from Get Started');
        onFinishOnboarding(); // Call the callback
      });
    } else {
      console.warn("onFinishOnboarding prop not provided to OnboardingScreen");
    }
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / width);
    if (pageIndex !== currentPage) { // Only update if page actually changed
        setCurrentPage(pageIndex);
    }
  };

  const renderPage = (item) => ( // Removed index as key is item.id
    <View key={item.id} style={styles.page}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: `${item.color}20` }]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={80}
            color={item.color}
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            currentPage === index ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Important for onScroll to fire frequently enough
        style={styles.scrollView}
      >
        {onboardingData.map((item) => renderPage(item))}
      </ScrollView>

      {renderPagination()}

      <View style={styles.footer}>
        {currentPage === onboardingData.length - 1 ? (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#ffffff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>Next</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#3498db"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, // Adjusted for status bar
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: height * 0.05, // Responsive margin
  },
  iconBackground: {
    width: Math.min(width * 0.4, 160), // Responsive size
    height: Math.min(width * 0.4, 160),
    borderRadius: Math.min(width * 0.2, 80),
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: Math.min(width * 0.07, 28), // Responsive font size
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: Math.min(width * 0.04, 16), // Responsive font size
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: Math.min(width * 0.04, 16) * 1.5, // Responsive line height
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 40, // Ensure it has some height
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#3498db',
  },
  inactiveDot: {
    backgroundColor: '#e0e0e0',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // Adjust for safe area on iOS
    minHeight: 80, // Ensure footer has some height
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30, // More rounded
    borderWidth: 2,
    borderColor: '#3498db',
    backgroundColor: '#fff' // Add background for better tap feedback
  },
  nextText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  getStartedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30, // More rounded
  },
  getStartedText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OnboardingScreen;