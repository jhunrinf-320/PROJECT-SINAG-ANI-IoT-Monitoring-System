import React from "react";

function HighestTemperatureChart({ history }) {
  const records = Object.entries(history || {}).filter(
    ([, value]) => value && typeof value === "object"
  );

  let highestTemp1 = null;
  let highestTemp2 = null;

  records.forEach(([, value]) => {
    const temp1 = Number(value.temp1);
    const temp2 = Number(value.temp2);

    if (Number.isFinite(temp1)) {
      if (highestTemp1 === null || temp1 > highestTemp1) {
        highestTemp1 = temp1;
      }
    }

    if (Number.isFinite(temp2)) {
      if (highestTemp2 === null || temp2 > highestTemp2) {
        highestTemp2 = temp2;
      }
    }
  });

  let overallHighest = null;

  if (highestTemp1 !== null && highestTemp2 !== null) {
    overallHighest = Math.max(highestTemp1, highestTemp2);
  } else if (highestTemp1 !== null) {
    overallHighest = highestTemp1;
  } else if (highestTemp2 !== null) {
    overallHighest = highestTemp2;
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "24px",
        marginTop: "24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "700",
          color: "#6b7280",
          letterSpacing: "1px",
        }}
      >
        TEMPERATURE MONITORING
      </div>

      <h2 style={{ margin: "6px 0" }}>
        Highest Temperature Recorded
      </h2>

      <p
        style={{
          color: "#6b7280",
          fontSize: "13px",
          marginBottom: "20px",
        }}
      >
        Highest temperatures recorded by Temperature
        Sensor 1 and Temperature Sensor 2.
      </p>

      {/* TEMPERATURE CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* TEMP 1 */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#6b7280",
            }}
          >
            TEMP 1 HIGHEST
          </div>

          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              marginTop: "6px",
            }}
          >
            {highestTemp1 === null
              ? "No data"
              : `${highestTemp1.toFixed(2)} °C`}
          </div>
        </div>

        {/* TEMP 2 */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#6b7280",
            }}
          >
            TEMP 2 HIGHEST
          </div>

          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              marginTop: "6px",
            }}
          >
            {highestTemp2 === null
              ? "No data"
              : `${highestTemp2.toFixed(2)} °C`}
          </div>
        </div>

        {/* OVERALL */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#6b7280",
            }}
          >
            OVERALL HIGHEST
          </div>

          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              marginTop: "6px",
            }}
          >
            {overallHighest === null
              ? "No data"
              : `${overallHighest.toFixed(2)} °C`}
          </div>
        </div>
      </div>

      {/* RECORDS */}
      <div
        style={{
          marginTop: "20px",
        }}
      >
        {records.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            No temperature history available yet.
          </p>
        ) : (
          records.map(([id, value]) => {
            const temp1 = Number(value.temp1);
            const temp2 = Number(value.temp2);

            const validTemp1 = Number.isFinite(temp1);
            const validTemp2 = Number.isFinite(temp2);

            if (!validTemp1 && !validTemp2) {
              return null;
            }

            return (
              <div
                key={id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr 1fr",
                  gap: "10px",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom:
                    "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              >
                <span
                  style={{
                    color: "#6b7280",
                  }}
                >
                  {String(id).slice(-12)}
                </span>

                <span>
                  Temp 1:{" "}
                  {validTemp1
                    ? `${temp1.toFixed(2)} °C`
                    : "N/A"}
                </span>

                <span>
                  Temp 2:{" "}
                  {validTemp2
                    ? `${temp2.toFixed(2)} °C`
                    : "N/A"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HighestTemperatureChart;
