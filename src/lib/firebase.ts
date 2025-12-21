// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6CTYz7Mxk1sp4AVsAeSkc_8MdWXAChnM",
  authDomain: "studentattendanceportal-37b5a.firebaseapp.com",
  projectId: "studentattendanceportal-37b5a",
  storageBucket: "studentattendanceportal-37b5a.firebasestorage.app",
  messagingSenderId: "79727656933",
  appId: "1:79727656933:web:2d571be81fdfd70a1c390c",
  measurementId: "G-CJHK3W2WL7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics only works in browser
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const auth = getAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;