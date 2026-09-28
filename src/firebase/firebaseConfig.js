import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const database = getDatabase(app);

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

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(
      "Firebase user authenticated:",
      user.uid
    );
  } else {
    console.log(
      "Firebase user is not authenticated."
    );
  }
});

export {
  app,
  auth,
  database,
  firebaseReady,
};

export default app;
