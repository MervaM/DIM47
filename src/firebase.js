import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAddZ0kMo79g3RAtAlpB1TqicxZi703sM",
  authDomain: "dim47-orders.firebaseapp.com",
  projectId: "dim47-orders",
  storageBucket: "dim47-orders.firebasestorage.app",
  messagingSenderId: "115802645955",
  appId: "1:115802645955:web:5a2c2e563647c36b7d8976",
  measurementId: "G-1Y2P90WQEC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);