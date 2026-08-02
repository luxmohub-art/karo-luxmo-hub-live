import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD366V9fIGJnHwfpgf9KYW3e...",
  authDomain: "luxmo-hub.firebaseapp.com",
  projectId: "luxmo-hub",
  storageBucket: "luxmo-hub.firebasestorage.app",
  messagingSenderId: "1054383037062",
  appId: "1:1054383037062:web:12898cc7c85be687424f07",
  measurementId: "G-NNT3KBE925"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


