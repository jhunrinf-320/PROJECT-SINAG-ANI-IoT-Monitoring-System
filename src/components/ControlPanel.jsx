import {
  initializeApp,
  getApps
} from "firebase/app";

import {
  getDatabase,
  ref,
  set
} from "firebase/database";

import firebaseConfig from "../firebase/firebaseConfig";


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database =
  getDatabase(firebaseApp);


// ============================================================
// CONTROL PANEL
// ============================================================

function ControlPanel() {


  // ==========================================================
  // SEND COMMAND TO ESP32
  // ==========================================================

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


  // ==========================================================
  // USER INTERFACE
  // ==========================================================

  return (

    <div className="control-panel">


      <h2>
        Drying Control
      </h2>


      <p>
        Select the drying mode for the SINAG-ANI system.
      </p>


      <div className="control-buttons">


        {/* ==================================================
            INITIAL HIGH
        ================================================== */}

        <button
          onClick={() => command("HIGH")}
        >
          HIGH
        </button>


        {/* ==================================================
            MAIN DRYING
        ================================================== */}

        <button
          onClick={() => command("MODERATE-HIGH")}
        >
          MODERATE-HIGH
        </button>


        {/* ==================================================
            FINAL DRYING
        ================================================== */}

        <button
          onClick={() => command("MODERATE")}
        >
          MODERATE
        </button>


        {/* ==================================================
            STOP
        ================================================== */}

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
