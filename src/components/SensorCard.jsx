function SensorCard({
  title,
  value,
  unit,
  icon,
}) {
  const numericValue = Number(value);

  const displayValue =
    Number.isFinite(numericValue)
      ? numericValue.toFixed(1)
      : "--";

  return (

    <div className="sensor-card">

      <div className="icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <h1>
        {displayValue}

        <span>
          {unit}
        </span>
      </h1>

    </div>
  );
}

export default SensorCard;
