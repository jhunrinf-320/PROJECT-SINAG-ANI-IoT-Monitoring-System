import { useEffect, useState } from "react";

import {
  database,
  ref,
  onValue,
} from "./firebase/firebaseConfig";

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
  // FIREBASE DEVICE LISTENER
  // ==========================================

  useEffect(() => {
    const deviceRef = ref(
      database,
      "devices/device001"
    );

    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        const data = snapshot.val();

        console.log("Firebase device data:", data);

        if (data) {
          setDevice(data);

          const temp1 = data?.sensors?.temp1;

          if (
            temp1 !== undefined &&
            temp1 !== null &&
            !isNaN(Number(temp1))
          ) {
            setHistory((previous) => [
              ...previous.slice(-19),
              {
                time: new Date().toLocaleTimeString(),
                temp: Number(temp1),
              },
            ]);
          }
        }
      },
      (error) => {
        console.error(
          "Firebase listener error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // SENSOR VALUES
  // ==========================================

  const temp1 = device?.sensors?.temp1;
  const temp2 = device?.sensors?.temp2;
  const humidity = device?.sensors?.humidity;

  // ==========================================
  // DEVICE ONLINE STATUS
  // ==========================================

  const deviceOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "1" ||
    device?.online === true ||
    device?.online === 1 ||
    device?.online === "1";

  // ==========================================
  // MAIN APP
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
          MAIN CONTENT
      ====================================== */}

      <main>

        <h1>SINAG-ANI IoT Dashboard</h1>

        {/* ====================================
            DASHBOARD
        ==================================== */}

        {activePage === "Dashboard" && (
          <>
            {/* DEVICE STATUS */}

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

            {/* =================================
                CONTROL PANEL
            ================================= */}

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
            CONTROL PAGE
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
              Connected
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
