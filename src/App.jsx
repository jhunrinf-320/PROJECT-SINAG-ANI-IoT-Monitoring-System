import React, { useEffect, useState } from "react";

import { initializeApp } from "firebase/app";

import {
  getDatabase,
  ref,
  onValue
} from "firebase/database";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";

import Sidebar from "./components/Sidebar";
import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";


// =====================================================
// FIREBASE CONFIG
// =====================================================

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


// =====================================================
// FIREBASE INITIALIZATION
// =====================================================

const firebaseApp = initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);

const auth = getAuth(firebaseApp);


// =====================================================
// APP
// =====================================================

function App() {

  const [device, setDevice] = useState({});
  const [history, setHistory] = useState({});
  const [activePage, setActivePage] = useState("Dashboard");

  const [firebaseOnline, setFirebaseOnline] = useState(false);


  // ===================================================
  // FIREBASE CONNECTION
  // ===================================================

  useEffect(() => {

    let unsubscribeDevice = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {

        // ---------------------------------------------
        // NOT AUTHENTICATED
        // ---------------------------------------------

        if (!user) {

          setFirebaseOnline(false);

          signInAnonymously(auth)
            .then(() => {
              console.log(
                "Firebase anonymous authentication successful."
              );
            })
            .catch((error) => {

              console.error(
                "Firebase authentication failed:",
                error
              );

              setFirebaseOnline(false);

            });

          return;
        }


        // ---------------------------------------------
        // AUTHENTICATED
        // ---------------------------------------------

        console.log("Firebase user authenticated.");

        setFirebaseOnline(true);


        // ---------------------------------------------
        // DEVICE DATA
        // ---------------------------------------------

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


              if (data.history) {
                setHistory(data.history);
              }

            }

          },

          (error) => {

            console.error(
              "Firebase database error:",
              error
            );

            setFirebaseOnline(false);

          }
        );

      }
    );


    // -----------------------------------------------
    // CLEANUP
    // -----------------------------------------------

    return () => {

      unsubscribeAuth();

      if (unsubscribeDevice) {
        unsubscribeDevice();
      }

    };

  }, []);


  // ===================================================
  // DEVICE DATA
  // ===================================================

  const sensors = device?.sensors || {};

  const control = device?.control || {};


  // ===================================================
  // ONLINE STATUS
  // ===================================================

  const deviceOnline =
    sensors?.online === true ||
    device?.online === true;


  // ===================================================
  // PAGE HANDLER
  // ===================================================

  const handlePageChange = (page) => {
    setActivePage(page);
  };


  // ===================================================
  // DASHBOARD
  // ===================================================

  const renderDashboard = () => {

    return (
      <div className="page-content">

        <div className="page-header">

          <h1>Dashboard</h1>

          <p>
            SINAG-ANI IoT Solar Food Drying System
          </p>

        </div>


        {/* SYSTEM STATUS */}

        <StatusCard
          data={device}
          firebaseOnline={firebaseOnline}
          deviceOnline={deviceOnline}
        />


        {/* SENSOR CARDS */}

        <div className="sensor-grid">

          <SensorCard
            title="Temperature Sensor 1"
            value={
              sensors?.temp1 !== undefined
                ? sensors.temp1
                : "--"
            }
            unit="°C"
          />


          <SensorCard
            title="Temperature Sensor 2"
            value={
              sensors?.temp2 !== undefined
                ? sensors.temp2
                : "--"
            }
            unit="°C"
          />


          <SensorCard
            title="Humidity"
            value={
              sensors?.humidity !== undefined
                ? sensors.humidity
                : "--"
            }
            unit="%"
          />


          <SensorCard
            title="Device Status"
            value={
              deviceOnline
                ? "ONLINE"
                : "OFFLINE"
            }
            unit=""
          />

        </div>


        {/* CONTROL PANEL */}

        <div className="control-section">

          <ControlPanel />

        </div>


        {/* TEMPERATURE CHART */}

        <div className="chart-section">

          <TemperatureChart
            data={history}
          />

        </div>

      </div>
    );
  };


  // ===================================================
  // CONTROL PAGE
  // ===================================================

  const renderControl = () => {

    return (
      <div className="page-content">

        <div className="page-header">

          <h1>System Control</h1>

          <p>
            Control the SINAG-ANI drying operation
          </p>

        </div>


        <ControlPanel />

      </div>
    );
  };


  // ===================================================
  // MONITORING PAGE
  // ===================================================

  const renderMonitoring = () => {

    return (
      <div className="page-content">

        <div className="page-header">

          <h1>Monitoring</h1>

          <p>
            Real-time SINAG-ANI sensor monitoring
          </p>

        </div>


        <div className="sensor-grid">

          <SensorCard
            title="Temperature Sensor 1"
            value={
              sensors?.temp1 !== undefined
                ? sensors.temp1
                : "--"
            }
            unit="°C"
          />


          <SensorCard
            title="Temperature Sensor 2"
            value={
              sensors?.temp2 !== undefined
                ? sensors.temp2
                : "--"
            }
            unit="°C"
          />


          <SensorCard
            title="Humidity"
            value={
              sensors?.humidity !== undefined
                ? sensors.humidity
                : "--"
            }
            unit="%"
          />


          <SensorCard
            title="Device"
            value={
              deviceOnline
                ? "ONLINE"
                : "OFFLINE"
            }
            unit=""
          />

        </div>


        <div className="chart-section">

          <TemperatureChart
            data={history}
          />

        </div>

      </div>
    );
  };


  // ===================================================
  // SETTINGS PAGE
  // ===================================================

  const renderSettings = () => {

    return (
      <div className="page-content">

        <div className="page-header">

          <h1>Settings</h1>

          <p>
            SINAG-ANI device settings
          </p>

        </div>


        <div className="settings-card">

          <h2>Device Information</h2>

          <p>
            Device ID:
            <strong> device001</strong>
          </p>

          <p>
            Firebase:
            <strong>
              {firebaseOnline
                ? " Connected"
                : " Disconnected"}
            </strong>
          </p>

          <p>
            Device:
            <strong>
              {deviceOnline
                ? " Online"
                : " Offline"}
            </strong>
          </p>

        </div>

      </div>
    );
  };


  // ===================================================
  // PAGE CONTENT
  // ===================================================

  const renderPage = () => {

    switch (activePage) {

      case "Control":
        return renderControl();

      case "Monitoring":
        return renderMonitoring();

      case "Settings":
        return renderSettings();

      case "Dashboard":
      default:
        return renderDashboard();

    }

  };


  // ===================================================
  // MAIN UI
  // ===================================================

  return (

    <div className="app">

      <Sidebar
        activePage={activePage}
        onPageChange={handlePageChange}
      />


      <main className="main-content">

        {renderPage()}

      </main>

    </div>

  );

}


export default App;
