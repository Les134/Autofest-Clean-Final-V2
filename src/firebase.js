import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REPLACE_WITH_REAL_API_KEY",
  authDomain: "autofestscoreapp.firebaseapp.com",
  projectId: "autofestscoreapp",
  storageBucket: "autofestscoreapp.appspot.com",
  messagingSenderId: "REPLACE_WITH_REAL_ID",
  appId: "REPLACE_WITH_REAL_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
