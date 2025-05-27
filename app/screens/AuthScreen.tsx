// screens/AuthScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase imports
// Make sure this path is correct and exports the initialized `auth` and `db`
import { auth, db } from '../utils/firebase'; // UPDATED IMPORT
import {
  // getAuth, // No longer needed here if auth is imported directly
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  // sendPasswordResetEmail, // This can be handled by ForgotPasswordScreen directly
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Firestore functions

const { width, height } = Dimensions.get('window');

// const auth = getAuth(firebaseApp); // REMOVED - auth is now imported

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const cardGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const glowSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(cardGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    setTimeout(() => glowSequence.start(), 1000);

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      glowSequence.stop();
    };
  }, []);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getFirebaseErrorMessage = (errorCode) => {
    // ... (same as before)
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please sign in or use a different email.';
      case 'auth/weak-password':
        return 'Password is too weak. It must be at least 6 characters long.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
      default:
        console.error("Firebase Auth Error Code:", errorCode);
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const validateForm = () => {
    // ... (same as before)
    const { email, password, confirmPassword, fullName } = formData;

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return false;
    }
    if (!isLogin) {
      if (!fullName.trim()) {
        Alert.alert('Validation Error', 'Please enter your full name.');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Validation Error', 'Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    const { email, password, fullName } = formData;

    try {
      if (isLogin) {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
        // RootNavigator will handle navigation change based on auth state.
        // The Alert can stay, or you can remove it if you prefer a silent success.
        console.log('Sign in successful');
        // Alert.alert('Success', 'Welcome back!'); // Optional: RootNavigator handles screen change
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user) {
          // 1. Update Firebase Auth profile (optional, but good practice)
          await updateProfile(user, {
            displayName: fullName.trim(),
          });

          // 2. Store user details in Firestore 'users' collection
          // The document ID will be the user's UID from Firebase Auth
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            fullName: fullName.trim(),
            email: user.email, // Store email (already in auth but can be convenient here)
            createdAt: serverTimestamp(), // Timestamp of account creation
            // Add any other default fields you want for a new user
            // e.g., profileImageUrl: null, preferences: {}, etc.
          });
          console.log("User document created in Firestore for UID:", user.uid);
        }
        // RootNavigator will handle navigation change.
        console.log('Sign up successful, user data stored.');
        // Alert.alert('Success', 'Account created successfully!'); // Optional
      }
    } catch (error) {
      console.error("Auth handleSubmit error:", error);
      Alert.alert('Authentication Error', getFirebaseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
      loadingAnim.stopAnimation();
      loadingAnim.setValue(0);
      // No need for navigation.replace here if RootNavigator handles it
      // Forcing a reset of form data might be good on error or success if fields shouldn't persist
      // setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
    }
  };

  const handleForgotPassword = () => {
    // Navigate to the dedicated ForgotPasswordScreen
    // This AuthScreen is part of the 'AuthFlow' stack defined in RootNavigator
    // So, we can navigate to 'ForgotPasswordScreen' within this stack.
    navigation.navigate('ForgotPasswordScreen');
  };


  const handleBackPress = () => {
    // ... (same as before, though less likely to be used if AuthScreen is a root of AuthFlow)
    if (navigation.canGoBack()) {
        navigation.goBack();
    } else {
        Alert.alert("Info", "No screen to go back to.");
    }
  };

  const LoadingSpinner = () => {
    // ... (same as before)
    const rotation = loadingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return (
      <Animated.View
        style={[styles.loadingSpinner, { transform: [{ rotate: rotation }] }]}
      >
        <View style={styles.loadingSpinnerInner} />
      </Animated.View>
    );
  };

  const renderInputField = (
    // ... (same as before)
    placeholder,
    value,
    onChangeText,
    iconName,
    secureTextEntry = false,
    showPasswordToggle = false
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputIconContainer}>
        <MaterialCommunityIcons name={iconName} size={20} color="#7f8c8d" />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor="#bdc3c7"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType={placeholder.toLowerCase().includes('email') ? 'email-address' : 'default'}
      />
      {showPasswordToggle && (
        <TouchableOpacity
          onPress={() =>
            placeholder.toLowerCase().includes('confirm')
              ? setShowConfirmPassword(!showConfirmPassword)
              : setShowPassword(!showPassword)
          }
          style={styles.eyeIconContainer}
        >
          <MaterialCommunityIcons
            name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#7f8c8d"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef', '#f8f9fa']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* SafeAreaView for back button can be removed if no back button is intended here */}
      {/* <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[styles.backButtonContainer, { opacity: fadeAnim }]}
        >
        </Animated.View>
      </SafeAreaView> */}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentKeyboard,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.logoBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="wallet-outline" size={40} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.logoText}>FinanceTracker</Text>
            <Text style={styles.tagline}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.formGlow,
                {
                  opacity: cardGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.15],
                  }),
                },
              ]}
            />
            <View style={styles.formContent}>
              <View style={styles.authToggle}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.activeToggle]}
                  onPress={() => !isLogin && toggleAuthMode()}
                  activeOpacity={0.8}
                  disabled={isLoading || isLogin}
                >
                  <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                  onPress={() => isLogin && toggleAuthMode()}
                  activeOpacity={0.8}
                  disabled={isLoading || !isLogin}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {!isLogin &&
                  renderInputField(
                    'Full Name',
                    formData.fullName,
                    (text) => handleInputChange('fullName', text),
                    'account-outline'
                  )}
                {renderInputField(
                  'Email Address',
                  formData.email,
                  (text) => handleInputChange('email', text),
                  'email-outline'
                )}
                {renderInputField(
                  'Password',
                  formData.password,
                  (text) => handleInputChange('password', text),
                  'lock-outline',
                  !showPassword,
                  true
                )}
                {!isLogin &&
                  renderInputField(
                    'Confirm Password',
                    formData.confirmPassword,
                    (text) => handleInputChange('confirmPassword', text),
                    'lock-check-outline',
                    !showConfirmPassword,
                    true
                  )}

                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#95a5a6', '#7f8c8d'] : ['#3498db', '#2980b9']}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <LoadingSpinner />
                        <Text style={styles.submitButtonText}>Processing...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>
                          {isLogin ? 'Sign In' : 'Create Account'}
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" style={styles.submitIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {isLogin && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    activeOpacity={0.7}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({

  // Ensure styles for backButtonContainer, safeArea are suitable or removed if no back button
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8'
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: { // Kept for consistency, but content within it (back button) is commented out
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 40,
    left: 20,
  },
 
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: height * 0.08, // Adjusted if no explicit back button space needed at top
    paddingBottom: 40,
  },
  scrollContentKeyboard: {
    paddingTop: height * 0.03,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  formContainer: {
    position: 'relative',
  },
  formGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#3498db',
    borderRadius: 34,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  formContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: Platform.OS === 'ios' ? 28 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.1)',
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  activeToggleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIconContainer: {
    marginRight: 12,
    width: 20,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 15 : 11,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '400',
  },
  eyeIconContainer: {
    padding: 8,
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 16,
    marginTop: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    paddingVertical: Platform.OS === 'ios' ? 15 : 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    marginRight: 8,
  },
  loadingSpinnerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;