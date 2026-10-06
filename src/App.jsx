import React, { useEffect, useState } from "react";
import HighestTemperatureChart from "./components/HighestTemperatureChart";

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  update,
} from "firebase/database";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

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

// ======================================================
// DRYING TIMES
// ======================================================

const INITIAL_TIME = 60 * 60; // 1 hour
const MAIN_TIME = 2 * 60 * 60; // 2 hours
const FINAL_TIME = 2 * 60 * 60; // 2 hours

const TOTAL_TIME =
  INITIAL_TIME +
  MAIN_TIME +
  FINAL_TIME;

// ======================================================
// APP
// ======================================================

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [deviceData, setDeviceData] = useState({});

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  const [sendingCommand, setSendingCommand] =
    useState(false);

  const [commandMessage, setCommandMessage] =
    useState("");

  // ====================================================
  // LOCAL TIMER
  // ====================================================

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [timerInitialized, setTimerInitialized] =
    useState(false);

  const [localTimerElapsed, setLocalTimerElapsed] =
    useState(0);

  // ====================================================
  // FIREBASE CONNECTION
  // ====================================================

  useEffect(() => {
    let unsubscribeDatabase = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setFirebaseConnected(false);

          signInAnonymously(auth).catch((error) => {
            console.error(
              "Firebase authentication error:",
              error
            );
          });

          return;
        }

        setFirebaseConnected(true);

        const deviceRef = ref(
          database,
          DEVICE_PATH
        );

        unsubscribeDatabase = onValue(
          deviceRef,
          (snapshot) => {
            const data = snapshot.val();

            if (data) {
              setDeviceData(data);
            }
          },
          (error) => {
            console.error(
              "Firebase database error:",
              error
            );

            setFirebaseConnected(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeDatabase) {
        unsubscribeDatabase();
      }
    };
  }, []);

  // ====================================================
  // LOCAL TIMER
  // ====================================================

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
    if (
      timerRunning &&
      localTimerElapsed >= TOTAL_TIME
    ) {
      setLocalTimerElapsed(TOTAL_TIME);
      setTimerRunning(false);
    }
  }, [timerRunning, localTimerElapsed]);

  // ====================================================
  // FIREBASE DATA
  // ====================================================

  const sensors = deviceData?.sensors || {};
  const control = deviceData?.control || {};
  const status = deviceData?.status || {};

  // ====================================================
  // REACTOR TEMPERATURE
  // ====================================================

  const reactorTemperature =
    sensors?.storageChamberTemperature ??
    sensors?.reactorChamberTemperature ??
    sensors?.temp1 ??
    "--";

  // ====================================================
  // HUMIDITY
  // ====================================================

  const humidity =
    sensors?.humidity ?? "--";

  // ====================================================
  // HISTORY
  // ====================================================

  const history = deviceData?.history || {};

  const historyItems = Array.isArray(history)
    ? history
    : Object.values(history);

  const historyTemperatures = historyItems
    .map((item) =>
      Number(
        item?.storageChamberTemperature ??
          item?.reactorChamberTemperature ??
          item?.temp1
      )
    )
    .filter((value) =>
      Number.isFinite(value)
    );

  const highestTemperature =
    historyTemperatures.length > 0
      ? Math.max(...historyTemperatures)
      : null;

  // ====================================================
  // DEVICE ONLINE
  // ====================================================

  const deviceOnline =
    status?.online === true ||
    sensors?.online === true ||
    deviceData?.online === true;

  // ====================================================
  // MODE
  // ====================================================

  const mode =
    status?.mode ??
    sensors?.mode ??
    control?.mode ??
    "OFF";

  // ====================================================
  // STAGE
  // ====================================================

  const stage =
    status?.stage ??
    sensors?.stage ??
    "OFF";

  // ====================================================
  // FIREBASE TIMER VALUES
  // ====================================================

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

  // ====================================================
  // LOCAL STAGE TIMER
  // ====================================================

  let localStageRemaining = 0;

  if (localTimerElapsed < INITIAL_TIME) {
    localStageRemaining =
      INITIAL_TIME -
      localTimerElapsed;
  } else if (
    localTimerElapsed <
    INITIAL_TIME + MAIN_TIME
  ) {
    localStageRemaining =
      INITIAL_TIME +
      MAIN_TIME -
      localTimerElapsed;
  } else if (
    localTimerElapsed < TOTAL_TIME
  ) {
    localStageRemaining =
      TOTAL_TIME -
      localTimerElapsed;
  }

  // ====================================================
  // TIMER VALUES TO DISPLAY
  // ====================================================

  const stageRemaining =
    timerInitialized
      ? localStageRemaining
      : firebaseStageRemaining;

  const totalRemaining =
    timerInitialized
      ? Math.max(
          0,
          TOTAL_TIME -
            localTimerElapsed
        )
      : firebaseTotalRemaining;

  const totalElapsed =
    timerInitialized
      ? localTimerElapsed
      : firebaseTotalElapsed;

  // ====================================================
  // FAN PWM
  // ====================================================

  const mainFan =
    sensors?.pwm ??
    sensors?.mainFan ??
    status?.pwm ??
    control?.pwm ??
    0;

  // ====================================================
  // FORMAT TIME
  // ====================================================

  const formatTime = (seconds) => {
    const value = Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );

    const hours = Math.floor(
      value / 3600
    );

    const minutes = Math.floor(
      (value % 3600) / 60
    );

    const secs = value % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  };

  // ====================================================
  // TIMER COMMAND HANDLER
  // ====================================================

  const handleTimerCommand = (command) => {
    if (command === "AUTO") {
      if (
        !timerInitialized ||
        localTimerElapsed >= TOTAL_TIME
      ) {
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
      if (
        timerInitialized &&
        localTimerElapsed < TOTAL_TIME
      ) {
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

  // ====================================================
  // SEND COMMAND
  // ====================================================

  const sendCommand = async (command) => {
    try {
      setSendingCommand(true);

      setCommandMessage(
        `Sending ${command}...`
      );

      // ------------------------------------------------
      // PWM VALUES
      // ------------------------------------------------

      let pwmValue = 0;

      switch (command) {
        case "HIGH":
          pwmValue = 100;
          break;

        case "MODERATE":
          pwmValue = 75;
          break;

        case "LOW":
          pwmValue = 50;
          break;

        case "STOP":
          pwmValue = 0;
          break;

        case "AUTO":
          // ESP32 should handle automatic stages.
          // Keep existing PWM unless firmware changes it.
          pwmValue = Number(
            control?.pwm ?? 0
          );
          break;

        case "PAUSE":
          // Keep current PWM value.
          pwmValue = Number(
            control?.pwm ?? 0
          );
          break;

        case "RESUME":
          // Keep current PWM value.
          pwmValue = Number(
            control?.pwm ?? 0
          );
          break;

        default:
          pwmValue = 0;
      }

      // ------------------------------------------------
      // FIREBASE UPDATE
      // ------------------------------------------------
      //
      // This writes BOTH values at once:
      //
      // control/mode
      // control/pwm
      //
      // Example:
      // HIGH      -> 100
      // MODERATE  -> 75
      // LOW       -> 50
      // STOP      -> 0
      //

      const controlRef = ref(
        database,
        `${DEVICE_PATH}/control`
      );

      await update(controlRef, {
        mode: command,
        pwm: pwmValue,
      });

      // ------------------------------------------------
      // LOCAL TIMER
      // ------------------------------------------------

      handleTimerCommand(command);

      // ------------------------------------------------
      // SUCCESS MESSAGE
      // ------------------------------------------------

      setCommandMessage(
        `Command "${command}" sent successfully.`
      );

      setTimeout(() => {
        setCommandMessage("");
      }, 2000);

    } catch (error) {
      console.error(
        "Command error:",
        error
      );

      setCommandMessage(
        `Failed to send ${command}.`
      );
    } finally {
      setSendingCommand(false);
    }
  };

  // ====================================================
  // CARD STYLE
  // ====================================================

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.05)",
  };

  // ====================================================
  // HEADER
  // ====================================================

  const Header = () => (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background:
          "rgba(255,255,255,0.96)",
        backdropFilter: "blur(10px)",
        borderBottom:
          "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "auto",
          padding: "16px 24px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "19px",
              fontWeight: "900",
              color: "#111827",
            }}
          >
            ☀ SINAG-ANI
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              marginTop: "2px",
            }}
          >
            IoT Solar Food Drying System
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            justifyContent:
              "center",
          }}
        >
          {[
            "Dashboard",
            "Control",
            "Monitoring",
            "Settings",
          ].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() =>
                setActivePage(page)
              }
              style={{
                border: "0",
                borderRadius: "10px",
                padding:
                  "9px 14px",
                background:
                  activePage === page
                    ? "#111827"
                    : "transparent",
                color:
                  activePage === page
                    ? "#ffffff"
                    : "#64748b",
                fontWeight:
                  activePage === page
                    ? "800"
                    : "600",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {page}
            </button>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            fontWeight: "700",
            color:
              firebaseConnected
                ? "#15803d"
                : "#64748b",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background:
                firebaseConnected
                  ? "#22c55e"
                  : "#94a3b8",
            }}
          />

          {firebaseConnected
            ? "Firebase Connected"
            : "Connecting..."}
        </div>
      </div>
    </header>
  );

  // ====================================================
  // PAGE HEADER
  // ====================================================

  const PageHeader = ({
    title,
    subtitle,
  }) => (
    <div
      style={{
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "800",
          letterSpacing: "1.5px",
          color: "#64748b",
          marginBottom: "5px",
        }}
      >
        SINAG-ANI
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: "30px",
          fontWeight: "900",
          color: "#111827",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          margin:
            "5px 0 0",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );

  // ====================================================
  // SENSOR CARD
  // ====================================================

  const SensorCard = ({
    icon,
    title,
    value,
    unit,
  }) => (
    <div
      style={{
        ...cardStyle,
        padding: "22px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#64748b",
              letterSpacing:
                "0.5px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems:
                "baseline",
              gap: "6px",
              marginTop:
                "12px",
            }}
          >
            <strong
              style={{
                fontSize: "32px",
                color:
                  "#111827",
              }}
            >
              {value}
            </strong>

            <span
              style={{
                color:
                  "#64748b",
                fontSize:
                  "15px",
              }}
            >
              {unit}
            </span>
          </div>
        </div>

        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius:
              "12px",
            background:
              "#f1f5f9",
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            fontSize: "21px",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  // ====================================================
  // HIGHEST TEMPERATURE
  // ====================================================

  const HighestTemperatureDisplay =
    () => (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
          height: "100%",
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize:
                  "11px",
                fontWeight:
                  "800",
                color:
                  "#64748b",
                letterSpacing:
                  "1px",
              }}
            >
              HIGHEST TEMPERATURE
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "baseline",
                gap: "7px",
                marginTop:
                  "10px",
              }}
            >
              <strong
                style={{
                  fontSize:
                    "42px",
                  color:
                    "#111827",
                }}
              >
                {highestTemperature !==
                null
                  ? highestTemperature.toFixed(
                      1
                    )
                  : "--"}
              </strong>

              <span
                style={{
                  fontSize:
                    "18px",
                  color:
                    "#64748b",
                }}
              >
                °C
              </span>
            </div>

            <div
              style={{
                fontSize:
                  "12px",
                color:
                  "#64748b",
                marginTop:
                  "4px",
              }}
            >
              Reactor Chamber
            </div>
          </div>

          <div
            style={{
              fontSize:
                "40px",
            }}
          >
            🌡️
          </div>
        </div>
      </section>
    );

  // ====================================================
  // STATUS ITEM
  // ====================================================

  const StatusItem = ({
    title,
    value,
  }) => (
    <div
      style={{
        background:
          "#f8fafc",
        borderRadius:
          "12px",
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "#64748b",
          marginBottom:
            "6px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize:
            "14px",
          color:
            "#111827",
        }}
      >
        {value}
      </strong>
    </div>
  );

  // ====================================================
  // OPERATION CARD
  // ====================================================

  const OperationCard =
    () => (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
          height: "100%",
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "18px",
          }}
        >
          <div>
            <div
              style={{
                fontSize:
                  "11px",
                fontWeight:
                  "800",
                letterSpacing:
                  "1px",
                color:
                  "#64748b",
              }}
            >
              CURRENT OPERATION
            </div>

            <h2
              style={{
                margin:
                  "5px 0 0",
                fontSize:
                  "20px",
              }}
            >
              Drying Status
            </h2>
          </div>

          <div
            style={{
              padding:
                "7px 11px",
              borderRadius:
                "20px",
              background:
                deviceOnline
                  ? "#dcfce7"
                  : "#f1f5f9",
              color:
                deviceOnline
                  ? "#166534"
                  : "#64748b",
              fontSize:
                "10px",
              fontWeight:
                "900",
            }}
          >
            {deviceOnline
              ? "● ONLINE"
              : "● OFFLINE"}
          </div>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <StatusItem
            title="MODE"
            value={mode}
          />

          <StatusItem
            title="STAGE"
            value={stage}
          />

          <StatusItem
            title="STAGE REMAINING"
            value={formatTime(
              stageRemaining
            )}
          />

          <StatusItem
            title="TOTAL REMAINING"
            value={formatTime(
              totalRemaining
            )}
          />

          <StatusItem
            title="TOTAL ELAPSED"
            value={formatTime(
              totalElapsed
            )}
          />

          <StatusItem
            title="MAIN FAN"
            value={`${Number(
              mainFan
            ) || 0}%`}
          />
        </div>
      </section>
    );

  // ====================================================
  // CONTROL BUTTON
  // ====================================================

  const ControlButton = ({
    children,
    background,
    command,
  }) => (
    <button
      type="button"
      disabled={sendingCommand}
      onClick={() =>
        sendCommand(command)
      }
      style={{
        border: "0",
        borderRadius:
          "12px",
        minHeight:
          "58px",
        padding:
          "12px",
        background,
        color:
          "#ffffff",
        fontWeight:
          "800",
        fontSize:
          "12px",
        cursor:
          sendingCommand
            ? "not-allowed"
            : "pointer",
        opacity:
          sendingCommand
            ? 0.6
            : 1,
        transition:
          "0.2s",
      }}
    >
      {children}
    </button>
  );

  // ====================================================
  // CONTROL PANEL
  // ====================================================

  const ControlPanel =
    () => (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
        }}
      >
        <div
          style={{
            marginBottom:
              "22px",
          }}
        >
          <div
            style={{
              fontSize:
                "11px",
              fontWeight:
                "800",
              letterSpacing:
                "1px",
              color:
                "#64748b",
            }}
          >
            SYSTEM CONTROL
          </div>

          <h2
            style={{
              margin:
                "5px 0 0",
            }}
          >
            Drying Controls
          </h2>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "20px",
          }}
        >
          {/* ==========================================
              AUTOMATIC MODE
          ========================================== */}

          <div
            style={{
              background:
                "#f8fafc",
              borderRadius:
                "15px",
              padding:
                "18px",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 12px",
                fontSize:
                  "14px",
              }}
            >
              Automatic Mode
            </h3>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "9px",
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

          {/* ==========================================
              MANUAL MODE
          ========================================== */}

          <div
            style={{
              background:
                "#f8fafc",
              borderRadius:
                "15px",
              padding:
                "18px",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 12px",
                fontSize:
                  "14px",
              }}
            >
              Manual Mode
            </h3>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "9px",
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
        </div>

        {/* ============================================
            COMMAND MESSAGE
        ============================================ */}

        {commandMessage && (
          <div
            style={{
              marginTop:
                "18px",
              padding:
                "12px 14px",
              borderRadius:
                "10px",
              background:
                "#f1f5f9",
              color:
                "#475569",
              fontSize:
                "12px",
              fontWeight:
                "600",
            }}
          >
            {commandMessage}
          </div>
        )}
      </section>
    );

  // ====================================================
  // TEMPERATURE CHART
  // ====================================================

  const TemperatureChart =
    () => (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
        }}
      >
        <div
          style={{
            fontSize:
              "11px",
            fontWeight:
              "800",
            letterSpacing:
              "1px",
            color:
              "#64748b",
          }}
        >
          TEMPERATURE MONITORING
        </div>

        <h2
          style={{
            margin:
              "5px 0 18px",
            fontSize:
              "20px",
          }}
        >
          Reactor Chamber Temperature
        </h2>

        <HighestTemperatureChart
          history={
            historyItems
          }
        />
      </section>
    );

  // ====================================================
  // DASHBOARD
  // ====================================================

  const Dashboard =
    () => (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Real-time SINAG-ANI system monitoring"
        />

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom:
              "14px",
          }}
        >
          <SensorCard
            icon="🌡️"
            title="REACTOR CHAMBER TEMPERATURE"
            value={
              reactorTemperature
            }
            unit="°C"
          />

          <SensorCard
            icon="💧"
            title="HUMIDITY"
            value={
              humidity
            }
            unit="%"
          />

          <SensorCard
            icon="⚡"
            title="DEVICE STATUS"
            value={
              deviceOnline
                ? "ONLINE"
                : "OFFLINE"
            }
            unit=""
          />
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0, 0.8fr) minmax(0, 1.2fr)",
            gap: "14px",
            marginBottom:
              "14px",
          }}
        >
          <HighestTemperatureDisplay />

          <OperationCard />
        </div>

        <div
          style={{
            marginBottom:
              "14px",
          }}
        >
          <TemperatureChart />
        </div>

        <ControlPanel />
      </>
    );

  // ====================================================
  // CONTROL PAGE
  // ====================================================

  const ControlPage =
    () => (
      <>
        <PageHeader
          title="Control"
          subtitle="Control the SINAG-ANI drying operation"
        />

        <ControlPanel />

        <div
          style={{
            marginTop:
              "14px",
          }}
        >
          <OperationCard />
        </div>
      </>
    );

  // ====================================================
  // MONITORING
  // ====================================================

  const Monitoring =
    () => (
      <>
        <PageHeader
          title="Monitoring"
          subtitle="Monitor reactor temperature and drying performance"
        />

        <div
          style={{
            marginBottom:
              "14px",
          }}
        >
          <HighestTemperatureDisplay />
        </div>

        <TemperatureChart />
      </>
    );

  // ====================================================
  // SETTINGS
  // ====================================================

  const Settings =
    () => (
      <>
        <PageHeader
          title="Settings"
          subtitle="SINAG-ANI device information"
        />

        <section
          style={{
            ...cardStyle,
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize:
                "11px",
              fontWeight:
                "800",
              letterSpacing:
                "1px",
              color:
                "#64748b",
              marginBottom:
                "18px",
            }}
          >
            DEVICE INFORMATION
          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <StatusItem
              title="DEVICE ID"
              value="device001"
            />

            <StatusItem
              title="FIREBASE"
              value={
                firebaseConnected
                  ? "CONNECTED"
                  : "DISCONNECTED"
              }
            />

            <StatusItem
              title="DEVICE STATUS"
              value={
                deviceOnline
                  ? "ONLINE"
                  : "OFFLINE"
              }
            />

            <StatusItem
              title="CURRENT MODE"
              value={
                mode
              }
            />
          </div>
        </section>
      </>
    );

  // ====================================================
  // PAGE ROUTER
  // ====================================================

  const renderPage =
    () => {
      if (
        activePage ===
        "Control"
      ) {
        return (
          <ControlPage />
        );
      }

      if (
        activePage ===
        "Monitoring"
      ) {
        return (
          <Monitoring />
        );
      }

      if (
        activePage ===
        "Settings"
      ) {
        return (
          <Settings />
        );
      }

      return (
        <Dashboard />
      );
    };

  // ====================================================
  // MAIN RETURN
  // ====================================================

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "#f8fafc",
        color:
          "#111827",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Header />

      <main
        style={{
          maxWidth:
            "1250px",
          margin:
            "0 auto",
          padding:
            "30px 24px 50px",
          boxSizing:
            "border-box",
        }}
      >
        {renderPage()}
      </main>

      <footer
        style={{
          borderTop:
            "1px solid #e5e7eb",
          background:
            "#ffffff",
          padding:
            "18px 24px",
          textAlign:
            "center",
          color:
            "#94a3b8",
          fontSize:
            "11px",
        }}
      >
        SINAG-ANI IoT Solar Food Drying System
        {" • "}
        device001
      </footer>
    </div>
  );
}

export default App;
