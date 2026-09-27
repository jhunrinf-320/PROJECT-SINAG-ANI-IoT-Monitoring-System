function StatusCard({
mode,
pwm
}){


return(

<div className="status-card">


<h2>
Drying Status
</h2>


<h1>
{mode}
</h1>


<div className="power">

PWM POWER

<h2>
{pwm}/255
</h2>

</div>


</div>

)

}


export default StatusCard;