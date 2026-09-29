import { useState } from "react";

import {
  initializeApp,
  getApps,
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
  storageBucket:
    "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL",
};

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const database = getDatabase(app);
const auth = getAuth(app);

// ==========================================
// CONTROL PANEL
// ==========================================

function ControlPanel() {

  const [currentCommand, setCurrentCommand] =
    useState("IDLE");

  const [message, setMessage] =
    useState("Ready");

  const [loading, setLoading] =
    useState(false);

  // ========================================
  // SEND FIREBASE COMMAND
  // ========================================

  const command = async (mode) => {

    console.log(
      "================================"
    );

    console.log(
      "SINAG-ANI COMMAND:",
      mode
    );

    setLoading(true);

    setMessage(
      `Sending ${mode}...`
    );

    try {

      // ------------------------------------
      // AUTHENTICATION
      // ------------------------------------

      console.log(
        "Authenticating Firebase..."
      );

      await signInAnonymously(auth);

      console.log(
        "Firebase authentication successful."
      );

      // ------------------------------------
      // FIREBASE COMMAND PATH
      // ------------------------------------

      const commandRef = ref(
        database,
        "devices/device001/control/mode"
      );

      // ------------------------------------
      // WRITE COMMAND
      // ------------------------------------

      await set(
        commandRef,
        mode
      );

      console.log(
        "Firebase command sent:",
        mode
      );

      // ------------------------------------
      // UPDATE WEBSITE
      // ------------------------------------

      setCurrentCommand(mode);

      setMessage(
        `${mode} command sent successfully.`
      );

    } catch (error) {

      console.error(
        "Firebase command error:",
        error
      );

      setMessage(
        `ERROR: ${error.message}`
      );

    } finally {

      setLoading(false);

    }
  };

  // ========================================
  // BUTTON COMPONENT
  // ========================================

  const ControlButton = ({
    label,
    commandValue,
    className = "",
  }) => {

    return (
      <button
        type="button"
        className={className}
        disabled={loading}
        onClick={() =>
          command(commandValue)
        }
      >
        {label}
      </button>
    );
  };

  // ========================================
  // UI
  // ========================================

  return (

    <section className="control-panel">

      <h2>
        Drying Control
      </h2>

      <p>
        Control the SINAG-ANI drying
        operation.
      </p>


      {/* ==================================
          AUTOMATIC DRYING
          ================================== */}

      <h3
        style={{
          marginTop: "20px",
          marginBottom: "10px",
          color: "#166534",
        }}
      >
        Automatic Drying
      </h3>

      <div className="control-buttons">

        <ControlButton
          label="START"
          commandValue="START"
        />

        <ControlButton
          label="PAUSE"
          commandValue="PAUSE"
        />

        <ControlButton
          label="RESUME"
          commandValue="RESUME"
        />

        <ControlButton
          label="STOP"
          commandValue="STOP"
          className="stop-button"
        />

      </div>


      {/* ==================================
          MANUAL FAN CONTROL
          ================================== */}

      <h3
        style={{
          marginTop: "24px",
          marginBottom: "10px",
          color: "#166534",
        }}
      >
        Manual Fan Control
      </h3>

      <div className="control-buttons">

        <ControlButton
          label="HIGH"
          commandValue="HIGH"
        />

        <ControlButton
          label="MODERATE-HIGH"
          commandValue="MODERATE-HIGH"
        />

        <ControlButton
          label="MODERATE"
          commandValue="MODERATE"
        />

        <ControlButton
          label="OFF"
          commandValue="OFF"
          className="stop-button"
        />

      </div>


      {/* ==================================
          CURRENT COMMAND
          ================================== */}

      <div
        style={{
          marginTop: "18px",
          padding: "12px 14px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          fontSize: "13px",
        }}
      >

        <div>
          <strong>
            Last Command:
          </strong>{" "}

          {currentCommand}
        </div>

        <div
          style={{
            marginTop: "5px",
            color: "#64748b",
          }}
        >
          {message}
        </div>

      </div>

    </section>
  );
}

export default ControlPanel;
