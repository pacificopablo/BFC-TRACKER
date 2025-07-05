import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN0dBQXoaWh_13lF0ON25otUpeH3OGINQ",
  authDomain: "bfc-tracker.firebaseapp.com",
  projectId: "bfc-tracker",
  storageBucket: "bfc-tracker.appspot.com",
  messagingSenderId: "127052459580",
  appId: "1:127052459580:web:ee9af6545f841d171cdd39"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
