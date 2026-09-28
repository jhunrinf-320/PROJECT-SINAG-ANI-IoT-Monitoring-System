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
  const [displayRemaining, setDisplayRemaining] = useState(0);

  // --------------------------------------------------
  // FIREBASE DEVICE DATA
  // --------------------------------------------------
  useEffect(() => {
    const deviceRef = ref(database, "devices/device001");

    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setDevice(data);

          if (data.status?.stageRemainingSeconds !== undefined) {
            setDisplayRemaining(
              Number(data.status.stageRemainingSeconds) || 0
            );
          }
        }
      },
      (error) => {
        console.error("Firebase read error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------
  // FIREBASE HISTORY
  // --------------------------------------------------
  useEffect(() => {
    const historyRef = ref(database, "devices/device001/history");

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setHistory([]);
          return;
        }

        const historyArray = Object.entries(data)
          .map(([key, item]) => ({
            id: key,
            ...item,
          }))
          .sort((a, b) => {
            const timeA = Number(a.timestamp) || 0;
            const timeB = Number(b.timestamp) || 0;
            return timeA - timeB;
          })
          .slice(-60)
          .map((item) => ({
            time: item.time || formatTime(item.timestamp),
            temp1: Number(item.temp1) || 0,
            temp2: Number(item.temp2) || 0,
          }));

        setHistory(historyArray);
      },
      (error) => {
        console.error("Firebase history error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------
  // SMOOTH COUNTDOWN
  // --------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      const automatic = device?.status?.automatic === true;
      const paused = device?.status?.paused === true;

      if (automatic && !paused && displayRemaining > 0) {
        setDisplayRemaining((previous) =>
          previous > 0 ? previous - 1 : 0
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [device, displayRemaining]);

  // --------------------------------------------------
  // ONLINE STATUS
  // --------------------------------------------------
  const isOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "true";

  // --------------------------------------------------
  // SENSOR HEALTH
  // --------------------------------------------------
  const temp1Healthy =
    device?.status?.temp1Healthy !== false;

  const temp2Healthy =
    device?.status?.temp2Healthy !== false;

  const humidityHealthy =
    device?.status?.humidityHealthy !== false;

  // --------------------------------------------------
  // DEVICE VALUES
  // --------------------------------------------------
  const temp1 = device?.sensors?.temp1;
  const temp2 = device?.sensors?.temp2;
  const humidity = device?.sensors?.humidity;
  const dht11Temperature = device?.sensors?.dht11Temperature;

  const mode = device?.status?.mode || "IDLE";
  const stage = device?.status?.stage || mode;

  const automatic =
    device?.status?.automatic === true;

  const paused =
    device?.status?.paused === true;

  const pwm =
    Number(device?.status?.pwm) || 0;

  const coolFan =
    device?.status?.coolFan === true;

  const totalRemaining =
    Number(device?.status?.totalRemainingSeconds) || 0;

  const totalElapsed =
    Number(device?.status?.totalElapsedSeconds) || 0;

  // --------------------------------------------------
  // SYSTEM INFO
  // --------------------------------------------------
  const ipAddress =
    device?.status?.ip || "Unknown";

  const wifi =
    device?.status?.wifi || "Unknown";

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="app">

      {/* HEADER */}
      <header className="dashboard-header">

        <div className="header-title">
          <h1>SINAG-ANI IoT Dashboard</h1>
          <p>IoT Solar Food Drying System</p>
        </div>

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

      {/* SENSOR SECTION */}
      <section className="dashboard-section">

        <div className="section-heading">
          <h2>Environmental Sensors</h2>
          <p>
            Real-time temperature and humidity readings
          </p>
        </div>

        <div className="cards">

          <SensorCard
            title="Temperature Sensor 1"
            value={temp1}
            unit="°C"
            icon="🌡️"
            healthy={temp1Healthy}
            sensorName="DS18B20 #1"
          />

          <SensorCard
            title="Temperature Sensor 2"
            value={temp2}
            unit="°C"
            icon="🌡️"
            healthy={temp2Healthy}
            sensorName="DS18B20 #2"
          />

          <SensorCard
            title="Humidity"
            value={humidity}
            unit="%"
            icon="💧"
            healthy={humidityHealthy}
            sensorName="DHT11"
          />

          <SensorCard
            title="DHT11 Temperature"
            value={dht11Temperature}
            unit="°C"
            icon="🌡️"
            healthy={humidityHealthy}
            sensorName="DHT11"
          />

        </div>

      </section>

      {/* STATUS SECTION */}
      <section className="dashboard-section">

        <StatusCard
          mode={mode}
          stage={stage}
          automatic={automatic}
          paused={paused}
          pwm={pwm}
          coolFan={coolFan}
          stageRemainingSeconds={displayRemaining}
          totalRemainingSeconds={totalRemaining}
          totalElapsedSeconds={totalElapsed}
        />

      </section>

      {/* CONTROL SECTION */}
      <section className="dashboard-section">

        <ControlPanel
          mode={mode}
          automatic={automatic}
          paused={paused}
        />

      </section>

      {/* TEMPERATURE CHART */}
      <section className="dashboard-section">

        <div className="section-card">

          <div className="section-heading">
            <h2>Temperature Monitoring</h2>

            <p>
              Temperature history from both DS18B20
              sensors.
            </p>
          </div>

          <TemperatureChart data={history} />

        </div>

      </section>

      {/* SYSTEM INFORMATION */}
      <section className="dashboard-section">

        <div className="section-card">

          <div className="section-heading">
            <h2>System Information</h2>
          </div>

          <div className="system-info">

            <div className="info-item">
              <span>Device ID</span>
              <strong>device001</strong>
            </div>

            <div className="info-item">
              <span>Controller</span>
              <strong>ESP32</strong>
            </div>

            <div className="info-item">
              <span>Wi-Fi</span>
              <strong>{wifi}</strong>
            </div>

            <div className="info-item">
              <span>IP Address</span>
              <strong>{ipAddress}</strong>
            </div>

            <div className="info-item">
              <span>Firebase</span>
              <strong className="connected">
                Connected
              </strong>
            </div>

            <div className="info-item">
              <span>Device Status</span>

              <strong
                className={
                  isOnline
                    ? "connected"
                    : "disconnected"
                }
              >
                {isOnline
                  ? "Online"
                  : "Offline"}
              </strong>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}


// --------------------------------------------------
// FORMAT TIME
// --------------------------------------------------
function formatTime(timestamp) {
  if (!timestamp) {
    return "--:--:--";
  }

  const date = new Date(Number(timestamp));

  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString();
}


export default App;
