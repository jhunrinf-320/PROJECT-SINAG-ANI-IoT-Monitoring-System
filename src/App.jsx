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

  useEffect(() => {
    const deviceRef = ref(
      database,
      "devices/device001"
    );

    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setDevice(data);

          if (
            data.sensors?.temp1 !== undefined &&
            data.sensors?.temp1 !== null
          ) {
            setHistory((previous) => [
              ...previous.slice(-9),
              {
                time: new Date().toLocaleTimeString(),
                temp: Number(data.sensors.temp1)
              }
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

  const isOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "true";

  return (
    <div className="layout">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main>

        <h1>
          SINAG-ANI IoT Dashboard
        </h1>

        {/* DASHBOARD */}

        {activePage === "Dashboard" ? (
          <>
            <div className="status-online">
              {isOnline
                ? "● DEVICE ONLINE"
                : "● DEVICE OFFLINE"}
            </div>

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


        {/* MONITORING */}

        {activePage === "Monitoring" ? (
          <>
            <h2>
              Sensor Monitoring
            </h2>

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

            <TemperatureChart
              data={history}
            />
          </>
        ) : null}


        {/* CONTROL */}

        {activePage === "Control" ? (
          <>
            <h2>
              Drying Control
            </h2>

            <ControlPanel />
          </>
        ) : null}


        {/* SETTINGS */}

        {activePage === "Settings" ? (
          <div className="settings-box">

            <h2>
              System Settings
            </h2>

            <p>
              Device ID: device001
            </p>

            <p>
              Firebase Connection: Active
            </p>

            <p>
              Controller: ESP32
            </p>

          </div>
        ) : null}

      </main>

    </div>
  );
}

export default App;
