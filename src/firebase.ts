import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
      apiKey: "AIzaSyDbGjgJiqQMOqRsMmSrZGJtWKw0GXRBESM",
      authDomain: "propipegemini.firebaseapp.com",
      projectId: "propipegemini",
      storageBucket: "propipegemini.firebasestorage.app",
      messagingSenderId: "409234416676",
      appId: "1:409234416676:web:2e1f4ca51fd7876aff24b1",
      measurementId: "G-EQ2D62YE6W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
