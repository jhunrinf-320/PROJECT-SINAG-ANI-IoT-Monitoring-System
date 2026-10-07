import React, { useMemo } from "react";

export default function ResultsSummary({
  researchResults,
}) {
  const trials =
    researchResults?.trials || [];

  const reductions = trials
    .map((trial) => {
      const initial =
        Number(trial.initialWeight);

      const final =
        Number(trial.finalWeight);

      if (!initial || !Number.isFinite(final)) {
        return null;
      }

      return (
        ((initial - final) / initial) * 100
      );
    })
    .filter(
      (value) => value !== null
    );

  const averageReduction =
    reductions.length
      ? reductions.reduce(
          (a, b) => a + b,
          0
        ) / reductions.length
      : null;

  const temperatures = trials
    .map((trial) =>
      Number(
        trial.highestTemperature
      )
    )
    .filter((value) =>
      Number.isFinite(value)
    );

  const highestTemperature =
    temperatures.length
      ? Math.max(...temperatures)
      : null;

  const averageTemperature =
    temperatures.length
      ? temperatures.reduce(
          (a, b) => a + b,
          0
        ) / temperatures.length
      : null;

  const finalWeights = trials
    .map((trial) =>
      Number(trial.finalWeight)
    )
    .filter((value) =>
      Number.isFinite(value)
    );

  const averageFinalWeight =
    finalWeights.length
      ? finalWeights.reduce(
          (a, b) => a + b,
          0
        ) / finalWeights.length
      : null;

  const functionality =
    researchResults?.functionality ||
    [];

  const functional =
    functionality.reduce(
      (sum, item) =>
        sum +
        (Number(item.functional) || 0),
      0
    );

  const notFunctional =
    functionality.reduce(
      (sum, item) =>
        sum +
        (Number(item.notFunctional) || 0),
      0
    );

  const total =
    functional + notFunctional;

  const functionalityRate =
    total
      ? (functional / total) * 100
      : null;

  const cards = [
    [
      "AVERAGE WEIGHT REDUCTION",
      averageReduction !== null
        ? `${averageReduction.toFixed(2)}%`
        : "--",
      "Trials 1–3",
    ],
    [
      "HIGHEST TEMPERATURE",
      highestTemperature !== null
        ? `${highestTemperature.toFixed(2)}°C`
        : "--",
      "Research trials",
    ],
    [
      "AVERAGE HIGHEST TEMP",
      averageTemperature !== null
        ? `${averageTemperature.toFixed(2)}°C`
        : "--",
      "Research trials",
    ],
    [
      "AVERAGE FINAL WEIGHT",
      averageFinalWeight !== null
        ? `${averageFinalWeight.toFixed(2)} g`
        : "--",
      "After drying",
    ],
    [
      "FUNCTIONALITY",
      functionalityRate !== null
        ? `${functionalityRate.toFixed(2)}%`
        : "--",
      "System testing",
    ],
  ];

  return (
    <div className="results-summary">
      {cards.map(
        ([title, value, subtitle]) => (
          <div
            className="summary-card"
            key={title}
          >
            <span>{title}</span>

            <strong>{value}</strong>

            <small>{subtitle}</small>
          </div>
        )
      )}
    </div>
  );
}
