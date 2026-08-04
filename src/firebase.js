import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_REAL_API_KEY",
  authDomain: "luxmo-hub.firebaseapp.com",
  projectId: "luxmo-hub",
  storageBucket: "luxmo-hub.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_REAL_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_REAL_APP_ID",
  measurementId: "PASTE_YOUR_REAL_MEASUREMENT_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
