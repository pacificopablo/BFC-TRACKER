// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCN0dBQXoaWh_13lF0ON25otUpeH3OGINQ",
  authDomain: "bfc-tracker.firebaseapp.com",
  projectId: "bfc-tracker",
  storageBucket: "bfc-tracker.firebasestorage.app",
  messagingSenderId: "127052459580",
  appId: "1:127052459580:web:ee9af6545f841d171cdd39",
  measurementId: "G-TJEMF05CH7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
