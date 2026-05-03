import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appleConfig from '../../firebase-applet-config.json';

// Use environment variables if available (for Vercel), otherwise fallback to the generated JSON
const getEnv = (key: string): string | null => {
  if (typeof window !== 'undefined' && (window as { env?: Record<string, string> }).env?.[key]) {
    return (window as { env?: Record<string, string> }).env![key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return null;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || appleConfig.apiKey,
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || appleConfig.authDomain,
  projectId: getEnv('FIREBASE_PROJECT_ID') || appleConfig.projectId,
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || appleConfig.storageBucket,
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || appleConfig.messagingSenderId,
  appId: getEnv('FIREBASE_APP_ID') || appleConfig.appId,
  firestoreDatabaseId: getEnv('FIREBASE_DATABASE_ID') || appleConfig.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
