import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";

import { database } from "./firebase/firebaseConfig.js";

import Sidebar from "./components/Sidebar";
import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");

  // ==========================================
  // FIREBASE DEVICE DATA
  // ==========================================
  useEffect(() => {
    const deviceRef = ref(database, "devices/device001");

    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setDevice(data);

          // ==========================================
          // SAVE TEMPERATURE HISTORY
          // ==========================================
          if (
            data.sensors?.temp1 !== undefined &&
            data.sensors?.temp1 !== null
          ) {
            setHistory((previous) => [
              ...previous.slice(-9),
              {
                time: new Date().toLocaleTimeString(),
                temp: Number(data.sensors.temp1),
              },
            ]);
          }
        }
      },
      (error) => {
        console.error("Firebase read error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // DEVICE ONLINE / OFFLINE STATUS
  // ==========================================
  const isOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "true";

  return (
    <div className="layout">

      {/* ==========================================
          SIDEBAR
      ========================================== */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}
      <main>

        <h1>SINAG-ANI IoT Dashboard</h1>

        {/* ==========================================
            ONLINE / OFFLINE STATUS
        ========================================== */}
        <div
          className={`device-status ${
            isOnline ? "online" : "offline"
          }`}
        >
          <span className="status-dot"></span>

          <span>
            {isOnline
              ? "Device Online"
              : "Device Offline"}
          </span>
        </div>

        {/* ==========================================
            DASHBOARD PAGE
        ========================================== */}
        {activePage === "Dashboard" ? (
          <>
            <div className="cards">

              <SensorCard
                title="Temperature Sensor 1"
                value={device?.sensors?.temp1}
                unit="°C"
                icon="🌡️"
              />

              <SensorCard
                title="Temperature Sensor 2"
                value={device?.sensors?.temp2}
                unit="°C"
                icon="🔥"
              />

              <SensorCard
                title="Humidity"
                value={device?.sensors?.humidity}
                unit="%"
                icon="💧"
              />

            </div>

            <StatusCard
              mode={device?.status?.mode}
              pwm={device?.status?.pwm}
            />
          </>
        ) : null}

        {/* ==========================================
            MONITORING PAGE
        ========================================== */}
        {activePage === "Monitoring" ? (
          <>
            <h2>Sensor Monitoring</h2>

            <div className="cards">

              <SensorCard
                title="Temperature Sensor 1"
                value={device?.sensors?.temp1}
                unit="°C"
                icon="🌡️"
              />

              <SensorCard
                title="Temperature Sensor 2"
                value={device?.sensors?.temp2}
                unit="°C"
                icon="🔥"
              />

              <SensorCard
                title="Humidity"
                value={device?.sensors?.humidity}
                unit="%"
                icon="💧"
              />

            </div>

            <TemperatureChart data={history} />
          </>
        ) : null}

        {/* ==========================================
            CONTROL PAGE
        ========================================== */}
        {activePage === "Control" ? (
          <>
            <h2>Drying Control</h2>

            <ControlPanel />
          </>
        ) : null}

        {/* ==========================================
            SETTINGS PAGE
        ========================================== */}
        {activePage === "Settings" ? (
          <div className="settings-box">

            <h2>System Settings</h2>

            <p>
              <strong>Device ID:</strong> device001
            </p>

            <p>
              <strong>Firebase Connection:</strong> Active
            </p>

            <p>
              <strong>Controller:</strong> ESP32
            </p>

          </div>
        ) : null}

      </main>
    </div>
  );
}

export default App;
