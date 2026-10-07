import React, { useEffect, useMemo, useState } from "react";
import HighestTemperatureChart from "./components/HighestTemperatureChart";

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  update,
  set,
} from "firebase/database";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

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
const RESULTS_PATH = `${DEVICE_PATH}/researchResults`;

/* =========================================================
   DRYING TIMES
========================================================= */

const INITIAL_TIME = 60 * 60;
const MAIN_TIME = 2 * 60 * 60;
const FINAL_TIME = 2 * 60 * 60;
const TOTAL_TIME = INITIAL_TIME + MAIN_TIME + FINAL_TIME;

/* =========================================================
   DEFAULT RESEARCH RESULTS
========================================================= */

const DEFAULT_RESULTS = {
  trials: [
    {
      trial: "Trial 1",
      fruit: "Banana",
      initialWeight: 100,
      finalWeight: 68,
      initialHumidity: 78,
      finalHumidity: 58,
      highestTemperature: 38.11,
      finalTemperature: 36.12,
      dryingTime: 5,
      weather: "Sunny",
      observation:
        "The system operated successfully under sunny conditions and achieved noticeable weight reduction.",
      stages: {
        initial: {
          startingWeight: 100,
          endingWeight: 83,
          humidity: 51.11,
          highestTemperature: 37,
          finalTemperature: 36,
          fanPower: 100,
          observation: "Initial moisture was reduced during high fan operation.",
        },
        main: {
          startingWeight: 83,
          endingWeight: 76,
          humidity: 50.98,
          highestTemperature: 38,
          finalTemperature: 35,
          fanPower: 75,
          observation: "The sample continued to lose moisture under moderate-high airflow.",
        },
        final: {
          startingWeight: 76,
          endingWeight: 69,
          humidity: 49.11,
          highestTemperature: 39,
          finalTemperature: 36,
          fanPower: 50,
          observation: "Final drying further reduced the sample weight.",
        },
      },
    },
    {
      trial: "Trial 2",
      fruit: "Banana",
      initialWeight: 100,
      finalWeight: 69,
      initialHumidity: "",
      finalHumidity: "",
      highestTemperature: "",
      finalTemperature: "",
      dryingTime: 5,
      weather: "Sunny",
      observation:
        "The system completed the drying cycle and produced a consistent reduction in sample weight.",
      stages: {
        initial: {
          startingWeight: "",
          endingWeight: "",
          humidity: "",
          highestTemperature: "",
          finalTemperature: "",
          fanPower: 100,
          observation: "",
        },
        main: {
          startingWeight: "",
          endingWeight: "",
          humidity: "",
          highestTemperature: "",
          finalTemperature: "",
          fanPower: 75,
          observation: "",
        },
        final: {
          startingWeight: "",
          endingWeight: "",
          humidity: "",
          highestTemperature: "",
          finalTemperature: "",
          fanPower: 50,
          observation: "",
        },
      },
    },
    {
      trial: "Trial 3",
      fruit: "Banana",
      initialWeight: 100,
      finalWeight: 75,
      initialHumidity: "",
      finalHumidity: "",
      highestTemperature: "",
      finalTemperature: "",
      dryingTime: 5,
      weather: "Cloudy/Rainy",
      observation:
        "Cloudy and rainy conditions were observed, which may have contributed to lower drying performance.",
      stages: {
        initial: {
          startingWeight: "",
          endingWeight: "",
          humidity: "",
          highestTemperature: "",
          finalTemperature: "",
          fanPower: 100,
          observation: "",
        },
        main: {
          startingWeight: "",
          endingWeight: "",
          humidity: "",
          highestTemperature: "",
          finalTemperature: "",
          fanPower: 75,
          observation: "",
        },
        final: {
          startingWeight: "",
          endingWeight: "",
          humidity: "",
          highestTemperature: "",
          finalTemperature: "",
          fanPower: 50,
          observation: "",
        },
      },
    },
  ],

  functionality: [
    {
      trial: "Trial 1",
      functional: 7,
      notFunctional: 2,
    },
    {
      trial: "Trial 2",
      functional: 9,
      notFunctional: 0,
    },
    {
      trial: "Trial 3",
      functional: 9,
      notFunctional: 0,
    },
  ],

  monitoring: {
    temperature: "Functional",
    humidity: "Functional",
    deviceStatus: "Functional",
    webDashboard: "Functional",
    firebaseSynchronization: "Functional",
  },

  notes:
    "The system demonstrated successful monitoring and drying operation. Environmental conditions affected the drying performance.",
};

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const calculateWeightReduction = (initial, final) => {
  const start = toNumber(initial);
  const end = toNumber(final);

  if (start === null || end === null || start === 0) {
    return null;
  }

  return ((start - end) / start) * 100;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  return `${Number(value).toFixed(2)}%`;
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  return number.toFixed(decimals);
};

