import React, { useEffect, useState } from "react";

import {
  initializeApp,
  getApps
} from "firebase/app";

import {
  getDatabase,
  ref,
  onValue
} from "firebase/database";

import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";

import Sidebar from "./components/Sidebar";
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

const database =
  getDatabase(firebaseApp);

const auth =
  getAuth(firebaseApp);


function App() {

  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [firebaseOnline, setFirebaseOnline] =
    useState(false);


  /* ============================================
     FIREBASE
  ============================================ */

  useEffect(() => {

    let unsubscribeDevice = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (user) => {

          try {

            if (!user) {

              await signInAnonymously(auth);

              return;
            }


            setFirebaseOnline(true);


            const deviceRef =
              ref(
                database,
                "devices/device001"
              );


            unsubscribeDevice =
              onValue(
                deviceRef,
                (snapshot) => {

                  const data =
                    snapshot.val();

                  console.log(
                    "SINAG-ANI DATA:",
                    data
                  );


                  if (!data) return;


                  setDevice(data);


                  const temperature =
                    data?.sensors?.temp1;


                  if (
                    typeof temperature ===
                      "number"
                  ) {

                    setHistory(
                      previous => [

                        ...previous.slice(-19),

                        {
                          time:
                            new Date()
                              .toLocaleTimeString(),

                          temp:
                            temperature
                        }

                      ]
                    );

                  }

                },

                (error) => {

                  console.error(
                    "Firebase error:",
                    error
                  );

                  setFirebaseOnline(false);

                }
              );

          }

          catch (error) {

            console.error(
              "Authentication error:",
              error
            );

            setFirebaseOnline(false);

          }

        }
      );


    return () => {

      unsubscribeAuth();

      if (unsubscribeDevice) {

        unsubscribeDevice();

      }

    };

  }, []);


  /* ============================================
     SENSOR DATA
  ============================================ */

  const temp1 =
    device?.sensors?.temp1;

  const temp2 =
    device?.sensors?.temp2;

  const humidity =
    device?.sensors?.humidity;

  const dht11Temperature =
    device?.sensors?.dht11Temperature;


  /* ============================================
     DEVICE STATUS
  ============================================ */

  const deviceOnline =
    device?.status?.online === true ||
    device?.status?.online === 1 ||
    device?.status?.online === "1";


  /* ============================================
     PAGE
  ============================================ */

  return (

    <div className="layout">


      {/* SIDEBAR */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />


      {/* MAIN */}

      <main>


        {/* ======================================
            DASHBOARD
        ====================================== */}

        {activePage === "Dashboard" && (

          <>

            <h1>
              SINAG-ANI IoT Dashboard
            </h1>


            <p>
              Real-time monitoring and
              multi-stage drying control
            </p>


            {/* ONLINE */}

            <div
              className={
                deviceOnline &&
                firebaseOnline
                  ? "status-online"
                  : "status-offline"
              }
            >

              ●{" "}

              {deviceOnline &&
              firebaseOnline
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


            {/* DRYING STATUS */}

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
                device?.status
                  ?.stageElapsedSeconds
              }

              stageRemainingSeconds={
                device?.status
                  ?.stageRemainingSeconds
              }

              totalElapsedSeconds={
                device?.status
                  ?.totalElapsedSeconds
              }

              totalRemainingSeconds={
                device?.status
                  ?.totalRemainingSeconds
              }

              coolFan={
                device?.status?.coolFan
              }

            />


            {/* CONTROL PANEL */}

            <ControlPanel />

          </>

        )}


        {/* ======================================
            MONITORING
        ====================================== */}

        {activePage === "Monitoring" && (

          <>

            <h1>
              Sensor Monitoring
            </h1>


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


        {/* ======================================
            CONTROL
        ====================================== */}

        {activePage === "Control" && (

          <>

            <h1>
              Drying Control
            </h1>


            <ControlPanel />

          </>

        )}


        {/* ======================================
            SETTINGS
        ====================================== */}

        {activePage === "Settings" && (

          <div className="settings-box">

            <h1>
              System Settings
            </h1>

            <p>
              Device ID: <strong>
                device001
              </strong>
            </p>

            <p>
              Firebase:
              {" "}
              <strong>
                {firebaseOnline
                  ? "Connected"
                  : "Disconnected"}
              </strong>
            </p>

            <p>
              Device:
              {" "}
              <strong>
                {deviceOnline
                  ? "Online"
                  : "Offline"}
              </strong>
            </p>

            <p>
              Controller:
              {" "}
              <strong>
                ESP32
              </strong>
            </p>

          </div>

        )}

      </main>

    </div>

  );

}

export default App;
