function formatTime(seconds) {
  const total = Math.max(
    0,
    Math.floor(Number(seconds) || 0)
  );

  const hours = String(
    Math.floor(total / 3600)
  ).padStart(2, "0");

  const minutes = String(
    Math.floor((total % 3600) / 60)
  ).padStart(2, "0");

  const secs = String(
    total % 60
  ).padStart(2, "0");

  return `${hours}:${minutes}:${secs}`;
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

  const elapsed =
    Number(stageElapsedSeconds) || 0;

  const remaining =
    Number(stageRemainingSeconds) || 0;

  const totalRemaining =
    Number(totalRemainingSeconds) || 0;

  const totalElapsed =
    Number(totalElapsedSeconds) || 0;

  const fanPWM =
    Number(pwm) || 0;

  const fanPercentage =
    Math.round((fanPWM / 255) * 100);

  const stageProgress =
    elapsed + remaining > 0
      ? Math.min(
          100,
          Math.round(
            (elapsed /
              (elapsed + remaining)) *
              100
          )
        )
      : 0;

  return (

    <section className="status-card">

      <div className="status-title">

        <div>

          <h2>
            Drying Status
          </h2>

          <p>
            Current SINAG-ANI operation
          </p>

        </div>

        <span className="mode-badge">
          {mode || "IDLE"}
        </span>

      </div>


      <div className="status-grid">

        <div className="status-item">
          <span>Mode</span>
          <strong>
            {mode || "OFF"}
          </strong>
        </div>


        <div className="status-item">
          <span>Stage</span>
          <strong>
            {stage || "OFF"}
          </strong>
        </div>


        <div className="status-item">
          <span>
            Stage Time Remaining
          </span>

          <strong>
            {formatTime(remaining)}
          </strong>
        </div>


        <div className="status-item">
          <span>
            Total Time Remaining
          </span>

          <strong>
            {formatTime(totalRemaining)}
          </strong>
        </div>


        <div className="status-item">
          <span>
            Total Elapsed
          </span>

          <strong>
            {formatTime(totalElapsed)}
          </strong>
        </div>


        <div className="status-item">
          <span>
            Main Fan
          </span>

          <strong>
            {fanPWM}/255
          </strong>
        </div>


        <div className="status-item">
          <span>
            Main Fan Power
          </span>

          <strong>
            {fanPercentage}%
          </strong>
        </div>


        <div className="status-item">
          <span>
            Cool-Air Fan
          </span>

          <strong>
            {coolFan ? "ON" : "OFF"}
          </strong>
        </div>


        <div className="status-item">
          <span>
            Operation
          </span>

          <strong>
            {paused
              ? "PAUSED"
              : automatic
              ? "AUTOMATIC"
              : online
              ? "ACTIVE"
              : "IDLE"}
          </strong>
        </div>

      </div>


      <div className="status-progress">

        <div className="progress-label">

          <span>
            Current stage progress
          </span>

          <span>
            {stageProgress}%
          </span>

        </div>


        <div className="progress-track">

          <div
            className="progress-fill"
            style={{
              width: `${stageProgress}%`,
            }}
          />

        </div>

      </div>

    </section>
  );
}

export default StatusCard;
