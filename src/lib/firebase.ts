import { initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

let firebaseAuth: Auth | null = null;

export function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;

  const firebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  });

  firebaseAuth = getAuth(firebaseApp);
  return firebaseAuth;
}
