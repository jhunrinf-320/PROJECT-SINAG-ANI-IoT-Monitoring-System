function SensorCard({
title,
value,
unit,
icon
}){


return(

<div className="sensor-card">


<div className="icon">

{icon}

</div>


<h3>
{title}
</h3>


<h1>

{
value ?? "--"
}

<span>
{unit}
</span>

</h1>


</div>

)

}


export default SensorCard;