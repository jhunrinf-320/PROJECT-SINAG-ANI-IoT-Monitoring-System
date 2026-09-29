import { useEffect, useState } from "react";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
} from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

import Sidebar from "./components/Sidebar";
import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL",
};

// ==========================================
// INITIALIZE FIREBASE
// ==========================================

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// ==========================================
// APP
// ==========================================

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [firebaseReady, setFirebaseReady] = useState(false);

  // ==========================================
  // FIREBASE AUTH + DEVICE LISTENER
  // ==========================================

  useEffect(() => {
    let unsubscribeDevice = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setFirebaseReady(false);

          signInAnonymously(auth).catch((error) => {
            console.error(
              "Anonymous authentication failed:",
              error
            );
          });

          return;
        }

        console.log(
          "Firebase authentication successful"
        );

        setFirebaseReady(true);

        const deviceRef = ref(
          database,
          "devices/device001"
        );

        unsubscribeDevice = onValue(
          deviceRef,
          (snapshot) => {
            const data = snapshot.val();

            console.log(
              "Firebase device data:",
              data
            );

            if (data) {
              setDevice(data);

              const temp1 =
                data?.sensors?.temp1;

              if (
                temp1 !== undefined &&
                temp1 !== null &&
                !isNaN(Number(temp1))
              ) {
                setHistory((previous) => [
                  ...previous.slice(-19),
                  {
                    time:
                      new Date().toLocaleTimeString(),
                    temp: Number(temp1),
                  },
                ]);
              }
            }
          },
          (error) => {
            console.error(
              "Firebase device listener error:",
              error
            );
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeDevice) {
        unsubscribeDevice();
      }
    };
  }, []);

  // ==========================================
  // SENSOR DATA
  // ==========================================

  const temp1 = device?.sensors?.temp1;
  const temp2 = device?.sensors?.temp2;
  const humidity = device?.sensors?.humidity;

  // ==========================================
  // DEVICE ONLINE
  // ==========================================

  const deviceOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "1" ||
    device?.online === true ||
    device?.online === 1 ||
    device?.online === "1";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="layout">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* ======================================
          MAIN
      ====================================== */}

      <main>

        <h1>SINAG-ANI IoT Dashboard</h1>

        {/* ====================================
            DASHBOARD
        ==================================== */}

        {activePage === "Dashboard" && (
          <>
            {/* CONNECTION STATUS */}

            <div
              className={
                deviceOnline && firebaseReady
                  ? "status-online"
                  : "status-offline"
              }
            >
              ●{" "}
              {deviceOnline && firebaseReady
                ? "DEVICE ONLINE"
                : "DEVICE OFFLINE"}
            </div>

            {/* SENSOR CARDS */}

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
                icon="🔥"
              />

              <SensorCard
                title="Humidity"
                value={humidity}
                unit="%"
                icon="💧"
              />

            </div>

            {/* DRYING STATUS */}

            <StatusCard
              mode={device?.status?.mode}
              pwm={device?.status?.pwm}
              stage={device?.status?.stage}
              online={device?.status?.online}
              automatic={device?.status?.automatic}
              paused={device?.status?.paused}
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
              coolFan={device?.status?.coolFan}
            />

            {/* CONTROL PANEL */}

            <ControlPanel />
          </>
        )}

        {/* ====================================
            MONITORING
        ==================================== */}

        {activePage === "Monitoring" && (
          <>
            <h2>Sensor Monitoring</h2>

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
                icon="🔥"
              />

              <SensorCard
                title="Humidity"
                value={humidity}
                unit="%"
                icon="💧"
              />

            </div>

            <TemperatureChart
              data={history}
            />
          </>
        )}

        {/* ====================================
            CONTROL
        ==================================== */}

        {activePage === "Control" && (
          <>
            <h2>Drying Control</h2>

            <ControlPanel />
          </>
        )}

        {/* ====================================
            SETTINGS
        ==================================== */}

        {activePage === "Settings" && (
          <div className="settings-box">

            <h2>System Settings</h2>

            <p>
              <strong>Device ID:</strong>{" "}
              device001
            </p>

            <p>
              <strong>Firebase:</strong>{" "}
              {firebaseReady
                ? "Connected"
                : "Connecting..."}
            </p>

            <p>
              <strong>Controller:</strong>{" "}
              ESP32
            </p>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
