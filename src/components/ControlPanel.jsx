import { useEffect, useState } from "react";

import { ref, set, onValue } from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

import { database, auth } from "../firebase/firebaseConfig";

function ControlPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentCommand, setCurrentCommand] = useState("IDLE");
  const [lastSent, setLastSent] = useState("NONE");
  const [message, setMessage] = useState("Connecting to Firebase...");
  const [sending, setSending] = useState(false);

  const commandRef = ref(
    database,
    "devices/device001/control/mode"
  );

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
  // LISTEN TO COMMAND PATH
  // ==========================================================

  useEffect(() => {
    const unsubscribe = onValue(
      commandRef,
      (snapshot) => {
        const value = snapshot.val();

        if (value !== null) {
          setCurrentCommand(String(value));
          console.log(
            "Firebase command path:",
            value
          );
        }
      },
      (error) => {
        console.error(
          "Command listener error:",
          error
        );

        setMessage(
          "Cannot read Firebase command path."
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================================
  // SEND COMMAND TO ESP32
  // ==========================================================

  const sendCommand = async (command) => {
    console.log("--------------------------------");
    console.log(
      "SINAG-ANI COMMAND:",
      command
    );
    console.log(
      "PATH:",
      "devices/device001/control/mode"
    );

    setSending(true);
    setMessage(
      `Sending ${command}...`
    );

    try {
      // Make absolutely sure the website is authenticated.
      if (!auth.currentUser) {
        console.log(
          "No Firebase user. Signing in..."
        );

        await signInAnonymously(auth);
      }

      if (!auth.currentUser) {
        throw new Error(
          "Firebase authentication failed."
        );
      }

      console.log(
        "Authenticated UID:",
        auth.currentUser.uid
      );

      // ======================================================
      // ACTUAL COMMAND
      // ======================================================

      await set(commandRef, command);

      console.log(
        "COMMAND SUCCESSFULLY WRITTEN:",
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

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="control-panel">

      <div className="control-header">
        <div>
          <h2>Drying Control</h2>

          <p>
            Send commands directly to the
            SINAG-ANI ESP32 through Firebase.
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
          AUTOMATIC DRYING
      ==================================================== */}

      <div className="control-section">

        <h3>
          Automatic Drying
        </h3>

        <p className="section-description">
          Control the complete multi-stage
          drying cycle.
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

        <h3>
          Manual Fan Control
        </h3>

        <p className="section-description">
          Directly select the fan operating level.
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
          COMMAND DEBUG
      ==================================================== */}

      <div className="command-status">

        <div>
          <span>
            Last sent:
          </span>

          <strong>
            {lastSent}
          </strong>
        </div>

        <div>
          <span>
            Firebase value:
          </span>

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
