import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);


function TemperatureChart({
  data = [],
}) {

  const chartData = {

    labels: data.map(
      (item) => item.time
    ),

    datasets: [

      {
        label: "Temperature Sensor 1",

        data: data.map(
          (item) => item.temp1
        ),

        tension: 0.35,

        borderWidth: 2,

        pointRadius: 3,

        pointHoverRadius: 5,
      },

      {
        label: "Temperature Sensor 2",

        data: data.map(
          (item) => item.temp2
        ),

        tension: 0.35,

        borderWidth: 2,

        pointRadius: 3,

        pointHoverRadius: 5,
      },

    ],
  };


  const options = {

    responsive: true,

    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {

      legend: {
        display: true,

        position: "top",
      },

      tooltip: {
        enabled: true,
      },

    },

    scales: {

      x: {
        title: {
          display: true,
          text: "Time",
        },

        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },

      y: {

        title: {
          display: true,
          text: "Temperature (°C)",
        },

        beginAtZero: false,
      },

    },

  };


  if (!data || data.length === 0) {

    return (
      <div className="chart-empty">
        No temperature history available yet.
      </div>
    );

  }


  return (

    <div className="temperature-chart">

      <Line
        data={chartData}
        options={options}
      />

    </div>

  );
}

export default TemperatureChart;
