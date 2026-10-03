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
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [deviceData, setDeviceData] =
    useState({});

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  const [sendingCommand, setSendingCommand] =
    useState(false);

  const [commandMessage, setCommandMessage] =
    useState("");


  // ===================================================
  // FIREBASE
  // ===================================================

  useEffect(() => {
    let unsubscribeDatabase = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {

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


          console.log(
            "Firebase authenticated."
          );


          setFirebaseConnected(true);


          const deviceRef =
            ref(
              database,
              DEVICE_PATH
            );


          unsubscribeDatabase =
            onValue(
              deviceRef,
              (snapshot) => {

                const data =
                  snapshot.val();


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


  // ===================================================
  // FIREBASE DATA
  // ===================================================

  const sensors =
    deviceData?.sensors || {};

  const status =
    deviceData?.status || {};

  const control =
    deviceData?.control || {};


  // ===================================================
  // SENSOR DATA
  // ===================================================

  const reactorTemperature =
    sensors?.temp1 ?? "--";

  const humidity =
    sensors?.humidity ?? "--";


  // ===================================================
  // DEVICE ONLINE / OFFLINE
  // ===================================================

  const lastSeen =
    Number(status?.lastSeen) || 0;


  const heartbeatIsFresh =
    lastSeen > 0 &&
    Date.now() - lastSeen < 25000;


  const deviceOnline =
    status?.online === true &&
    heartbeatIsFresh;


  // ===================================================
  // DEVICE STATUS
  // ===================================================

  const mode =
    status?.mode ??
    "OFF";


  const stage =
    status?.stage ??
    "OFF";


  const stageRemaining =
    Number(
      status?.stageRemainingSeconds
    ) || 0;


  const totalRemaining =
    Number(
      status?.totalRemainingSeconds
    ) || 0;


  const totalElapsed =
    Number(
      status?.totalElapsedSeconds
    ) || 0;


  // ===================================================
  // MAIN FAN
  // ===================================================

  /*
    ESP32 PWM:

    255 = 100%
    191 = 75%
    128 = 50%
    0   = 0%
  */

  const pwm =
    Number(
      status?.pwm
    ) || 0;


  const mainFan =
    Math.round(
      Math.max(
        0,
        Math.min(
          255,
          pwm
        )
      ) / 255 * 100
    );


  // ===================================================
  // COOL-AIR FAN
  // ===================================================

  const coolFan =
    status?.coolFan === true;


  // ===================================================
  // FORMAT TIME
  // ===================================================

  const formatTime = (
    seconds
  ) => {

    const value =
      Math.max(
        0,
        Math.floor(
          Number(seconds) || 0
        )
      );


    const hours =
      Math.floor(
        value / 3600
      );


    const minutes =
      Math.floor(
        (value % 3600) / 60
      );


    const secs =
      value % 60;


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

  const sendCommand = async (
    command
  ) => {

    try {

      setSendingCommand(true);

      setCommandMessage(
        `Sending ${command}...`
      );


      const commandRef =
        ref(
          database,
          `${DEVICE_PATH}/control/mode`
        );


      await set(
        commandRef,
        command
      );


      console.log(
        "Firebase command sent:",
        command
      );


      setCommandMessage(
        `Command "${command}" sent successfully.`
      );


      setTimeout(() => {
        setCommandMessage("");
      }, 2500);


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
            background:
              firebaseConnected
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


  // ===================================================
  // SENSOR CARD
  // ===================================================

  const SensorCard = ({
    title,
    value,
    unit,
  }) => (

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

        <strong
          style={{
            fontSize: "28px",
          }}
        >
          {value}
        </strong>


        <span
          style={{
            color: "#6b7280",
          }}
        >
          {unit}
        </span>

      </div>

    </div>

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


      <strong>
        {value}
      </strong>

    </div>

  );


  // ===================================================
  // DRYING STATUS
  // ===================================================

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


          <h2
            style={{
              margin: "5px 0 0",
            }}
          >
            Drying Status
          </h2>

        </div>


        <div
          style={{
            padding: "7px 12px",
            borderRadius: "20px",
            background:
              deviceOnline
                ? "#dcfce7"
                : "#f3f4f6",
            color:
              deviceOnline
                ? "#166534"
                : "#6b7280",
            fontSize: "11px",
            fontWeight: "800",
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
          gap: "12px",
        }}
      >

        <StatusItem
          title="Mode"
          value={mode}
        />


        <StatusItem
          title="Stage"
          value={stage}
        />


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
          value={
            coolFan
              ? "ON"
              : "OFF"
          }
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


  // ===================================================
  // CONTROL BUTTON
  // ===================================================

  const ControlButton = ({
    children,
    background,
    command,
  }) => (

    <button
      disabled={sendingCommand}
      onClick={() =>
        sendCommand(command)
      }
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
        opacity: sendingCommand
          ? 0.6
          : 1,
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
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
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
            color: "#6b7280",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          SYSTEM CONTROL
        </div>


        <h2
          style={{
            margin: "5px 0 0",
          }}
        >
          Drying Controls
        </h2>

      </div>


      {/* =============================================
          AUTOMATIC MODE
      ============================================= */}

      <div
        style={{
          marginBottom: "28px",
        }}
      >

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


      {/* =============================================
          MANUAL MODE
      ============================================= */}

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
            command="MODERATE-HIGH"
            background="#eab308"
          >
            MODERATE-HIGH
          </ControlButton>


          <ControlButton
            command="MODERATE"
            background="#84cc16"
          >
            MODERATE
          </ControlButton>


          <ControlButton
            command="STOP"
            background="#dc2626"
          >
            ■ STOP
          </ControlButton>

        </div>

      </div>


      {/* =============================================
          COMMAND MESSAGE
      ============================================= */}

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


      {/* =============================================
          SENSOR CARDS
      ============================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "15px",
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
          value={
            deviceOnline
              ? "ONLINE"
              : "OFFLINE"
          }
          unit=""
        />

      </div>


      <DryingStatus />


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

    </>

  );


  // ===================================================
  // MONITORING PAGE
  // ===================================================

  const Monitoring = () => (

    <>

      <PageHeader
        title="Monitoring"
        subtitle="Real-time sensor monitoring"
      />


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "15px",
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
          value={
            deviceOnline
              ? "ONLINE"
              : "OFFLINE"
          }
          unit=""
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


      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
          maxWidth: "700px",
        }}
      >

        <Setting
          title="Device ID"
          value="device001"
        />


        <Setting
          title="Firebase"
          value={
            firebaseConnected
              ? "Connected"
              : "Disconnected"
          }
        />


        <Setting
          title="Device"
          value={
            deviceOnline
              ? "Online"
              : "Offline"
          }
        />


        <Setting
          title="Reactor Chamber Temperature"
          value={`${reactorTemperature} °C`}
        />


        <Setting
          title="Database"
          value="Realtime Database"
        />

      </section>

    </>

  );


  // ===================================================
  // SETTING
  // ===================================================

  const Setting = ({
    title,
    value,
  }) => (

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom:
          "1px solid #e5e7eb",
      }}
    >

      <span
        style={{
          color: "#6b7280",
        }}
      >
        {title}
      </span>


      <strong>
        {value}
      </strong>

    </div>

  );


  // ===================================================
  // PAGE ROUTER
  // ===================================================

  const renderPage = () => {

    switch (activePage) {

      case "Control":
        return <ControlPage />;

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
  // WEBSITE
  // ===================================================

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        color: "#17202a",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >

      {/* =============================================
          SIDEBAR
      ============================================= */}

      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          background: "#111827",
          color: "#ffffff",
          padding: "20px",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >

        <div
          style={{
            marginBottom: "35px",
          }}
        >

          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            SINAG-ANI
          </h2>


          <span
            style={{
              color: "#9ca3af",
              fontSize: "12px",
            }}
          >
            IoT Solar Dryer
          </span>

        </div>


        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
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
              onClick={() =>
                setActivePage(page)
              }
              style={{
                border: "0",
                borderRadius: "9px",
                padding: "13px",
                textAlign: "left",
                cursor: "pointer",
                background:
                  activePage === page
                    ? "#ffffff"
                    : "transparent",

                color:
                  activePage === page
                    ? "#111827"
                    : "#9ca3af",

                fontWeight:
                  activePage === page
                    ? "700"
                    : "500",
              }}
            >
              {page}
            </button>

          ))}

        </nav>


        <div
          style={{
            position: "absolute",
            bottom: "25px",
            left: "20px",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >

          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              marginRight: "7px",
              background:
                deviceOnline
                  ? "#22c55e"
                  : "#9ca3af",
            }}
          />


          {deviceOnline
            ? "Device Online"
            : "Device Offline"}

        </div>

      </aside>


      {/* =============================================
          MAIN CONTENT
      ============================================= */}

      <main
        style={{
          marginLeft: "240px",
          minHeight: "100vh",
        }}
      >

        <header
          style={{
            height: "65px",
            background: "#ffffff",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            padding: "0 25px",
          }}
        >

          <strong>
            {activePage}
          </strong>


          <div
            style={{
              marginLeft: "auto",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            device001
          </div>

        </header>


        <main
          style={{
            padding: "30px",
            maxWidth: "1500px",
            margin: "0 auto",
          }}
        >

          {renderPage()}

        </main>

      </main>

    </div>

  );

}

export default App;
