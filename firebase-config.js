import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
     apiKey: "AIzaSyCN0dBQXoaWh_13lF0ON25otUpeH3OGINQ",
    authDomain: "bfc-tracker.firebaseapp.com",
    databaseURL: "https://bfc-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bfc-tracker",
    storageBucket: "bfc-tracker.firebasestorage.app",
    messagingSenderId: "127052459580",
    appId: "1:127052459580:web:c3d5caa9302238c11cdd39",
    measurementId: "G-PNYRCFJHYM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
