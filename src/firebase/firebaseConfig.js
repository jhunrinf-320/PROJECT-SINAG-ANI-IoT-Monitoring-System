import { initializeApp } from "firebase/app";
import {
  getDatabase
} from "firebase/database";

import {
  getAuth,
  signInAnonymously
} from "firebase/auth";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {

  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",

  authDomain:
    "sinag-ani-iot.firebaseapp.com",

  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "sinag-ani-iot",

  storageBucket:
    "sinag-ani-iot.firebasestorage.app",

  messagingSenderId:
    "505006165687",

  appId:
    "1:505006165687:web:8d930c2a846a978a41c732",

  measurementId:
    "G-F1YD6L3XNL"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp =
  initializeApp(firebaseConfig);


// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================

const auth =
  getAuth(firebaseApp);


// ============================================================
// FIREBASE REALTIME DATABASE
// ============================================================

const database =
  getDatabase(firebaseApp);


// ============================================================
// ANONYMOUS AUTHENTICATION
// ============================================================

signInAnonymously(auth)

  .then(() => {

    console.log(
      "Firebase anonymous authentication successful."
    );

  })

  .catch((error) => {

    console.error(
      "Firebase anonymous authentication failed:",
      error
    );

  });


// ============================================================
// EXPORTS
// ============================================================

export {
  auth,
  database
};
