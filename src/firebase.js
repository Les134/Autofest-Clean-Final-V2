import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR REAL KEY",
  authDomain: "autofest-burnout-judging.firebaseapp.com",
  projectId: "autofest-burnout-judging",
  storageBucket: "autofest-burnout-judging.firebasestorage.app",
  messagingSenderId: "453347070025",
  appId: "1:453347070025:web:0567bc51df8a0b49b46f98"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
