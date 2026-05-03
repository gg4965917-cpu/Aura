import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appleConfig from '../../firebase-applet-config.json';

// Use environment variables if available (for Vercel), otherwise fallback to the generated JSON
const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' && process.env?.['FIREBASE_API_KEY']) || appleConfig.apiKey,
  authDomain: (typeof process !== 'undefined' && process.env?.['FIREBASE_AUTH_DOMAIN']) || appleConfig.authDomain,
  projectId: (typeof process !== 'undefined' && process.env?.['FIREBASE_PROJECT_ID']) || appleConfig.projectId,
  storageBucket: (typeof process !== 'undefined' && process.env?.['FIREBASE_STORAGE_BUCKET']) || appleConfig.storageBucket,
  messagingSenderId: (typeof process !== 'undefined' && process.env?.['FIREBASE_MESSAGING_SENDER_ID']) || appleConfig.messagingSenderId,
  appId: (typeof process !== 'undefined' && process.env?.['FIREBASE_APP_ID']) || appleConfig.appId,
  firestoreDatabaseId: (typeof process !== 'undefined' && process.env?.['FIREBASE_DATABASE_ID']) || appleConfig.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
