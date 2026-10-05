import React, { useEffect, useState } from "react";
import HighestTemperatureChart from "./components/HighestTemperatureChart";

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
} from "firebase/database";
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
// APP
// =====================================================

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [deviceData, setDeviceData] = useState({});
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [commandMessage, setCommandMessage] = useState("");

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
  // DATA
  // ===================================================

  const sensors = deviceData?.sensors || {};
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

  const lastSeen = Number(status?.lastSeen) || 0;
  const heartbeatIsFresh =
    lastSeen > 0 && Date.now() - lastSeen < 25000;

  const deviceOnline =
    status?.online === true && heartbeatIsFresh;

  const mode = status?.mode ?? "OFF";
  const stage = status?.stage ?? "OFF";

  const stageRemaining =
    Number(status?.stageRemainingSeconds) || 0;

  const totalRemaining =
    Number(status?.totalRemainingSeconds) || 0;

  const totalElapsed =
    Number(status?.totalElapsedSeconds) || 0;

  const pwm = Number(status?.pwm) || 0;

  const mainFan = Math.round(
    (Math.max(0, Math.min(255, pwm)) / 255) * 100
  );

  const coolFan = status?.coolFan === true;

  // ===================================================
  // TIME
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
  // FIREBASE COMMAND
  // ===================================================

  const sendCommand = async (command) => {
    try {
      setCommandMessage(`Sending ${command}...`);

      const commandRef = ref(
        database,
        `${DEVICE_PATH}/control/mode`
      );

      await set(commandRef, command);

      console.log("Firebase command sent:", command);

      setCommandMessage(
        `Command "${command}" sent successfully.`
      );

      setTimeout(() => setCommandMessage(""), 1500);
    } catch (error) {
      console.error("Command error:", error);

      setCommandMessage(
        `Failed to send "${command}".`
      );

      setTimeout(() => setCommandMessage(""), 2500);
    }
  };

  // ===================================================
  // STYLES
  // ===================================================

  const colors = {
    navy: "#111827",
    page: "#f5f6f8",
    card: "#ffffff",
    border: "#e5e7eb",
    muted: "#6b7280",
    green: "#16a34a",
    yellow: "#eab308",
    orange: "#f59e0b",
    blue: "#2563eb",
    red: "#dc2626",
    lime: "#84cc16",
  };

  // ===================================================
  // COMPONENTS
  // ===================================================

  const PageHeader = ({ title, subtitle }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "24px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: colors.muted,
            marginBottom: "4px",
          }}
        >
          SINAG-ANI
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "25px",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: "5px 0 0",
            color: colors.muted,
            fontSize: "12px",
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          color: colors.muted,
          fontSize: "10px",
          paddingTop: "5px",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
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
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "11px",
        padding: "16px",
        minHeight: "79px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color: colors.muted,
          fontSize: "10px",
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
        }}
      >
        <strong style={{ fontSize: "21px" }}>
          {value}
        </strong>
        <span
          style={{
            color: colors.muted,
            fontSize: "12px",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );

  const StatusItem = ({ title, value }) => (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: "9px",
        padding: "12px",
        minHeight: "54px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color: colors.muted,
          fontSize: "9px",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>
      <strong style={{ fontSize: "11px" }}>
        {value}
      </strong>
    </div>
  );

  const HighestTemperatureDisplay = () => (
    <section
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "11px",
        padding: "17px",
        marginBottom: "18px",
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
              color: colors.muted,
              fontSize: "9px",
              marginBottom: "5px",
            }}
          >
            HIGHEST TEMPERATURE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "5px",
            }}
          >
            <strong style={{ fontSize: "27px" }}>
              {highestTemperature !== null
                ? highestTemperature.toFixed(1)
                : "--"}
            </strong>
            <span
              style={{
                color: colors.muted,
                fontSize: "13px",
              }}
            >
              °C
            </span>
          </div>

          <div
            style={{
              color: colors.muted,
              fontSize: "9px",
              marginTop: "2px",
            }}
          >
            Reactor Chamber
          </div>
        </div>

        <div style={{ fontSize: "27px" }}>
          🌡️
        </div>
      </div>
    </section>
  );

  const DryingStatus = () => (
    <section
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "11px",
        padding: "17px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              color: colors.muted,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            CURRENT SINAG-ANI OPERATION
          </div>
          <h2
            style={{
              margin: "3px 0 0",
              fontSize: "17px",
            }}
          >
            Drying Status
          </h2>
        </div>

        <div
          style={{
            padding: "6px 9px",
            borderRadius: "15px",
            background: deviceOnline
              ? "#dcfce7"
              : "#f3f4f6",
            color: deviceOnline
              ? "#166534"
              : colors.muted,
            fontSize: "9px",
            fontWeight: 800,
          }}
        >
          {deviceOnline
            ? "● ONLINE"
            : "● OFFLINE"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "9px",
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
          value={`${mainFan}%`}
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
      onClick={() => sendCommand(command)}
      style={{
        border: 0,
        borderRadius: "9px",
        padding: "12px 8px",
        minHeight: "40px",
        background,
        color: "#ffffff",
        fontWeight: 700,
        fontSize: "10px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  const ControlPanel = () => (
    <section
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "11px",
        padding: "17px",
        marginBottom: "18px",
      }}
    >
      <div style={{ marginBottom: "17px" }}>
        <div
          style={{
            color: colors.muted,
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          SYSTEM CONTROL
        </div>

        <h2
          style={{
            margin: "3px 0 0",
            fontSize: "17px",
          }}
        >
          Drying Controls
        </h2>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <h3
          style={{
            fontSize: "11px",
            margin: "0 0 9px",
          }}
        >
          Automatic Mode
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "7px",
          }}
        >
          <ControlButton
            command="AUTO"
            background={colors.green}
          >
            ▶ AUTOMATIC
          </ControlButton>

          <ControlButton
            command="PAUSE"
            background={colors.orange}
          >
            ⏸ PAUSE
          </ControlButton>

          <ControlButton
            command="RESUME"
            background={colors.blue}
          >
            ▶ RESUME
          </ControlButton>

          <ControlButton
            command="STOP"
            background={colors.red}
          >
            ■ STOP
          </ControlButton>
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: "11px",
            margin: "0 0 9px",
          }}
        >
          Manual Mode
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "7px",
          }}
        >
          <ControlButton
            command="HIGH"
            background={colors.orange}
          >
            HIGH
          </ControlButton>

          <ControlButton
            command="MODERATE"
            background={colors.yellow}
          >
            MODERATE
          </ControlButton>

          <ControlButton
            command="LOW"
            background={colors.lime}
          >
            LOW
          </ControlButton>

          <ControlButton
            command="STOP"
            background={colors.red}
          >
            ■ STOP
          </ControlButton>
        </div>
      </div>

      {commandMessage && (
        <div
          style={{
            marginTop: "13px",
            padding: "9px",
            borderRadius: "7px",
            background: "#f1f5f9",
            color: "#475569",
            fontSize: "10px",
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
          marginBottom: "18px",
        }}
      >
        <SensorCard
          title={
            <>
              Reactor Chamber
              <br />
              Temperature
            </>
          }
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
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "11px",
          padding: "17px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: colors.muted,
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          TEMPERATURE MONITORING
        </div>

        <h2
          style={{
            margin: "4px 0 14px",
            fontSize: "17px",
          }}
        >
          Reactor Chamber Temperature
        </h2>

        <div style={{ width: "100%", minHeight: "230px" }}>
          <HighestTemperatureChart history={historyItems} />
        </div>
      </section>

      <ControlPanel />
    </>
  );

  // ===================================================
  // CONTROL PAGE
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

  // ===================================================
  // MONITORING PAGE
  // ===================================================

  const Monitoring = () => (
    <>
      <PageHeader
        title="Monitoring"
        subtitle="Monitor reactor temperature and system performance"
      />

      <HighestTemperatureDisplay />

      <section
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "11px",
          padding: "17px",
        }}
      >
        <div
          style={{
            color: colors.muted,
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          TEMPERATURE MONITORING
        </div>

        <h2
          style={{
            margin: "4px 0 14px",
            fontSize: "17px",
          }}
        >
          Reactor Chamber Temperature
        </h2>

        <HighestTemperatureChart history={historyItems} />
      </section>
    </>
  );

  // ===================================================
  // SETTINGS PAGE
  // ===================================================

  const Settings = () => (
    <>
      <PageHeader
        title="Settings"
        subtitle="SINAG-ANI device settings"
      />

      <section
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "11px",
          padding: "17px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "17px",
          }}
        >
          Device Information
        </h2>

        <StatusItem
          title="Device ID"
          value="device001"
        />
      </section>
    </>
  );

  // ===================================================
  // PAGE ROUTER
  // ===================================================

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
        background: colors.page,
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
          padding: "18px 12px",
          boxSizing: "border-box",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <div
          style={{
            fontWeight: 800,
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
                activePage === page ? 700 : 500,
              fontSize: "9px",
              cursor: "pointer",
            }}
          >
            {page}
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main
        style={{
          marginLeft: "168px",
          width: "calc(100% - 168px)",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            height: "42px",
            background: "#ffffff",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 18px",
            boxSizing: "border-box",
            fontSize: "10px",
          }}
        >
          <strong>{activePage}</strong>
          <span style={{ color: colors.muted }}>
            device001
          </span>
        </div>

        <div
          style={{
            padding: "20px 22px 35px",
            maxWidth: "1000px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {renderPage()}

          <div
            style={{
              marginTop: "20px",
              color: colors.muted,
              fontSize: "9px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Device: device001</span>
            <span>
              {deviceOnline
                ? "● Device Online"
                : "● Device Offline"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
