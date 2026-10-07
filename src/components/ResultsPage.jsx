import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";

const DEFAULT_TRIALS = [
  {
    name: "Trial 1",
    initialWeight: 100,
    finalWeight: 68,
    initialHumidity: 78,
    finalHumidity: 58,
    highestTemp: 38.11,
    finalTemp: 36.12,
    dryingTime: "5 hours",
    weather: "Sunny",
    observation: "Good drying performance."
  },
  {
    name: "Trial 2",
    initialWeight: 100,
    finalWeight: 69,
    initialHumidity: 79,
    finalHumidity: 49,
    highestTemp: 39.01,
    finalTemp: 35.12,
    dryingTime: "5 hours",
    weather: "Sunny",
    observation: "Good drying performance."
  },
  {
    name: "Trial 3",
    initialWeight: 100,
    finalWeight: 75,
    initialHumidity: 96,
    finalHumidity: 85.12,
    highestTemp: 30.11,
    finalTemp: 27.12,
    dryingTime: "5 hours",
    weather: "Cloudy/Rainy",
    observation: "Lower drying performance due to weather."
  }
];

const DEFAULT_FUNCTIONALITY = [
  { trial: "Trial 1", functional: 7, notFunctional: 2 },
  { trial: "Trial 2", functional: 9, notFunctional: 0 },
  { trial: "Trial 3", functional: 9, notFunctional: 0 }
];

