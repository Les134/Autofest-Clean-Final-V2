import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuvxgmnpr8EVRAN9y-AJCWGVOf0xi7sxk",
  authDomain: "autofestscoreapp.firebaseapp.com",
  projectId: "autofestscoreapp",
  storageBucket: "autofestscoreapp.firebasestorage.app",
  messagingSenderId: "293382914162",
  appId: "1:293382914162:web:1c0ab2f637988819f9c2eb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
