// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");
const { getDatabase } = require("firebase/database");

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
const db = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

module.exports = { db, database, auth, storage };
