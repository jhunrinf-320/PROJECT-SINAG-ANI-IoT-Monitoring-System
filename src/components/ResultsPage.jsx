
import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";

const DB_PATH = "devices/device001/researchResults";

const DEFAULT_DATA = {
  manualTrials: [
    { trial: "Trial 1", reduction: 32 },
    { trial: "Trial 2", reduction: 31 },
    { trial: "Trial 3", reduction: 25 },
  ],
  automaticTrials: [
    { trial: "Trial 1", reduction: 34 },
    { trial: "Trial 2", reduction: 32 },
    { trial: "Trial 3", reduction: 30 },
  ],
  initialWeight: 100,
  highestTemperature: 39.01,
  pValue: 0.341,
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const inputStyle = {
  width: "100%",
  minWidth: "70px",
  padding: "9px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  boxSizing: "border-box",
  fontSize: "14px",
};

function average(trials) {
  if (!trials.length) return 0;

  return (
    trials.reduce(
      (sum, trial) => sum + (Number(trial.reduction) || 0),
      0
    ) / trials.length
  );
}

function EditableValue({ editing, value, onChange, type = "number" }) {
  if (!editing) return <>{value}</>;

  return (
    <input
      style={inputStyle}
      type={type}
      step={type === "number" ? "any" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function ResearchSummary({ database }) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!database) {
      setMessage("Firebase database is not connected.");
      return;
    }

    const resultsRef = ref(database, DB_PATH);

    const unsubscribe = onValue(
      resultsRef,
      (snapshot) => {
        const saved = snapshot.val();

        if (!saved) return;

        setData({
          ...DEFAULT_DATA,
          ...saved,
          manualTrials:
            saved.manualTrials ?? DEFAULT_DATA.manualTrials,
          automaticTrials:
            saved.automaticTrials ?? DEFAULT_DATA.automaticTrials,
        });

        setMessage("");
      },
      (error) => {
        console.error("Unable to load research results:", error);
        setMessage("Unable to load results. Check Firebase permissions.");
      }
    );

    return unsubscribe;
  }, [database]);

  const manualAverage = useMemo(
    () => average(data.manualTrials),
    [data.manualTrials]
  );

  const automaticAverage = useMemo(
    () => average(data.automaticTrials),
    [data.automaticTrials]
  );

  const updateTrial = (mode, index, value) => {
    setData((current) => ({
      ...current,
      [mode]: current[mode].map((trial, i) =>
        i === index ? { ...trial, reduction: value } : trial
      ),
    }));
    setMessage("");
  };

  const updateFinding = (field, value) => {
    setData((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const saveResults = async () => {
    if (!database) {
      setMessage("Cannot save: Firebase database is not connected.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await set(ref(database, DB_PATH), {
        ...data,
        lastUpdated: new Date().toISOString(),
      });

      setEditing(false);
      setMessage("Research results saved successfully.");
    } catch (error) {
      console.error("Unable to save research results:", error);
      setMessage("Save failed. Check your Firebase database rules.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setMessage("");
    // The Firebase listener restores the last saved values.
    if (database) {
      onValue(ref(database, DB_PATH), (snapshot) => {
        if (snapshot.exists()) {
          const saved = snapshot.val();
          setData({
            ...DEFAULT_DATA,
            ...saved,
            manualTrials:
              saved.manualTrials ?? DEFAULT_DATA.manualTrials,
            automaticTrials:
              saved.automaticTrials ?? DEFAULT_DATA.automaticTrials,
          });
        } else {
          setData(DEFAULT_DATA);
        }
      }, { onlyOnce: true });
    }
  };

  return (
    <main style={{
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "24px",
      color: "#1e293b",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "24px",
      }}>
        <div>
          <h1 style={{ margin: "0 0 8px" }}>Research Summary</h1>
          <p style={{ margin: 0, color: "#64748b" }}>
            SINAG-ANI experimental findings
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {editing ? (
            <>
              <button
                onClick={saveResults}
                disabled={saving}
                style={buttonStyle}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
              style={buttonStyle}
            >
              Edit Results
            </button>
          )}
        </div>
      </div>

      {message && (
        <p role="status" style={{ color: "#475569" }}>
          {message}
        </p>
      )}

      {/* TABLE 1: WEIGHT REDUCTION RESULTS */}
      <section style={cardStyle}>
        <h2>1. Weight Reduction Results</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Trial</th>
                <th style={cellStyle}>Manual Mode (%)</th>
                <th style={cellStyle}>Automatic Mode (%)</th>
              </tr>
            </thead>

            <tbody>
              {[0, 1, 2].map((index) => (
                <tr key={index}>
                  <td style={cellStyle}>
                    {data.manualTrials[index]?.trial ??
                      `Trial ${index + 1}`}
                  </td>

                  <td style={cellStyle}>
                    <EditableValue
                      editing={editing}
                      value={data.manualTrials[index].reduction}
                      onChange={(value) =>
                        updateTrial("manualTrials", index, value)
                      }
                    />
                  </td>

                  <td style={cellStyle}>
                    <EditableValue
                      editing={editing}
                      value={data.automaticTrials[index].reduction}
                      onChange={(value) =>
                        updateTrial("automaticTrials", index, value)
                      }
                    />
                  </td>
                </tr>
              ))}

              <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                <td style={cellStyle}>Average</td>
                <td style={cellStyle}>{manualAverage.toFixed(2)}%</td>
                <td style={cellStyle}>{automaticAverage.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* TABLE 2: SUMMARY OF RESEARCH FINDINGS */}
      <section style={cardStyle}>
        <h2>2. Summary of Research Findings</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Parameter</th>
                <th style={cellStyle}>Result</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td style={cellStyle}>Initial Sample Weight</td>
                <td style={cellStyle}>
                  <EditableValue
                    editing={editing}
                    value={data.initialWeight}
                    onChange={(value) =>
                      updateFinding("initialWeight", value)
                    }
                    type="text"
                  />
                </td>
              </tr>

              <tr>
                <td style={cellStyle}>
                  Average Weight Reduction — Manual Mode
                </td>
                <td style={cellStyle}>{manualAverage.toFixed(2)}%</td>
              </tr>

              <tr>
                <td style={cellStyle}>
                  Average Weight Reduction — Automatic Mode
                </td>
                <td style={cellStyle}>{automaticAverage.toFixed(2)}%</td>
              </tr>

              <tr>
                <td style={cellStyle}>Highest Recorded Temperature</td>
                <td style={cellStyle}>
                  <EditableValue
                    editing={editing}
                    value={data.highestTemperature}
                    onChange={(value) =>
                      updateFinding("highestTemperature", value)
                    }
                  />
                  {editing ? "" : "°C"}
                </td>
              </tr>

              <tr>
                <td style={cellStyle}>Statistical Significance (p-value)</td>
                <td style={cellStyle}>
                  <EditableValue
                    editing={editing}
                    value={data.pValue}
                    onChange={(value) =>
                      updateFinding("pValue", value)
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          .research-summary-table th,
          .research-summary-table td {
            padding: 9px !important;
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "middle",
};

const buttonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "7px",
  background: "#166534",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#e2e8f0",
  color: "#1e293b",
};
