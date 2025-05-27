import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyBdRyktwRpji8XXwSn_WjczkW1K4TyDZeI",
  authDomain: "finance-tracker-93c4e.firebaseapp.com",
  projectId: "finance-tracker-93c4e",
  storageBucket: "finance-tracker-93c4e.firebasestorage.app",
  messagingSenderId: "824333830324",
  appId: "1:824333830324:web:5b7fea34dd44cc1261afe1",
  measurementId: "G-3XXVN6CNVF"
};

// Initialize Firebase App FIRST
const app = initializeApp(firebaseConfig);

// Initialize Auth SECOND with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore THIRD
const db = getFirestore(app);

export { app, auth, db };