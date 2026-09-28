function SensorCard({
  title,
  value,
  unit,
  icon,
  healthy = true,
  sensorName,
}) {

  const numericValue =
    value !== undefined &&
    value !== null &&
    !Number.isNaN(Number(value))
      ? Number(value)
      : null;


  return (
    <div className="sensor-card">

      <div className="sensor-card-top">

        <div className="sensor-icon">
          {icon}
        </div>

        <div
          className={`sensor-health ${
            healthy
              ? "healthy"
              : "unhealthy"
          }`}
        >
          <span className="health-dot"></span>

          {healthy
            ? "Healthy"
            : "Error"}
        </div>

      </div>


      <div className="sensor-card-content">

        <h3>
          {title}
        </h3>

        <div className="sensor-value">

          {numericValue !== null
            ? numericValue.toFixed(1)
            : "--"}

          <span>
            {unit}
          </span>

        </div>

        <p>
          {sensorName}
        </p>

      </div>

    </div>
  );
}

export default SensorCard;
