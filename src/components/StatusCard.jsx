function formatTime(value) {
  const seconds = Number(value);

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "00:00:00";
  }

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = Math.floor(
    seconds % 60
  );

  return [
    hours,
    minutes,
    secs,
  ]
    .map((number) =>
      String(number).padStart(2, "0")
    )
    .join(":");
}

function getNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function StatusCard({
  mode,
  pwm,
  stage,
  online,
  automatic,
  paused,
  stageElapsedSeconds,
  stageRemainingSeconds,
  totalElapsedSeconds,
  totalRemainingSeconds,
  coolFan,
}) {
  const normalizedMode =
    String(mode || "OFF").toUpperCase();

  const normalizedStage =
    String(stage || "OFF").toUpperCase();

  const isRunning =
    normalizedStage !== "OFF" &&
    normalizedStage !== "COMPLETE" &&
    normalizedStage !== "SAFETY" &&
    normalizedStage !== "PAUSED";

  const isPaused =
    paused === true ||
    paused === 1 ||
    paused === "1" ||
    normalizedStage === "PAUSED";

  const isComplete =
    normalizedStage === "COMPLETE";

  const isSafety =
    normalizedStage === "SAFETY";

  let operation = "IDLE";

  if (isSafety) {
    operation = "SAFETY";
  } else if (isComplete) {
    operation = "COMPLETE";
  } else if (isPaused) {
    operation = "PAUSED";
  } else if (isRunning) {
    operation = "ACTIVE";
  }

  const fanPWM = Math.max(
    0,
    Math.min(
      255,
      getNumber(pwm)
    )
  );

  const fanPercent = Math.round(
    (fanPWM / 255) * 100
  );

  const stageElapsed =
    getNumber(stageElapsedSeconds);

  const stageRemaining =
    getNumber(stageRemainingSeconds);

  const totalElapsed =
    getNumber(totalElapsedSeconds);

  const totalRemaining =
    getNumber(totalRemainingSeconds);

  let progress = 0;

  const stageTotal =
    stageElapsed + stageRemaining;

  if (stageTotal > 0) {
    progress =
      (stageElapsed / stageTotal) * 100;
  }

  progress = Math.max(
    0,
    Math.min(100, progress)
  );

  const coolFanOn =
    coolFan === true ||
    coolFan === 1 ||
    coolFan === "1" ||
    String(coolFan).toUpperCase() === "ON";

  const operationClass =
    operation.toLowerCase();

  return (
    <div className="status-card">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="status-card-header">

        <div>
          <span className="card-eyebrow">
            DRYING STATUS
          </span>

          <h2>
            Current SINAG-ANI operation
          </h2>
        </div>

        <div
          className={`operation-badge ${operationClass}`}
        >
          <span></span>
          {operation}
        </div>

      </div>

      {/* ====================================================
          MAIN STATUS
      ==================================================== */}

      <div className="status-main">

        <div className="status-main-title">
          {operation}
        </div>

        <div className="status-subtitle">
          {online
            ? "ESP32 is connected to Firebase"
            : "Waiting for ESP32 connection"}
        </div>

      </div>

      {/* ====================================================
          STATUS GRID
      ==================================================== */}

      <div className="status-grid">

        <div className="status-item">
          <span>Mode</span>
          <strong>
            {normalizedMode}
          </strong>
        </div>

        <div className="status-item">
          <span>Stage</span>
          <strong>
            {normalizedStage}
          </strong>
        </div>

        <div className="status-item">
          <span>Stage Time Remaining</span>
          <strong>
            {formatTime(stageRemaining)}
          </strong>
        </div>

        <div className="status-item">
          <span>Total Time Remaining</span>
          <strong>
            {formatTime(totalRemaining)}
          </strong>
        </div>

        <div className="status-item">
          <span>Total Elapsed</span>
          <strong>
            {formatTime(totalElapsed)}
          </strong>
        </div>

        <div className="status-item">
          <span>Main Fan</span>
          <strong>
            {fanPWM}/255
          </strong>
        </div>

        <div className="status-item">
          <span>Main Fan Power</span>
          <strong>
            {fanPercent}%
          </strong>
        </div>

        <div className="status-item">
          <span>Cool-Air Fan</span>
          <strong>
            {coolFanOn
              ? "ON"
              : "OFF"}
          </strong>
        </div>

      </div>

      {/* ====================================================
          PROGRESS
      ==================================================== */}

      <div className="progress-section">

        <div className="progress-header">

          <span>
            Current stage progress
          </span>

          <strong>
            {Math.round(progress)}%
          </strong>

        </div>

        <div className="progress-track">

          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

export default StatusCard;
