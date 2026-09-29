import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function TemperatureChart({
  data = [],
}) {

  const labels = data.map(
    (item) => item.time
  );

  const chartData = {

    labels,

    datasets: [

      {
        label:
          "Temperature Sensor 1",

        data: data.map(
          (item) => item.temp1
        ),

        borderColor:
          "#16a34a",

        backgroundColor:
          "rgba(22, 163, 74, 0.10)",

        pointBackgroundColor:
          "#16a34a",

        pointRadius: 3,

        pointHoverRadius: 5,

        borderWidth: 2.5,

        tension: 0.3,

        spanGaps: true,
      },


      {
        label:
          "Temperature Sensor 2",

        data: data.map(
          (item) => item.temp2
        ),

        borderColor:
          "#0f766e",

        backgroundColor:
          "rgba(15, 118, 110, 0.08)",

        pointBackgroundColor:
          "#0f766e",

        pointRadius: 3,

        pointHoverRadius: 5,

        borderWidth: 2.5,

        tension: 0.3,

        spanGaps: true,
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

        position: "top",

        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,

          font: {
            size: 12,
            weight: "600",
          },
        },

      },

      tooltip: {

        callbacks: {

          label: (context) =>
            `${context.dataset.label}: ${
              context.parsed.y?.toFixed(1) ??
              "--"
            } °C`,

        },

      },

    },

    scales: {

      x: {

        title: {
          display: true,
          text: "Time",

          font: {
            weight: "600",
          },
        },

        grid: {
          display: false,
        },

        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },

      },


      y: {

        title: {
          display: true,
          text: "Temperature (°C)",

          font: {
            weight: "600",
          },
        },

        beginAtZero: false,

        suggestedMin: 20,

        suggestedMax: 45,

        grid: {
          color:
            "rgba(148, 163, 184, 0.20)",
        },

        ticks: {
          callback: (value) =>
            `${value}°`,
        },

      },

    },

  };


  return (

    <section className="chart">

      <div className="chart-header">

        <div>

          <h2>
            Temperature History
          </h2>

          <p>
            Live temperature trend from
            the two DS18B20 sensors.
          </p>

        </div>

      </div>


      <div className="chart-wrap">

        {data.length > 0 ? (

          <Line
            data={chartData}
            options={options}
          />

        ) : (

          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              fontSize: 13,
            }}
          >
            Waiting for temperature
            history from Firebase…
          </div>

        )}

      </div>

    </section>
  );
}

export default TemperatureChart;
