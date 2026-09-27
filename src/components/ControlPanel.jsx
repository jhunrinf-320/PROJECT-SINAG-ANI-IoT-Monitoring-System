import {
ref,
set
}
from "firebase/database";


import {
database
}
from "../firebase/firebaseConfig";



function ControlPanel(){


function command(mode){


set(

ref(
database,
"devices/device001/control/mode"
),

mode

);


}



return(

<div className="control">


<h2>
Drying Control
</h2>



<button
onClick={()=>command("HIGH")}
>
INITIAL HIGH
</button>



<button
onClick={()=>command("MODERATE-HIGH")}
>
MAIN DRYING
</button>



<button
onClick={()=>command("MODERATE")}
>
FINAL DRYING
</button>



<button
onClick={()=>command("OFF")}
>
STOP
</button>


</div>

)


}


export default ControlPanel;