// screens/SplashScreen.js


import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  // Platform, // Only needed if you use Platform.OS in styles
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("SplashScreen: Mounted, starting animations.");
    // Smooth entrance animations
    const entranceSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Enhanced pulse animation for logo with glow effect
    const pulseSequence = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoGlowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoGlowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Enhanced loading animation
    const loadingSequence = Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );

    // Start animations
    entranceSequence.start();

    const loopStartTimer = setTimeout(() => {
      pulseSequence.start();
      loadingSequence.start();
    }, 1000); // Your original delay was 1000ms

    // Clean exit animation
    const finishTimer = setTimeout(() => {
      console.log("SplashScreen: 3-second timer elapsed, stopping loops and starting exit animation.");
      pulseSequence.stop();
      loadingSequence.stop();

      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        console.log("SplashScreen: Exit animation complete. Calling onFinish.");
        if (onFinish) {
          onFinish();
        }
      });
    }, 3000);

    return () => {
      console.log("SplashScreen: Unmounted. Clearing timers and stopping animations.");
      clearTimeout(loopStartTimer);
      clearTimeout(finishTimer);
      entranceSequence.stop();
      pulseSequence.stop();
      loadingSequence.stop();
    };
  }, [fadeAnim, scaleAnim, slideAnim, pulseAnim, loadingAnim, exitAnim, logoGlowAnim, onFinish]);

  const LoadingIndicator = () => {
    const rotation = loadingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.loadingRing,
          {
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        <View style={styles.loadingRingInner} />
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: exitAnim,
        },
      ]}
    >
      <StatusBar
        barStyle="light-content" // Keep as is, or adjust to "dark-content" if your gradient is light
        backgroundColor="transparent"
        translucent={true}
        // hidden={false} // This is default, can be omitted
      />

      {/* YOUR ORIGINAL GRADIENT */}
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef', '#f8f9fa']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoGlow,
              {
                opacity: logoGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3], // Your original glow opacity
                }),
              },
            ]}
          />
          {/* YOUR ORIGINAL LOGO GRADIENT AND ICON SIZE */}
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.logoBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="wallet-outline"
              size={60} // Your original icon size
              color="#ffffff"
            />
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* YOUR ORIGINAL APP NAME AND TAGLINE */}
          <Text style={styles.appName}>FinanceTracker</Text>
          <Animated.View
            style={{
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.6, 1],
                outputRange: [0, 0, 1],
              }),
            }}
          >
            <Text style={styles.tagline}>Your Personal Finance Companion</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 0, 1],
              }),
            },
          ]}
        >
          <LoadingIndicator />
          {/* YOUR ORIGINAL LOADING TEXT */}
          <Text style={styles.loadingText}>Loading your financial data...</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// YOUR ORIGINAL STYLES
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1, // Your original full shadow opacity for glow
    shadowRadius: 20,
    elevation: 10, // Your original elevation
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2c3e50', // Assuming your original gradient was light
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#7f8c8d', // Assuming your original gradient was light
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    opacity: 0.8, // Your original opacity
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#e9ecef', // Assuming light gradient background
    borderTopColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingRingInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d', // Assuming light gradient background
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default SplashScreen;