// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Import Authentication
import { getAuth } from 'firebase/auth'
// Import Database
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDLKg95T10PcKJKbiRvVQWuv8ofNcDqxOE",
  authDomain: "phiscord-56e5e.firebaseapp.com",
  projectId: "phiscord-56e5e",
  storageBucket: "phiscord-56e5e.appspot.com",
  messagingSenderId: "532717218873",
  appId: "1:532717218873:web:aed2428bb50d0aabd3b1e8",
  measurementId: "G-LP39876P8K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Authentication
export const auth = getAuth();
export const db = getFirestore(app);
export default app;