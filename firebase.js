// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBmTd4_XnTDAxIkJQ0d74B1PXhH7YZwWCA",
  authDomain: "khayal-shop.firebaseapp.com",
  projectId: "khayal-shop",
  storageBucket: "khayal-shop.firebasestorage.app",
  messagingSenderId: "254612552466",
  appId: "1:254612552466:web:bf050fc76d6124251751cb"
};

firebase.initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = firebase.firestore();
const auth = firebase.auth();

// Add to firebase.js
function isAdmin() {
  // For now, return true for all logged-in users
  // In production, you'd check user roles in Firestore
  return auth.currentUser !== null;
}

// Export for use in other files
window.db = db;
window.auth = auth;

console.log("Firebase initialized successfully!");