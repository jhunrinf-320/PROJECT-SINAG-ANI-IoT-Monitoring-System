import {
  ref,
  set
} from "firebase/database";

import {
  database
} from "../firebase/firebaseConfig.js";

function ControlPanel() {

  // ==========================================
  // SEND COMMAND TO ESP32 THROUGH FIREBASE
  // ==========================================

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
        "Firebase command sent:",
        mode
      );

    } catch (error) {

      console.error(
        "Failed to send Firebase command:",
        error
      );

    }

  };


  // ==========================================
  // CONTROL PANEL
  // ==========================================

  return (

    <div className="control-panel">

      <h2>
        Drying Control
      </h2>


      <p>
        Select the drying mode for the SINAG-ANI system.
      </p>


      <div className="control-buttons">

        {/* HIGH */}

        <button
          onClick={() => command("HIGH")}
        >
          HIGH
        </button>


        {/* MODERATE-HIGH */}

        <button
          onClick={() => command("MODERATE-HIGH")}
        >
          MODERATE-HIGH
        </button>


        {/* MODERATE */}

        <button
          onClick={() => command("MODERATE")}
        >
          MODERATE
        </button>


        {/* OFF */}

        <button
          onClick={() => command("OFF")}
        >
          OFF
        </button>

      </div>

    </div>

  );

}

export default ControlPanel; 
