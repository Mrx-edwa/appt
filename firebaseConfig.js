// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCbhFX1Y2gAYH4Fprr5W5dNrs0fT816Dlc",
  authDomain: "ordenventas-5e9d4.firebaseapp.com",
  projectId: "ordenventas-5e9d4",
  storageBucket: "ordenventas-5e9d4.firebasestorage.app",
  messagingSenderId: "234386121178",
  appId: "1:234386121178:web:f2ae6ca59295bf3adae0e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
