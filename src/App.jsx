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
// TIMER SETTINGS
// =====================================================

const INITIAL_TIME = 60 * 60;        // 1 hour
const MAIN_TIME = 2 * 60 * 60;       // 2 hours
const FINAL_TIME = 2 * 60 * 60;      // 2 hours

const TOTAL_TIME =
  INITIAL_TIME +
  MAIN_TIME +
  FINAL_TIME;


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

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [timerInitialized, setTimerInitialized] =
    useState(false);

  const [localTimerElapsed, setLocalTimerElapsed] =
    useState(0);


  // ===================================================
  //
