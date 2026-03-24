import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLd3DAFeiO9dGkVw5EDho_3CFnRiyO9sM",
  authDomain: "animal-feeds-db.firebaseapp.com",
  projectId: "animal-feeds-db",
  storageBucket: "animal-feeds-db.firebasestorage.app",
  messagingSenderId: "755643419082",
  appId: "1:755643419082:web:3748e9182ce18108c5a733",
  measurementId: "G-VX15P5CCX0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
