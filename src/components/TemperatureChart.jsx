import {

Line

}

from "react-chartjs-2";


import {

Chart as ChartJS,

CategoryScale,

LinearScale,

PointElement,

LineElement

}

from "chart.js";


ChartJS.register(

CategoryScale,

LinearScale,

PointElement,

LineElement

);



function TemperatureChart({
data
}){


const chartData={


labels:data.map(
(x)=>x.time
),


datasets:[

{

label:"Temperature °C",

data:data.map(
(x)=>x.temp
)

}

]


};



return(

<div className="chart">


<h2>
Temperature History
</h2>


<Line
data={chartData}
/>


</div>

)


}


export default TemperatureChart;