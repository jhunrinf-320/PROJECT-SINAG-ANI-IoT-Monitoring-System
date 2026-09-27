function Sidebar({
activePage,
setActivePage
}){


const menu = [

{
name:"Dashboard",
icon:"📊"
},

{
name:"Monitoring",
icon:"📈"
},

{
name:"Control",
icon:"⚙️"
},

{
name:"Settings",
icon:"🔧"
}

];



return(

<div className="sidebar">


<h2>
🌾 SINAG-ANI
</h2>


<p>
IoT Dryer System
</p>


<hr/>


{

menu.map((item)=>(


<button

key={item.name}

className={

activePage === item.name

?

"menu-active"

:

"menu-item"

}


onClick={()=>setActivePage(item.name)}

>


<span>
{item.icon}
</span>


{item.name}


</button>


))


}



</div>

)

}


export default Sidebar;