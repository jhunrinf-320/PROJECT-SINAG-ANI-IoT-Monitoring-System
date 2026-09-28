import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import Sidebar from "./components/Sidebar";
import SensorCard from "./components/SensorCard";
import StatusCard from "./components/StatusCard";
import ControlPanel from "./components/ControlPanel";
import TemperatureChart from "./components/TemperatureChart";

const firebaseConfig = {
  apiKey: "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU",
  authDomain: "sinag-ani-iot.firebaseapp.com",
  databaseURL: "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sinag-ani-iot",
  storageBucket: "sinag-ani-iot.firebasestorage.app",
  messagingSenderId: "505006165687",
  appId: "1:505006165687:web:8d930c2a846a978a41c732",
  measurementId: "G-F1YD6L3XNL"
};

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

signInAnonymously(auth).then(() => console.log("Firebase anonymous authentication successful.")).catch((error) => console.error("Firebase anonymous authentication failed:", error));

function App() {
  const [device, setDevice] = useState({});
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [firebaseOnline, setFirebaseOnline] = useState(false);

  useEffect(() => {
    let unsubscribeDevice = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFirebaseOnline(false);
        setDevice({});
        return;
      }
      setFirebaseOnline(true);
      const deviceRef = ref(database, "devices/device001");
      unsubscribeDevice = onValue(deviceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setDevice(data);
          const temp1 = data?.sensors?.temp1;
          if (typeof temp1 === "number" && Number.isFinite(temp1)) {
            setHistory((previous) => [...previous.slice(-19), { time: new Date().toLocaleTimeString(), temp: temp1 }]);
          }
        }
      }, (error) => {
        console.error("Firebase device listener error:", error);
        setFirebaseOnline(false);
      });
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeDevice) unsubscribeDevice();
    };
  }, []);

  const temp1 = device?.sensors?.temp1;
  const temp2 = device?.sensors?.temp2;
  const humidity = device?.sensors?.humidity;
  const dht11Temperature = device?.sensors?.dht11Temperature;
  const deviceOnline = device?.status?.online === true || device?.status?.online === 1 || device?.status?.online === "1";

  return (
    <div className="layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main>
        <h1>SINAG-ANI IoT Dashboard</h1>

        {activePage === "Dashboard" && <>
          <div className={deviceOnline && firebaseOnline ? "status-online" : "status-offline"}>
            ● {deviceOnline && firebaseOnline ? "DEVICE ONLINE" : "DEVICE OFFLINE"}
          </div>
          <div className="cards">
            <SensorCard title="Temperature Sensor 1" value={temp1} unit="°C" icon="🌡️" />
            <SensorCard title="Temperature Sensor 2" value={temp2} unit="°C" icon="🌡️" />
            <SensorCard title="Humidity" value={humidity} unit="%" icon="💧" />
            <SensorCard title="DHT11 Temperature" value={dht11Temperature} unit="°C" icon="🌡️" />
          </div>
          <StatusCard
            mode={device?.status?.mode}
            pwm={device?.status?.pwm}
            stage={device?.status?.stage}
            online={device?.status?.online}
            automatic={device?.status?.automatic}
            paused={device?.status?.paused}
            stageElapsedSeconds={device?.status?.stageElapsedSeconds}
            stageRemainingSeconds={device?.status?.stageRemainingSeconds}
            totalElapsedSeconds={device?.status?.totalElapsedSeconds}
            totalRemainingSeconds={device?.status?.totalRemainingSeconds}
            coolFan={device?.status?.coolFan}
          />
        </>}

        {activePage === "Monitoring" && <>
          <h2>Sensor Monitoring</h2>
          <div className="cards">
            <SensorCard title="Temperature Sensor 1" value={temp1} unit="°C" icon="🌡️" />
            <SensorCard title="Temperature Sensor 2" value={temp2} unit="°C" icon="🌡️" />
            <SensorCard title="Humidity" value={humidity} unit="%" icon="💧" />
            <SensorCard title="DHT11 Temperature" value={dht11Temperature} unit="°C" icon="🌡️" />
          </div>
          <TemperatureChart data={history} />
        </>}

        {activePage === "Control" && <>
          <h2>Drying Control</h2>
          <ControlPanel />
        </>}

        {activePage === "Settings" && <div className="settings-box">
          <h2>System Settings</h2>
          <p>Device ID: device001</p>
          <p>Firebase Connection: {firebaseOnline ? "Active" : "Disconnected"}</p>
          <p>Device Status: {deviceOnline ? "Online" : "Offline"}</p>
          <p>Controller: ESP32</p>
          <p>Database Path: devices/device001</p>
        </div>}
      </main>
    </div>
  );
}

export default App;
