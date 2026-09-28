import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
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

import SensorCard from "./components/SensorCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",

  authDomain:
    "sinag-ani-iot.firebaseapp.com",

  databaseURL:
    "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "sinag-ani-iot",

  storageBucket:
    "sinag-ani-iot.firebasestorage.app",

  messagingSenderId:
    "505006165687",

  appId:
    "1:505006165687:web:8d930c2a846a978a41c732",

  measurementId:
    "G-F1YD6L3XNL"
};


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const database =
  getDatabase(firebaseApp);

const auth =
  getAuth(firebaseApp);


// ============================================================
// DEVICE SETTINGS
// ============================================================

// ESP32 sends heartbeat every 10 seconds.
// If there is no heartbeat for 25 seconds,
// the website considers the device OFFLINE.

const DEVICE_TIMEOUT = 25000;


// ============================================================
// FIREBASE ANONYMOUS LOGIN
// ============================================================

signInAnonymously(auth)
  .then(() => {
    console.log(
      "Firebase anonymous authentication successful."
    );
  })
  .catch((error) => {
    console.error(
      "Firebase anonymous authentication failed:",
      error
    );
  });


// ============================================================
// TIME FORMATTER
// ============================================================

const formatTime = (seconds) => {

  const totalSeconds =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const secs =
    Math.floor(
      totalSeconds % 60
    );

  return [
    hours
      .toString()
      .padStart(2, "0"),

    minutes
      .toString()
      .padStart(2, "0"),

    secs
      .toString()
      .padStart(2, "0")
  ].join(":");
};


// ============================================================
// DRYING PROGRESS
// ============================================================

const getDryingProgress = (
  elapsed
) => {

  // 5 hours total drying time

  const totalDuration =
    5 * 60 * 60;

  const elapsedSeconds =
    Math.max(
      0,
      Number(elapsed) || 0
    );

  return Math.min(
    100,
    Math.round(
      (
        elapsedSeconds /
        totalDuration
      ) * 100
    )
  );
};


// ============================================================
// APP
// ============================================================

