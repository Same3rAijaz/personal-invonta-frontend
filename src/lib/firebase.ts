import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { getFirebaseApp } from "../utils/firebase";

let firebaseAuth: Auth | null = null;

function getOrInitFirebaseApp() {
  const existing = getFirebaseApp();
  if (existing) return existing;
  if (getApps().length) return getApps()[0];

  return initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  });
}

export function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;
  firebaseAuth = getAuth(getOrInitFirebaseApp());
  return firebaseAuth;
}
