import {
  database,
  ref,
  set,
} from "../firebase/firebaseConfig";

function ControlPanel() {

  // ==========================================
  // SEND COMMAND TO ESP32
  // ==========================================

  const command = async (mode) => {

    try {

      console.log(
        "Sending Firebase command:",
        mode
      );

      await set(
        ref(
          database,
          "devices/device001/control/mode"
        ),
        mode
      );

      console.log(
        "Command successfully sent:",
        mode
      );

    } catch (error) {

      console.error(
        "Firebase command failed:",
        error
      );

      alert(
        "Failed to send command. Check Firebase connection."
      );
    }
  };

  // ==========================================
  // CONTROL PANEL UI
  // ==========================================

  return (
    <div className="control-panel">

      <h2>DRYING CONTROL</h2>

      <p>
        Select a drying operation:
      </p>

      <div className="control-buttons">

        {/* INITIAL STAGE */}

        <button
          type="button"
          onClick={() => command("HIGH")}
        >
          INITIAL HIGH
        </button>

        {/* MAIN STAGE */}

        <button
          type="button"
          onClick={() =>
            command("MODERATE-HIGH")
          }
        >
          MAIN DRYING
        </button>

        {/* FINAL STAGE */}

        <button
          type="button"
          onClick={() =>
            command("MODERATE")
          }
        >
          FINAL DRYING
        </button>

        {/* STOP */}

        <button
          type="button"
          onClick={() =>
            command("OFF")
          }
        >
          STOP
        </button>

      </div>

    </div>
  );
}

export default ControlPanel;
