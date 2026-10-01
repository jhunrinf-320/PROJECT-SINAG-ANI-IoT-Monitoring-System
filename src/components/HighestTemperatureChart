import React from "react";

function HighestTemperatureChart({ history }) {
  const records = Object.entries(history || {}).filter(
    ([, value]) => value && typeof value === "object"
  );

  let highestTemperature = null;

  records.forEach(([, value]) => {
    const temp1 = Number(value.temp1);
    const temp2 = Number(value.temp2);

    if (Number.isFinite(temp1)) {
      if (highestTemperature === null || temp1 > highestTemperature) {
        highestTemperature = temp1;
      }
    }

    if (Number.isFinite(temp2)) {
      if (highestTemperature === null || temp2 > highestTemperature) {
        highestTemperature = temp2;
      }
    }
  });

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
        }}
      >
        Highest temperature recorded by Temperature
        Sensor 1 and Temperature Sensor 2.
      </p>

      <div
        style={{
          background: "#f8fafc",
          borderRadius: "10px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#6b7280",
          }}
        >
          HIGHEST RECORDED TEMPERATURE
        </div>

        <div
          style={{
            fontSize: "32px",
            fontWeight: "800",
            marginTop: "5px",
          }}
        >
          {highestTemperature === null
            ? "No data"
            : `${highestTemperature.toFixed(2)} °C`}
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        {records.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            No temperature history available yet.
          </p>
        ) : (
          records.map(([id, value]) => {
            const temp1 = Number(value.temp1);
            const temp2 = Number(value.temp2);

            const valid1 = Number.isFinite(temp1);
            const valid2 = Number.isFinite(temp2);

            if (!valid1 && !valid2) {
              return null;
            }

            const highest = Math.max(
              valid1 ? temp1 : -Infinity,
              valid2 ? temp2 : -Infinity
            );

            return (
              <div
                key={id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {String(id).slice(-12)}
                </span>

                <strong>
                  {highest.toFixed(2)} °C
                </strong>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HighestTemperatureChart;
