import {
  useEffect,
  useState
} from "react";

import {
  ref,
  onValue
} from "firebase/database";

import {
  database
} from "./firebase/firebaseConfig.js";

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
  // FIREBASE LISTENER
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

        if (data) {

          setDevice(data);

          // Store temperature history
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

        console.error(
          "Firebase read error:",
          error
        );

      }
    );

    return () => unsubscribe();

  }, []);


  // ==========================================
  // DEVICE STATUS
  // ==========================================

  const isOnline =
    device?.status?.online === true ||
    device?.status?.online === "true";


  // ==========================================
  // MAIN APP
  // ==========================================

  return (

    <div className="layout">

      {/* SIDEBAR */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />


      {/* MAIN CONTENT */}

      <main>

        <h1>
          SINAG-ANI IoT Dashboard
        </h1>


        {/* =====================================
            DASHBOARD
        ====================================== */}

        {activePage === "Dashboard" && (

          <>

            <div className="status-online">

              {isOnline
                ? "● DEVICE ONLINE"
                : "● DEVICE OFFLINE"
              }

            </div>


            <div className="cards">

              <SensorCard

                title="Temperature Sensor 1"

                value={
                  device?.sensors?.temp1
                }

                unit="°C"

                icon="🌡️"

              />


              <SensorCard

                title="Temperature Sensor 2"

                value={
                  device?.sensors?.temp2
                }

                unit="°C"

                icon="🔥"

              />


              <SensorCard

                title="Humidity"

                value={
                  device?.sensors?.humidity
                }

                unit="%"

                icon="💧"

              />

            </div>


            <StatusCard

              mode={
                device?.status?.mode
              }

              pwm={
                device?.status?.pwm
              }

            />

          </>

        )}
