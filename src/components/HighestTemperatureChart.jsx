import React from "react";

function HighestTemperatureChart({ history }) {
  // =====================================================
  // PREPARE TEMP1 HISTORY
  // =====================================================

  const historyData = Object.entries(history || {})
    .map(([key, item]) => {

      if (!item || typeof item !== "object") {
        return null;
      }

      const temperature =
        Number(item.temp1);

      if (!Number.isFinite(temperature)) {
        return null;
      }

      const timestamp =
        Number(item.timestamp) ||
        Number(key) ||
        Date.now();

      return {
        timestamp,
        temperature,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp
    );


  // =====================================================
  // NO DATA
  // =====================================================

  if (historyData.length === 0) {
    return (
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
            color: "#6b7280",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          TEMPERATURE MONITORING
        </div>

        <h2
          style={{
            margin: "5px 0 20px",
          }}
        >
          Reactor Chamber Temperature
        </h2>

        <div
          style={{
            height: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          No temperature history available.
        </div>

      </section>
    );
  }


  // =====================================================
  // CHART DIMENSIONS
  // =====================================================

  const width = 900;
  const height = 300;

  const paddingLeft = 60;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 50;


  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;


  // =====================================================
  // TEMPERATURE RANGE
  // =====================================================

  const temperatures =
    historyData.map(
      (item) =>
        item.temperature
    );


  let minTemp =
    Math.floor(
      Math.min(...temperatures)
    ) - 2;


  let maxTemp =
    Math.ceil(
      Math.max(...temperatures)
    ) + 2;


  if (minTemp === maxTemp) {
    minTemp -= 5;
    maxTemp += 5;
  }


  // =====================================================
  // POINTS
  // =====================================================

  const points =
    historyData.map(
      (item, index) => {

        const x =
          historyData.length === 1
            ? paddingLeft +
              chartWidth / 2
            : paddingLeft +
              (
                index /
                (historyData.length - 1)
              ) *
              chartWidth;


        const normalized =
          (
            item.temperature -
            minTemp
          ) /
          (
            maxTemp -
            minTemp
          );


        const y =
          paddingTop +
          chartHeight -
          normalized *
          chartHeight;


        return {
          ...item,
          x,
          y,
        };
      }
    );


  // =====================================================
  // SVG LINE
  // =====================================================

  const linePoints =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");


  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    timestamp
  ) => {

    const date =
      new Date(timestamp);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "--";
    }


    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  // =====================================================
  // Y AXIS
  // =====================================================

  const ySteps = 5;


  const yLabels =
    Array.from(
      {
        length:
          ySteps + 1,
      },
      (_, index) => {

        const value =
          minTemp +
          (
            (maxTemp - minTemp) /
            ySteps
          ) *
          index;


        const y =
          paddingTop +
          chartHeight -
          (
            index /
            ySteps
          ) *
          chartHeight;


        return {
          value,
          y,
        };

      }
    );


  // =====================================================
  // X AXIS LABELS
  // =====================================================

  const xLabelCount =
    Math.min(
      6,
      historyData.length
    );


  const xIndexes =
    historyData.length <= 6
      ? historyData.map(
          (_, index) => index
        )
      : Array.from(
          {
            length:
              xLabelCount,
          },
          (_, index) =>
            Math.round(
              index *
              (
                (historyData.length - 1) /
                (xLabelCount - 1)
              )
            )
        );


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: "20px",
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
          TEMPERATURE MONITORING
        </div>


        <h2
          style={{
            margin: "5px 0 0",
          }}
        >
          Reactor Chamber Temperature
        </h2>

      </div>


      {/* CHART */}

      <div
        style={{
          width: "100%",
          overflowX: "auto",
        }}
      >

        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="300"
          style={{
            display: "block",
            minWidth: "650px",
          }}
        >

          {/* =========================================
              HORIZONTAL GRID
          ========================================= */}

          {yLabels.map(
            (label, index) => (

              <g key={index}>

                <line
                  x1={paddingLeft}
                  y1={label.y}
                  x2={
                    width -
                    paddingRight
                  }
                  y2={label.y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />


                <text
                  x={
                    paddingLeft - 10
                  }
                  y={
                    label.y + 4
                  }
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {label.value.toFixed(0)}°C
                </text>

              </g>

            )
          )}


          {/* =========================================
              AXIS
          ========================================= */}

          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={
              height -
              paddingBottom
            }
            stroke="#9ca3af"
          />


          <line
            x1={paddingLeft}
            y1={
              height -
              paddingBottom
            }
            x2={
              width -
              paddingRight
            }
            y2={
              height -
              paddingBottom
            }
            stroke="#9ca3af"
          />


          {/* =========================================
              TEMPERATURE LINE
          ========================================= */}

          {points.length > 1 && (

            <polyline
              points={linePoints}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          )}


          {/* =========================================
              DATA POINTS
          ========================================= */}

          {points.map(
            (point, index) => (

              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#ffffff"
                stroke="#f59e0b"
                strokeWidth="2"
              />

            )
          )}


          {/* =========================================
              X AXIS LABELS
          ========================================= */}

          {xIndexes.map(
            (dataIndex) => {

              const point =
                points[dataIndex];


              return (

                <text
                  key={dataIndex}
                  x={point.x}
                  y={
                    height -
                    paddingBottom +
                    25
                  }
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {formatTime(
                    point.timestamp
                  )}
                </text>

              );

            }
          )}


          {/* =========================================
              Y AXIS TITLE
          ========================================= */}

          <text
            x="15"
            y={
              height / 2
            }
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
            transform={`rotate(-90 15 ${
              height / 2
            })`}
          >
            Temperature (°C)
          </text>


          {/* =========================================
              X AXIS TITLE
          ========================================= */}

          <text
            x={
              width / 2
            }
            y={
              height - 5
            }
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
          >
            Time
          </text>

        </svg>

      </div>

    </section>

  );

}

export default HighestTemperatureChart;
