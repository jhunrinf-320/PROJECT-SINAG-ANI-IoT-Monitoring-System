import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";

import { database } from "./firebase/firebaseConfig";

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
    const deviceRef = ref(database, "devices/device001");

    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setDevice(data);

          if (data.sensors?.temp1 !== undefined) {
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
        console.error("Firebase listener error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // DEVICE STATUS
  // ==========================================
  const isOnline =
    device?.status?.online === true ||
    device?.sensors?.online === true ||
    device?.online === true;

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

        {/* ====================================
            HEADER
        ==================================== */}
        <div className="page-header">
          <h1>SINAG-ANI IoT Dashboard</h1>

          <div
            className={
              isOnline
                ? "status-online"
                : "status-offline"
            }
          >
            ● {isOnline ? "DEVICE ONLINE" : "DEVICE OFFLINE"}
          </div>
        </div>

        {/* ====================================
            DASHBOARD
        ==================================== */}
        {activePage === "Dashboard" && (
          <>
            <section>
              <h2>System Overview</h2>

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

            {/* =================================
                DRYING STATUS
            ================================= */}
            <section className="dashboard-section">

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

            </section>

            {/* =================================
                DRYING CONTROL
            ================================= */}
            <section className="dashboard-section">

              <ControlPanel />

            </section>
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
              <strong>Device ID:</strong> device001
            </p>

            <p>
              <strong>Firebase Connection:</strong>{" "}
              Active
            </p>

            <p>
              <strong>Controller:</strong> ESP32
            </p>

            <p>
              <strong>Database:</strong>{" "}
              sinag-ani-iot
            </p>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
