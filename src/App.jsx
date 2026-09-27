import {
  useEffect,
  useState
} from "react";


import {
  ref,
  onValue
} from "firebase/database";


import {
  database
} from "./firebase/firebaseConfig";


import Sidebar from "./components/Sidebar";

import SensorCard from "./components/SensorCard";

import StatusCard from "./components/StatusCard";

import ControlPanel from "./components/ControlPanel";

import TemperatureChart from "./components/TemperatureChart";



function App(){


const [device,setDevice] = useState({});


const [history,setHistory] = useState([]);


const [activePage,setActivePage] = useState(
"Dashboard"
);



// ================================
// FIREBASE LISTENER
// ================================

useEffect(()=>{


const deviceRef = ref(
database,
"devices/device001"
);



const unsubscribe = onValue(

deviceRef,

(snapshot)=>{


const data = snapshot.val();



if(data){

setDevice(data);



if(data.sensors?.temp1){


setHistory(

(previous)=>[

...previous.slice(-9),

{

time:
new Date()
.toLocaleTimeString(),

temp:
data.sensors.temp1

}

]

);


}


}



}

);



return()=>unsubscribe();



},[]);





return(


<div className="layout">



{/* SIDEBAR */}

<Sidebar

activePage={activePage}

setActivePage={setActivePage}

/>





{/* MAIN CONTENT */}

<main>



<h1>
SINAG-ANI IoT Dashboard
</h1>





{
activePage === "Dashboard" &&

(


<>


<div className="status-online">

● DEVICE ONLINE

</div>





<div className="cards">



<SensorCard

title="Temperature Sensor 1"

value={
device?.sensors?.temp1
}

unit="°C"

icon="🌡️"

/>





<SensorCard

title="Temperature Sensor 2"

value={
device?.sensors?.temp2
}

unit="°C"

icon="🔥"

/>





<SensorCard

title="Humidity"

value={
device?.sensors?.humidity
}

unit="%"

icon="💧"

/>



</div>





<StatusCard

mode={
device?.status?.mode
}

pwm={
device?.status?.pwm
}

/>



</>

)

}








{
activePage === "Monitoring" &&

(


<>


<h2>
Sensor Monitoring
</h2>



<div className="cards">


<SensorCard

title="Temperature Sensor 1"

value={
device?.sensors?.temp1
}

unit="°C"

icon="🌡️"

/>



<SensorCard

title="Temperature Sensor 2"

value={
device?.sensors?.temp2
}

unit="°C"

icon="🔥"

/>



<SensorCard

title="Humidity"

value={
device?.sensors?.humidity
}

unit="%"

icon="💧"

/>



</div>





<TemperatureChart

data={history}

/>


</>


)

}








{
activePage === "Control" &&

(


<>


<h2>
Drying Control
</h2>


<ControlPanel/>




</>


)

}








{
activePage === "Settings" &&

(


<div className="settings-box">


<h2>
System Settings
</h2>



<p>
Device ID:
device001
</p>



<p>
Firebase Connection:
Active
</p>



<p>
Controller:
ESP32
</p>



</div>


)

}





</main>



</div>


)


}


export default App;