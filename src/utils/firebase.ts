import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, where, limit, updateDoc, getDoc } from "firebase/firestore";

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

const mockMessages: Record<string, any[]> = {};
const mockSubscribers: Record<string, ((snapshot: any) => void)[]> = {};

const mockDb = {};
const mockCollection = (db: any, ...paths: string[]) => paths.join("/");
const mockDoc = (db: any, ...paths: string[]) => paths.join("/");

const mockAddDoc = async (collectionRef: string, data: any) => {
  console.log("MOCK ADD DOC:", collectionRef, data);
  const parts = collectionRef.split("/");
  if (parts.length >= 3 && parts[0] === 'chats' && parts[2] === 'messages') {
    const chatId = parts[1];
    if (!mockMessages[chatId]) mockMessages[chatId] = [];
    const newMsg = { 
        id: "mock_id_" + Date.now(), 
        ...data, 
        createdAt: { toDate: () => new Date(), toMillis: () => Date.now() } 
    };
    mockMessages[chatId].push(newMsg);
    
    if (mockSubscribers[chatId]) {
        mockSubscribers[chatId].forEach(sub => sub({
            docs: mockMessages[chatId].map(m => ({ id: m.id, data: () => m }))
        }));
    }
  }
  return { id: "mock_id_" + Date.now() };
};

const mockSetDoc = async (docRef: string, data: any) => {
  console.log("MOCK SET DOC:", docRef, data);
};

const mockQuery = (...args: any[]) => args;
const mockOrderBy = (field: string, direction: string) => ({ field, direction });

const mockOnSnapshot = (queryRef: any, onNext: (snapshot: any) => void) => {
  let path = Array.isArray(queryRef) ? queryRef[0] : queryRef;
  const chatId = typeof path === 'string' ? path.split("/")[1] : "unknown";
  
  if (!mockSubscribers[chatId]) mockSubscribers[chatId] = [];
  mockSubscribers[chatId].push(onNext);

  const msgs = mockMessages[chatId] || [
    { id: "mock_1", text: "Connected to Chat!", senderId: "server", createdAt: { toDate: () => new Date(), toMillis: () => Date.now() }, status: 'read' },
  ];
  setTimeout(() => onNext({
    docs: msgs.map(m => ({ id: m.id, data: () => m }))
  }), 100);

  return () => {
    mockSubscribers[chatId] = mockSubscribers[chatId].filter(sub => sub !== onNext);
  };
};

const mockServerTimestamp = () => new Date();
const mockWhere = (f: string, op: string, v: any) => ({ f, op, v });
const mockLimit = (n: number) => ({ n });
const mockUpdateDoc = async (r: any, d: any) => console.log("MOCK UPDATE DOC:", r, d);
const mockGetDoc = async (r: any) => ({ exists: () => false, data: () => ({}) });

const mockAuth = { currentUser: null };
const mockMessaging = {
  onMessage: (onNext: any) => () => {},
  getToken: async () => "mock_fcm_token_" + Date.now()
};

const mockGetMessaging = () => mockMessaging;
const mockGetToken = async () => "mock_fcm_token_123";

// EXPORTS
const exportDb = apiKey ? db : mockDb;
const exportCollection = apiKey ? collection : mockCollection as any;
const exportAddDoc = apiKey ? addDoc : mockAddDoc as any;
const exportUpdateDoc = apiKey ? updateDoc : mockUpdateDoc as any;
const exportQuery = apiKey ? query : mockQuery as any;
const exportOrderBy = apiKey ? orderBy : mockOrderBy as any;
const exportOnSnapshot = apiKey ? onSnapshot : mockOnSnapshot as any;
const exportServerTimestamp = apiKey ? serverTimestamp : mockServerTimestamp as any;
const exportSetDoc = apiKey ? setDoc : mockSetDoc as any;
const exportDoc = apiKey ? doc : mockDoc as any;
const exportWhere = apiKey ? where : mockWhere as any;
const exportLimit = apiKey ? limit : mockLimit as any;
const exportGetDoc = apiKey ? getDoc : mockGetDoc as any;

export { 
  exportDb as db, 
  exportCollection as collection, 
  exportAddDoc as addDoc, 
  exportUpdateDoc as updateDoc,
  exportQuery as query, 
  exportOrderBy as orderBy, 
  exportOnSnapshot as onSnapshot, 
  exportServerTimestamp as serverTimestamp, 
  exportSetDoc as setDoc, 
  exportDoc as doc,
  exportWhere as where,
  exportLimit as limit,
  exportGetDoc as getDoc,
  mockAuth as auth,
  mockGetMessaging as getMessaging,
  mockGetToken as getToken
};
