import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
const auth = getAuth(app);

// Realtime Database
const database = getDatabase(app);

// Anonymous login
const firebaseReady = signInAnonymously(auth)
  .then(() => {
    console.log("Firebase anonymous authentication successful.");
    return true;
  })
  .catch((error) => {
    console.error(
      "Firebase anonymous authentication failed:",
      error
    );
    return false;
  });

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Firebase authenticated:", user.uid);
  } else {
    console.log("Firebase not authenticated");
  }
});

export {
  app,
  auth,
  database,
  firebaseReady,
};
