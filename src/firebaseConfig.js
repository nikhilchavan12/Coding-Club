import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYG5HvD-40CZBVQbS-tiDWky-Fsw7Lv3g",
  authDomain: "coding-club-ad538.firebaseapp.com",
  databaseURL: "https://coding-club-ad538-default-rtdb.firebaseio.com",
  projectId: "coding-club-ad538",
  storageBucket: "coding-club-ad538.firebasestorage.app",
  messagingSenderId: "529914796071",
  appId: "1:529914796071:web:16ae0b752145a71bc15602"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