/* =========================================================
   APP
========================================================= */

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [deviceData, setDeviceData] = useState({});

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  const [sendingCommand, setSendingCommand] =
    useState(false);

  const [commandMessage, setCommandMessage] =
    useState("");

  /* =======================================================
     TIMER
  ======================================================= */

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [timerInitialized, setTimerInitialized] =
    useState(false);

  const [localTimerElapsed, setLocalTimerElapsed] =
    useState(0);

  /* =======================================================
     RESEARCH RESULTS
  ======================================================= */

  const [researchResults, setResearchResults] =
    useState(DEFAULT_RESULTS);

  const [editingResults, setEditingResults] =
    useState(false);

  const [savingResults, setSavingResults] =
    useState(false);

  const [resultsMessage, setResultsMessage] =
    useState("");

  const [resultsLastUpdated, setResultsLastUpdated] =
    useState("");

  /* =======================================================
     FIREBASE DEVICE CONNECTION
  ======================================================= */

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

  /* =======================================================
     FIREBASE RESEARCH RESULTS
  ======================================================= */

  useEffect(() => {
    let unsubscribeResults = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) return;

        const resultsRef = ref(
          database,
          RESULTS_PATH
        );

        unsubscribeResults = onValue(
          resultsRef,
          (snapshot) => {
            const data = snapshot.val();

            if (data) {
              setResearchResults((previous) => ({
                ...previous,
                ...data,
                trials:
                  data.trials ??
                  previous.trials,
                functionality:
                  data.functionality ??
                  previous.functionality,
                monitoring:
                  data.monitoring ??
                  previous.monitoring,
                notes:
                  data.notes ??
                  previous.notes,
              }));

              if (data.lastUpdated) {
                setResultsLastUpdated(
                  data.lastUpdated
                );
              }
            }
          },
          (error) => {
            console.error(
              "Research results error:",
              error
            );
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeResults) {
        unsubscribeResults();
      }
    };
  }, []);

  /* =======================================================
     LOCAL TIMER
  ======================================================= */

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setLocalTimerElapsed((previous) =>
        Math.min(
          previous + 1,
          TOTAL_TIME
        )
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
  }, [
    timerRunning,
    localTimerElapsed,
  ]);

  /* =======================================================
     DEVICE DATA
  ======================================================= */

  const sensors = deviceData?.sensors || {};
  const control = deviceData?.control || {};
  const status = deviceData?.status || {};

  const reactorTemperature =
    sensors?.storageChamberTemperature ??
    sensors?.reactorChamberTemperature ??
    sensors?.temp1 ??
    "--";

  const humidity =
    sensors?.humidity ?? "--";

  const history =
    deviceData?.history || {};

  const historyItems = Array.isArray(history)
    ? history
    : Object.values(history);

  const historyTemperatures =
    historyItems
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

  /* =======================================================
     LOCAL STAGE TIMER
  ======================================================= */

  let localStageRemaining = 0;

  if (
    localTimerElapsed <
    INITIAL_TIME
  ) {
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
    localTimerElapsed <
    TOTAL_TIME
  ) {
    localStageRemaining =
      TOTAL_TIME -
      localTimerElapsed;
  }

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

  const mainFan =
    sensors?.pwm ??
    sensors?.mainFan ??
    status?.pwm ??
    control?.pwm ??
    0;

  /* =======================================================
     TIME FORMAT
  ======================================================= */

  const formatTime = (seconds) => {
    const value = Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );

    const hours =
      Math.floor(value / 3600);

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

  /* =======================================================
     TIMER COMMANDS
  ======================================================= */

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

  /* =======================================================
     SEND COMMAND
  ======================================================= */

  const sendCommand = async (command) => {
    try {
      setSendingCommand(true);

      setCommandMessage(
        `Sending ${command}...`
      );

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
        case "PAUSE":
        case "RESUME":
          pwmValue = Number(
            control?.pwm ?? 0
          );
          break;

        default:
          pwmValue = 0;
      }

      const controlRef = ref(
        database,
        `${DEVICE_PATH}/control`
      );

      await update(
        controlRef,
        {
          mode: command,
          pwm: pwmValue,
        }
      );

      handleTimerCommand(command);

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
        `Failed to send ${command}.`
      );
    } finally {
      setSendingCommand(false);
    }
  };

  /* =======================================================
     RESEARCH RESULT CALCULATIONS
  ======================================================= */

  const calculatedTrialResults = useMemo(() => {
    return researchResults.trials.map(
      (trial) => ({
        ...trial,
        weightReduction:
          calculateWeightReduction(
            trial.initialWeight,
            trial.finalWeight
          ),
      })
    );
  }, [researchResults.trials]);

  const weightReductions =
    calculatedTrialResults
      .map(
        (trial) =>
          trial.weightReduction
      )
      .filter(
        (value) =>
          value !== null
      );

  const averageWeightReduction =
    weightReductions.length > 0
      ? weightReductions.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        weightReductions.length
      : null;

  const highestTrialTemperatures =
    calculatedTrialResults
      .map((trial) =>
        toNumber(
          trial.highestTemperature
        )
      )
      .filter(
        (value) =>
          value !== null
      );

  const maximumTrialTemperature =
    highestTrialTemperatures.length > 0
      ? Math.max(
          ...highestTrialTemperatures
        )
      : null;

  const averageHighestTemperature =
    highestTrialTemperatures.length > 0
      ? highestTrialTemperatures.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        highestTrialTemperatures.length
      : null;

  const finalWeights =
    calculatedTrialResults
      .map((trial) =>
        toNumber(
          trial.finalWeight
        )
      )
      .filter(
        (value) =>
          value !== null
      );

  const averageFinalWeight =
    finalWeights.length > 0
      ? finalWeights.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        finalWeights.length
      : null;

  const totalDryingTime =
    calculatedTrialResults
      .map((trial) =>
        toNumber(
          trial.dryingTime
        )
      )
      .filter(
        (value) =>
          value !== null
      );

  const averageDryingTime =
    totalDryingTime.length > 0
      ? totalDryingTime.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        totalDryingTime.length
      : null;

  const functionalitySummary =
    researchResults.functionality.reduce(
      (summary, item) => {
        summary.functional +=
          Number(
            item.functional
          ) || 0;

        summary.notFunctional +=
          Number(
            item.notFunctional
          ) || 0;

        return summary;
      },
      {
        functional: 0,
        notFunctional: 0,
      }
    );

  const totalFunctionality =
    functionalitySummary.functional +
    functionalitySummary.notFunctional;

  const overallFunctionality =
    totalFunctionality > 0
      ? (functionalitySummary.functional /
          totalFunctionality) *
        100
      : null;

  /* =======================================================
     EDIT RESEARCH DATA
  ======================================================= */

  const startEditingResults = () => {
    setEditingResults(true);
    setResultsMessage("");
  };

  const cancelEditingResults = () => {
    setEditingResults(false);
    setResultsMessage("");
  };

  const updateTrialField = (
    trialIndex,
    field,
    value
  ) => {
    setResearchResults(
      (previous) => {
        const trials = [
          ...previous.trials,
        ];

        trials[trialIndex] = {
          ...trials[trialIndex],
          [field]: value,
        };

        return {
          ...previous,
          trials,
        };
      }
    );
  };

  const updateStageField = (
    trialIndex,
    stageName,
    field,
    value
  ) => {
    setResearchResults(
      (previous) => {
        const trials = [
          ...previous.trials,
        ];

        trials[trialIndex] = {
          ...trials[trialIndex],
          stages: {
            ...trials[trialIndex].stages,
            [stageName]: {
              ...trials[trialIndex].stages[
                stageName
              ],
              [field]: value,
            },
          },
        };

        return {
          ...previous,
          trials,
        };
      }
    );
  };

  const updateFunctionalityField = (
    index,
    field,
    value
  ) => {
    setResearchResults(
      (previous) => {
        const functionality = [
          ...previous.functionality,
        ];

        functionality[index] = {
          ...functionality[index],
          [field]: value,
        };

        return {
          ...previous,
          functionality,
        };
      }
    );
  };

  const updateMonitoringField = (
    field,
    value
  ) => {
    setResearchResults(
      (previous) => ({
        ...previous,
        monitoring: {
          ...previous.monitoring,
          [field]: value,
        },
      })
    );
  };

  const saveResearchResults = async () => {
    try {
      setSavingResults(true);
      setResultsMessage(
        "Saving research results..."
      );

      const payload = {
        ...researchResults,
        lastUpdated:
          new Date().toISOString(),
      };

      await set(
        ref(
          database,
          RESULTS_PATH
        ),
        payload
      );

      setResultsLastUpdated(
        payload.lastUpdated
      );

      setResearchResults(payload);

      setEditingResults(false);

      setResultsMessage(
        "Research results saved successfully."
      );

      setTimeout(() => {
        setResultsMessage("");
      }, 3000);

    } catch (error) {
      console.error(
        "Research result save error:",
        error
      );

      setResultsMessage(
        "Unable to save results. Check Firebase database permissions."
      );
    } finally {
      setSavingResults(false);
    }
  };

  /* =======================================================
     CARD STYLE
  ======================================================= */

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.05)",
  };

  /* =======================================================
     COMMON INPUT STYLE
  ======================================================= */

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 11px",
    borderRadius: "9px",
    border: "1px solid #dbe3ec",
    background: "#ffffff",
    color: "#111827",
    fontSize: "12px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "10px",
    fontWeight: "800",
    color: "#64748b",
    marginBottom: "5px",
  };

  /* =======================================================
     HEADER
  ======================================================= */

  const Header = () => (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background:
          "rgba(255,255,255,0.97)",
        backdropFilter:
          "blur(10px)",
        borderBottom:
          "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "auto",
          padding: "14px 24px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
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
            IoT Solar Fruit Drying System
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            "Dashboard",
            "Control",
            "Monitoring",
            "Results",
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
                padding: "9px 12px",
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

  /* =======================================================
     PAGE HEADER
  ======================================================= */

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
          margin: "5px 0 0",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );

  /* =======================================================
     SENSOR CARD
  ======================================================= */

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
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#64748b",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              marginTop: "12px",
            }}
          >
            <strong
              style={{
                fontSize: "30px",
                color: "#111827",
              }}
            >
              {value}
            </strong>

            <span
              style={{
                color: "#64748b",
                fontSize: "15px",
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
            borderRadius: "12px",
            background: "#f1f5f9",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "21px",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  /* =======================================================
     STATUS ITEM
  ======================================================= */

  const StatusItem = ({
    title,
    value,
  }) => (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: "12px",
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "#64748b",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "14px",
          color: "#111827",
        }}
      >
        {value}
      </strong>
    </div>
  );

  /* =======================================================
     HIGHEST TEMPERATURE
  ======================================================= */

  const HighestTemperatureDisplay =
    () => (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#64748b",
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
                  ? highestTemperature.toFixed(
                      1
                    )
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
              fontSize: "40px",
            }}
          >
            🌡️
          </div>
        </div>
      </section>
    );

  /* =======================================================
     OPERATION CARD
  ======================================================= */

  const OperationCard = () => (
    <section
      style={{
        ...cardStyle,
        padding: "24px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "18px",
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
            background:
              deviceOnline
                ? "#dcfce7"
                : "#f1f5f9",
            color:
              deviceOnline
                ? "#166534"
                : "#64748b",
            fontSize: "10px",
            fontWeight: "900",
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
          value={`${Number(
            mainFan
          ) || 0}%`}
        />
      </div>
    </section>
  );

  /* =======================================================
     DRYING STAGE TIMELINE
  ======================================================= */

  const StageTimeline = () => {
    const currentStage =
      String(stage).toUpperCase();

    const stages = [
      {
        name: "INITIAL",
        time: "1 hour",
        power: "100%",
      },
      {
        name: "MAIN",
        time: "2 hours",
        power: "75%",
      },
      {
        name: "FINAL",
        time: "2 hours",
        power: "50%",
      },
    ];

    return (
      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
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
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Multi-Stage Drying Timeline
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          {stages.map(
            (item, index) => {
              const active =
                currentStage.includes(
                  item.name
                );

              return (
                <div
                  key={item.name}
                  style={{
                    border: active
                      ? "2px solid #111827"
                      : "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    background:
                      active
                        ? "#f1f5f9"
                        : "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "900",
                      color: "#64748b",
                    }}
                  >
                    STAGE {index + 1}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "17px",
                      fontWeight: "900",
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {item.time} • Fan {item.power}
                  </div>

                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "10px",
                      fontWeight: "800",
                      color: active
                        ? "#111827"
                        : "#94a3b8",
                    }}
                  >
                    {active
                      ? "● CURRENT STAGE"
                      : "○ PENDING / COMPLETE"}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>
    );
  };

  /* =======================================================
     CONTROL BUTTON
  ======================================================= */

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
        borderRadius: "12px",
        minHeight: "58px",
        padding: "12px",
        background,
        color: "#ffffff",
        fontWeight: "800",
        fontSize: "12px",
        cursor:
          sendingCommand
            ? "not-allowed"
            : "pointer",
        opacity:
          sendingCommand
            ? 0.6
            : 1,
      }}
    >
      {children}
    </button>
  );

  /* =======================================================
     CONTROL PANEL
  ======================================================= */

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
          }}
        >
          Drying Controls
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "15px",
            padding: "18px",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
            }}
          >
            Automatic Mode
          </h3>

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

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "15px",
            padding: "18px",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
            }}
          >
            Manual Mode
          </h3>

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
            >
              HIGH • 100%
            </ControlButton>

            <ControlButton
              command="MODERATE"
              background="#eab308"
            >
              MODERATE • 75%
            </ControlButton>

            <ControlButton
              command="LOW"
              background="#84cc16"
            >
              LOW • 50%
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
            padding: "12px 14px",
            borderRadius: "10px",
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

  /* =======================================================
     TEMPERATURE CHART
  ======================================================= */

  const TemperatureChart = () => (
    <section
      style={{
        ...cardStyle,
        padding: "24px",
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
        TEMPERATURE MONITORING
      </div>

      <h2
        style={{
          margin: "5px 0 18px",
          fontSize: "20px",
        }}
      >
        Reactor Chamber Temperature
      </h2>

      <HighestTemperatureChart
        history={historyItems}
      />
    </section>
  );

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const Dashboard = () => (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time SINAG-ANI system monitoring and drying status"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <SensorCard
          icon="🌡️"
          title="REACTOR CHAMBER TEMPERATURE"
          value={reactorTemperature}
          unit="°C"
        />

        <SensorCard
          icon="💧"
          title="HUMIDITY"
          value={humidity}
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
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 0.8fr) minmax(0, 1.2fr)",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <HighestTemperatureDisplay />
        <OperationCard />
      </div>

      <StageTimeline />

      <div
        style={{
          marginBottom: "14px",
        }}
      >
        <TemperatureChart />
      </div>

      <ControlPanel />
    </>
  );

  /* =======================================================
     CONTROL PAGE
  ======================================================= */

  const ControlPage = () => (
    <>
      <PageHeader
        title="Control"
        subtitle="Control the SINAG-ANI drying operation"
      />

      <ControlPanel />

      <div
        style={{
          marginTop: "14px",
        }}
      >
        <StageTimeline />
        <OperationCard />
      </div>
    </>
  );

  /* =======================================================
     MONITORING PAGE
  ======================================================= */

  const Monitoring = () => (
    <>
      <PageHeader
        title="Monitoring"
        subtitle="Monitor reactor temperature, humidity, drying stage, and system status"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <HighestTemperatureDisplay />

        <section
          style={{
            ...cardStyle,
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#64748b",
              letterSpacing: "1px",
            }}
          >
            LIVE SENSOR DATA
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <StatusItem
              title="REACTOR TEMP"
              value={`${reactorTemperature} °C`}
            />

            <StatusItem
              title="HUMIDITY"
              value={`${humidity} %`}
            />

            <StatusItem
              title="MODE"
              value={mode}
            />

            <StatusItem
              title="STAGE"
              value={stage}
            />

            <StatusItem
              title="FAN POWER"
              value={`${Number(
                mainFan
              ) || 0}%`}
            />

            <StatusItem
              title="DEVICE"
              value={
                deviceOnline
                  ? "ONLINE"
                  : "OFFLINE"
              }
            />
          </div>
        </section>
      </div>

      <StageTimeline />

      <TemperatureChart />
    </>
  );

  /* =======================================================
     RESULTS INPUT
  ======================================================= */

  const ResultInput = ({
    label,
    value,
    onChange,
    type = "text",
    disabled = false,
  }) => (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        value={
          value === null ||
          value === undefined
            ? ""
            : value
        }
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={{
          ...inputStyle,
          background: disabled
            ? "#f8fafc"
            : "#ffffff",
        }}
      />
    </div>
  );

  /* =======================================================
     SUMMARY CARD
  ======================================================= */

  const ResultSummaryCard = ({
    title,
    value,
    subtitle,
  }) => (
    <div
      style={{
        ...cardStyle,
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "800",
          letterSpacing: "0.8px",
          color: "#64748b",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "900",
          marginTop: "9px",
          color: "#111827",
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            marginTop: "4px",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );

  /* =======================================================
     RESULTS PAGE
  ======================================================= */

  const ResultsPage = () => (
    <>
      <PageHeader
        title="Research Results"
        subtitle="Editable SINAG-ANI experimental results, functionality testing, and monitoring performance"
      />

      {/* =================================================
          RESULT TOOLBAR
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "18px 20px",
          marginBottom: "14px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#64748b",
              letterSpacing: "0.8px",
            }}
          >
            RESEARCH DATA
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#475569",
              marginTop: "4px",
            }}
          >
            {resultsLastUpdated
              ? `Last updated: ${new Date(
                  resultsLastUpdated
                ).toLocaleString()}`
              : "No saved update time"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {!editingResults ? (
            <button
              type="button"
              onClick={
                startEditingResults
              }
              style={{
                border: 0,
                borderRadius: "10px",
                padding:
                  "11px 16px",
                background:
                  "#111827",
                color: "#ffffff",
                fontWeight: "800",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ✎ EDIT RESULTS
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={
                  saveResearchResults
                }
                disabled={savingResults}
                style={{
                  border: 0,
                  borderRadius: "10px",
                  padding:
                    "11px 16px",
                  background:
                    "#16a34a",
                  color: "#ffffff",
                  fontWeight: "800",
                  cursor:
                    savingResults
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "12px",
                  opacity:
                    savingResults
                      ? 0.6
                      : 1,
                }}
              >
                {savingResults
                  ? "SAVING..."
                  : "✓ SAVE RESULTS"}
              </button>

              <button
                type="button"
                onClick={
                  cancelEditingResults
                }
                style={{
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding:
                    "11px 16px",
                  background:
                    "#ffffff",
                  color: "#475569",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                CANCEL
              </button>
            </>
          )}
        </div>
      </section>

      {resultsMessage && (
        <div
          style={{
            marginBottom: "14px",
            padding: "13px 15px",
            borderRadius: "12px",
            background:
              resultsMessage.includes(
                "successfully"
              )
                ? "#dcfce7"
                : "#f1f5f9",
            color:
              resultsMessage.includes(
                "successfully"
              )
                ? "#166534"
                : "#475569",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {resultsMessage}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <ResultSummaryCard
          title="AVERAGE WEIGHT REDUCTION"
          value={formatPercentage(
            averageWeightReduction
          )}
          subtitle="Trials 1–3"
        />

        <ResultSummaryCard
          title="HIGHEST RECORDED TEMP"
          value={
            maximumTrialTemperature !== null
              ? `${maximumTrialTemperature.toFixed(
                  2
                )}°C`
              : "--"
          }
          subtitle="Research trials"
        />

        <ResultSummaryCard
          title="AVERAGE HIGHEST TEMP"
          value={
            averageHighestTemperature !== null
              ? `${averageHighestTemperature.toFixed(
                  2
                )}°C`
              : "--"
          }
          subtitle="Research trials"
        />

        <ResultSummaryCard
          title="AVERAGE FINAL WEIGHT"
          value={
            averageFinalWeight !== null
              ? `${averageFinalWeight.toFixed(
                  2
                )} g`
              : "--"
          }
          subtitle="After drying"
        />

        <ResultSummaryCard
          title="OVERALL FUNCTIONALITY"
          value={formatPercentage(
            overallFunctionality
          )}
          subtitle="System testing"
        />
      </div>

      {/* =================================================
          TRIAL RESULTS
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
          overflowX: "auto",
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
          EXPERIMENTAL DATA
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Trial Results
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            minWidth: "1050px",
          }}
        >
          <thead>
            <tr>
              {[
                "Trial",
                "Fruit",
                "Initial Weight",
                "Final Weight",
                "Weight Reduction",
                "Initial Humidity",
                "Final Humidity",
                "Highest Temp",
                "Final Temp",
                "Drying Time",
                "Weather",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "10px",
                    background:
                      "#f8fafc",
                    borderBottom:
                      "1px solid #e2e8f0",
                    fontSize: "10px",
                    color: "#64748b",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {calculatedTrialResults.map(
              (trial, index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom:
                        "1px solid #f1f5f9",
                      fontWeight: "800",
                      fontSize: "12px",
                    }}
                  >
                    {trial.trial}
                  </td>

                  <td
                    style={{
                      padding: "10px",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {editingResults ? (
                      <input
                        style={inputStyle}
                        value={
                          trial.fruit
                        }
                        onChange={(e) =>
                          updateTrialField(
                            index,
                            "fruit",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      trial.fruit
                    )}
                  </td>

                  {[
                    [
                      "initialWeight",
                      "number",
                    ],
                    [
                      "finalWeight",
                      "number",
                    ],
                  ].map(
                    ([field, type]) => (
                      <td
                        key={field}
                        style={{
                          padding: "10px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {editingResults ? (
                          <input
                            type={type}
                            style={{
                              ...inputStyle,
                              minWidth:
                                "90px",
                            }}
                            value={
                              trial[
                                field
                              ] ?? ""
                            }
                            onChange={(e) =>
                              updateTrialField(
                                index,
                                field,
                                e.target
                                  .value
                              )
                            }
                          />
                        ) : (
                          `${trial[field] ?? "--"} g`
                        )}
                      </td>
                    )
                  )}

                  <td
                    style={{
                      padding: "10px",
                      borderBottom:
                        "1px solid #f1f5f9",
                      fontWeight: "900",
                      color: "#111827",
                    }}
                  >
                    {formatPercentage(
                      trial.weightReduction
                    )}
                  </td>

                  {[
                    "initialHumidity",
                    "finalHumidity",
                    "highestTemperature",
                    "finalTemperature",
                    "dryingTime",
                  ].map(
                    (field) => (
                      <td
                        key={field}
                        style={{
                          padding: "10px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {editingResults ? (
                          <input
                            type="number"
                            step="0.01"
                            style={{
                              ...inputStyle,
                              minWidth:
                                "85px",
                            }}
                            value={
                              trial[
                                field
                              ] ?? ""
                            }
                            onChange={(e) =>
                              updateTrialField(
                                index,
                                field,
                                e.target
                                  .value
                              )
                            }
                          />
                        ) : (
                          field ===
                          "dryingTime"
                            ? `${trial[field] ?? "--"} h`
                            : `${trial[field] ?? "--"}`
                        )}
                      </td>
                    )
                  )}

                  <td
                    style={{
                      padding: "10px",
                      borderBottom:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {editingResults ? (
                      <select
                        value={
                          trial.weather ??
                          ""
                        }
                        onChange={(e) =>
                          updateTrialField(
                            index,
                            "weather",
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="Sunny">
                          Sunny
                        </option>
                        <option value="Cloudy">
                          Cloudy
                        </option>
                        <option value="Rainy">
                          Rainy
                        </option>
                        <option value="Cloudy/Rainy">
                          Cloudy/Rainy
                        </option>
                      </select>
                    ) : (
                      trial.weather ||
                      "--"
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </section>

      {/* =================================================
          OBSERVATIONS
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
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
          TRIAL OBSERVATIONS
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Observations
        </h2>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {researchResults.trials.map(
            (trial, index) => (
              <div
                key={index}
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "900",
                    marginBottom: "7px",
                  }}
                >
                  {trial.trial}
                </div>

                {editingResults ? (
                  <textarea
                    value={
                      trial.observation ||
                      ""
                    }
                    onChange={(e) =>
                      updateTrialField(
                        index,
                        "observation",
                        e.target.value
                      )
                    }
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: "12px",
                      lineHeight: 1.6,
                      color: "#475569",
                    }}
                  >
                    {trial.observation ||
                      "No observation recorded."}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* =================================================
          STAGE RESULTS
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
          overflowX: "auto",
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
          STAGE-BY-STAGE RESULTS
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Drying Stage Data
        </h2>

        {researchResults.trials.map(
          (trial, trialIndex) => (
            <div
              key={trialIndex}
              style={{
                marginBottom: "22px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  margin:
                    "0 0 10px",
                }}
              >
                {trial.trial} —{" "}
                {trial.fruit}
              </h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: "850px",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Stage",
                      "Starting Weight",
                      "Ending Weight",
                      "Humidity",
                      "Highest Temp",
                      "Final Temp",
                      "Fan Power",
                      "Observation",
                    ].map(
                      (header) => (
                        <th
                          key={header}
                          style={{
                            padding: "9px",
                            textAlign:
                              "left",
                            background:
                              "#f8fafc",
                            fontSize:
                              "10px",
                            color:
                              "#64748b",
                            borderBottom:
                              "1px solid #e2e8f0",
                          }}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {[
                    [
                      "initial",
                      "Initial",
                    ],
                    [
                      "main",
                      "Main",
                    ],
                    [
                      "final",
                      "Final",
                    ],
                  ].map(
                    ([stageName, stageLabel]) => {
                      const stageData =
                        trial.stages?.[
                          stageName
                        ] || {};

                      return (
                        <tr
                          key={stageName}
                        >
                          <td
                            style={{
                              padding:
                                "9px",
                              fontWeight:
                                "800",
                              fontSize:
                                "11px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {stageLabel}
                          </td>

                          {[
                            "startingWeight",
                            "endingWeight",
                            "humidity",
                            "highestTemperature",
                            "finalTemperature",
                            "fanPower",
                          ].map(
                            (field) => (
                              <td
                                key={field}
                                style={{
                                  padding:
                                    "9px",
                                  borderBottom:
                                    "1px solid #f1f5f9",
                                }}
                              >
                                {editingResults ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={
                                      stageData[
                                        field
                                      ] ?? ""
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateStageField(
                                        trialIndex,
                                        stageName,
                                        field,
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                    style={{
                                      ...inputStyle,
                                      minWidth:
                                        "80px",
                                    }}
                                  />
                                ) : (
                                  stageData[
                                    field
                                  ] ??
                                  "--"
                                )}
                              </td>
                            )
                          )}

                          <td
                            style={{
                              padding:
                                "9px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              minWidth:
                                "220px",
                            }}
                          >
                            {editingResults ? (
                              <textarea
                                rows={2}
                                value={
                                  stageData.observation ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateStageField(
                                    trialIndex,
                                    stageName,
                                    "observation",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                style={{
                                  ...inputStyle,
                                  resize:
                                    "vertical",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize:
                                    "11px",
                                  color:
                                    "#475569",
                                }}
                              >
                                {stageData.observation ||
                                  "--"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>

      {/* =================================================
          FUNCTIONALITY TEST
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
          overflowX: "auto",
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
          SYSTEM FUNCTIONALITY
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Functionality Test
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr>
              {[
                "Trial",
                "Functional",
                "Not Functional",
                "Functionality Rate",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "10px",
                    background:
                      "#f8fafc",
                    borderBottom:
                      "1px solid #e2e8f0",
                    fontSize: "10px",
                    color: "#64748b",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {researchResults.functionality.map(
              (item, index) => {
                const total =
                  (Number(
                    item.functional
                  ) || 0) +
                  (Number(
                    item.notFunctional
                  ) || 0);

                const rate =
                  total > 0
                    ? (Number(
                        item.functional
                      ) /
                        total) *
                      100
                    : null;

                return (
                  <tr key={index}>
                    <td
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #f1f5f9",
                        fontWeight: "800",
                      }}
                    >
                      {item.trial}
                    </td>

                    {[
                      "functional",
                      "notFunctional",
                    ].map(
                      (field) => (
                        <td
                          key={field}
                          style={{
                            padding: "10px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          {editingResults ? (
                            <input
                              type="number"
                              min="0"
                              style={{
                                ...inputStyle,
                                maxWidth:
                                  "110px",
                              }}
                              value={
                                item[
                                  field
                                ] ?? ""
                              }
                              onChange={(e) =>
                                updateFunctionalityField(
                                  index,
                                  field,
                                  e
                                    .target
                                    .value
                                )
                              }
                            />
                          ) : (
                            item[field]
                          )}
                        </td>
                      )
                    )}

                    <td
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #f1f5f9",
                        fontWeight: "900",
                      }}
                    >
                      {formatPercentage(
                        rate
                      )}
                    </td>
                  </tr>
                );
              }
            )}

            <tr>
              <td
                style={{
                  padding: "12px 10px",
                  fontWeight: "900",
                }}
              >
                OVERALL
              </td>

              <td
                style={{
                  padding: "12px 10px",
                  fontWeight: "900",
                }}
              >
                {
                  functionalitySummary.functional
                }
              </td>

              <td
                style={{
                  padding: "12px 10px",
                  fontWeight: "900",
                }}
              >
                {
                  functionalitySummary.notFunctional
                }
              </td>

              <td
                style={{
                  padding: "12px 10px",
                  fontWeight: "900",
                }}
              >
                {formatPercentage(
                  overallFunctionality
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* =================================================
          MONITORING CAPABILITY
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
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
          MONITORING CAPABILITY
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          IoT Monitoring Functions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          {[
            [
              "temperature",
              "Temperature Monitoring",
            ],
            [
              "humidity",
              "Humidity Monitoring",
            ],
            [
              "deviceStatus",
              "Device Status Monitoring",
            ],
            [
              "webDashboard",
              "Web Dashboard",
            ],
            [
              "firebaseSynchronization",
              "Firebase Data Synchronization",
            ],
          ].map(
            ([field, label]) => (
              <div
                key={field}
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "12px",
                  padding: "14px",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  {label}
                </span>

                {editingResults ? (
                  <select
                    value={
                      researchResults
                        .monitoring[
                        field
                      ] || ""
                    }
                    onChange={(e) =>
                      updateMonitoringField(
                        field,
                        e.target
                          .value
                      )
                    }
                    style={{
                      ...inputStyle,
                      width: "145px",
                    }}
                  >
                    <option value="Functional">
                      Functional
                    </option>

                    <option value="Not Functional">
                      Not Functional
                    </option>
                  </select>
                ) : (
                  <strong
                    style={{
                      fontSize: "11px",
                      color:
                        researchResults
                          .monitoring[
                          field
                        ] ===
                        "Functional"
                          ? "#15803d"
                          : "#dc2626",
                    }}
                  >
                    {researchResults
                      .monitoring[
                      field
                    ] || "--"}
                  </strong>
                )}
              </div>
            )
          )}
        </div>

        <div
          style={{
            marginTop: "14px",
            padding: "16px",
            borderRadius: "12px",
            background: "#ecfdf5",
            color: "#166534",
            fontSize: "13px",
            fontWeight: "900",
          }}
        >
          Overall Monitoring Capability: 100%
        </div>
      </section>

      {/* =================================================
          RESEARCH NOTES
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
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
          RESEARCH NOTES
        </div>

        <h2
          style={{
            margin: "5px 0 15px",
            fontSize: "20px",
          }}
        >
          Overall Notes
        </h2>

        {editingResults ? (
          <textarea
            rows={5}
            value={
              researchResults.notes ||
              ""
            }
            onChange={(e) =>
              setResearchResults(
                (previous) => ({
                  ...previous,
                  notes: e.target
                    .value,
                })
              )
            }
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        ) : (
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "12px",
              color: "#475569",
              fontSize: "12px",
              lineHeight: 1.7,
            }}
          >
            {researchResults.notes ||
              "No research notes recorded."}
          </div>
        )}
      </section>

      {/* =================================================
          RESULT CHARTS
      ================================================= */}

      <section
        style={{
          ...cardStyle,
          padding: "24px",
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
          RESULTS OVERVIEW
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Trial Comparison
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          {/* WEIGHT REDUCTION CHART */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#64748b",
                marginBottom: "15px",
              }}
            >
              WEIGHT REDUCTION
            </div>

            {calculatedTrialResults.map(
              (trial, index) => {
                const value =
                  trial.weightReduction ||
                  0;

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: "5px",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      <span>
                        {trial.trial}
                      </span>

                      <span>
                        {formatPercentage(
                          trial.weightReduction
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        height: "10px",
                        borderRadius:
                          "999px",
                        background:
                          "#e2e8f0",
                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            Math.max(
                              value,
                              0
                            ),
                            100
                          )}%`,
                          height: "100%",
                          background:
                            "#111827",
                          borderRadius:
                            "999px",
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* TEMPERATURE CHART */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#64748b",
                marginBottom: "15px",
              }}
            >
              HIGHEST TEMPERATURE
            </div>

            {calculatedTrialResults.map(
              (trial, index) => {
                const value =
                  toNumber(
                    trial.highestTemperature
                  );

                const percent =
                  value !== null
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          (value /
                            50) *
                            100
                        )
                      )
                    : 0;

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: "5px",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      <span>
                        {trial.trial}
                      </span>

                      <span>
                        {value !== null
                          ? `${value.toFixed(
                              2
                            )}°C`
                          : "--"}
                      </span>
                    </div>

                    <div
                      style={{
                        height: "10px",
                        borderRadius:
                          "999px",
                        background:
                          "#e2e8f0",
                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background:
                            "#475569",
                          borderRadius:
                            "999px",
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>
    </>
  );

  /* =======================================================
     SETTINGS
  ======================================================= */

  const Settings = () => (
    <>
      <PageHeader
        title="Settings"
        subtitle="SINAG-ANI device information and system configuration"
      />

      <section
        style={{
          ...cardStyle,
          padding: "24px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
            color: "#64748b",
            marginBottom: "18px",
          }}
        >
          DEVICE INFORMATION
        </div>

        <div
          style={{
            display: "grid",
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
            value={mode}
          />

          <StatusItem
            title="CURRENT STAGE"
            value={stage}
          />

          <StatusItem
            title="PWM"
            value={`${Number(
              mainFan
            ) || 0}%`}
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
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
            color: "#64748b",
          }}
        >
          SYSTEM CONFIGURATION
        </div>

        <h2
          style={{
            margin: "5px 0 18px",
            fontSize: "20px",
          }}
        >
          Drying Parameters
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <StatusItem
            title="INITIAL STAGE"
            value="1 hour • 100%"
          />

          <StatusItem
            title="MAIN STAGE"
            value="2 hours • 75%"
          />

          <StatusItem
            title="FINAL STAGE"
            value="2 hours • 50%"
          />

          <StatusItem
            title="TOTAL DRYING TIME"
            value="5 hours"
          />

          <StatusItem
            title="TEMPERATURE SENSOR"
            value="DS18B20"
          />

          <StatusItem
            title="HUMIDITY SENSOR"
            value="DHT11"
          />
        </div>
      </section>
    </>
  );

  /* =======================================================
     PAGE ROUTER
  ======================================================= */

  const renderPage = () => {
    if (
      activePage === "Control"
    ) {
      return <ControlPage />;
    }

    if (
      activePage === "Monitoring"
    ) {
      return <Monitoring />;
    }

    if (
      activePage === "Results"
    ) {
      return <ResultsPage />;
    }

    if (
      activePage === "Settings"
    ) {
      return <Settings />;
    }

    return <Dashboard />;
  };

  /* =======================================================
     RESPONSIVE STYLE
  ======================================================= */

  const responsiveStyle = `
    @media (max-width: 900px) {
      .sinag-grid-3 {
        grid-template-columns: 1fr !important;
      }

      .sinag-grid-2 {
        grid-template-columns: 1fr !important;
      }

      .sinag-grid-5 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 600px) {
      .sinag-main {
        padding: 20px 12px 40px !important;
      }

      .sinag-grid-5 {
        grid-template-columns: 1fr !important;
      }

      h1 {
        font-size: 25px !important;
      }
    }
  `;

  /* =======================================================
     MAIN RETURN
  ======================================================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#111827",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>
        {responsiveStyle}
      </style>

      <Header />

      <main
        className="sinag-main"
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding:
            "30px 24px 50px",
          boxSizing: "border-box",
        }}
      >
        {renderPage()}
      </main>

      <footer
        style={{
          borderTop:
            "1px solid #e5e7eb",
          background: "#ffffff",
          padding:
            "18px 24px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        SINAG-ANI IoT Solar Fruit Drying System
        {" • "}
        device001
        {" • "}
        Research Monitoring Dashboard
      </footer>
    </div>
  );
}

export default App;
