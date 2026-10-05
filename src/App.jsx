import React, { useEffect, useState } from "react";
import HighestTemperatureChart from "./components/HighestTemperatureChart";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

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
  measurementId: "G-F1YD6L3XNL",
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

const DEVICE_PATH = "devices/device001";

// =====================================================
// TIMER SETTINGS
// =====================================================

const INITIAL_TIME = 60 * 60;
const MAIN_TIME = 2 * 60 * 60;
const FINAL_TIME = 2 * 60 * 60;
const TOTAL_TIME = INITIAL_TIME + MAIN_TIME + FINAL_TIME;

// =====================================================
// APP
// =====================================================

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [deviceData, setDeviceData] = useState({});
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [sendingCommand, setSendingCommand] = useState(false);
  const [commandMessage, setCommandMessage] = useState("");

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitialized, setTimerInitialized] = useState(false);
  const [localTimerElapsed, setLocalTimerElapsed] = useState(0);

  // ===================================================
  // FIREBASE
  // ===================================================

  useEffect(() => {
    let unsubscribeDatabase = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFirebaseConnected(false);

        signInAnonymously(auth)
          .then(() =>
            console.log("Firebase anonymous authentication successful.")
          )
          .catch((error) =>
            console.error("Firebase authentication error:", error)
          );

        return;
      }

      setFirebaseConnected(true);

      const deviceRef = ref(database, DEVICE_PATH);

      unsubscribeDatabase = onValue(
        deviceRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) setDeviceData(data);
        },
        (error) => {
          console.error("Firebase database error:", error);
          setFirebaseConnected(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDatabase) unsubscribeDatabase();
    };
  }, []);

  // ===================================================
  // LOCAL TIMER
  // ===================================================

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setLocalTimerElapsed((previous) =>
        Math.min(previous + 1, TOTAL_TIME)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && localTimerElapsed >= TOTAL_TIME) {
      setLocalTimerElapsed(TOTAL_TIME);
      setTimerRunning(false);
    }
  }, [timerRunning, localTimerElapsed]);

  // ===================================================
  // DATA
  // ===================================================

  const sensors = deviceData?.sensors || {};
  const control = deviceData?.control || {};
  const status = deviceData?.status || {};

  const reactorTemperature =
    sensors?.storageChamberTemperature ??
    sensors?.temp1 ??
    "--";

  const humidity = sensors?.humidity ?? "--";

  const history = deviceData?.history || {};
  const historyItems = Array.isArray(history)
    ? history
    : Object.values(history);

  const historyTemperatures = historyItems
    .map((item) =>
      Number(
        item?.storageChamberTemperature ??
          item?.temp1
      )
    )
    .filter((value) => Number.isFinite(value));

  const highestTemperature =
    historyTemperatures.length > 0
      ? Math.max(...historyTemperatures)
      : null;

  const deviceOnline =
    status?.online === true ||
    sensors?.online === true ||
    deviceData?.online === true;

  const mode =
    status?.mode ??
    sensors?.mode ??
    control?.mode ??
    "OFF";

  const stage =
    status?.stage ??
    sensors?.stage ??
    "OFF";

  // ===================================================
  // TIMER VALUES
  // ===================================================

  const firebaseStageRemaining =
    status?.stageRemainingSeconds ??
    sensors?.stageRemainingSeconds ??
    control?.stageRemainingSeconds ??
    0;

  const firebaseTotalRemaining =
    status?.totalRemainingSeconds ??
    sensors?.totalRemainingSeconds ??
    control?.totalRemainingSeconds ??
    0;

  const firebaseTotalElapsed =
    status?.totalElapsedSeconds ??
    sensors?.totalElapsedSeconds ??
    control?.totalElapsedSeconds ??
    0;

  let localStageRemaining = 0;

  if (localTimerElapsed < INITIAL_TIME) {
    localStageRemaining = INITIAL_TIME - localTimerElapsed;
  } else if (localTimerElapsed < INITIAL_TIME + MAIN_TIME) {
    localStageRemaining =
      INITIAL_TIME + MAIN_TIME - localTimerElapsed;
  } else if (localTimerElapsed < TOTAL_TIME) {
    localStageRemaining = TOTAL_TIME - localTimerElapsed;
  }

  const stageRemaining = timerInitialized
    ? localStageRemaining
    : firebaseStageRemaining;

  const totalRemaining = timerInitialized
    ? Math.max(0, TOTAL_TIME - localTimerElapsed)
    : firebaseTotalRemaining;

  const totalElapsed = timerInitialized
    ? localTimerElapsed
    : firebaseTotalElapsed;

  const mainFan =
    sensors?.pwm ??
    sensors?.mainFan ??
    status?.pwm ??
    control?.pwm ??
    0;

  const coolFan =
    sensors?.coolFan === true ||
    status?.coolFan === true ||
    control?.coolFan === true;

  // ===================================================
  // FORMAT TIME
  // ===================================================

  const formatTime = (seconds) => {
    const value = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  };

  // ===================================================
  // TIMER COMMAND HANDLER
  // ===================================================

  const handleTimerCommand = (command) => {
    if (command === "AUTO") {
      if (!timerInitialized || localTimerElapsed >= TOTAL_TIME) {
        setLocalTimerElapsed(0);
        setTimerInitialized(true);
      }

      setTimerRunning(true);
      return;
    }

    if (command === "PAUSE") {
      setTimerRunning(false);
      return;
    }

    if (command === "RESUME") {
      if (timerInitialized && localTimerElapsed < TOTAL_TIME) {
        setTimerRunning(true);
      }
      return;
    }

    if (command === "STOP") {
      setTimerRunning(false);
      setTimerInitialized(false);
      setLocalTimerElapsed(0);
    }
  };

  // ===================================================
  // FIREBASE COMMAND
  // ===================================================

  const sendCommand = async (command) => {
    try {
      setSendingCommand(true);
      setCommandMessage(`Sending ${command}...`);

      const commandRef = ref(
        database,
        `${DEVICE_PATH}/control/mode`
      );

      await set(commandRef, command);
      handleTimerCommand(command);

      setCommandMessage(
        `Command "${command}" sent successfully.`
      );

      setTimeout(() => setCommandMessage(""), 2000);
    } catch (error) {
      console.error("Command error:", error);
      setCommandMessage("Failed to send command.");
    } finally {
      setSendingCommand(false);
    }
  };

  // ===================================================
  // COMPONENTS
  // ===================================================

  const PageHeader = ({ title, subtitle }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
            color: "#6b7280",
          }}
        >
          SINAG-ANI
        </div>

        <h1
          style={{
            margin: "5px 0",
            fontSize: "30px",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        <span
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: firebaseConnected
              ? "#22c55e"
              : "#9ca3af",
          }}
        />

        {firebaseConnected
          ? "Firebase Connected"
          : "Firebase Connecting..."}
      </div>
    </div>
  );

  const SensorCard = ({ title, value, unit }) => (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "13px",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "5px",
        }}
      >
        <strong style={{ fontSize: "28px" }}>
          {value}
        </strong>

        <span style={{ color: "#6b7280" }}>
          {unit}
        </span>
      </div>
    </div>
  );

  const HighestTemperatureDisplay = () => (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "24px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            HIGHEST TEMPERATURE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
            }}
          >
            <strong
              style={{
                fontSize: "36px",
                fontWeight: "700",
                color: "#17202a",
              }}
            >
              {highestTemperature !== null
                ? highestTemperature.toFixed(1)
                : "--"}
            </strong>

            <span
              style={{
                color: "#6b7280",
                fontSize: "18px",
              }}
            >
              °C
            </span>
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            Reactor Chamber
          </div>
        </div>

        <div style={{ fontSize: "32px" }}>🌡️</div>
      </div>
    </section>
  );

  const StatusItem = ({ title, value }) => (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "11px",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  );

  const DryingStatus = () => (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            CURRENT SINAG-ANI OPERATION
          </div>

          <h2 style={{ margin: "5px 0 0" }}>
            Drying Status
          </h2>
        </div>

        <div
          style={{
            padding: "7px 12px",
            borderRadius: "20px",
            background: deviceOnline
              ? "#dcfce7"
              : "#f3f4f6",
            color: deviceOnline
              ? "#166534"
              : "#6b7280",
            fontSize: "11px",
            fontWeight: "800",
          }}
        >
          {deviceOnline ? "● ONLINE" : "● OFFLINE"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        <StatusItem title="Mode" value={mode} />
        <StatusItem title="Stage" value={stage} />

        <StatusItem
          title="Stage Time Remaining"
          value={formatTime(stageRemaining)}
        />

        <StatusItem
          title="Total Time Remaining"
          value={formatTime(totalRemaining)}
        />

        <StatusItem
          title="Total Elapsed"
          value={formatTime(totalElapsed)}
        />

        <StatusItem
          title="Main Fan"
          value={`${Number(mainFan) || 0}%`}
        />

        <StatusItem
          title="Cool-Air Fan"
          value={coolFan ? "ON" : "OFF"}
        />

        <StatusItem
          title="Firebase"
          value={
            firebaseConnected
              ? "CONNECTED"
              : "DISCONNECTED"
          }
        />
      </div>
    </section>
  );

  const ControlButton = ({
    children,
    background,
    command,
  }) => (
    <button
      type="button"
      disabled={sendingCommand}
      onClick={() => sendCommand(command)}
      style={{
        border: "0",
        borderRadius: "10px",
        padding: "15px",
        minHeight: "55px",
        background,
        color: "#ffffff",
        fontWeight: "700",
        cursor: sendingCommand
          ? "not-allowed"
          : "pointer",
        opacity: sendingCommand ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );

  const ControlPanel = () => (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div style={{ marginBottom: "22px" }}>
        <div
          style={{
            color: "#6b7280",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          SYSTEM CONTROL
        </div>

        <h2 style={{ margin: "5px 0 0" }}>
          Drying Controls
        </h2>
      </div>

      {/* AUTOMATIC MODE */}
      <div style={{ marginBottom: "28px" }}>
        <h3
          style={{
            fontSize: "15px",
            marginBottom: "12px",
          }}
        >
          Automatic Mode
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <ControlButton
            command="AUTO"
            background="#16a34a"
          >
            ▶ AUTOMATIC
          </ControlButton>

          <ControlButton
            command="PAUSE"
            background="#f59e0b"
          >
            ⏸ PAUSE
          </ControlButton>

          <ControlButton
            command="RESUME"
            background="#2563eb"
          >
            ▶ RESUME
          </ControlButton>

          <ControlButton
            command="STOP"
            background="#dc2626"
          >
            ■ STOP
          </ControlButton>
        </div>
      </div>

      {/* MANUAL MODE */}
      <div>
        <h3
          style={{
            fontSize: "15px",
            marginBottom: "12px",
          }}
        >
          Manual Mode
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <ControlButton
            command="HIGH"
            background="#f59e0b"
          >
            HIGH
          </ControlButton>

          <ControlButton
            command="MODERATE"
            background="#eab308"
          >
            MODERATE
          </ControlButton>

          <ControlButton
            command="LOW"
            background="#84cc16"
          >
            LOW
          </ControlButton>

          <ControlButton
            command="STOP"
            background="#dc2626"
          >
            ■ STOP
          </ControlButton>
        </div>
      </div>

      {commandMessage && (
        <div
          style={{
            marginTop: "18px",
            padding: "11px",
            borderRadius: "8px",
            background: "#f1f5f9",
            color: "#475569",
            fontSize: "13px",
          }}
        >
          {commandMessage}
        </div>
      )}
    </section>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <SensorCard
          title="Reactor Chamber Temperature"
          value={reactorTemperature}
          unit="°C"
        />

        <SensorCard
          title="Humidity"
          value={humidity}
          unit="%"
        />

        <SensorCard
          title="Device Status"
          value={deviceOnline ? "ONLINE" : "OFFLINE"}
          unit=""
        />
      </div>

      <HighestTemperatureDisplay />

      <DryingStatus />

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          TEMPERATURE MONITORING
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
          }}
        >
          Reactor Chamber Temperature
        </h2>

        <HighestTemperatureChart
          history={historyItems}
        />
      </section>

      <ControlPanel />
    </>
  );

  // ===================================================
  // OTHER PAGES
  // ===================================================

  const ControlPage = () => (
    <>
      <PageHeader
        title="Control"
        subtitle="Control the SINAG-ANI drying operation"
      />
      <ControlPanel />
      <DryingStatus />
    </>
  );

  const Monitoring = () => (
    <>
      <PageHeader
        title="Monitoring"
        subtitle="Monitor reactor temperature and system performance"
      />

      <HighestTemperatureDisplay />

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Reactor Chamber Temperature
        </h2>

        <HighestTemperatureChart
          history={historyItems}
        />
      </section>
    </>
  );

  const Settings = () => (
    <>
      <PageHeader
        title="Settings"
        subtitle="SINAG-ANI device settings"
      />

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Device Information
        </h2>

        <StatusItem
          title="Device ID"
          value="device001"
        />
      </section>
    </>
  );

  const renderPage = () => {
    if (activePage === "Control") return <ControlPage />;
    if (activePage === "Monitoring") return <Monitoring />;
    if (activePage === "Settings") return <Settings />;
    return <Dashboard />;
  };

  // ===================================================
  // MAIN LAYOUT
  // ===================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#17202a",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "168px",
          background: "#111827",
          color: "#ffffff",
          padding: "16px 12px",
          boxSizing: "border-box",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <div
          style={{
            fontWeight: "800",
            fontSize: "14px",
            marginBottom: "3px",
          }}
        >
          SINAG-ANI
        </div>

        <div
          style={{
            fontSize: "8px",
            color: "#9ca3af",
            marginBottom: "28px",
          }}
        >
          IoT Solar Dryer
        </div>

        {[
          "Dashboard",
          "Control",
          "Monitoring",
          "Settings",
        ].map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setActivePage(page)}
            style={{
              width: "100%",
              textAlign: "left",
              border: 0,
              background:
                activePage === page
                  ? "#ffffff"
                  : "transparent",
              color:
                activePage === page
                  ? "#111827"
                  : "#9ca3af",
              padding: "9px 10px",
              borderRadius: "7px",
              marginBottom: "5px",
              fontWeight:
                activePage === page ? "700" : "500",
              fontSize: "9px",
              cursor: "pointer",
            }}
          >
            {page}
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main
        style={{
          marginLeft: "168px",
          width: "calc(100% - 168px)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            height: "42px",
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 18px",
            fontSize: "10px",
          }}
        >
          <strong>{activePage}</strong>
          <span style={{ color: "#6b7280" }}>
            device001
          </span>
        </div>

        <div
          style={{
            padding: "22px",
            maxWidth: "1000px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
