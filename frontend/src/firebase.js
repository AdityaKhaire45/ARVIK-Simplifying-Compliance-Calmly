import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, off } from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAseyT0oYziUWJD6Z3cuxyc92s7GDvPWVQ",
  authDomain: "avdhi-a3205.firebaseapp.com",
  databaseURL: "https://avdhi-a3205-default-rtdb.firebaseio.com",
  projectId: "avdhi-a3205",
  storageBucket: "avdhi-a3205.firebasestorage.app",
  messagingSenderId: "587393976946",
  appId: "1:587393976946:web:8bdfe8e944a28082b910eb",
  measurementId: "G-Y1MZZP4DVW"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { 
  db, 
  auth, 
  ref, 
  push, 
  set, 
  onValue, 
  off, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
