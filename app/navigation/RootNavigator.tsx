// navigation/RootNavigator.js
import React, { useState, useEffect, useCallback } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '../utils/firebase'; // Correct path to your firebase.js
import { onAuthStateChanged } from 'firebase/auth';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import AppNavigator from './AppNavigator';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const ASYNC_STORAGE_KEY_HAS_LAUNCHED = 'hasLaunched'; // Consistent key

const RootStack = createStackNavigator();

const AuthFlowStack = createStackNavigator();
const AuthFlowNavigator = () => (
  <AuthFlowStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthFlowStack.Screen name="AuthScreen" component={AuthScreen} />
    <AuthFlowStack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
  </AuthFlowStack.Navigator>
);

const RootNavigator = () => {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [isLogicReady, setIsLogicReady] = useState(false); // Tracks if async checks (AsyncStorage, initial auth) are done

  const [isFirstLaunch, setIsFirstLaunch] = useState(null); // null, true, or false
  const [currentUser, setCurrentUser] = useState(undefined); // undefined, null, or user object

  useEffect(() => {
    let isMounted = true;
    console.log("RootNavigator: Main useEffect for logic preparation.");

    const prepareAppLogic = async () => {
      console.log("RootNavigator: prepareAppLogic - Checking AsyncStorage for 'hasLaunched'.");
      try {
        const hasLaunchedItem = await AsyncStorage.getItem(ASYNC_STORAGE_KEY_HAS_LAUNCHED);
        if (isMounted) {
          const firstLaunch = hasLaunchedItem === null;
          setIsFirstLaunch(firstLaunch);
          console.log(`RootNavigator: AsyncStorage check done. hasLaunchedItem: ${hasLaunchedItem}, isFirstLaunch set to: ${firstLaunch}`);
        }
      } catch (e) {
        console.error("RootNavigator: Failed AsyncStorage check:", e);
        if (isMounted) setIsFirstLaunch(true); // Default to true on error
      }
    };

    prepareAppLogic();

    console.log("RootNavigator: Setting up onAuthStateChanged listener.");
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        console.log('RootNavigator: Auth state changed, User:', user ? user.uid : 'No user (null)');
        setCurrentUser(user); // Will be null if not logged in, or user object
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      console.log("RootNavigator: Main useEffect cleanup - Unsubscribed from auth.");
    };
  }, []); // Runs once on mount to initialize logic and listeners

  // Effect to determine if all background logic is ready
  useEffect(() => {
    // Logic is ready when isFirstLaunch is determined AND the first auth state has been received
    if (isFirstLaunch !== null && currentUser !== undefined) {
      console.log(`RootNavigator: Core logic ready. isFirstLaunch: ${isFirstLaunch}, currentUser state known.`);
      setIsLogicReady(true);
    }
  }, [isFirstLaunch, currentUser]);

  const handleSplashFinish = useCallback(() => {
    console.log("RootNavigator: SplashScreen's onFinish callback received.");
    setIsSplashFinished(true);
  }, []);

  const handleFinishOnboarding = useCallback(async () => {
    console.log('RootNavigator: handleFinishOnboarding called.');
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY_HAS_LAUNCHED, 'true');
      setIsFirstLaunch(false); // Update state to move past onboarding
      console.log('RootNavigator: Onboarding finished. hasLaunched set to true, isFirstLaunch set to false.');
    } catch (error) {
      console.error('RootNavigator: Error in handleFinishOnboarding:', error);
    }
  }, []);

  // Determine if the splash screen should be shown.
  // Show splash if it hasn't called its onFinish() yet.
  const showSplashScreen = !isSplashFinished;

  console.log(
    `RootNavigator Render: showSplashScreen=${showSplashScreen} (isSplashFinished=${isSplashFinished}), isLogicReady=${isLogicReady}, isFirstLaunch=${isFirstLaunch}, currentUser state: ${currentUser === undefined ? 'pending' : (currentUser ? 'exists' : 'null')}`
  );

  if (showSplashScreen) {
    console.log('RootNavigator: Rendering SplashScreen.');
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // --- Splash has finished, now decide the next screen ---
  // We should wait for logic to be ready before deciding the next screen
  if (!isLogicReady) {
    // This is a fallback state: splash finished, but background logic (AsyncStorage/initial Auth) isn't ready.
    // This should ideally not be hit frequently if SplashScreen's duration is sufficient.
    // Could show a minimal loading indicator or re-render splash (though could loop if splash calls onFinish too fast).
    console.warn('RootNavigator: Splash finished, but core logic not yet ready. Rendering minimal loading or re-evaluating.');
    // For safety, one might render a simple loading view here, or if confident splash duration covers it, proceed.
    // Let's assume splash duration (3s) is enough for isLogicReady to become true.
    // If not, the conditions below will use potentially 'null' or 'undefined' states.
  }

  if (isFirstLaunch === true) { // Explicitly check true, as null means not yet determined
    console.log('RootNavigator: Rendering OnboardingFlow (isFirstLaunch is true).');
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="OnboardingFlowScreen">
          {props => <OnboardingScreen {...props} onFinishOnboarding={handleFinishOnboarding} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }

  // At this point, isFirstLaunch should be 'false' (or an error occurred making it 'true' and handled above)
  if (currentUser === null) { // currentUser is null means not authenticated
    console.log('RootNavigator: Rendering AuthFlow (Not first launch, no user).');
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="AuthFlowScreens" component={AuthFlowNavigator} />
      </RootStack.Navigator>
    );
  }

  if (currentUser) { // currentUser has a user object means authenticated
    console.log('RootNavigator: Rendering AppMain (Not first launch, user exists).');
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="AppMainScreens" component={AppNavigator} />
      </RootStack.Navigator>
    );
  }

  // Fallback / Still loading critical state (should be rare if logic above is sound and splash gives enough time)
  // This state could be hit if currentUser is still `undefined` after splash.
  console.log('RootNavigator: Fallback - Critical states (isFirstLaunch/currentUser) not definitively resolved after splash. Rendering AuthFlow as default.');
  // Or render a simple loading indicator again
  // return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator /></View>;
   return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="AuthFlowScreens" component={AuthFlowNavigator} />
      </RootStack.Navigator>
    );
};

export default RootNavigator;