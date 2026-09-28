import { ref, set } from "firebase/database";
import { database } from "../firebase/firebaseConfig.js";

function ControlPanel({
  mode,
  automatic,
  paused,
}) {

  const sendCommand = async (command) => {
    try {

      const commandRef = ref(
        database,
        "devices/device001/control/mode"
      );

      await set(commandRef, command);

      console.log(
        `Command sent: ${command}`
      );

    } catch (error) {

      console.error(
        "Failed to send command:",
        error
      );

      alert(
        "Failed to send command. Check Firebase connection."
      );
    }
  };


  return (
    <div className="control-panel">

      <div className="control-header">

        <div>
          <h2>System Controls</h2>

          <p>
            Control the SINAG-ANI drying operation.
          </p>
        </div>

      </div>


      {/* AUTOMATIC CONTROLS */}
      <div className="control-group">

        <h3>Automatic Drying</h3>

        <div className="control-buttons">

          <button
            className="control-button start"
            onClick={() =>
              sendCommand("START")
            }
            disabled={automatic && !paused}
          >
            ▶ START
          </button>


          <button
            className="control-button pause"
            onClick={() =>
              sendCommand("PAUSE")
            }
            disabled={
              !automatic ||
              paused
            }
          >
            ⏸ PAUSE
          </button>


          <button
            className="control-button resume"
            onClick={() =>
              sendCommand("RESUME")
            }
            disabled={
              !automatic ||
              !paused
            }
          >
            ▶ RESUME
          </button>


          <button
            className="control-button stop"
            onClick={() =>
              sendCommand("STOP")
            }
          >
            ■ STOP
          </button>

        </div>

      </div>


      {/* MANUAL CONTROLS */}
      <div className="control-group">

        <h3>Manual Fan Modes</h3>

        <div className="control-buttons">

          <button
            className="control-button high"
            onClick={() =>
              sendCommand("HIGH")
            }
          >
            HIGH
            <span>100%</span>
          </button>


          <button
            className="control-button moderate-high"
            onClick={() =>
              sendCommand("MODERATE-HIGH")
            }
          >
            MODERATE-HIGH
            <span>75%</span>
          </button>


          <button
            className="control-button moderate"
            onClick={() =>
              sendCommand("MODERATE")
            }
          >
            MODERATE
            <span>50%</span>
          </button>


          <button
            className="control-button off"
            onClick={() =>
              sendCommand("OFF")
            }
          >
            OFF
          </button>

        </div>

      </div>


      {/* CURRENT COMMAND */}
      <div className="current-command">

        <span>
          Current Mode
        </span>

        <strong>
          {mode || "IDLE"}
        </strong>

      </div>

    </div>
  );
}

export default ControlPanel;
