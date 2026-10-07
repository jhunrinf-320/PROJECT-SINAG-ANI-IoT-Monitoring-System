import React, { useEffect, useMemo, useState } from "react";
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

  const [lastUpdate, setLastUpdate] = useState(null);

  // ===================================================
  // FIREBASE
  // ===================================================

  useEffect(() => {
    let unsubscribeDatabase = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFirebaseConnected(false);

        signInAnonymously(auth)
          .then(() => {
            console.log(
              "Firebase anonymous authentication successful."
            );
          })
          .catch((error) => {
            console.error(
              "Firebase authentication error:",
              error
            );
          });

        return;
      }

      setFirebaseConnected(true);

      const deviceRef = ref(database, DEVICE_PATH);

      unsubscribeDatabase = onValue(
        deviceRef,
        (snapshot) => {
          const data = snapshot.val();

          if (data) {
            setDeviceData(data);
            setLastUpdate(new Date());
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
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeDatabase) {
        unsubscribeDatabase();
      }
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
    if (
      timerRunning &&
      localTimerElapsed >= TOTAL_TIME
    ) {
      setLocalTimerElapsed(TOTAL_TIME);
      setTimerRunning(false);
    }
  }, [timerRunning, localTimerElapsed]);

  // ===================================================
  // FIREBASE DATA
  // ===================================================

  const sensors = deviceData?.sensors || {};
  const control = deviceData?.control || {};
  const status = deviceData?.status || {};

  const reactorTemperature =
    sensors?.storageChamberTemperature ??
    sensors?.reactorChamberTemperature ??
    sensors?.temp1 ??
    "--";

  const humidity =
    sensors?.humidity ??
    "--";

  const history = deviceData?.history || {};

  const historyItems = Array.isArray(history)
    ? history
    : Object.values(history);

  // ===================================================
  // HIGHEST TEMPERATURE
  // ===================================================

  const historyTemperatures = historyItems
    .map((item) =>
      Number(
        item?.storageChamberTemperature ??
        item?.reactorChamberTemperature ??
        item?.temp1
      )
    )
    .filter((value) => Number.isFinite(value));

  const currentTemperatureNumber =
    Number(reactorTemperature);

  const allTemperatures = [
    ...historyTemperatures,
    ...(Number.isFinite(currentTemperatureNumber)
      ? [currentTemperatureNumber]
      : []),
  ];

  const highestTemperature =
    allTemperatures.length > 0
      ? Math.max(...allTemperatures)
      : null;

  // ===================================================
  // DEVICE STATUS
  // ===================================================

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
    localStageRemaining =
      INITIAL_TIME - localTimerElapsed;
  } else if (
    localTimerElapsed <
    INITIAL_TIME + MAIN_TIME
  ) {
    localStageRemaining =
      INITIAL_TIME +
      MAIN_TIME -
      localTimerElapsed;
  } else if (localTimerElapsed < TOTAL_TIME) {
    localStageRemaining =
      TOTAL_TIME - localTimerElapsed;
  }

  const stageRemaining = timerInitialized
    ? localStageRemaining
    : firebaseStageRemaining;

  const totalRemaining = timerInitialized
    ? Math.max(
        0,
        TOTAL_TIME - localTimerElapsed
      )
    : firebaseTotalRemaining;

  const totalElapsed = timerInitialized
    ? localTimerElapsed
    : firebaseTotalElapsed;

  // ===================================================
  // FAN
  // ===================================================

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
  // STAGE HELPERS
  // ===================================================

  const normalizedStage =
    String(stage)
      .toLowerCase()
      .replace(/[_-]/g, " ");

  const getStageIndex = () => {
    if (
      normalizedStage.includes("initial")
    ) {
      return 0;
    }

    if (
      normalizedStage.includes("main")
    ) {
      return 1;
    }

    if (
      normalizedStage.includes("final")
    ) {
      return 2;
    }

    if (
      normalizedStage.includes("complete")
    ) {
      return 3;
    }

    if (
      normalizedStage.includes("done")
    ) {
      return 3;
    }

    if (
      Number(totalElapsed) >= TOTAL_TIME
    ) {
      return 3;
    }

    return -1;
  };

  const activeStageIndex = getStageIndex();

  // ===================================================
  // FORMAT TIME
  // ===================================================

  const formatTime = (seconds) => {
    const value = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
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

  // ===================================================
  // TIMER COMMAND
  // ===================================================

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

  // ===================================================
  // SEND COMMAND
  // ===================================================

  const sendCommand = async (command) => {
    try {
      setSendingCommand(true);
      setCommandMessage(
        `Sending ${command}...`
      );

      const commandRef = ref(
        database,
        `${DEVICE_PATH}/control/mode`
      );

      await set(commandRef, command);

      handleTimerCommand(command);

      setCommandMessage(
        `Command "${command}" sent successfully.`
      );

      setTimeout(
        () => setCommandMessage(""),
        2500
      );
    } catch (error) {
      console.error(
        "Command error:",
        error
      );

      setCommandMessage(
        "Failed to send command."
      );
    } finally {
      setSendingCommand(false);
    }
  };

  // ===================================================
  // GENERAL STYLES
  // ===================================================

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    boxShadow:
      "0 1px 2px rgba(15,23,42,0.04)",
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#111827",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  // ===================================================
  // PAGE HEADER
  // ===================================================

  const PageHeader = ({
    title,
    subtitle,
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "24px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1.4px",
            color: "#64748b",
          }}
        >
          SINAG-ANI
        </div>

        <h1
          style={{
            margin: "5px 0 5px",
            fontSize: "30px",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "999px",
          padding: "9px 13px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#475569",
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
            boxShadow:
              firebaseConnected
                ? "0 0 0 4px #dcfce7"
                : "none",
          }}
        />

        {firebaseConnected
          ? "Firebase Connected"
          : "Connecting..."}
      </div>
    </div>
  );

  // ===================================================
  // SENSOR CARD
  // ===================================================

  const SensorCard = ({
    title,
    value,
    unit,
    icon,
    smallText,
  }) => (
    <div
      style={{
        ...cardStyle,
        padding: "20px",
        minHeight: "135px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <div>
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "11px",
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
            <strong
              style={{
                fontSize: "30px",
                letterSpacing: "-0.5px",
              }}
            >
              {value}
            </strong>

            {unit && (
              <span
                style={{
                  color: "#64748b",
                  fontSize: "15px",
                }}
              >
                {unit}
              </span>
            )}
          </div>

          {smallText && (
            <div
              style={{
                marginTop: "8px",
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              {smallText}
            </div>
          )}
        </div>

        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "12px",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "19px",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  // ===================================================
  // HIGHEST TEMPERATURE
  // ===================================================

  const HighestTemperatureDisplay = () => (
    <section
      style={{
        ...cardStyle,
        padding: "22px",
        height: "100%",
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
              color: "#64748b",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            HIGHEST TEMPERATURE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "7px",
              marginTop: "10px",
            }}
          >
            <strong
              style={{
                fontSize: "42px",
                color: "#111827",
              }}
            >
              {highestTemperature !== null
                ? highestTemperature.toFixed(1)
                : "--"}
            </strong>

            <span
              style={{
                fontSize: "18px",
                color: "#64748b",
              }}
            >
              °C
            </span>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Reactor Chamber
          </div>
        </div>

        <div
          style={{
            fontSize: "38px",
          }}
        >
          🌡️
        </div>
      </div>
    </section>
  );

  // ===================================================
  // STATUS ITEM
  // ===================================================

  const StatusItem = ({
    title,
    value,
  }) => (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: "12px",
        padding: "14px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "800",
          color: "#64748b",
          marginBottom: "6px",
          letterSpacing: "0.3px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "14px",
          color: "#111827",
          wordBreak: "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );

  // ===================================================
  // OPERATION CARD
  // ===================================================

  const OperationCard = () => (
    <section
      style={{
        ...cardStyle,
        padding: "22px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          gap: "15px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
              color: "#64748b",
            }}
          >
            CURRENT OPERATION
          </div>

          <h2
            style={{
              margin: "5px 0 0",
              fontSize: "20px",
            }}
          >
            Drying Status
          </h2>
        </div>

        <div
          style={{
            padding: "7px 11px",
            borderRadius: "20px",
            background: deviceOnline
              ? "#dcfce7"
              : "#f1f5f9",
            color: deviceOnline
              ? "#166534"
              : "#64748b",
            fontSize: "10px",
            fontWeight: "900",
            whiteSpace: "nowrap",
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
          value={`${Number(mainFan) || 0}%`}
        />

        <StatusItem
          title="COOL-AIR FAN"
          value={
            coolFan ? "ON" : "OFF"
          }
        />

        <StatusItem
          title="FIREBASE"
          value={
            firebaseConnected
              ? "CONNECTED"
              : "DISCONNECTED"
          }
        />
      </div>
    </section>
  );

  // ===================================================
  // DRYING STAGE TIMELINE
  // ===================================================

  const DryingTimeline = () => {
    const stages = [
      {
        name: "Initial",
        duration: "1 hour",
        fan: "100%",
        description: "Pre-drying",
      },
      {
        name: "Main",
        duration: "2 hours",
        fan: "75%",
        description: "Main drying",
      },
      {
        name: "Final",
        duration: "2 hours",
        fan: "50%",
        description: "Final drying",
      },
      {
        name: "Complete",
        duration: "Finished",
        fan: "OFF",
        description: "Drying complete",
      },
    ];

    return (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
              color: "#64748b",
            }}
          >
            DRYING PROCESS
          </div>

          <h2
            style={{
              margin: "5px 0 4px",
              fontSize: "20px",
            }}
          >
            Multi-Stage Drying Timeline
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Five-hour automatic drying cycle
          </p>
        </div>

        <div
          className="stage-timeline"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "0",
          }}
        >
          {stages.map(
            (item, index) => {
              const completed =
                activeStageIndex > index;

              const active =
                activeStageIndex === index;

              return (
                <div
                  key={item.name}
                  style={{
                    position: "relative",
                    textAlign: "center",
                    padding:
                      "0 8px",
                  }}
                >
                  {index <
                    stages.length - 1 && (
                    <div
                      style={{
                        position:
                          "absolute",
                        top: "16px",
                        left: "50%",
                        width: "100%",
                        height: "2px",
                        background:
                          completed
                            ? "#16a34a"
                            : "#e2e8f0",
                        zIndex: 0,
                      }}
                    />
                  )}

                  <div
                    style={{
                      position:
                        "relative",
                      zIndex: 1,
                      width: "32px",
                      height: "32px",
                      margin:
                        "0 auto 10px",
                      borderRadius:
                        "50%",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize:
                        "12px",
                      fontWeight:
                        "900",
                      background:
                        completed
                          ? "#16a34a"
                          : active
                          ? "#2563eb"
                          : "#e2e8f0",
                      color:
                        completed ||
                        active
                          ? "#ffffff"
                          : "#64748b",
                      boxShadow:
                        active
                          ? "0 0 0 5px #dbeafe"
                          : "none",
                    }}
                  >
                    {completed
                      ? "✓"
                      : index + 1}
                  </div>

                  <div
                    style={{
                      fontWeight:
                        "800",
                      fontSize:
                        "13px",
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      color:
                        "#64748b",
                      fontSize:
                        "11px",
                      marginTop:
                        "4px",
                    }}
                  >
                    {item.duration}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "7px",
                      fontSize:
                        "11px",
                      fontWeight:
                        "800",
                    }}
                  >
                    Fan {item.fan}
                  </div>

                  <div
                    style={{
                      color:
                        "#94a3b8",
                      fontSize:
                        "10px",
                      marginTop:
                        "3px",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>
    );
  };

  // ===================================================
  // CONTROL BUTTON
  // ===================================================

  const ControlButton = ({
    children,
    background,
    command,
    active = false,
  }) => (
    <button
      type="button"
      disabled={sendingCommand}
      onClick={() =>
        sendCommand(command)
      }
      style={{
        border: active
          ? "2px solid #111827"
          : "0",
        borderRadius: "12px",
        minHeight: "58px",
        padding: "12px",
        background,
        color: "#ffffff",
        fontWeight: "800",
        fontSize: "12px",
        cursor: sendingCommand
          ? "not-allowed"
          : "pointer",
        opacity: sendingCommand
          ? 0.6
          : 1,
        transition: "0.2s",
        boxShadow: active
          ? "0 0 0 3px rgba(15,23,42,0.08)"
          : "none",
      }}
    >
      {children}
    </button>
  );

  // ===================================================
  // CONTROL PANEL
  // ===================================================

  const ControlPanel = () => (
    <section
      style={{
        ...cardStyle,
        padding: "24px",
      }}
    >
      <div
        style={{
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
            color: "#64748b",
          }}
        >
          SYSTEM CONTROL
        </div>

        <h2
          style={{
            margin: "5px 0 0",
            fontSize: "20px",
          }}
        >
          Drying Controls
        </h2>
      </div>

      <div
        className="control-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "20px",
        }}
      >
        {/* AUTOMATIC */}

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "15px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
              }}
            >
              Automatic Mode
            </h3>

            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color: "#64748b",
              }}
            >
              5-HOUR CYCLE
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "9px",
            }}
          >
            <ControlButton
              command="AUTO"
              background="#16a34a"
              active={mode === "AUTO"}
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

        {/* MANUAL */}

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "15px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
              }}
            >
              Manual Mode
            </h3>

            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color: "#64748b",
              }}
            >
              FAN CONTROL
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "9px",
            }}
          >
            <ControlButton
              command="HIGH"
              background="#f59e0b"
              active={mode === "HIGH"}
            >
              HIGH · 100%
            </ControlButton>

            <ControlButton
              command="MODERATE"
              background="#eab308"
              active={mode === "MODERATE"}
            >
              MODERATE · 75%
            </ControlButton>

            <ControlButton
              command="LOW"
              background="#65a30d"
              active={mode === "LOW"}
            >
              LOW · 50%
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

      {commandMessage && (
        <div
          style={{
            marginTop: "18px",
            padding: "11px 13px",
            borderRadius: "9px",
            background: "#f1f5f9",
            color: "#475569",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {commandMessage}
        </div>
      )}
    </section>
  );

  // ===================================================
  // SYSTEM FLOWCHART
  // ===================================================

  const FlowBox = ({
    children,
    type = "normal",
  }) => {
    const colors = {
      start: {
        background: "#111827",
        color: "#ffffff",
      },
      decision: {
        background: "#eff6ff",
        color: "#1d4ed8",
      },
      process: {
        background: "#f8fafc",
        color: "#111827",
      },
      data: {
        background: "#f0fdf4",
        color: "#166534",
      },
      end: {
        background: "#dcfce7",
        color: "#166534",
      },
    };

    return (
      <div
        style={{
          minWidth: "170px",
          padding: "13px 16px",
          borderRadius:
            type === "start" ||
            type === "end"
              ? "999px"
              : "11px",
          border:
            type === "start"
              ? "1px solid #111827"
              : "1px solid #dbe2ea",
          background:
            colors[type].background,
          color:
            colors[type].color,
          textAlign: "center",
          fontSize: "12px",
          fontWeight: "800",
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        {children}
      </div>
    );
  };

  const FlowArrow = ({
    label,
  }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        minWidth: "35px",
      }}
    >
      {label && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: "800",
            color: "#64748b",
            marginBottom: "2px",
          }}
        >
          {label}
        </span>
      )}

      <span
        style={{
          fontSize: "22px",
          lineHeight: 1,
        }}
      >
        →
      </span>
    </div>
  );

  const SystemFlowchart = () => (
    <section
      style={{
        ...cardStyle,
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
            color: "#64748b",
          }}
        >
          SYSTEM OPERATION
        </div>

        <h2
          style={{
            margin: "5px 0 4px",
            fontSize: "20px",
          }}
        >
          SINAG-ANI System Flowchart
        </h2>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          Overview of monitoring, control, and drying
          operation
        </p>
      </div>

      <div
        className="flowchart-scroll"
        style={{
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        <div
          style={{
            minWidth: "850px",
          }}
        >
          {/* ROW 1 */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <FlowBox type="start">
              START SYSTEM
            </FlowBox>

            <FlowArrow />

            <FlowBox>
              Initialize ESP32,
              <br />
              Sensors & Firebase
            </FlowBox>

            <FlowArrow />

            <FlowBox type="data">
              Read Temperature
              <br />
              & Humidity
            </FlowBox>
          </div>

          {/* DOWN */}

          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "25px",
              margin: "8px 0",
            }}
          >
            ↓
          </div>

          {/* ROW 2 */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FlowBox type="decision">
              AUTO MODE
              <br />
              ENABLED?
            </FlowBox>

            <FlowArrow label="YES" />

            <FlowBox>
              Automatic
              <br />
              Drying Cycle
            </FlowBox>

            <FlowArrow />

            <FlowBox>
              Initial 100%
              <br />
              Main 75%
              <br />
              Final 50%
            </FlowBox>
          </div>

          {/* MANUAL BRANCH */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "14px",
            }}
          >
            <div
              style={{
                borderLeft:
                  "2px dashed #cbd5e1",
                paddingLeft: "20px",
                marginLeft: "100px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#64748b",
                  }}
                >
                  NO
                </span>

                <FlowArrow />

                <FlowBox>
                  Manual Control
                  <br />
                  High / Moderate / Low
                </FlowBox>
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "25px",
              margin: "10px 0",
            }}
          >
            ↓
          </div>

          {/* ROW 3 */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <FlowBox type="data">
              ESP32 Controls
              <br />
              Drying System
            </FlowBox>

            <FlowArrow />

            <FlowBox type="data">
              Send Data
              <br />
              to Firebase
            </FlowBox>

            <FlowArrow />

            <FlowBox type="data">
              Web Dashboard
              <br />
              Displays Live Data
            </FlowBox>
          </div>

          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "25px",
              margin: "8px 0",
            }}
          >
            ↓
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FlowBox type="decision">
              DRYING
              <br />
              COMPLETE?
            </FlowBox>

            <FlowArrow label="YES" />

            <FlowBox type="end">
              STOP /
              <br />
              COMPLETE
            </FlowBox>
          </div>
        </div>
      </div>
    </section>
  );

  // ===================================================
  // TRIAL RESULTS
  // ===================================================

  const TrialResults = () => {
    const trials = [
      {
        trial: "Trial 1",
        initial: "100 g",
        final: "68 g",
        reduction: "32%",
        condition: "Sunny",
      },
      {
        trial: "Trial 2",
        initial: "100 g",
        final: "69 g",
        reduction: "31%",
        condition: "Sunny",
      },
      {
        trial: "Trial 3",
        initial: "100 g",
        final: "75 g",
        reduction: "25%",
        condition: "Cloudy / Rainy",
      },
    ];

    return (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
              color: "#64748b",
            }}
          >
            RESEARCH RESULTS
          </div>

          <h2
            style={{
              margin: "5px 0 4px",
              fontSize: "20px",
            }}
          >
            Banana Drying Trial Results
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Summary of recorded drying performance
          </p>
        </div>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr>
                {[
                  "Trial",
                  "Initial Weight",
                  "Final Weight",
                  "Weight Reduction",
                  "Condition",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      background: "#f8fafc",
                      borderBottom:
                        "1px solid #e5e7eb",
                      color: "#475569",
                      fontWeight: "800",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {trials.map((trial) => (
                <tr key={trial.trial}>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #f1f5f9",
                      fontWeight: "800",
                    }}
                  >
                    {trial.trial}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {trial.initial}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {trial.final}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #f1f5f9",
                      fontWeight: "800",
                    }}
                  >
                    {trial.reduction}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {trial.condition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "15px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              AVERAGE WEIGHT REDUCTION
            </div>

            <strong
              style={{
                display: "block",
                fontSize: "22px",
                marginTop: "5px",
              }}
            >
              29.33%
            </strong>
          </div>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "15px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              HIGHEST RECORDED TEMP.
            </div>

            <strong
              style={{
                display: "block",
                fontSize: "22px",
                marginTop: "5px",
              }}
            >
              39.01°C
            </strong>
          </div>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "15px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              SYSTEM FUNCTIONALITY
            </div>

            <strong
              style={{
                display: "block",
                fontSize: "22px",
                marginTop: "5px",
              }}
            >
              92.59%
            </strong>
          </div>
        </div>
      </section>
    );
  };

  // ===================================================
  // TEMPERATURE MONITORING
  // ===================================================

  const TemperatureMonitoring = () => (
    <section
      style={{
        ...cardStyle,
        padding: "24px",
      }}
    >
      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: "#64748b",
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
          }}
        >
          LIVE MONITORING
        </div>

        <h2
          style={{
            margin: "5px 0 4px",
            fontSize: "20px",
          }}
        >
          Reactor Chamber Temperature
        </h2>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          Temperature history received from Firebase
        </p>
      </div>

      <div
        style={{
          width: "100%",
          overflow: "hidden",
        }}
      >
        <HighestTemperatureChart
          history={historyItems}
        />
      </div>
    </section>
  );

  // ===================================================
  // DASHBOARD
  // ===================================================

  const Dashboard = () => (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="SINAG-ANI IoT Solar Fruit Drying System"
      />

      {/* TOP CARDS */}

      <div
        className="dashboard-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <SensorCard
          title="REACTOR CHAMBER TEMPERATURE"
          value={reactorTemperature}
          unit="°C"
          icon="🌡️"
          smallText="Live sensor reading"
        />

        <SensorCard
          title="HUMIDITY"
          value={humidity}
          unit="%"
          icon="💧"
          smallText="Relative humidity"
        />

        <SensorCard
          title="DEVICE STATUS"
          value={
            deviceOnline
              ? "ONLINE"
              : "OFFLINE"
          }
          icon={
            deviceOnline
              ? "●"
              : "○"
          }
          smallText={
            firebaseConnected
              ? "System connected"
              : "Waiting for connection"
          }
        />
      </div>

      {/* SECOND ROW */}

      <div
        className="dashboard-secondary-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <HighestTemperatureDisplay />

        <OperationCard />
      </div>

      {/* TIMELINE */}

      <DryingTimeline />

      {/* CHART */}

      <TemperatureMonitoring />

      <div style={{ height: "24px" }} />

      {/* CONTROLS */}

      <ControlPanel />

      <div style={{ height: "24px" }} />

      {/* FLOWCHART */}

      <SystemFlowchart />

      {/* TRIAL RESULTS */}

      <TrialResults />
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

      <div style={{ height: "24px" }} />

      <DryingTimeline />

      <OperationCard />
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

      <div
        className="dashboard-secondary-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <HighestTemperatureDisplay />
        <OperationCard />
      </div>

      <TemperatureMonitoring />

      <div style={{ height: "24px" }} />

      <DryingTimeline />
    </>
  );

  // ===================================================
  // FLOWCHART PAGE
  // ===================================================

  const FlowchartPage = () => (
    <>
      <PageHeader
        title="System Flow"
        subtitle="SINAG-ANI system operation and process flow"
      />

      <SystemFlowchart />

      <DryingTimeline />
    </>
  );

  // ===================================================
  // RESULTS PAGE
  // ===================================================

  const ResultsPage = () => (
    <>
      <PageHeader
        title="Results"
        subtitle="SINAG-ANI experimental trial results"
      />

      <TrialResults />

      <TemperatureMonitoring />
    </>
  );

  // ===================================================
  // SETTINGS PAGE
  // ===================================================

  const Settings = () => (
    <>
      <PageHeader
        title="Settings"
        subtitle="SINAG-ANI device and system information"
      />

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            DEVICE INFORMATION
          </div>

          <h2
            style={{
              margin: "5px 0 0",
              fontSize: "20px",
            }}
          >
            System Information
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <StatusItem
            title="DEVICE ID"
            value="device001"
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
            title="FIREBASE"
            value={
              firebaseConnected
                ? "CONNECTED"
                : "DISCONNECTED"
            }
          />

          <StatusItem
            title="CURRENT MODE"
            value={mode}
          />

          <StatusItem
            title="CURRENT STAGE"
            value={stage}
          />

          <StatusItem
            title="MAIN FAN"
            value={`${Number(mainFan) || 0}%`}
          />
        </div>
      </section>

      <section
        style={{
          ...cardStyle,
          padding: "24px",
        }}
      >
        <div
          style={{
            color: "#64748b",
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
          }}
        >
          PROJECT
        </div>

        <h2
          style={{
            margin: "5px 0 10px",
          }}
        >
          SINAG-ANI
        </h2>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.7,
            fontSize: "13px",
            marginBottom: 0,
          }}
        >
          An IoT-based solar fruit drying system
          designed to monitor drying conditions and
          provide automatic and manual control of the
          drying process.
        </p>
      </section>
    </>
  );

  // ===================================================
  // PAGE ROUTING
  // ===================================================

  const renderPage = () => {
    if (activePage === "Control") {
      return <ControlPage />;
    }

    if (activePage === "Monitoring") {
      return <Monitoring />;
    }

    if (activePage === "Flowchart") {
      return <FlowchartPage />;
    }

    if (activePage === "Results") {
      return <ResultsPage />;
    }

    if (activePage === "Settings") {
      return <Settings />;
    }

    return <Dashboard />;
  };

  // ===================================================
  // NAVIGATION ITEM
  // ===================================================

  const NavItem = ({
    name,
    icon,
  }) => (
    <button
      type="button"
      onClick={() =>
        setActivePage(name)
      }
      style={{
        width: "100%",
        border: "0",
        borderRadius: "10px",
        padding: "11px 12px",
        marginBottom: "4px",
        background:
          activePage === name
            ? "#1f2937"
            : "transparent",
        color:
          activePage === name
            ? "#ffffff"
            : "#9ca3af",
        textAlign: "left",
        fontWeight:
          activePage === name
            ? "800"
            : "600",
        fontSize: "12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "0.2s",
      }}
    >
      <span
        style={{
          width: "22px",
          textAlign: "center",
          fontSize: "14px",
        }}
      >
        {icon}
      </span>

      {name}
    </button>
  );

  // ===================================================
  // LAST UPDATE TEXT
  // ===================================================

  const lastUpdateText = useMemo(() => {
    if (!lastUpdate) {
      return "Waiting for data";
    }

    return lastUpdate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  }, [lastUpdate]);

  // ===================================================
  // MAIN LAYOUT
  // ===================================================

  return (
    <div style={pageStyle}>
      {/* RESPONSIVE STYLE */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        button {
          font-family: inherit;
        }

        button:not(:disabled):hover {
          filter: brightness(0.97);
          transform: translateY(-1px);
        }

        button:active {
          transform: translateY(0);
        }

        @media (max-width: 1000px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr !important;
          }

          .dashboard-secondary-grid {
            grid-template-columns: 1fr !important;
          }

          .control-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .sinag-sidebar {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
          }

          .sinag-layout {
            flex-direction: column !important;
          }

          .sinag-main {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 18px !important;
          }

          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }

          .dashboard-secondary-grid {
            grid-template-columns: 1fr !important;
          }

          .stage-timeline {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .stage-timeline {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        className="sinag-layout"
        style={{
          display: "flex",
          minHeight: "100vh",
        }}
      >
        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          className="sinag-sidebar"
          style={{
            width: "190px",
            background: "#111827",
            color: "#ffffff",
            padding: "18px 12px",
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 20,
          }}
        >
          {/* LOGO */}

          <div
            style={{
              padding:
                "4px 10px 20px",
              borderBottom:
                "1px solid #1f2937",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                fontWeight: "900",
                fontSize: "16px",
                letterSpacing:
                  "0.5px",
              }}
            >
              SINAG-ANI
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: "10px",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              IoT Solar Fruit
              <br />
              Drying System
            </div>
          </div>

          {/* NAVIGATION */}

          <div
            style={{
              fontSize: "9px",
              fontWeight: "800",
              color: "#6b7280",
              letterSpacing: "1px",
              padding:
                "0 10px 8px",
            }}
          >
            MAIN MENU
          </div>

          <NavItem
            name="Dashboard"
            icon="▦"
          />

          <NavItem
            name="Control"
            icon="⚙"
          />

          <NavItem
            name="Monitoring"
            icon="◉"
          />

          <NavItem
            name="Flowchart"
            icon="⇢"
          />

          <NavItem
            name="Results"
            icon="▤"
          />

          <div
            style={{
              fontSize: "9px",
              fontWeight: "800",
              color: "#6b7280",
              letterSpacing: "1px",
              padding:
                "20px 10px 8px",
            }}
          >
            SYSTEM
          </div>

          <NavItem
            name="Settings"
            icon="☷"
          />

          {/* SIDEBAR FOOTER */}

          <div
            style={{
              position: "absolute",
              left: "12px",
              right: "12px",
              bottom: "18px",
              borderTop:
                "1px solid #1f2937",
              padding:
                "13px 10px 0",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              DEVICE
            </div>

            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              device001
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "7px",
                fontSize: "10px",
                color: deviceOnline
                  ? "#86efac"
                  : "#9ca3af",
              }}
            >
              <span>●</span>

              {deviceOnline
                ? "Device Online"
                : "Device Offline"}
            </div>
          </div>
        </aside>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main
          className="sinag-main"
          style={{
            marginLeft: "190px",
            width: "calc(100% - 190px)",
            padding: "28px",
            minHeight: "100vh",
          }}
        >
          {/* PAGE CONTENT */}

          {renderPage()}

          {/* FOOTER */}

          <footer
            style={{
              marginTop: "35px",
              paddingTop: "18px",
              borderTop:
                "1px solid #e5e7eb",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              color: "#94a3b8",
              fontSize: "10px",
            }}
          >
            <div>
              SINAG-ANI IoT Solar Fruit Drying System
            </div>

            <div>
              Last data update:{" "}
              <strong
                style={{
                  color: "#64748b",
                }}
              >
                {lastUpdateText}
              </strong>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
