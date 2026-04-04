import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from "firebase/firestore";

// Read Firebase config from Vite env vars
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

let db: any = null;
let app: any = null;

// Only initialize REAL Firebase if the developer provided an API key
if (apiKey) {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "invonta-app.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "invonta-app",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "invonta-app.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "00000000000",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:00000000000:web:0000000"
  };
  
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase Initialization Error:", err);
  }
}

// ============================================================================
// SAFE MOCK IMPLEMENTATION (Used if Firebase is not configured in .env)
// ============================================================================

const mockDb = {};
const mockCollection = (db: any, ...paths: string[]) => paths.join("/");
const mockDoc = (db: any, ...paths: string[]) => paths.join("/");

const mockAddDoc = async (collectionRef: string, data: any) => {
  console.log("MOCK ADD DOC:", collectionRef, data);
  return { id: "mock_id_" + Date.now() };
};

const mockSetDoc = async (docRef: string, data: any) => {
  console.log("MOCK SET DOC:", docRef, data);
};

const mockQuery = (...args: any[]) => args;
const mockOrderBy = (field: string, direction: string) => ({ field, direction });

const mockOnSnapshot = (queryRef: any, onNext: (snapshot: any) => void) => {
  // Simulate an immediate snapshot with mock messages
  const mockSnapshot = {
    docs: [
      { id: "mock_1", data: () => ({ text: "Welcome to Invonta Chat Demo!", senderId: "server", createdAt: { toDate: () => new Date() } }) },
      { id: "mock_2", data: () => ({ text: "To enable real-time Firebase chat, you must add VITE_FIREBASE_API_KEY to your .env file.", senderId: "server", createdAt: { toDate: () => new Date() } }) },
      { id: "mock_3", data: () => ({ text: "Until then, this is a beautiful mock UI you can interact with! Try sending a message.", senderId: "server", createdAt: { toDate: () => new Date() } }) }
    ]
  };
  setTimeout(() => onNext(mockSnapshot), 500);
  return () => {}; // unsubscribe function
};

const mockServerTimestamp = () => new Date();

// ============================================================================
// EXPORTS: Route to real SDK or Mock SDK based on configuration
// ============================================================================

const exportDb = apiKey ? db : mockDb;
const exportCollection = apiKey ? collection : mockCollection as any;
const exportAddDoc = apiKey ? addDoc : mockAddDoc as any;
const exportQuery = apiKey ? query : mockQuery as any;
const exportOrderBy = apiKey ? orderBy : mockOrderBy as any;
const exportOnSnapshot = apiKey ? onSnapshot : mockOnSnapshot as any;
const exportServerTimestamp = apiKey ? serverTimestamp : mockServerTimestamp as any;
const exportSetDoc = apiKey ? setDoc : mockSetDoc as any;
const exportDoc = apiKey ? doc : mockDoc as any;

export { 
  exportDb as db, 
  exportCollection as collection, 
  exportAddDoc as addDoc, 
  exportQuery as query, 
  exportOrderBy as orderBy, 
  exportOnSnapshot as onSnapshot, 
  exportServerTimestamp as serverTimestamp, 
  exportSetDoc as setDoc, 
  exportDoc as doc 
};
