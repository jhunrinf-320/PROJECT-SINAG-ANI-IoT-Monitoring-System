
import React, { useState } from "react";

const initialTrials = [
  { trial: "Trial 1", manual: 32, automatic: 34 },
  { trial: "Trial 2", manual: 31, automatic: 32 },
  { trial: "Trial 3", manual: 25, automatic: 30 },
];

const initialFindings = {
  initialWeight: "100 g",
  highestTemperature: "39.01°C",
  pValue: "0.341",
};

const storageKey = "sinagAniResearchResults";

function loadResults() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function EditableCell({ value, onChange, type = "text" }) {
  return (
    <input
      className="result-input"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      step={type === "number" ? "any" : undefined}
    />
  );
}

export default function ResearchResults() {
  const saved = loadResults();

  const [trials, setTrials] = useState(saved?.trials ?? initialTrials);
  const [findings, setFindings] = useState(
    saved?.findings ?? initialFindings
  );
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const average = (mode) =>
    (
      trials.reduce((sum, trial) => sum + Number(trial[mode] || 0), 0) /
      trials.length
    ).toFixed(2);

  function updateTrial(index, field, value) {
    setTrials((previous) =>
      previous.map((trial, i) =>
        i === index ? { ...trial, [field]: value } : trial
      )
    );
  }

  function updateFinding(field, value) {
    setFindings((previous) => ({ ...previous, [field]: value }));
  }

  function saveResults() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ trials, findings })
      );
      setEditing(false);
      setMessage("Changes saved in this browser.");
    } catch {
      setMessage("Unable to save. Check browser storage settings.");
    }
  }

  function resetResults() {
    if (!window.confirm("Restore the original research values?")) return;

    setTrials(initialTrials);
    setFindings(initialFindings);
    localStorage.removeItem(storageKey);
    setEditing(false);
    setMessage("Original values restored.");
  }

  return (
    <main className="research-results">
      <div className="results-heading">
        <h1>SINAG-ANI Research Results</h1>
        <div className="results-actions">
          {editing ? (
            <>
              <button onClick={saveResults}>Save Changes</button>
              <button
                className="secondary"
                onClick={() => {
                  setTrials(loadResults()?.trials ?? initialTrials);
                  setFindings(loadResults()?.findings ?? initialFindings);
                  setEditing(false);
                  setMessage("");
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => { setEditing(true); setMessage(""); }}>
              Edit Results
            </button>
          )}
          <button className="secondary" onClick={resetResults}>
            Reset
          </button>
        </div>
      </div>

      {message && <p role="status">{message}</p>}

      <section className="results-card">
        <h2>Weight Reduction Results</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Trial</th>
                <th>Manual Mode (%)</th>
                <th>Automatic Mode (%)</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((trial, index) => (
                <tr key={trial.trial}>
                  <td>{trial.trial}</td>
                  <td>
                    {editing ? (
                      <EditableCell
                        type="number"
                        value={trial.manual}
                        onChange={(v) => updateTrial(index, "manual", v)}
                      />
                    ) : `${trial.manual}%`}
                  </td>
                  <td>
                    {editing ? (
                      <EditableCell
                        type="number"
                        value={trial.automatic}
                        onChange={(v) => updateTrial(index, "automatic", v)}
                      />
                    ) : `${trial.automatic}%`}
                  </td>
                </tr>
              ))}
              <tr className="average-row">
                <td>Average</td>
                <td>{average("manual")}%</td>
                <td>{average("automatic")}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="results-card">
        <h2>Summary of Research Findings</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Initial Sample Weight</td>
                <td>
                  {editing ? (
                    <EditableCell
                      value={findings.initialWeight}
                      onChange={(v) => updateFinding("initialWeight", v)}
                    />
                  ) : findings.initialWeight}
                </td>
              </tr>
              <tr>
                <td>Average Weight Reduction — Manual Mode</td>
                <td>{average("manual")}%</td>
              </tr>
              <tr>
                <td>Average Weight Reduction — Automatic Mode</td>
                <td>{average("automatic")}%</td>
              </tr>
              <tr>
                <td>Highest Recorded Temperature</td>
                <td>
                  {editing ? (
                    <EditableCell
                      value={findings.highestTemperature}
                      onChange={(v) =>
                        updateFinding("highestTemperature", v)
                      }
                    />
                  ) : findings.highestTemperature}
                </td>
              </tr>
              <tr>
                <td>Statistical Significance (p-value)</td>
                <td>
                  {editing ? (
                    <EditableCell
                      value={findings.pValue}
                      onChange={(v) => updateFinding("pValue", v)}
                    />
                  ) : findings.pValue}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .research-results {
          max-width: 1100px;
          margin: auto;
          padding: 24px;
          color: var(--text-color, #1f2937);
          font-family: Arial, sans-serif;
        }
        .results-heading {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .results-heading h1 { font-size: 26px; margin: 0; }
        .results-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .results-actions button {
          padding: 10px 14px;
          border: 0;
          border-radius: 7px;
          background: #166534;
          color: white;
          cursor: pointer;
        }
        .results-actions button.secondary {
          background: #e5e7eb;
          color: #1f2937;
        }
        .results-card {
          margin-bottom: 24px;
          padding: 20px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          background: var(--card-bg, #fff);
        }
        .results-card h2 { font-size: 19px; margin: 0 0 16px; }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td {
          padding: 13px 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        th { background: #f3f4f6; }
        .average-row { font-weight: bold; background: #f9fafb; }
        .result-input {
          box-sizing: border-box;
          width: 100%;
          min-width: 75px;
          padding: 8px;
          border: 1px solid #9ca3af;
          border-radius: 5px;
          background: white;
          color: #111827;
        }
        @media (max-width: 600px) {
          .research-results { padding: 12px; }
          .results-card { padding: 12px; }
          th, td { padding: 10px; font-size: 13px; }
        }
      `}</style>
    </main>
  );
}
