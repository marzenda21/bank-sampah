import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2hJFlSSVrwND8H3dYIys2hfztWNhbyB4",
  authDomain: "storesampah-662d1.firebaseapp.com",
  projectId: "storesampah-662d1",
  storageBucket: "storesampah-662d1.firebasestorage.app",
  messagingSenderId: "353858757620",
  appId: "1:353858757620:web:6ab3e934c961d0bd2b4fa1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Authentication
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
