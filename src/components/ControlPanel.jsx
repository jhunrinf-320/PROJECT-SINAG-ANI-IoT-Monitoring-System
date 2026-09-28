import { ref, set } from "firebase/database";
import { database } from "../firebase/firebaseConfig";

function ControlPanel() {
  const command = async (mode) => {
    try {
      await set(
        ref(database, "devices/device001/control/mode"),
        mode
      );

      console.log("Firebase command sent:", mode);
    } catch (error) {
      console.error("Failed to send Firebase command:", error);
    }
  };

  return (
    <div className="control">
      <h2>Drying Control</h2>

      <button onClick={() => command("HIGH")}>
        INITIAL HIGH
      </button>

      <button onClick={() => command("MODERATE-HIGH")}>
        MAIN DRYING
      </button>

      <button onClick={() => command("MODERATE")}>
        FINAL DRYING
      </button>

      <button onClick={() => command("OFF")}>
        STOP
      </button>
    </div>
  );
}

export default ControlPanel;
