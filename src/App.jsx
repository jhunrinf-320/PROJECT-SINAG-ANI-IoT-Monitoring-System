import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";

import "./App.css";

// =====================================================
// FIREBASE
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

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

const DEVICE_PATH = "devices/device001";

// =====================================================
// APP
// =====================================================

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [device, setDevice] = useState({});
  const [firebaseOnline, setFirebaseOnline] = useState(false);

  const [sending, setSending] = useState(false);
  const [commandMessage, setCommandMessage] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ===================================================
  // FIREBASE AUTH + REALTIME DATA
  // ===================================================

  useEffect(() => {
    let unsubscribeDevice = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFirebaseOnline(false);

        signInAnonymously(auth)
          .then(() => {
            console.log("Firebase anonymous authentication successful.");
          })
          .catch((error) => {
            console.error("Firebase authentication failed:", error);
            setFirebaseOnline(false);
          });

        return;
      }

      setFirebaseOnline(true);

      const deviceRef = ref(database, DEVICE_PATH);

      unsubscribeDevice = onValue(
        deviceRef,
        (snapshot) => {
          const data = snapshot.val();

          if (data) {
            setDevice(data);
          }
        },
        (error) => {
          console.error("Firebase database error:", error);
          setFirebaseOnline(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeDevice) {
        unsubscribeDevice();
      }
    };
  }, []);

  // ===================================================
  // DATA
  // ===================================================

  const sensors = device?.sensors || {};
  const control = device?.control || {};

  const temp1 = sensors?.temp1 ?? "--";
  const temp2 = sensors?.temp2 ?? "--";
  const humidity = sensors?.humidity ?? "--";

  const deviceOnline =
    sensors?.online === true ||
    device?.online === true;

  const mode = sensors?.mode ?? control?.mode ?? "OFF";
  const stage = sensors?.stage ?? "OFF";

  const stageRemaining =
    sensors?.stageRemainingSeconds ??
    control?.stageRemainingSeconds ??
    0;

  const totalRemaining =
    sensors?.totalRemainingSeconds ??
    control?.totalRemainingSeconds ??
    0;

  const totalElapsed =
    sensors?.totalElapsedSeconds ??
    control?.totalElapsedSeconds ??
    0;

  const mainFan =
    sensors?.pwm ??
    sensors?.mainFan ??
    control?.pwm ??
    0;

  const coolFan =
    sensors?.coolFan === true ||
    control?.coolFan === true;

  // ===================================================
  // TIME FORMAT
  // ===================================================

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].join(":");
  };

  // ===================================================
  // SEND COMMAND
  // ===================================================

  const sendCommand = async (command) => {
    try {
      setSending(true);
      setCommandMessage(`Sending ${command}...`);

      const commandRef = ref(
        database,
        `${DEVICE_PATH}/control/mode`
      );

      await set(commandRef, command);

      setCommandMessage(`Command ${command} sent.`);

      setTimeout(() => {
        setCommandMessage("");
      }, 3000);
    } catch (error) {
      console.error("Command error:", error);
      setCommandMessage("Command failed.");
    } finally {
      setSending(false);
    }
  };

  // ===================================================
  // NAVIGATION
  // ===================================================

  const navigation = [
    "Dashboard",
    "Control",
    "Monitoring",
    "Settings"
  ];

  // ===================================================
  // STATUS CARD
  // ===================================================

  const DryingStatus = () => (
    <section className="drying-status-card">

      <div className="card-heading">
        <div>
          <span className="eyebrow">CURRENT SINAG-ANI OPERATION</span>
          <h2>Drying Status</h2>
        </div>

        <span
          className={
            deviceOnline
              ? "status-pill online"
              : "status-pill offline"
          }
        >
          <span className="status-dot"></span>
          {deviceOnline ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      <div className="status-grid">

        <div className="status-item">
          <span>Mode</span>
          <strong>{mode}</strong>
        </div>

        <div className="status-item">
          <span>Stage</span>
          <strong>{stage}</strong>
        </div>

        <div className="status-item">
          <span>Stage Time Remaining</span>
          <strong>{formatTime(stageRemaining)}</strong>
        </div>

        <div className="status-item">
          <span>Total Time Remaining</span>
          <strong>{formatTime(totalRemaining)}</strong>
        </div>

        <div className="status-item">
          <span>Total Elapsed</span>
          <strong>{formatTime(totalElapsed)}</strong>
        </div>

        <div className="status-item">
          <span>Main Fan</span>
          <strong>{Number(mainFan) || 0}%</strong>
        </div>

        <div className="status-item">
          <span>Cool-Air Fan</span>
          <strong>{coolFan ? "ON" : "OFF"}</strong>
        </div>

        <div className="status-item">
          <span>Firebase</span>
          <strong>
            {firebaseOnline ? "CONNECTED" : "DISCONNECTED"}
          </strong>
        </div>

      </div>
    </section>
  );

  // ===================================================
  // SENSOR CARD
  // ===================================================

  const SensorCard = ({ title, value, unit, icon }) => (
    <div className="sensor-card">

      <div className="sensor-icon">
        {icon}
      </div>

      <div className="sensor-info">
        <span>{title}</span>

        <div className="sensor-value">
          <strong>{value}</strong>
          <small>{unit}</small>
        </div>
      </div>

    </div>
  );

  // ===================================================
  // DASHBOARD
  // ===================================================

  const Dashboard = () => (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="SINAG-ANI IoT Solar Food Drying System"
      />

      <DryingStatus />

      <div className="sensor-grid">

        <SensorCard
          title="Temperature Sensor 1"
          value={temp1}
          unit="°C"
          icon="T1"
        />

        <SensorCard
          title="Temperature Sensor 2"
          value={temp2}
          unit="°C"
          icon="T2"
        />

        <SensorCard
          title="Humidity"
          value={humidity}
          unit="%"
          icon="H"
        />

        <SensorCard
          title="Device Status"
          value={deviceOnline ? "ONLINE" : "OFFLINE"}
          unit=""
          icon="●"
        />

      </div>

      <ControlPanel />

    </>
  );

  // ===================================================
  // CONTROL PANEL
  // ===================================================

  const ControlPanel = () => (
    <section className="control-card">

      <div className="card-heading">
        <div>
          <span className="eyebrow">SYSTEM CONTROL</span>
          <h2>Drying Controls</h2>
        </div>
      </div>

      <div className="control-grid">

        <button
          className="control-btn start"
          disabled={sending}
          onClick={() => sendCommand("START")}
        >
          <span>▶</span>
          START DRYING
        </button>

        <button
          className="control-btn high"
          disabled={sending}
          onClick={() => sendCommand("HIGH")}
        >
          HIGH
        </button>

        <button
          className="control-btn moderate-high"
          disabled={sending}
          onClick={() => sendCommand("MODERATE-HIGH")}
        >
          MODERATE-HIGH
        </button>

        <button
          className="control-btn moderate"
          disabled={sending}
          onClick={() => sendCommand("MODERATE")}
        >
          MODERATE
        </button>

        <button
          className="control-btn stop"
          disabled={sending}
          onClick={() => sendCommand("OFF")}
        >
          ■ STOP / OFF
        </button>

      </div>

      {commandMessage && (
        <div className="command-message">
          {commandMessage}
        </div>
      )}

    </section>
  );

  // ===================================================
  // MONITORING
  // ===================================================

  const Monitoring = () => (
    <>
      <PageHeader
        title="Monitoring"
        subtitle="Real-time sensor information"
      />

      <div className="sensor-grid">

        <SensorCard
          title="Temperature Sensor 1"
          value={temp1}
          unit="°C"
          icon="T1"
        />

        <SensorCard
          title="Temperature Sensor 2"
          value={temp2}
          unit="°C"
          icon="T2"
        />

        <SensorCard
          title="Humidity"
          value={humidity}
          unit="%"
          icon="H"
        />

        <SensorCard
          title="Device Status"
          value={deviceOnline ? "ONLINE" : "OFFLINE"}
          unit=""
          icon="●"
        />

      </div>

      <DryingStatus />
    </>
  );

  // ===================================================
  // SETTINGS
  // ===================================================

  const Settings = () => (
    <>
      <PageHeader
        title="Settings"
        subtitle="SINAG-ANI device information"
      />

      <section className="settings-card">

        <div className="settings-row">
          <span>Device ID</span>
          <strong>device001</strong>
        </div>

        <div className="settings-row">
          <span>Firebase Connection</span>
          <strong>
            {firebaseOnline ? "Connected" : "Disconnected"}
          </strong>
        </div>

        <div className="settings-row">
          <span>Device Status</span>
          <strong>
            {deviceOnline ? "Online" : "Offline"}
          </strong>
        </div>

        <div className="settings-row">
          <span>Database</span>
          <strong>Realtime Database</strong>
        </div>

      </section>
    </>
  );

  // ===================================================
  // PAGE HEADER
  // ===================================================

  const PageHeader = ({ title, subtitle }) => (
    <div className="page-header">

      <div>
        <span className="eyebrow">SINAG-ANI</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="connection-status">

        <span
          className={
            firebaseOnline
              ? "connection-dot connected"
              : "connection-dot"
          }
        ></span>

        {firebaseOnline
          ? "Firebase Connected"
          : "Firebase Connecting..."}

      </div>

    </div>
  );

  // ===================================================
  // PAGE ROUTER
  // ===================================================

  const renderPage = () => {

    switch (activePage) {

      case "Control":
        return (
          <>
            <PageHeader
              title="Control"
              subtitle="Control the drying operation"
            />

            <ControlPanel />
          </>
        );

      case "Monitoring":
        return <Monitoring />;

      case "Settings":
        return <Settings />;

      case "Dashboard":
      default:
        return <Dashboard />;
    }
  };

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside
        className={
          sidebarOpen
            ? "sidebar open"
            : "sidebar closed"
        }
      >

        <div className="brand">

          <div className="brand-logo">
            SA
          </div>

          {sidebarOpen && (
            <div>
              <h2>SINAG-ANI</h2>
              <span>IoT Dryer</span>
            </div>
          )}

        </div>


        <nav className="nav">

          {navigation.map((item) => (

            <button
              key={item}
              className={
                activePage === item
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setActivePage(item)}
            >

              <span className="nav-icon">
                {item === "Dashboard" && "⌂"}
                {item === "Control" && "⚙"}
                {item === "Monitoring" && "◉"}
                {item === "Settings" && "☷"}
              </span>

              {sidebarOpen && (
                <span>{item}</span>
              )}

            </button>

          ))}

        </nav>


        <div className="sidebar-bottom">

          <div className="mini-status">

            <span
              className={
                deviceOnline
                  ? "connection-dot connected"
                  : "connection-dot"
              }
            ></span>

            {sidebarOpen && (
              <span>
                {deviceOnline
                  ? "Device Online"
                  : "Device Offline"}
              </span>
            )}

          </div>

        </div>

      </aside>


      {/* MAIN */}

      <main
        className={
          sidebarOpen
            ? "main open"
            : "main closed"
        }
      >

        <header className="topbar">

          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
          >
            ☰
          </button>

          <div className="topbar-title">
            {activePage}
          </div>

          <div className="topbar-device">
            <span
              className={
                deviceOnline
                  ? "connection-dot connected"
                  : "connection-dot"
              }
            ></span>

            device001
          </div>

        </header>


        <div className="content">
          {renderPage()}
        </div>

      </main>

    </div>
  );
}

export default App;
