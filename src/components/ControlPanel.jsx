import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  set
} from "firebase/database";

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

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);

const COMMAND_PATH =
  "devices/device001/control/mode";


function ControlPanel() {

  const sendCommand = async (command) => {

    try {

      console.log(
        "Sending command:",
        command
      );

      await set(
        ref(
          database,
          COMMAND_PATH
        ),
        command
      );

      console.log(
        "Command sent successfully:",
        command
      );

    } catch (error) {

      console.error(
        "Command failed:",
        error
      );

      alert(
        "Command failed: " +
        error.message
      );

    }

  };


  const buttonStyle = {
    display: "block",
    width: "100%",
    minHeight: "58px",
    padding: "15px",
    margin: "0",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer"
  };


  return (

    <div
      style={{
        width: "100%",
        marginTop: "30px",
        padding: "28px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        boxShadow:
          "0 8px 25px rgba(15,23,42,0.08)"
      }}
    >

      <h2
        style={{
          marginTop: 0,
          marginBottom: "8px",
          color: "#14532d"
        }}
      >
        🌾 Drying Control
      </h2>

      <p
        style={{
          marginBottom: "25px",
          color: "#64748b"
        }}
      >
        Control the SINAG-ANI drying operation.
      </p>


      {/* ================================================
          AUTOMATIC CONTROL
      ================================================= */}

      <h3
        style={{
          color: "#172033",
          marginBottom: "12px"
        }}
      >
        Automatic Operation
      </h3>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(140px, 1fr))",
          gap: "12px",
          marginBottom: "30px"
        }}
      >

        {/* START */}

        <button
          type="button"
          onClick={() => sendCommand("START")}
          style={{
            ...buttonStyle,
            background: "#16a34a"
          }}
        >
          ▶ START
        </button>


        {/* AUTO */}

        <button
          type="button"
          onClick={() => sendCommand("AUTO")}
          style={{
            ...buttonStyle,
            background: "#2563eb"
          }}
        >
          ⚙ AUTO
        </button>


        {/* PAUSE */}

        <button
          type="button"
          onClick={() => sendCommand("PAUSE")}
          style={{
            ...buttonStyle,
            background: "#f59e0b",
            color: "#422006"
          }}
        >
          ⏸ PAUSE
        </button>


        {/* RESUME */}

        <button
          type="button"
          onClick={() => sendCommand("RESUME")}
          style={{
            ...buttonStyle,
            background: "#0f766e"
          }}
        >
          ▶ RESUME
        </button>

      </div>


      {/* ================================================
          MANUAL STAGES
      ================================================= */}

      <h3
        style={{
          color: "#172033",
          marginBottom: "12px"
        }}
      >
        Manual Drying Stages
      </h3>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "30px"
        }}
      >

        {/* INITIAL */}

        <button
          type="button"
          onClick={() => sendCommand("HIGH")}
          style={{
            ...buttonStyle,
            background: "#f59e0b",
            color: "#422006"
          }}
        >
          🔥 INITIAL HIGH
        </button>


        {/* MAIN */}

        <button
          type="button"
          onClick={() =>
            sendCommand("MODERATE-HIGH")
          }
          style={{
            ...buttonStyle,
            background: "#166534"
          }}
        >
          🌡 MAIN DRYING
        </button>


        {/* FINAL */}

        <button
          type="button"
          onClick={() =>
            sendCommand("MODERATE")
          }
          style={{
            ...buttonStyle,
            background: "#0f766e"
          }}
        >
          💨 FINAL DRYING
        </button>

      </div>


      {/* ================================================
          STOP
      ================================================= */}

      <button
        type="button"
        onClick={() => sendCommand("OFF")}
        style={{
          display: "block",
          width: "100%",
          minHeight: "60px",
          padding: "16px",
          margin: "0",
          border: "none",
          borderRadius: "12px",
          background: "#dc2626",
          color: "white",
          fontSize: "16px",
          fontWeight: "900",
          cursor: "pointer"
        }}
      >
        ⛔ STOP DRYING
      </button>


      <p
        style={{
          marginTop: "18px",
          marginBottom: 0,
          color: "#64748b",
          fontSize: "13px"
        }}
      >
        Commands are sent to the ESP32 through Firebase.
      </p>

    </div>

  );

}

export default ControlPanel;
