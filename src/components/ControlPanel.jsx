import { useEffect, useState } from "react";

import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
} from "firebase/database";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

import "./ControlPanel.css";

// ============================================================
// FIREBASE CONFIG
// ============================================================

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

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// ============================================================
// DEVICE PATH
// ============================================================

const COMMAND_PATH =
  "devices/device001/control/mode";

// ============================================================
// CONTROL PANEL
// ============================================================

function ControlPanel() {
  const [authenticated, setAuthenticated] =
    useState(false);

  const [currentCommand, setCurrentCommand] =
    useState("IDLE");

  const [lastSent, setLastSent] =
    useState("NONE");

  const [message, setMessage] =
    useState("Connecting to Firebase...");

  const [sending, setSending] =
    useState(false);

  // ==========================================================
  // FIREBASE AUTHENTICATION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          if (mounted) {
            setAuthenticated(true);
            setMessage("Firebase connected.");
          }

          return;
        }

        try {
          await signInAnonymously(auth);

          if (mounted) {
            setAuthenticated(true);
            setMessage("Firebase connected.");
          }
        } catch (error) {
          console.error(
            "Firebase authentication failed:",
            error
          );

          if (mounted) {
            setAuthenticated(false);
            setMessage(
              "Firebase authentication failed."
            );
          }
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ==========================================================
  // LISTEN TO CURRENT COMMAND
  // ==========================================================

  useEffect(() => {
    const commandRef = ref(
      database,
      COMMAND_PATH
    );

    const unsubscribe = onValue(
      commandRef,
      (snapshot) => {
        const value = snapshot.val();

        if (value !== null) {
          setCurrentCommand(String(value));
        }
      },
      (error) => {
        console.error(
          "Firebase command listener error:",
          error
        );

        setMessage(
          "Cannot read Firebase command."
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // ==========================================================
  // SEND COMMAND
  // ==========================================================

  const sendCommand = async (command) => {
    if (sending) return;

    setSending(true);

    setMessage(
      `Sending ${command}...`
    );

    console.log(
      "================================"
    );

    console.log(
      "SINAG-ANI COMMAND:",
      command
    );

    console.log(
      "FIREBASE PATH:",
      COMMAND_PATH
    );

    try {
      // Make sure user is authenticated
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      if (!auth.currentUser) {
        throw new Error(
          "Firebase authentication failed."
        );
      }

      console.log(
        "Firebase UID:",
        auth.currentUser.uid
      );

      const commandRef = ref(
        database,
        COMMAND_PATH
      );

      // WRITE COMMAND TO FIREBASE
      await set(
        commandRef,
        command
      );

      console.log(
        "COMMAND SENT SUCCESSFULLY:",
        command
      );

      setLastSent(command);

      setMessage(
        `${command} command sent successfully.`
      );
    } catch (error) {
      console.error(
        "COMMAND FAILED:",
        error
      );

      setMessage(
        `Command failed: ${error.message}`
      );
    } finally {
      setSending(false);
    }
  };

  // ==========================================================
  // BUTTON
  // ==========================================================

  const CommandButton = ({
    label,
    command,
    danger = false,
  }) => {
    return (
      <button
        type="button"
        className={
          danger
            ? "command-button danger"
            : "command-button"
        }
        disabled={
          sending || !authenticated
        }
        onClick={() =>
          sendCommand(command)
        }
      >
        {label}
      </button>
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="control-panel">

      <div className="control-header">

        <div>
          <h2>Drying Control</h2>

          <p>
            Control the SINAG-ANI drying
            system through Firebase.
          </p>
        </div>

        <div
          className={
            authenticated
              ? "firebase-status connected"
              : "firebase-status disconnected"
          }
        >
          <span className="status-dot"></span>

          {authenticated
            ? "FIREBASE CONNECTED"
            : "FIREBASE DISCONNECTED"}
        </div>

      </div>

      {/* ====================================================
          AUTOMATIC CONTROL
      ==================================================== */}

      <div className="control-section">

        <h3>Automatic Drying</h3>

        <p className="section-description">
          Control the complete drying cycle.
        </p>

        <div className="control-buttons">

          <CommandButton
            label="START"
            command="START"
          />

          <CommandButton
            label="PAUSE"
            command="PAUSE"
          />

          <CommandButton
            label="RESUME"
            command="RESUME"
          />

          <CommandButton
            label="STOP"
            command="STOP"
            danger
          />

        </div>

      </div>

      {/* ====================================================
          MANUAL FAN CONTROL
      ==================================================== */}

      <div className="control-section">

        <h3>Manual Fan Control</h3>

        <p className="section-description">
          Select the fan operating level.
        </p>

        <div className="control-buttons">

          <CommandButton
            label="HIGH"
            command="HIGH"
          />

          <CommandButton
            label="MODERATE-HIGH"
            command="MODERATE-HIGH"
          />

          <CommandButton
            label="MODERATE"
            command="MODERATE"
          />

          <CommandButton
            label="OFF"
            command="OFF"
            danger
          />

        </div>

      </div>

      {/* ====================================================
          COMMAND STATUS
      ==================================================== */}

      <div className="command-status">

        <div>
          <span>Last sent:</span>

          <strong>
            {lastSent}
          </strong>
        </div>

        <div>
          <span>Firebase command:</span>

          <strong>
            {currentCommand}
          </strong>
        </div>

        <p>
          {message}
        </p>

      </div>

    </div>
  );
}

export default ControlPanel;
