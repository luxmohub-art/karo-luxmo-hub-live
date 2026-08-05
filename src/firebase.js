import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDIhrrRlRzbOm@iM1EsfMCrxglchl4IAI",
  authDomain: "luxmo-hub-enterprise.firebaseapp.com",
  databaseURL: "https://luxmo-hub-enterprise-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "luxmo-hub-enterprise",
  storageBucket: "luxmo-hub-enterprise.firebasestorage.app",
  messagingSenderId: "860667261629",
  appId: "1:860667261629:web:e0951d7835c778e4d9fdd4"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;
