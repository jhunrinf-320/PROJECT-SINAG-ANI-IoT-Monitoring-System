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


        // ------------------------------------------------------
        // MAIN DEVICE PATH
        // ------------------------------------------------------

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


              // ------------------------------------------------
              // TEMPERATURE HISTORY
              // ------------------------------------------------

              const temp1 =
                data?.sensors?.temp1;


              if (
                typeof temp1 === "number" &&
                Number.isFinite(temp1)
              ) {

                setHistory(
                  (previous) => {

                    const newPoint = {
                      time:
                        new Date()
                          .toLocaleTimeString(),

                      temp: temp1,
                    };


                    return [
                      ...previous.slice(-19),
                      newPoint,
                    ];
                  }
                );
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


    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

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
  // ONLINE STATUS
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


        <h1>
          SINAG-ANI IoT Dashboard
        </h1>


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {activePage === "Dashboard" && (

          <>

            <div
              className={
                deviceOnline && firebaseOnline
                  ? "status-online"
                  : "status-offline"
              }
            >

              ●{" "}

              {deviceOnline && firebaseOnline
                ? "DEVICE ONLINE"
                : "DEVICE OFFLINE"}

            </div>


            <div className="cards">


              {/* ------------------------------------------------
                  TEMPERATURE SENSOR 1
              ------------------------------------------------ */}

              <SensorCard
                title="Temperature Sensor 1"
                value={temp1}
                unit="°C"
                icon="🌡️"
              />


              {/* ------------------------------------------------
                  TEMPERATURE SENSOR 2
              ------------------------------------------------ */}

              <SensorCard
                title="Temperature Sensor 2"
                value={temp2}
                unit="°C"
                icon="🌡️"
              />


              {/* ------------------------------------------------
                  HUMIDITY
              ------------------------------------------------ */}

              <SensorCard
                title="Humidity"
                value={humidity}
                unit="%"
                icon="💧"
              />


              {/* ------------------------------------------------
                  DHT11 TEMPERATURE
              ------------------------------------------------ */}

              <SensorCard
                title="DHT11 Temperature"
                value={dht11Temperature}
                unit="°C"
                icon="🌡️"
              />

            </div>


            {/* --------------------------------------------------
                STATUS
            -------------------------------------------------- */}

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

            <h2>
              Sensor Monitoring
            </h2>


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


        {/* ====================================================
            CONTROL
        ==================================================== */}

        {activePage === "Control" && (

          <>

            <h2>
              Drying Control
            </h2>


            <ControlPanel />

          </>

        )}


        {/* ====================================================
            SETTINGS
        ==================================================== */}

        {activePage === "Settings" && (

          <div className="settings-box">

            <h2>
              System Settings
            </h2>


            <p>
              Device ID: device001
            </p>


            <p>
              Firebase Connection:{" "}

              {firebaseOnline
                ? "Active"
                : "Disconnected"}
            </p>


            <p>
              Device Status:{" "}

              {deviceOnline
                ? "Online"
                : "Offline"}
            </p>


            <p>
              Controller: ESP32
            </p>


            <p>
              Database Path:
              {" "}
              devices/device001
            </p>

          </div>

        )}

      </main>

    </div>

  );

}


export default App;
