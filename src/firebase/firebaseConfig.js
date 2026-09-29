import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
} from "firebase/database";
import {
  getAuth,
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

// ==========================================
// INITIALIZE FIREBASE
// ==========================================

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

// ==========================================
// FIREBASE SERVICES
// ==========================================

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// ==========================================
// EXPORT
// ==========================================

export {
  firebaseApp,
  database,
  auth,
};

export default firebaseApp;
