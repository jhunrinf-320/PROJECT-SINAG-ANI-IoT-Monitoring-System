import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
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
import "./index.css";

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

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeHistory(snapshotValue) {
  if (!snapshotValue || typeof snapshotValue !== "object") {
    return [];
  }

  return Object.entries(snapshotValue)
    .map(([key, item]) => {
      const timestamp = Number(item?.timestamp);

      const time = Number.isFinite(timestamp)
        ? new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

      const temp1Value = Number(item?.temp1);
      const temp2Value = Number(item?.temp2);

      return {
        key,
        timestamp: Number.isFinite(timestamp) ? timestamp : 0,
        time,
        temp1: isValidNumber(temp1Value) ? temp1Value : null,
        temp2: isValidNumber(temp2Value) ? temp2Value : null,
      };
    })
    .filter(
      (item) => item.temp1 !== null || item.temp2 !== null
    )
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-30);
}

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [firebaseOnline, setFirebaseOnline] = useState(false);

  useEffect(() => {
    let unsubscribeDevice = null;
    let unsubscribeHistory = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFirebaseOnline(false);
        setDevice({});
        setHistory([]);

        signInAnonymously(auth).catch((error) => {
          console.error(
            "Anonymous authentication failed:",
            error
          );
        });

        return;
      }

      setFirebaseOnline(true);

      const deviceRef = ref(
        database,
        "devices/device001"
      );

      const historyRef = ref(
        database,
        "devices/device001/history"
      );

      unsubscribeDevice = onValue(
        deviceRef,
        (snapshot) => {
          const data = snapshot.val();

          if (data) {
            setDevice(data);
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

      unsubscribeHistory = onValue(
        historyRef,
        (snapshot) => {
          const data = normalizeHistory(
            snapshot.val()
          );

          if (data.length) {
            setHistory(data);
          }
        },
        (error) => {
          console.error(
            "Firebase history listener error:",
            error
          );
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeDevice) {
        unsubscribeDevice();
      }

      if (unsubscribeHistory) {
        unsubscribeHistory();
      }
    };
  }, []);

  const temp1 = device?.sensors?.temp1;
  const temp2 = device?.sensors?.temp2;
  const humidity = device?.sensors?.humidity;
  const dht11Temperature =
    device?.sensors?.dht11Temperature;

  const deviceOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "1";

  const displayOnline =
    deviceOnline && firebaseOnline;

  return (
    <div className="layout">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main>

        {/* HEADER */}

        <header className="page-header">

          <div>
            <p className="eyebrow">
              IoT DRYER SYSTEM
            </p>

            <h1>
              SINAG-ANI Dashboard
            </h1>

            <p className="page-subtitle">
              Real-time monitoring and multi-stage
              drying control
            </p>
          </div>

          <div
            className={
              displayOnline
                ? "connection online"
                : "connection offline"
            }
          >
            <span className="connection-dot" />

            {displayOnline
              ? "DEVICE ONLINE"
              : "DEVICE OFFLINE"}
          </div>

        </header>


        {/* DASHBOARD */}

        {activePage === "Dashboard" && (
          <>

            <section className="section-heading">

              <div>

                <h2>
                  System Overview
                </h2>

                <p>
                  Current sensor readings and
                  drying operation.
                </p>

              </div>

            </section>


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
              coolFan={
                device?.status?.coolFan
              }
            />

          </>
        )}


        {/* MONITORING */}

        {activePage === "Monitoring" && (
          <>

            <section className="section-heading">

              <div>

                <h2>
                  Sensor Monitoring
                </h2>

                <p>
                  Temperature history from the
                  SINAG-ANI controller.
                </p>

              </div>

            </section>


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


        {/* CONTROL */}

        {activePage === "Control" && (
          <>

            <section className="section-heading">

              <div>

                <h2>
                  Drying Control
                </h2>

                <p>
                  Control the current drying
                  mode of SINAG-ANI.
                </p>

              </div>

            </section>

            <ControlPanel />

          </>
        )}


        {/* SETTINGS */}

        {activePage === "Settings" && (

          <section className="settings-box">

            <div className="section-heading compact">

              <div>

                <h2>
                  System Settings
                </h2>

                <p>
                  Connection and controller
                  information.
                </p>

              </div>

            </div>


            <div className="settings-grid">

              <div>
                <span>Device ID</span>
                <strong>
                  device001
                </strong>
              </div>

              <div>
                <span>
                  Firebase Connection
                </span>

                <strong>
                  {firebaseOnline
                    ? "Active"
                    : "Disconnected"}
                </strong>
              </div>

              <div>
                <span>
                  Device Status
                </span>

                <strong>
                  {deviceOnline
                    ? "Online"
                    : "Offline"}
                </strong>
              </div>

              <div>
                <span>
                  Controller
                </span>

                <strong>
                  ESP32
                </strong>
              </div>

              <div>
                <span>
                  Database Path
                </span>

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
