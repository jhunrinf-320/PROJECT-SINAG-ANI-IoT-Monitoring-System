import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue
} from "firebase/database";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";

import Sidebar from "./components/Sidebar";
import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// ============================================================
// APP
// ============================================================

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [firebaseOnline, setFirebaseOnline] = useState(false);

  // ==========================================================
  // FIREBASE AUTHENTICATION + DEVICE LISTENER
  // ==========================================================

  useEffect(() => {
    let unsubscribeDevice = null;

    // Anonymous Firebase login
    signInAnonymously(auth)
      .then(() => {
        console.log("Firebase anonymous authentication successful.");
      })
      .catch((error) => {
        console.error(
          "Firebase anonymous authentication failed:",
          error
        );
      });

    // Listen for authentication state
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          console.log("Firebase user is not authenticated.");

          setFirebaseOnline(false);
          setDevice({});

          return;
        }

        console.log(
          "Firebase authenticated:",
          user.uid
        );

        setFirebaseOnline(true);

        // ====================================================
        // DEVICE PATH
        // ====================================================

        const deviceRef = ref(
          database,
          "devices/device001"
        );

        // ====================================================
        // FIREBASE REALTIME LISTENER
        // ====================================================

        unsubscribeDevice = onValue(
          deviceRef,

          (snapshot) => {
            const data = snapshot.val();

            console.log(
              "Firebase device data:",
              data
            );

            // ------------------------------------------------
            // DEVICE DATA EXISTS
            // ------------------------------------------------

            if (data !== null && data !== undefined) {
              setDevice(data);

              // ----------------------------------------------
              // TEMPERATURE HISTORY
              // ----------------------------------------------

              const temp1 =
                data?.sensors?.temp1;

              if (
                typeof temp1 === "number" &&
                Number.isFinite(temp1)
              ) {
                setHistory((previous) => [
                  ...previous.slice(-19),
                  {
                    time:
                      new Date().toLocaleTimeString(),
                    temp: temp1
                  }
                ]);
              }
            }
          },

          // --------------------------------------------------
          // FIREBASE ERROR
          // --------------------------------------------------

          (error) => {
            console.error(
              "Firebase device listener error:",
              error
            );

            setFirebaseOnline(false);
          }
        );
      }
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      unsubscribeAuth();

      if (unsubscribeDevice) {
        unsubscribeDevice();
      }
    };
  }, []);

  // ==========================================================
  // SENSOR VALUES
  // ==========================================================

  const temp1 =
    device?.sensors?.temp1;

  const temp2 =
    device?.sensors?.temp2;

  const humidity =
    device?.sensors?.humidity;

  const dht11Temperature =
    device?.sensors?.dht11Temperature;

  // ==========================================================
  // DEVICE ONLINE STATUS
  // ==========================================================
  //
  // IMPORTANT:
  // We no longer depend ONLY on:
  //
  // device.status.online
  //
  // The dashboard considers the device connected when:
  //
  // 1. Firebase is connected
  // 2. Firebase has received the device data
  //
  // ==========================================================

  const hasDeviceData =
    device &&
    typeof device === "object" &&
    Object.keys(device).length > 0;

  const deviceOnline =
    firebaseOnline && hasDeviceData;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="layout">

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <main>

        <h1>
          SINAG-ANI IoT Dashboard
        </h1>

        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {activePage === "Dashboard" && (
          <>

            {/* ==============================================
                DEVICE CONNECTION STATUS
            ============================================== */}

            <div
              className={
                deviceOnline
                  ? "status-online"
                  : "status-offline"
              }
            >
              ●{" "}
              {deviceOnline
                ? "DEVICE ONLINE"
                : "DEVICE OFFLINE"}
            </div>

            {/* ==============================================
                SENSOR CARDS
            ============================================== */}

            <div className="cards">

              <SensorCard
                title="Temperature Sensor 1"
                value={temp1}
                unit="°C"
                icon="🌡️"
              />

              <SensorCard
                title="Temperature Sensor 2"
                value={temp2}
                unit="°C"
                icon="🌡️"
              />

              <SensorCard
                title="Humidity"
                value={humidity}
                unit="%"
                icon="💧"
              />

              <SensorCard
                title="DHT11 Temperature"
                value={dht11Temperature}
                unit="°C"
                icon="🌡️"
              />

            </div>

            {/* ==============================================
                DRYING STATUS
            ============================================== */}

            <StatusCard

              mode={
                device?.status?.mode
              }

              pwm={
                device?.status?.pwm
              }

              stage={
                device?.status?.stage
              }

              online={
                deviceOnline
              }

              automatic={
                device?.status?.automatic
              }

              paused={
                device?.status?.paused
              }

              stageElapsedSeconds={
                device?.status?.stageElapsedSeconds
              }

              stageRemainingSeconds={
                device?.status?.stageRemainingSeconds
              }

              totalElapsedSeconds={
                device?.status?.totalElapsedSeconds
              }

              totalRemainingSeconds={
                device?.status?.totalRemainingSeconds
              }

              coolFan={
                device?.status?.coolFan
              }

            />

          </>
        )}

        {/* ==================================================
            MONITORING
        ================================================== */}

        {activePage === "Monitoring" && (
          <>

            <h2>
              Sensor Monitoring
            </h2>

            <div className="cards">

              <SensorCard
                title="Temperature Sensor 1"
                value={temp1}
                unit="°C"
                icon="🌡️"
              />

              <SensorCard
                title="Temperature Sensor 2"
                value={temp2}
                unit="°C"
                icon="🌡️"
              />

              <SensorCard
                title="Humidity"
                value={humidity}
                unit="%"
                icon="💧"
              />

              <SensorCard
                title="DHT11 Temperature"
                value={dht11Temperature}
                unit="°C"
                icon="🌡️"
              />

            </div>

            <TemperatureChart
              data={history}
            />

          </>
        )}

        {/* ==================================================
            CONTROL
        ================================================== */}

        {activePage === "Control" && (
          <>

            <h2>
              Drying Control
            </h2>

            <ControlPanel />

          </>
        )}

        {/* ==================================================
            SETTINGS
        ================================================== */}

        {activePage === "Settings" && (
          <div className="settings-box">

            <h2>
              System Settings
            </h2>

            <p>
              Device ID: device001
            </p>

            <p>
              Firebase Connection:{" "}
              {firebaseOnline
                ? "Active"
                : "Disconnected"}
            </p>

            <p>
              Device Status:{" "}
              {deviceOnline
                ? "Online"
                : "Offline"}
            </p>

            <p>
              Controller: ESP32
            </p>

            <p>
              Database Path:{" "}
              devices/device001
            </p>

          </div>
        )}

      </main>

    </div>
  );
}

export default App;
