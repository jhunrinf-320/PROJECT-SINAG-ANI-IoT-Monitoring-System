import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";

import { database } from "./firebase/firebaseConfig.js";

import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);

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

          // Save temperature history
          if (
            data.sensors?.temp1 !== undefined &&
            data.sensors?.temp1 !== null
          ) {
            setHistory((previous) => {
              const newReading = {
                time: new Date().toLocaleTimeString(),
                temp: Number(data.sensors.temp1),
              };

              return [...previous.slice(-9), newReading];
            });
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
  // ONLINE / OFFLINE STATUS
  // ==========================================

  const isOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "true";

  return (
    <div className="app">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="dashboard-header">

        <div>
          <h1>SINAG-ANI IoT Dashboard</h1>
          <p>IoT Dryer System</p>
        </div>

        {/* ONLINE / OFFLINE */}

        <div
          className={`device-status ${
            isOnline ? "online" : "offline"
          }`}
        >
          <span className="status-dot"></span>

          {isOnline
            ? "Device Online"
            : "Device Offline"}
        </div>

      </header>


      {/* ======================================
          SENSOR CARDS
      ====================================== */}

      <section className="dashboard-section">

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

      </section>


      {/* ======================================
          DRYING STATUS
      ====================================== */}

      <section className="dashboard-section">

        <StatusCard
          mode={device?.status?.mode}
          pwm={device?.status?.pwm}
        />

      </section>


      {/* ======================================
          DRYING CONTROL
      ====================================== */}

      <section className="dashboard-section">

        <div className="section-card">

          <h2>Drying Control</h2>

          <p>
            Select the drying mode for the
            SINAG-ANI system.
          </p>

          <ControlPanel />

        </div>

      </section>


      {/* ======================================
          TEMPERATURE MONITORING
      ====================================== */}

      <section className="dashboard-section">

        <div className="section-card">

          <h2>Temperature Monitoring</h2>

          <p>
            Real-time temperature history from
            Temperature Sensor 1.
          </p>

          <TemperatureChart data={history} />

        </div>

      </section>


      {/* ======================================
          SYSTEM INFORMATION
      ====================================== */}

      <section className="dashboard-section">

        <div className="section-card">

          <h2>System Information</h2>

          <div className="system-info">

            <p>
              <strong>Device ID:</strong>{" "}
              device001
            </p>

            <p>
              <strong>Controller:</strong>{" "}
              ESP32
            </p>

            <p>
              <strong>Firebase:</strong>{" "}
              Connected
            </p>

            <p>
              <strong>Device Status:</strong>{" "}
              {isOnline
                ? "Online"
                : "Offline"}
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default App;