export default function ResearchResults({ database }) {
  const [trials, setTrials] = useState(DEFAULT_TRIALS);
  const [functionality, setFunctionality] = useState(DEFAULT_FUNCTIONALITY);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!database) return;

    const resultsRef = ref(database, "devices/device001/researchResults");

    return onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) return;

      if (data.trials) setTrials(data.trials);
      if (data.functionality) setFunctionality(data.functionality);
      if (data.notes) setNotes(data.notes);
    });
  }, [database]);

  const calculations = useMemo(() => {
    const reductions = trials.map((t) => {
      const initial = Number(t.initialWeight) || 0;
      const final = Number(t.finalWeight) || 0;

      return initial > 0
        ? ((initial - final) / initial) * 100
        : 0;
    });

    const highestTemps = trials.map((t) => Number(t.highestTemp) || 0);
    const finalWeights = trials.map((t) => Number(t.finalWeight) || 0);

    const totalFunctional = functionality.reduce(
      (sum, t) => sum + Number(t.functional || 0),
      0
    );

    const totalNotFunctional = functionality.reduce(
      (sum, t) => sum + Number(t.notFunctional || 0),
      0
    );

    return {
      reductions,
      averageReduction:
        reductions.reduce((a, b) => a + b, 0) / reductions.length,

      highestRecordedTemp: Math.max(...highestTemps),

      averageHighestTemp:
        highestTemps.reduce((a, b) => a + b, 0) / highestTemps.length,

      averageFinalWeight:
        finalWeights.reduce((a, b) => a + b, 0) / finalWeights.length,

      overallFunctionality:
        totalFunctional + totalNotFunctional > 0
          ? (totalFunctional /
              (totalFunctional + totalNotFunctional)) *
            100
          : 0
    };
  }, [trials, functionality]);

  const updateTrial = (index, field, value) => {
    setTrials((current) =>
      current.map((trial, i) =>
        i === index ? { ...trial, [field]: value } : trial
      )
    );
    setSaved(false);
  };

  const updateFunctionality = (index, field, value) => {
    setFunctionality((current) =>
      current.map((trial, i) =>
        i === index ? { ...trial, [field]: value } : trial
      )
    );
    setSaved(false);
  };

  const saveResults = async () => {
    try {
      await set(ref(database, "devices/device001/researchResults"), {
        trials,
        functionality,
        notes,
        lastUpdated: new Date().toISOString()
      });

      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Unable to save research results.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box"
  };

  const cardStyle = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "auto" }}>
      <h1>Research Results</h1>
      <p style={{ color: "#666" }}>
        Edit the raw trial data below. Calculated results update automatically.
      </p>

      {/* TRIAL DATA */}
      <div style={cardStyle}>
        <h2>Trial Results</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Trial",
                  "Initial Weight",
                  "Final Weight",
                  "Initial Humidity",
                  "Final Humidity",
                  "Highest Temp",
                  "Final Temp",
                  "Drying Time",
                  "Weather",
                  "Weight Reduction"
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {trials.map((trial, index) => (
                <tr key={trial.name}>
                  <td style={{ padding: "8px" }}>{trial.name}</td>

                  {[
                    ["initialWeight", "number"],
                    ["finalWeight", "number"],
                    ["initialHumidity", "number"],
                    ["finalHumidity", "number"],
                    ["highestTemp", "number"],
                    ["finalTemp", "number"]
                  ].map(([field, type]) => (
                    <td key={field} style={{ padding: "8px" }}>
                      <input
                        style={inputStyle}
                        type={type}
                        value={trial[field]}
                        onChange={(e) =>
                          updateTrial(index, field, e.target.value)
                        }
                      />
                    </td>
                  ))}

                  <td style={{ padding: "8px" }}>
                    <input
                      style={inputStyle}
                      value={trial.dryingTime}
                      onChange={(e) =>
                        updateTrial(index, "dryingTime", e.target.value)
                      }
                    />
                  </td>

                  <td style={{ padding: "8px" }}>
                    <input
                      style={inputStyle}
                      value={trial.weather}
                      onChange={(e) =>
                        updateTrial(index, "weather", e.target.value)
                      }
                    />
                  </td>

                  <td style={{ padding: "8px", fontWeight: "bold" }}>
                    {calculations.reductions[index].toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUTOMATIC SUMMARY */}
      <div style={cardStyle}>
        <h2>Automatic Summary</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: "15px"
          }}
        >
          <Summary
            title="Average Weight Reduction"
            value={`${calculations.averageReduction.toFixed(2)}%`}
          />

          <Summary
            title="Highest Recorded Temperature"
            value={`${calculations.highestRecordedTemp.toFixed(2)}°C`}
          />

          <Summary
            title="Average Highest Temperature"
            value={`${calculations.averageHighestTemp.toFixed(2)}°C`}
          />

          <Summary
            title="Average Final Weight"
            value={`${calculations.averageFinalWeight.toFixed(2)} g`}
          />

          <Summary
            title="Overall Functionality"
            value={`${calculations.overallFunctionality.toFixed(2)}%`}
          />
        </div>
      </div>

      {/* FUNCTIONALITY */}
      <div style={cardStyle}>
        <h2>System Functionality</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Trial</th>
              <th>Functional</th>
              <th>Not Functional</th>
              <th>Percentage</th>
            </tr>
          </thead>

          <tbody>
            {functionality.map((trial, index) => {
              const total =
                Number(trial.functional || 0) +
                Number(trial.notFunctional || 0);

              const percentage =
                total > 0
                  ? (Number(trial.functional || 0) / total) * 100
                  : 0;

              return (
                <tr key={trial.trial}>
                  <td>{trial.trial}</td>

                  <td>
                    <input
                      style={inputStyle}
                      type="number"
                      value={trial.functional}
                      onChange={(e) =>
                        updateFunctionality(
                          index,
                          "functional",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      style={inputStyle}
                      type="number"
                      value={trial.notFunctional}
                      onChange={(e) =>
                        updateFunctionality(
                          index,
                          "notFunctional",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>{percentage.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* NOTES */}
      <div style={cardStyle}>
        <h2>Observations / Notes</h2>

        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          rows="5"
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxSizing: "border-box"
          }}
          placeholder="Enter research observations..."
        />
      </div>

      <button
        onClick={saveResults}
        style={{
          padding: "12px 24px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Save Research Results
      </button>

      {saved && (
        <span style={{ marginLeft: "12px" }}>
          ✓ Saved to Firebase
        </span>
      )}
    </div>
  );
}

function Summary({ title, value }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "10px",
        background: "#f5f7fa"
      }}
    >
      <div style={{ fontSize: "13px", color: "#666" }}>{title}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "6px" }}>
        {value}
      </div>
    </div>
  );
}
