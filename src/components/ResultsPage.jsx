import React from "react";
import ResultsSummary from "./ResultsSummary";
import TrialResultsTable from "./TrialResultsTable";
import StageResultsTable from "./StageResultsTable";
import FunctionalityTable from "./FunctionalityTable";
import MonitoringCapability from "./MonitoringCapability";
import TrialObservations from "./TrialObservations";
import ResultsCharts from "./ResultsCharts";

export default function ResultsPage({
  researchResults,
  editingResults,
  setEditingResults,
  updateTrialField,
  updateStageField,
  updateFunctionalityField,
  updateMonitoringField,
  saveResearchResults,
  cancelEditingResults,
  resultsMessage,
  resultsLastUpdated,
}) {
  return (
    <div className="results-page">
      <div className="page-header">
        <div className="eyebrow">
          SINAG-ANI
        </div>

        <h1>Research Results</h1>

        <p>
          Experimental results, functionality testing,
          and IoT monitoring performance.
        </p>
      </div>

      <div className="results-toolbar">
        <div>
          <strong>Research Data</strong>

          <span>
            {resultsLastUpdated
              ? `Last updated: ${new Date(
                  resultsLastUpdated
                ).toLocaleString()}`
              : "No saved update"}
          </span>
        </div>

        {!editingResults ? (
          <button
            onClick={() => setEditingResults(true)}
            className="primary-button"
          >
            ✎ Edit Results
          </button>
        ) : (
          <div className="button-group">
            <button
              onClick={saveResearchResults}
              className="success-button"
            >
              ✓ Save Results
            </button>

            <button
              onClick={cancelEditingResults}
              className="secondary-button"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {resultsMessage && (
        <div className="results-message">
          {resultsMessage}
        </div>
      )}

      <ResultsSummary
        researchResults={researchResults}
      />

      <TrialResultsTable
        researchResults={researchResults}
        editingResults={editingResults}
        updateTrialField={updateTrialField}
      />

      <TrialObservations
        researchResults={researchResults}
        editingResults={editingResults}
        updateTrialField={updateTrialField}
      />

      <StageResultsTable
        researchResults={researchResults}
        editingResults={editingResults}
        updateStageField={updateStageField}
      />

      <FunctionalityTable
        researchResults={researchResults}
        editingResults={editingResults}
        updateFunctionalityField={
          updateFunctionalityField
        }
      />

      <MonitoringCapability
        researchResults={researchResults}
        editingResults={editingResults}
        updateMonitoringField={
          updateMonitoringField
        }
      />

      <ResultsCharts
        researchResults={researchResults}
      />
    </div>
  );
}