function App() {

  const [device, setDevice] =
    useState({});

  const [history, setHistory] =
    useState([]);

  const [firebaseOnline, setFirebaseOnline] =
    useState(false);

  const [deviceOnline, setDeviceOnline] =
    useState(false);


  // ==========================================================
  // FIREBASE DEVICE LISTENER
  // ==========================================================

  useEffect(() => {

    let unsubscribeDevice =
      null;


    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {

          // ----------------------------------------------------
          // USER NOT AUTHENTICATED
          // ----------------------------------------------------

          if (!user) {

            console.log(
              "Firebase user is not authenticated."
            );

            setFirebaseOnline(false);

            setDevice({});

            setDeviceOnline(false);

            return;
          }


          // ----------------------------------------------------
          // FIREBASE CONNECTED
          // ----------------------------------------------------

          console.log(
            "Firebase authenticated:",
            user.uid
          );

          setFirebaseOnline(true);


          // ----------------------------------------------------
          // DEVICE PATH
          // ----------------------------------------------------

          const deviceRef =
            ref(
              database,
              "devices/device001"
            );


          // ----------------------------------------------------
          // DEVICE LISTENER
          // ----------------------------------------------------

          unsubscribeDevice =
            onValue(

              deviceRef,

              (snapshot) => {

                const data =
                  snapshot.val();


                console.log(
                  "Firebase device data:",
                  data
                );


                // ----------------------------------------------
                // NO DEVICE DATA
                // ----------------------------------------------

                if (!data) {

                  setDevice({});

                  setDeviceOnline(false);

                  return;
                }


                // ----------------------------------------------
                // SAVE DEVICE DATA
                // ----------------------------------------------

                setDevice(data);


                // ----------------------------------------------
                // TEMPERATURE HISTORY
                // ----------------------------------------------

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

                        temp:
                          temp1

                      };


                      return [
                        ...previous.slice(-19),
                        newPoint
                      ];
                    }
                  );
                }

              },

              // ----------------------------------------------
              // FIREBASE ERROR
              // ----------------------------------------------

              (error) => {

                console.error(
                  "Firebase device listener error:",
                  error
                );

                setFirebaseOnline(false);

                setDeviceOnline(false);
              }
            );
        }
      );


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      unsubscribeAuth();

      if (
        unsubscribeDevice
      ) {

        unsubscribeDevice();
      }

    };

  }, []);


  // ==========================================================
  // DEVICE HEARTBEAT CHECK
  // ==========================================================

  useEffect(() => {

    const checkHeartbeat =
      () => {

        const lastSeen =
          device?.status?.lastSeen;


        // ----------------------------------------------------
        // NO LAST SEEN
        // ----------------------------------------------------

        if (
          typeof lastSeen !== "number" ||
          lastSeen <= 0
        ) {

          setDeviceOnline(false);

          return;
        }


        // ----------------------------------------------------
        // CALCULATE HEARTBEAT AGE
        // ----------------------------------------------------

        const age =
          Date.now() - lastSeen;


        // ----------------------------------------------------
        // ONLINE ONLY IF HEARTBEAT IS RECENT
        // ----------------------------------------------------

        setDeviceOnline(

          firebaseOnline &&
          age >= 0 &&
          age <= DEVICE_TIMEOUT

        );
      };


    // Check immediately

    checkHeartbeat();


    // Check every 2 seconds

    const timer =
      setInterval(
        checkHeartbeat,
        2000
      );


    return () =>
      clearInterval(timer);

  }, [
    device?.status?.lastSeen,
    firebaseOnline
  ]);


  // ==========================================================
  // SENSOR VALUES
  // ==========================================================

  const temp1 =
    device?.sensors?.temp1;

  const temp2 =
    device?.sensors?.temp2;

  const humidity =
    device?.sensors?.humidity;

  const dht11Temperature =
    device?.sensors?.dht11Temperature;


  // ==========================================================
  // STATUS VALUES
  // ==========================================================

  const mode =
    device?.status?.mode ||
    "IDLE";

  const stage =
    device?.status?.stage ||
    "OFF";

  const pwm =
    Number(
      device?.status?.pwm
    ) || 0;

  const coolFan =
    device?.status?.coolFan === true ||
    device?.status?.coolFan === 1 ||
    device?.status?.coolFan === "1";

  const automatic =
    device?.status?.automatic === true ||
    device?.status?.automatic === 1 ||
    device?.status?.automatic === "1";

  const paused =
    device?.status?.paused === true ||
    device?.status?.paused === 1 ||
    device?.status?.paused === "1";


  // ==========================================================
  // FAN PERCENTAGE
  // ==========================================================

  const fanPercentage =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (pwm / 255) * 100
        )
      )
    );


  // ==========================================================
  // TIMER VALUES
  // ==========================================================

  const stageElapsed =
    device?.status?.stageElapsedSeconds ||
    0;

  const stageRemaining =
    device?.status?.stageRemainingSeconds ||
    0;

  const totalElapsed =
    device?.status?.totalElapsedSeconds ||
    0;

  const totalRemaining =
    device?.status?.totalRemainingSeconds ||
    0;


  // ==========================================================
  // PROGRESS
  // ==========================================================

  const dryingProgress =
    getDryingProgress(
      totalElapsed
    );


  // ==========================================================
  // LAST HEARTBEAT
  // ==========================================================

  const lastSeen =
    device?.status?.lastSeen;


  const lastSeenText =
    typeof lastSeen === "number"
      ? new Date(
          lastSeen
        ).toLocaleTimeString()
      : "No heartbeat";


  // ==========================================================
  // OPERATION STATUS CLASS
  // ==========================================================

  let operationClass =
    "idle";


  if (
    paused
  ) {

    operationClass =
      "paused";

  } else if (
    mode === "COMPLETE"
  ) {

    operationClass =
      "complete";

  } else if (
    mode !== "IDLE" &&
    mode !== "OFF"
  ) {

    operationClass =
      "running";
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="app-shell">


      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-icon">
            ☀️
          </div>


          <div>

            <h1>
              SINAG-ANI IoT
            </h1>

            <p>
              Solar Food Dryer Monitoring System
            </p>

          </div>

        </div>


        {/* DEVICE STATUS */}

        <div
          className={
            deviceOnline
              ? "device-pill online"
              : "device-pill offline"
          }
        >

          <span className="status-dot"></span>

          {deviceOnline
            ? "DEVICE ONLINE"
            : "DEVICE OFFLINE"}

        </div>

      </header>


      {/* ====================================================
          MAIN DASHBOARD
      ==================================================== */}

      <main className="dashboard">


        {/* ==================================================
            LIVE SYSTEM
        ================================================== */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                LIVE SYSTEM
              </span>

              <h2>
                Dashboard Overview
              </h2>

            </div>


            <span
              className={
                firebaseOnline
                  ? "firebase-state connected"
                  : "firebase-state disconnected"
              }
            >

              ● Firebase{" "}

              {firebaseOnline
                ? "Connected"
                : "Disconnected"}

            </span>

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

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                DRYING SYSTEM
              </span>

              <h2>
                Current SINAG-ANI Operation
              </h2>

            </div>

          </div>


          <div className="drying-status-card">


            {/* ==============================================
                CURRENT STATUS
            ============================================== */}

            <div className="drying-status-header">


              <div className="operation-status">

                <span className="status-caption">
                  CURRENT STATUS
                </span>


                <div className="operation-row">

                  <span
                    className={
                      `operation-indicator ${operationClass}`
                    }
                  ></span>


                  <h3>
                    {mode}
                  </h3>

                </div>

              </div>


              <div className="stage-badge">

                <span>
                  CURRENT STAGE
                </span>

                <strong>
                  {stage}
                </strong>

              </div>

            </div>


            {/* ==============================================
                TIMER CARDS
            ============================================== */}

            <div className="timer-grid">


              <div className="timer-box stage-timer">

                <span className="timer-label">
                  STAGE TIME REMAINING
                </span>

                <strong>
                  {formatTime(
                    stageRemaining
                  )}
                </strong>

              </div>


              <div className="timer-box total-timer">

                <span className="timer-label">
                  TOTAL TIME REMAINING
                </span>

                <strong>
                  {formatTime(
                    totalRemaining
                  )}
                </strong>

              </div>

            </div>


            {/* ==============================================
                PROGRESS BAR
            ============================================== */}

            <div className="drying-progress">

              <div className="progress-heading">

                <span>
                  DRYING PROGRESS
                </span>

                <strong>
                  {dryingProgress}%
                </strong>

              </div>


              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${dryingProgress}%`
                  }}
                ></div>

              </div>

            </div>


            {/* ==============================================
                SYSTEM DETAILS
            ============================================== */}

            <div className="drying-details">


              {/* TOTAL ELAPSED */}

              <div className="detail-item">

                <span>
                  TOTAL ELAPSED
                </span>

                <strong>
                  {formatTime(
                    totalElapsed
                  )}
                </strong>

              </div>


              {/* MAIN FAN */}

              <div className="detail-item">

                <span>
                  MAIN FAN
                </span>

                <strong>
                  {fanPercentage}%
                </strong>


                <div className="mini-progress">

                  <div
                    style={{
                      width:
                        `${fanPercentage}%`
                    }}
                  ></div>

                </div>

              </div>


              {/* COOL FAN */}

              <div className="detail-item">

                <span>
                  COOL-AIR FAN
                </span>

                <strong
                  className={
                    coolFan
                      ? "fan-on"
                      : "fan-off"
                  }
                >

                  {coolFan
                    ? "ON"
                    : "OFF"}

                </strong>

              </div>


              {/* CONTROL MODE */}

              <div className="detail-item">

                <span>
                  CONTROL MODE
                </span>

                <strong>
                  {automatic
                    ? "AUTOMATIC"
                    : "MANUAL"}
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            TEMPERATURE MONITORING
        ================================================== */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                SENSOR DATA
              </span>

              <h2>
                Temperature Monitoring
              </h2>

            </div>

          </div>


          <TemperatureChart
            data={history}
          />

        </section>


        {/* ==================================================
            DRYING CONTROL
        ================================================== */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                CONTROL
              </span>

              <h2>
                Drying Control
              </h2>

            </div>

          </div>


          <ControlPanel />

        </section>


        {/* ==================================================
            SYSTEM INFORMATION
        ================================================== */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                CONNECTION
              </span>

              <h2>
                System Information
              </h2>

            </div>

          </div>


          <div className="info-grid">


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
                Device Status
              </span>

              <strong
                className={
                  deviceOnline
                    ? "text-online"
                    : "text-offline"
                }
              >

                {deviceOnline
                  ? "Online"
                  : "Offline"}

              </strong>

            </div>


            <div className="info-item">

              <span>
                Wi-Fi
              </span>

              <strong>
                {device?.status?.wifi ||
                  "Not available"}
              </strong>

            </div>


            <div className="info-item">

              <span>
                IP Address
              </span>

              <strong>
                {device?.status?.ip ||
                  "Not available"}
              </strong>

            </div>


            <div className="info-item">

              <span>
                Last Heartbeat
              </span>

              <strong>
                {lastSeenText}
              </strong>

            </div>

          </div>

        </section>

      </main>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer>

        SINAG-ANI IoT Monitoring System
        {" • "}
        Device 001

      </footer>

    </div>

  );
}


// ============================================================
// EXPORT
// ============================================================

export default App;
