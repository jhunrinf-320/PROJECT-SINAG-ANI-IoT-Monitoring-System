import {
  database,
  ref,
  set,
  auth,
  signInAnonymously,
} from "../firebase/firebaseConfig";

import { useState } from "react";

function ControlPanel() {

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // ==========================================
  // SEND FIREBASE COMMAND
  // ==========================================

  const command = async (mode) => {

    try {

      setSending(true);

      setMessage("Sending...");

      // Make sure user is authenticated

      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      // Firebase control path

      const commandRef = ref(
        database,
        "devices/device001/control/mode"
      );

      // Send command

      await set(
        commandRef,
        mode
      );

      console.log(
        "Firebase command sent:",
        mode
      );

      setMessage(
        `Command sent: ${mode}`
      );

    } catch (error) {

      console.error(
        "Firebase command failed:",
        error
      );

      setMessage(
        "Command failed"
      );

    } finally {

      setSending(false);

    }
  };

  return (
    <div className="control-panel">

      <h2>
        DRYING CONTROL
      </h2>

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

        {/* INITIAL */}

        <button
          type="button"
          disabled={sending}
          onClick={() =>
            command("HIGH")
          }
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: sending
              ? "wait"
              : "pointer",
          }}
        >
          INITIAL HIGH
        </button>

        {/* MAIN */}

        <button
          type="button"
          disabled={sending}
          onClick={() =>
            command(
              "MODERATE-HIGH"
            )
          }
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: sending
              ? "wait"
              : "pointer",
          }}
        >
          MAIN DRYING
        </button>

        {/* FINAL */}

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
            cursor: sending
              ? "wait"
              : "pointer",
          }}
        >
          FINAL DRYING
        </button>

        {/* STOP */}

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
            cursor: sending
              ? "wait"
              : "pointer",
          }}
        >
          STOP
        </button>

      </div>

      {/* COMMAND RESULT */}

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
