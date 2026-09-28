import { useEffect, useState } from "react";

import {
  ref,
  onValue,
} from "firebase/database";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  database,
  auth,
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
  const [firebaseOnline, setFirebaseOnline] = useState(false);


  // ============================================================
  // FIREBASE AUTHENTICATION + DEVICE LISTENER
  // ============================================================

  useEffect(() => {
    let unsubscribeDevice = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          console.log(
            "Firebase user is not authenticated."
          );

          setFirebaseOnline(false);
          setDevice({});

          return;
        }

        console.log(
          "Firebase authenticated:",
          user.uid
        );

        setFirebaseOnline(true);

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

              const temp2 =
                data?.sensors?.temp2;

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
                    temp1: temp1,
                    temp2:
                      typeof temp2 === "number"
                        ? temp2
                        : null,
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

            setFirebaseOnline(false);
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


  // ============================================================
  // SENSOR VALUES
  // ============================================================

  const temp1 =
    device?.sensors?.temp1;

  const temp2 =
    device?.sensors?.temp2;

  const humidity =
    device?.sensors?.humidity;

  const dht11Temperature =
    device?.sensors?.dht11Temperature;


  // ============================================================
  // DEVICE ONLINE STATUS
  // ============================================================

  const deviceOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "1";


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="layout">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main>

        <div className="dashboard-header">

          <div className="header-title">
            <h1>
              SINAG-ANI IoT Dashboard
            </h1>

            <p>
              IoT Solar Food Drying System
            </p>
          </div>


          {/* ==================================================
              ONLINE / OFFLINE
          ================================================== */}

          <div
            className={
              deviceOnline && firebaseOnline
                ? "device-status online"
                : "device-status offline"
            }
          >
            <span className="status-dot"></span>

            {deviceOnline && firebaseOnline
              ? "DEVICE ONLINE"
              : "DEVICE OFFLINE"}
          </div>

        </div>


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {activePage === "Dashboard" && (
          <>

            <section className="dashboard-section">

              <div className="section-heading">

                <h2>
                  Environmental Sensors
                </h2>

                <p>
                  Real-time temperature and
                  humidity readings
                </p>

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


            {/* ==================================================
                DRYING STATUS
            ================================================== */}

            <StatusCard
              mode={
                device?.status?.mode
              }

              pwm={
                device?.status?.pwm
              }

              stage={
                device?.status?.stage
              }

              online={
                device?.status?.online
              }

              automatic={
                device?.status?.automatic
              }

              paused={
                device?.status?.paused
              }

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


        {/* ====================================================
            MONITORING
        ==================================================== */}

        {activePage === "Monitoring" && (
          <>

            <section className="dashboard-section">

              <div className="section-heading">

                <h2>
                  Sensor Monitoring
                </h2>

                <p>
                  Live sensor data from
                  SINAG-ANI
                </p>

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


            <section className="section-card">

              <div className="section-heading">

                <h2>
                  Temperature History
                </h2>

                <p>
                  Temperature readings over time
                </p>

              </div>

              <TemperatureChart
                data={history}
              />

            </section>

          </>
        )}


        {/* ====================================================
            CONTROL
        ==================================================== */}

        {activePage === "Control" && (
          <section className="dashboard-section">

            <div className="section-heading">

              <h2>
                Drying Control
              </h2>

              <p>
                Control the SINAG-ANI
                drying system
              </p>

            </div>

            <ControlPanel />

          </section>
        )}


        {/* ====================================================
            SETTINGS
        ==================================================== */}

        {activePage === "Settings" && (
          <section className="dashboard-section">

            <div className="section-heading">

              <h2>
                System Settings
              </h2>

              <p>
                SINAG-ANI system information
              </p>

            </div>


            <div className="section-card">

              <div className="system-info">

                <div className="info-item">
                  <span>
                    Device ID
                  </span>

                  <strong>
                    device001
                  </strong>
                </div>


                <div className="info-item">
                  <span>
                    Controller
                  </span>

                  <strong>
                    ESP32
                  </strong>
                </div>


                <div className="info-item">
                  <span>
                    Database
                  </span>

                  <strong>
                    Firebase RTDB
                  </strong>
                </div>


                <div className="info-item">
                  <span>
                    Firebase Connection
                  </span>

                  <strong
                    className={
                      firebaseOnline
                        ? "connected"
                        : "disconnected"
                    }
                  >
                    {firebaseOnline
                      ? "Connected"
                      : "Disconnected"}
                  </strong>
                </div>


                <div className="info-item">
                  <span>
                    Device Status
                  </span>

                  <strong
                    className={
                      deviceOnline
                        ? "connected"
                        : "disconnected"
                    }
                  >
                    {deviceOnline
                      ? "Online"
                      : "Offline"}
                  </strong>
                </div>


                <div className="info-item">
                  <span>
                    Database Path
                  </span>

                  <strong>
                    devices/device001
                  </strong>
                </div>

              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;
