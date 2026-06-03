import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase (clés inchangées)
const firebaseConfig = {
  apiKey: "AIzaSyBGfXTxNzr68pksZeEoM9IGb0Tz9XDc1iI",
  authDomain: "monappedu-f6048.firebaseapp.com",
  projectId: "monappedu-f6048",
  storageBucket: "monappedu-f6048.firebasestorage.app",
  messagingSenderId: "91467362855",
  appId: "1:91467362855:web:aab443bf9135e4049f1402"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Auth avec persistance AsyncStorage (important pour garder la session)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore
export const db = getFirestore(app);

console.log('🔥 Firebase configuré avec succès');
