import { useState } from "react";

import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";

import {
  getDatabase,
  ref,
  set,
} from "firebase/database";

import {
  getAuth,
  signInAnonymously,
} from "firebase/auth";

// ==========================================
// FIREBASE CONFIG
// ==========================================

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

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

function ControlPanel() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const command = async (mode) => {
    try {
      setSending(true);
      setMessage("Sending...");

      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const commandRef = ref(
        database,
        "devices/device001/control/mode"
      );

      await set(commandRef, mode);

      console.log(
        "Firebase command sent:",
        mode
      );

      setMessage(
        `Command sent: ${mode}`
      );

    } catch (error) {
      console.error(
        "Command failed:",
        error
      );

      setMessage("Command failed");

    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="control-panel"
      style={{
        marginTop: "25px",
        padding: "25px",
        borderRadius: "15px",
        border: "1px solid #ddd",
        background: "#fff",
      }}
    >

      <h2>DRYING CONTROL</h2>

      <p>
        Select a drying operation:
      </p>

      <div
        className="control-buttons"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "20px",
        }}
      >

        <button
          type="button"
          disabled={sending}
          onClick={() => command("HIGH")}
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          INITIAL HIGH
        </button>

        <button
          type="button"
          disabled={sending}
          onClick={() =>
            command("MODERATE-HIGH")
          }
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          MAIN DRYING
        </button>

        <button
          type="button"
          disabled={sending}
          onClick={() =>
            command("MODERATE")
          }
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          FINAL DRYING
        </button>

        <button
          type="button"
          disabled={sending}
          onClick={() =>
            command("OFF")
          }
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          STOP
        </button>

      </div>

      {message && (
        <p
          style={{
            marginTop: "15px",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

    </div>
  );
}

export default ControlPanel;
