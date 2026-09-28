import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";

import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

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

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// ESP32 heartbeat is every 10 seconds.
// Device is considered offline after 25 seconds without heartbeat.
const DEVICE_TIMEOUT = 25000;

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

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [firebaseOnline, setFirebaseOnline] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(false);

  useEffect(() => {
    let unsubscribeDevice = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setFirebaseOnline(false);
          setDevice({});
          setDeviceOnline(false);
          return;
        }

        setFirebaseOnline(true);

        const deviceRef = ref(
          database,
          "devices/device001"
        );

        unsubscribeDevice = onValue(
          deviceRef,
          (snapshot) => {
            const data = snapshot.val();

            if (!data) {
              setDevice({});
              setDeviceOnline(false);
              return;
            }

            setDevice(data);

            const temp1 = data?.sensors?.temp1;

            if (
              typeof temp1 === "number" &&
              Number.isFinite(temp1)
            ) {
              setHistory((previous) => [
                ...previous.slice(-19),
                {
                  time: new Date().toLocaleTimeString(),
                  temp: temp1
                }
              ]);
            }
          },
          (error) => {
            console.error(
              "Firebase device listener error:",
              error
            );

            setFirebaseOnline(false);
            setDeviceOnline(false);
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

  // Check the ESP32 heartbeat.
  useEffect(() => {
    const checkHeartbeat = () => {
      const lastSeen = device?.status?.lastSeen;

      if (
        typeof lastSeen !== "number" ||
        lastSeen <= 0
      ) {
        setDeviceOnline(false);
        return;
      }

      const age = Date.now() - lastSeen;

      setDeviceOnline(
        firebaseOnline &&
        age >= 0 &&
        age <= DEVICE_TIMEOUT
      );
    };

    checkHeartbeat();

    const timer = setInterval(
      checkHeartbeat,
      2000
    );

    return () => clearInterval(timer);
  }, [
    device?.status?.lastSeen,
    firebaseOnline
  ]);

  const temp1 = device?.sensors?.temp1;
  const temp2 = device?.sensors?.temp2;
  const humidity = device?.sensors?.humidity;
  const dht11Temperature =
    device?.sensors?.dht11Temperature;

  const lastSeen = device?.status?.lastSeen;

  const lastSeenText =
    typeof lastSeen === "number"
      ? new Date(lastSeen).toLocaleTimeString()
      : "No heartbeat";

  return (
    <div className="app-shell">

      {/* HEADER */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-icon">
            ☀️
          </div>

          <div>
            <h1>SINAG-ANI IoT</h1>

            <p>
              Solar Food Dryer Monitoring System
            </p>
          </div>

        </div>


        <div
          className={
            deviceOnline
              ? "device-pill online"
              : "device-pill offline"
          }
        >

          <span className="status-dot"></span>

          {deviceOnline
            ? "DEVICE ONLINE"
            : "DEVICE OFFLINE"}

        </div>

      </header>


      {/* MAIN ONE-PAGE DASHBOARD */}

      <main className="dashboard">


        {/* SENSOR OVERVIEW */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                LIVE SYSTEM
              </span>

              <h2>
                Dashboard Overview
              </h2>

            </div>


            <span
              className={
                firebaseOnline
                  ? "firebase-state connected"
                  : "firebase-state disconnected"
              }
            >

              ● Firebase{" "}

              {firebaseOnline
                ? "Connected"
                : "Disconnected"}

            </span>

          </div>


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

        </section>


        {/* DRYING STATUS */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                DRYING SYSTEM
              </span>

              <h2>
                Current Status
              </h2>

            </div>

          </div>


          <StatusCard
            mode={device?.status?.mode}
            pwm={device?.status?.pwm}
            stage={device?.status?.stage}
            online={deviceOnline}
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

        </section>


        {/* MONITORING */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                SENSOR DATA
              </span>

              <h2>
                Temperature Monitoring
              </h2>

            </div>

          </div>


          <TemperatureChart
            data={history}
          />

        </section>


        {/* CONTROL */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                CONTROL
              </span>

              <h2>
                Drying Control
              </h2>

            </div>

          </div>


          <ControlPanel />

        </section>


        {/* SYSTEM INFORMATION */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                CONNECTION
              </span>

              <h2>
                System Information
              </h2>

            </div>

          </div>


          <div className="info-grid">

            <div className="info-item">
              <span>Device ID</span>
              <strong>
                device001
              </strong>
            </div>


            <div className="info-item">
              <span>Controller</span>
              <strong>
                ESP32
              </strong>
            </div>


            <div className="info-item">
              <span>Device Status</span>

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


            <div className="info-item">
              <span>Wi-Fi</span>

              <strong>
                {device?.status?.wifi ||
                  "Not available"}
              </strong>

            </div>


            <div className="info-item">
              <span>IP Address</span>

              <strong>
                {device?.status?.ip ||
                  "Not available"}
              </strong>

            </div>


            <div className="info-item">
              <span>Last Heartbeat</span>

              <strong>
                {lastSeenText}
              </strong>

            </div>

          </div>

        </section>

      </main>


      <footer>
        SINAG-ANI IoT Monitoring System • Device 001
      </footer>

    </div>
  );
}

export default App;
