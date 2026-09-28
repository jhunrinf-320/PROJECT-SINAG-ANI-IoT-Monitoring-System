function StatusCard({
  mode,
  stage,
  automatic,
  paused,
  pwm,
  coolFan,
  stageRemainingSeconds,
  totalRemainingSeconds,
  totalElapsedSeconds,
}) {

  const fanPercentage = Math.round(
    (Number(pwm) / 255) * 100
  );

  const formatDuration = (seconds) => {
    const totalSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const secs = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const getStageName = () => {
    if (stage === "INITIAL") {
      return "INITIAL";
    }

    if (stage === "MAIN") {
      return "MAIN";
    }

    if (stage === "FINAL") {
      return "FINAL";
    }

    if (stage === "COMPLETE") {
      return "COMPLETE";
    }

    if (stage === "PAUSED") {
      return "PAUSED";
    }

    if (stage === "IDLE") {
      return "IDLE";
    }

    return stage || "IDLE";
  };

  const getSystemState = () => {
    if (paused) {
      return "PAUSED";
    }

    if (automatic) {
      return "AUTOMATIC";
    }

    if (
      mode === "HIGH" ||
      mode === "MODERATE-HIGH" ||
      mode === "MODERATE"
    ) {
      return "MANUAL";
    }

    if (mode === "COMPLETE") {
      return "COMPLETE";
    }

    return "IDLE";
  };

  return (
    <div className="status-card">

      <div className="status-header">

        <div>
          <h2>Drying Status</h2>
          <p>Current SINAG-ANI operation</p>
        </div>

        <div className="state-badge">
          {getSystemState()}
        </div>

      </div>


      <div className="status-grid">

        {/* MODE */}
        <div className="status-item">

          <span className="status-label">
            Mode
          </span>

          <strong className="status-value">
            {mode || "IDLE"}
          </strong>

        </div>


        {/* STAGE */}
        <div className="status-item">

          <span className="status-label">
            Stage
          </span>

          <strong className="status-value">
            {getStageName()}
          </strong>

        </div>


        {/* STAGE TIMER */}
        <div className="status-item timer-item">

          <span className="status-label">
            Stage Time Remaining
          </span>

          <strong className="timer-value">
            {formatDuration(
              stageRemainingSeconds
            )}
          </strong>

        </div>


        {/* TOTAL TIMER */}
        <div className="status-item timer-item">

          <span className="status-label">
            Total Time Remaining
          </span>

          <strong className="timer-value">
            {formatDuration(
              totalRemainingSeconds
            )}
          </strong>

        </div>


        {/* TOTAL ELAPSED */}
        <div className="status-item">

          <span className="status-label">
            Total Elapsed
          </span>

          <strong className="status-value">
            {formatDuration(
              totalElapsedSeconds
            )}
          </strong>

        </div>


        {/* FAN */}
        <div className="status-item">

          <span className="status-label">
            Main Fan
          </span>

          <strong className="status-value">
            {fanPercentage}%
          </strong>

        </div>


        {/* COOL FAN */}
        <div className="status-item">

          <span className="status-label">
            Cool-Air Fan
          </span>

          <strong
            className={
              coolFan
                ? "status-value fan-on"
                : "status-value fan-off"
            }
          >
            {coolFan ? "ON" : "OFF"}
          </strong>

        </div>

      </div>


      {/* FAN BAR */}
      <div className="fan-progress">

        <div className="progress-header">

          <span>
            Main Fan Power
          </span>

          <strong>
            {fanPercentage}%
          </strong>

        </div>

        <div className="progress-track">

          <div
            className="progress-fill"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, fanPercentage)
              )}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

export default StatusCard;
