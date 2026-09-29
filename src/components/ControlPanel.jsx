import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
};

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);

function ControlPanel() {
  const command = async (mode) => {
    try {
      await set(
        ref(
          database,
          "devices/device001/control/mode"
        ),
        mode
      );

      console.log(
        "SINAG-ANI command sent:",
        mode
      );

      alert(`Command sent: ${mode}`);

    } catch (error) {
      console.error(
        "Firebase command error:",
        error
      );

      alert(
        "Command failed: " +
        error.message
      );
    }
  };

  return (
    <div
      style={{
        marginTop: "25px",
        padding: "25px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        boxShadow:
          "0 8px 25px rgba(15, 23, 42, 0.08)",
      }}
    >

      <h2
        style={{
          marginTop: 0,
          marginBottom: "8px",
          color: "#14532d",
        }}
      >
        Drying Control
      </h2>

      <p
        style={{
          color: "#64748b",
          marginBottom: "20px",
        }}
      >
        Control the SINAG-ANI drying operation.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
        }}
      >

        <button
          type="button"
          onClick={() => command("HIGH")}
          style={{
            display: "block",
            width: "100%",
            minHeight: "55px",
            padding: "15px",
            border: "none",
            borderRadius: "12px",
            background: "#f59e0b",
            color: "#422006",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          INITIAL HIGH
        </button>


        <button
          type="button"
          onClick={() =>
            command("MODERATE-HIGH")
          }
          style={{
            display: "block",
            width: "100%",
            minHeight: "55px",
            padding: "15px",
            border: "none",
            borderRadius: "12px",
            background: "#166534",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          MAIN DRYING
        </button>


        <button
          type="button"
          onClick={() =>
            command("MODERATE")
          }
          style={{
            display: "block",
            width: "100%",
            minHeight: "55px",
            padding: "15px",
            border: "none",
            borderRadius: "12px",
            background: "#0f766e",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          FINAL DRYING
        </button>


        <button
          type="button"
          onClick={() => command("OFF")}
          style={{
            display: "block",
            width: "100%",
            minHeight: "55px",
            padding: "15px",
            border: "none",
            borderRadius: "12px",
            background: "#dc2626",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          STOP
        </button>

      </div>

    </div>
  );
}

export default ControlPanel;
