import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_CURRENT_API_KEY",
  authDomain: "luxmo-hub.firebaseapp.com",
  projectId: "luxmo-hub",
  storageBucket: "luxmo-hub.firebasestorage.app",
  messagingSenderId: "YOUR_CURRENT_SENDER_ID",
  appId: "YOUR_CURRENT_APP_ID",
  measurementId: "YOUR_CURRENT_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
