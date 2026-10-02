import React, { useEffect, useState, useRef } from "react";

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

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  const [sendingCommand, setSendingCommand] =
    useState(false);

  const [commandMessage, setCommandMessage] =
    useState("");


  // ===================================================
  // TIMER STATE
  // ===================================================

  /*
    SINAG-ANI DRYING TIME

    INITIAL = 1 hour
    MAIN    = 2 hours
    FINAL   = 2 hours

    TOTAL   = 5 hours
  */

  const INITIAL_TIME = 60 * 60;
  const MAIN_TIME = 2 * 60 * 60;
  const FINAL_TIME = 2 * 60 * 60;

  const TOTAL_TIME =
    INITIAL_TIME +
    MAIN_TIME +
    FINAL_TIME;


  const [localStageRemaining, setLocalStageRemaining] =
    useState(0);

  const [localTotalRemaining, setLocalTotalRemaining] =
    useState(0);

  const [localTotalElapsed, setLocalTotalElapsed] =
    useState(0);

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [timerInitialized, setTimerInitialized] =
    useState(false);


  /*
    These refs store the actual timestamp.

    Using Date.now() instead of simply subtracting
    1 every second prevents the timer from getting
    badly affected by browser delays.
  */

  const timerEndTimeRef = useRef(null);

  const stageEndTimeRef = useRef(null);

  const lastTickRef = useRef(null);


  // ===================================================
  // FIREBASE
  // ===================================================

  useEffect(() => {
    let unsubscribeDatabase = null;

    const unsubscribeAuth = onAuthStateChanged(
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

        console.log("Firebase authenticated.");

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


  // ===================================================
  // SENSOR / DEVICE DATA
  // ===================================================

  const sensors = deviceData?.sensors || {};
  const control = deviceData?.control || {};

  const temperature1 = sensors?.temp1 ?? "--";
  const temperature2 = sensors?.temp2 ?? "--";
  const humidity = sensors?.humidity ?? "--";

  const deviceOnline =
    sensors?.online === true ||
    deviceData?.online === true;

  const mode =
    sensors?.mode ??
    control?.mode ??
    "OFF";

  const stage =
    sensors?.stage ??
    "OFF";


  // ===================================================
  // TIMER DISPLAY VALUES
  // ===================================================

  /*
    Before the website timer starts, use Firebase's
    existing values.

    Once AUTO is pressed, use the local timer.
  */

  const firebaseStageRemaining =
    sensors?.stageRemainingSeconds ??
    control?.stageRemainingSeconds ??
    0;

  const firebaseTotalRemaining =
    sensors?.totalRemainingSeconds ??
    control?.totalRemainingSeconds ??
    0;

  const firebaseTotalElapsed =
    sensors?.totalElapsedSeconds ??
    control?.totalElapsedSeconds ??
    0;


  const stageRemaining =
    timerInitialized
      ? localStageRemaining
      : firebaseStageRemaining;


  const totalRemaining =
    timerInitialized
      ? localTotalRemaining
      : firebaseTotalRemaining;


  const totalElapsed =
    timerInitialized
      ? localTotalElapsed
      : firebaseTotalElapsed;


  const mainFan =
    sensors?.pwm ??
    sensors?.mainFan ??
    control?.pwm ??
    0;

  const coolFan =
    sensors?.coolFan === true ||
   
