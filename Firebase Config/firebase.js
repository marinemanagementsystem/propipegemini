// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
