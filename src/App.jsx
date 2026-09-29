import { useEffect, useState } from "react";

import {
  initializeApp,
  getApps,
} from "firebase/app";

import {
  getDatabase,
  ref,
  onValue,
} from "firebase/database";

import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";

import Sidebar from "./components/Sidebar";
import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

// ============================================================
// FIREBASE
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
  measurementId: "G-F1YD6L3XNL",
};

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

const DEVICE_PATH = "devices/device001";

// ============================================================
// APP
// ============================================================

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [firebaseOnline, setFirebaseOnline] =
    useState(false);

  // ==========================================================
  // FIREBASE AUTH + DEVICE LISTENER
  // ==========================================================

  useEffect(() => {
    let unsubscribeDevice = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (!user) {
              await signInAnonymously(auth);
              return;
            }

            setFirebaseOnline(true);

            const deviceRef = ref(
              database,
              DEVICE_PATH
            );

            unsubscribeDevice = onValue(
              deviceRef,
              (snapshot) => {
                const data = snapshot.val();

                if (!data) {
                  setDevice({});
                  return;
                }

                setDevice(data);

                // ------------------------------
                // Temperature history
                // ------------------------------

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
                      temp: temp1,
                    },
                  ]);
                }
              },
              (error) => {
                console.error(
                  "Firebase device listener error:",
                  error
                );

                setFirebaseOnline(false);
              }
            );
          } catch (error) {
            console.error(
              "Firebase authentication error:",
              error
            );

            setFirebaseOnline(false);
          }
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeDevice) {
        unsubscribeDevice();
      }
    };
  }, []);

  // ==========================================================
  // SENSOR DATA
  // ==========================================================

  const sensors = device?.sensors || {};
  const status = device?.status || {};

  const temp1 = sensors?.temp1;
  const temp2 = sensors?.temp2;
  const humidity = sensors?.humidity;
  const dht11Temperature =
    sensors?.dht11Temperature;

  // ==========================================================
  // DEVICE ONLINE
  // ==========================================================

  const deviceOnline =
    status?.online === true ||
    status?.online === 1 ||
    status?.online === "1";

  const systemOnline =
    firebaseOnline && deviceOnline;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="app-shell">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="page-header">

          <div>
            <div className="brand-small">
              🌾 SINAG-ANI
            </div>

            <h1>
              IoT Dryer System
            </h1>

            <p>
              Real-time monitoring and
              multi-stage drying control
            </p>
          </div>

          <div
            className={
              systemOnline
                ? "connection-badge online"
                : "connection-badge offline"
            }
          >
            <span className="connection-dot"></span>

            {systemOnline
              ? "DEVICE ONLINE"
              : "DEVICE OFFLINE"}
          </div>

        </header>

        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {activePage === "Dashboard" && (
          <section className="page-section">

            <div className="section-heading">
              <div>
                <h2>System Overview</h2>

                <p>
                  Current sensor readings and
                  drying operation.
                </p>
              </div>
            </div>

            <div className="sensor-grid">

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

            <StatusCard
              mode={status?.mode}
              pwm={status?.pwm}
              stage={status?.stage}
              online={status?.online}
              automatic={status?.automatic}
              paused={status?.paused}
              stageElapsedSeconds={
                status?.stageElapsedSeconds
              }
              stageRemainingSeconds={
                status?.stageRemainingSeconds
              }
              totalElapsedSeconds={
                status?.totalElapsedSeconds
              }
              totalRemainingSeconds={
                status?.totalRemainingSeconds
              }
              coolFan={status?.coolFan}
            />

          </section>
        )}

        {/* ==================================================
            MONITORING
        ================================================== */}

        {activePage === "Monitoring" && (
          <section className="page-section">

            <div className="section-heading">
              <div>
                <h2>Sensor Monitoring</h2>

                <p>
                  Live readings from the
                  SINAG-ANI sensors.
                </p>
              </div>
            </div>

            <div className="sensor-grid">

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

          </section>
        )}

        {/* ==================================================
            CONTROL
        ================================================== */}

        {activePage === "Control" && (
          <section className="page-section">

            <div className="section-heading">
              <div>
                <h2>Drying Control</h2>

                <p>
                  Send commands directly to
                  the SINAG-ANI ESP32.
                </p>
              </div>
            </div>

            <ControlPanel />

          </section>
        )}

        {/* ==================================================
            SETTINGS
        ================================================== */}

        {activePage === "Settings" && (
          <section className="page-section">

            <div className="section-heading">
              <div>
                <h2>System Settings</h2>

                <p>
                  SINAG-ANI device information.
                </p>
              </div>
            </div>

            <div className="settings-card">

              <div className="setting-row">
                <span>Device ID</span>
                <strong>device001</strong>
              </div>

              <div className="setting-row">
                <span>Controller</span>
                <strong>ESP32</strong>
              </div>

              <div className="setting-row">
                <span>Firebase</span>
                <strong
                  className={
                    firebaseOnline
                      ? "text-online"
                      : "text-offline"
                  }
                >
                  {firebaseOnline
                    ? "Connected"
                    : "Disconnected"}
                </strong>
              </div>

              <div className="setting-row">
                <span>Device</span>
                <strong
                  className={
                    deviceOnline
                      ? "text-online"
                      : "text-offline"
                  }
                >
                  {deviceOnline
                    ? "Online"
                    : "Offline"}
                </strong>
              </div>

              <div className="setting-row">
                <span>Database Path</span>
                <strong>
                  devices/device001
                </strong>
              </div>

            </div>

          </section>
        )}

      </main>
    </div>
  );
}

export default App;
