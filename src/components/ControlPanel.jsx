import { useEffect, useState } from "react";

import {
  initializeApp,
  getApps,
} from "firebase/app";

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

// ============================================================
// FIREBASE
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

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

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
    useState("Connecting...");

  const [sending, setSending] =
    useState(false);

  // ==========================================================
  // AUTH
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (user) {
              if (mounted) {
                setAuthenticated(true);
                setMessage(
                  "Firebase connected."
                );
              }

              return;
            }

            await signInAnonymously(auth);

            if (mounted) {
              setAuthenticated(true);
              setMessage(
                "Firebase connected."
              );
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
  // LISTEN TO COMMAND
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
          setCurrentCommand(
            String(value)
          );
        }
      },
      (error) => {
        console.error(
          "Command listener error:",
          error
        );
      }
    );

    return () => unsubscribe();
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
      "PATH:",
      COMMAND_PATH
    );

    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      if (!auth.currentUser) {
        throw new Error(
          "Firebase authentication failed."
        );
      }

      const commandRef = ref(
        database,
        COMMAND_PATH
      );

      await set(
        commandRef,
        command
      );

      console.log(
        "COMMAND SENT:",
        command
      );

      setLastSent(command);

      setMessage(
        `${command} command sent to ESP32.`
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

  return (
    <div className="control-card">

      {/* ====================================================
          CONNECTION
      ==================================================== */}

      <div className="control-card-header">

        <div>
          <span className="card-eyebrow">
            ESP32 CONTROL
          </span>

          <h2>
            Drying Control
          </h2>

          <p>
            Commands are sent to the
            SINAG-ANI ESP32 through Firebase.
          </p>
        </div>

        <div
          className={
            authenticated
              ? "control-connection connected"
              : "control-connection disconnected"
          }
        >
          <span></span>

          {authenticated
            ? "CONNECTED"
            : "DISCONNECTED"}
        </div>

      </div>

      {/* ====================================================
          AUTOMATIC
      ==================================================== */}

      <div className="control-group">

        <div className="control-group-title">
          Automatic Drying
        </div>

        <div className="control-group-description">
          Start and manage the complete
          multi-stage drying cycle.
        </div>

        <div className="command-grid">

          <CommandButton
            label="▶ START"
            command="START"
          />

          <CommandButton
            label="Ⅱ PAUSE"
            command="PAUSE"
          />

          <CommandButton
            label="▶ RESUME"
            command="RESUME"
          />

          <CommandButton
            label="■ STOP"
            command="STOP"
            danger
          />

        </div>

      </div>

      {/* ====================================================
          MANUAL
      ==================================================== */}

      <div className="control-group">

        <div className="control-group-title">
          Manual Fan Control
        </div>

        <div className="control-group-description">
          Directly select the fan operating
          level.
        </div>

        <div className="command-grid">

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
          COMMAND INFORMATION
      ==================================================== */}

      <div className="command-info">

        <div className="command-info-row">
          <span>
            Last command
          </span>

          <strong>
            {lastSent}
          </strong>
        </div>

        <div className="command-info-row">
          <span>
            Firebase command
          </span>

          <strong>
            {currentCommand}
          </strong>
        </div>

        <div className="command-message">
          {message}
        </div>

      </div>

    </div>
  );
}

export default ControlPanel;
