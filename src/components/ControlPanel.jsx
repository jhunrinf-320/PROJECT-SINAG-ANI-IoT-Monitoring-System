import React, { useEffect, useState } from "react";

import { initializeApp } from "firebase/app";

import {
  getDatabase,
  ref,
  set
} from "firebase/database";

import {
  getAuth,
  signInAnonymously
} from "firebase/auth";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732"
};


// =====================================================
// FIREBASE
// =====================================================

const controlApp = initializeApp(
  firebaseConfig,
  "sinag-ani-control"
);

const database = getDatabase(controlApp);
const auth = getAuth(controlApp);


// =====================================================
// CONTROL PANEL
// =====================================================

function ControlPanel() {

  const [authenticated, setAuthenticated] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastCommand, setLastCommand] = useState("OFF");
  const [message, setMessage] = useState("");


  // ===================================================
  // AUTHENTICATION
  // ===================================================

  useEffect(() => {

    signInAnonymously(auth)
      .then(() => {

        console.log(
          "Control panel Firebase authentication successful."
        );

        setAuthenticated(true);

      })
      .catch((error) => {

        console.error(
          "Control panel authentication failed:",
          error
        );

        setMessage("Firebase authentication failed.");

      });

  }, []);


  // ===================================================
  // SEND COMMAND
  // ===================================================

  const sendCommand = async (command) => {

    if (!authenticated) {

      setMessage("Waiting for Firebase authentication...");
      return;

    }

    try {

      setSending(true);
      setMessage("Sending command...");


      const commandRef = ref(
        database,
        "devices/device001/control/mode"
      );


      await set(commandRef, command);


      setLastCommand(command);

      setMessage(
        `Command "${command}" sent successfully.`
      );


      console.log(
        "SINAG-ANI command sent:",
        command
      );


    } catch (error) {

      console.error(
        "Command failed:",
        error
      );

      setMessage(
        "Failed to send command."
      );

    } finally {

      setSending(false);

    }

  };


  // ===================================================
  // BUTTON HANDLERS
  // ===================================================

  const startDrying = () => {
    sendCommand("START");
  };

  const high = () => {
    sendCommand("HIGH");
  };

  const moderateHigh = () => {
    sendCommand("MODERATE-HIGH");
  };

  const moderate = () => {
    sendCommand("MODERATE");
  };

  const stopDrying = () => {
    sendCommand("OFF");
  };


  // ===================================================
  // UI
  // ===================================================

  return (

    <div className="control-panel">

      <div className="control-panel-header">

        <h2>System Control</h2>

        <p>
          Control the SINAG-ANI drying operation
        </p>

      </div>


      {/* AUTH STATUS */}

      <div className="control-status">

        <span>
          Firebase:
        </span>

        <strong>
          {authenticated
            ? " Connected"
            : " Connecting..."}
        </strong>

      </div>


      {/* START */}

      <div className="control-group">

        <h3>Automatic Drying</h3>

        <button
          className="control-button start-button"
          onClick={startDrying}
          disabled={!authenticated || sending}
        >
          START DRYING
        </button>

      </div>


      {/* MANUAL STAGES */}

      <div className="control-group">

        <h3>Manual Drying Stage</h3>

        <div className="control-buttons">

          <button
            className="control-button"
            onClick={high}
            disabled={!authenticated || sending}
          >
            HIGH
          </button>


          <button
            className="control-button"
            onClick={moderateHigh}
            disabled={!authenticated || sending}
          >
            MODERATE-HIGH
          </button>


          <button
            className="control-button"
            onClick={moderate}
            disabled={!authenticated || sending}
          >
            MODERATE
          </button>

        </div>

      </div>


      {/* STOP */}

      <div className="control-group">

        <button
          className="control-button stop-button"
          onClick={stopDrying}
          disabled={!authenticated || sending}
        >
          STOP / OFF
        </button>

      </div>


      {/* CURRENT COMMAND */}

      <div className="current-command">

        <span>
          Last Command:
        </span>

        <strong>
          {lastCommand}
        </strong>

      </div>


      {/* MESSAGE */}

      {message && (

        <div className="control-message">

          {message}

        </div>

      )}

    </div>

  );

}


export default ControlPanel;
