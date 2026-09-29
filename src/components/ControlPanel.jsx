import {
  initializeApp,
  getApps,
} from "firebase/app";

import {
  getDatabase,
  ref,
  set,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket:
    "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL",
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const database = getDatabase(app);

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

    } catch (error) {

      console.error(
        "Failed to send Firebase command:",
        error
      );

      alert(
        "Unable to send command to SINAG-ANI."
      );
    }
  };

  return (

    <section className="control-panel">

      <h2>
        Drying Control
      </h2>

      <p>
        Select the drying mode for the
        SINAG-ANI system.
      </p>

      <div className="control-buttons">

        <button
          onClick={() =>
            command("HIGH")
          }
        >
          HIGH
        </button>


        <button
          onClick={() =>
            command("MODERATE-HIGH")
          }
        >
          MODERATE-HIGH
        </button>


        <button
          onClick={() =>
            command("MODERATE")
          }
        >
          MODERATE
        </button>


        <button
          onClick={() =>
            command("OFF")
          }
        >
          OFF
        </button>

      </div>

    </section>
  );
}

export default ControlPanel;
