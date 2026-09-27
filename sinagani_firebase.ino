#include <WiFi.h>
#include <Firebase_ESP_Client.h>

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>


// =================================================
// WIFI
// =================================================

#define WIFI_SSID "YOUR_WIFI"

#define WIFI_PASSWORD "YOUR_PASSWORD"



// =================================================
// FIREBASE
// =================================================

#define API_KEY "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU"

#define DATABASE_URL "https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app/"



FirebaseData fbdo;

FirebaseAuth auth;

FirebaseConfig config;



// =================================================
// PIN DEFINITIONS
// =================================================


// DS18B20

#define TEMP1_PIN 15

#define TEMP2_PIN 16



// DHT22

#define DHT_PIN 26

#define DHT_TYPE DHT22



// LCD I2C

#define SDA_PIN 25

#define SCL_PIN 27



// MOSFET

#define MOSFET_PIN 18


#define PWM_FREQ 20000

#define PWM_RESOLUTION 8



// =================================================
// SENSOR OBJECTS
// =================================================


OneWire oneWire1(TEMP1_PIN);

OneWire oneWire2(TEMP2_PIN);


DallasTemperature tempSensor1(
&oneWire1
);


DallasTemperature tempSensor2(
&oneWire2
);



DHT dht(
DHT_PIN,
DHT_TYPE
);



// =================================================
// LCD
// =================================================

LiquidCrystal_I2C lcd(
0x27,
16,
2
);



// =================================================
// VARIABLES
// =================================================


String dryingMode="OFF";


int pwmValue=0;



unsigned long lastUpload=0;


const unsigned long uploadDelay=5000;



// =================================================
// WIFI CONNECT
// =================================================

void connectWiFi(){


WiFi.begin(
WIFI_SSID,
WIFI_PASSWORD
);



Serial.print(
"Connecting WiFi"
);



while(
WiFi.status()!=WL_CONNECTED
){

delay(500);

Serial.print(".");

}



Serial.println();

Serial.println(
"WiFi Connected"
);


}





// =================================================
// APPLY DRYING MODE
// =================================================


void applyMode(String mode){


mode.toUpperCase();



if(mode=="HIGH"){


dryingMode="INITIAL";

pwmValue=255;


}


else if(mode=="MODERATE-HIGH"){


dryingMode="MAIN";

pwmValue=191;


}


else if(mode=="MODERATE"){


dryingMode="FINAL";

pwmValue=128;


}


else{


dryingMode="OFF";

pwmValue=0;


}



ledcWrite(
MOSFET_PIN,
pwmValue
);



Serial.print(
"Mode: "
);

Serial.println(
dryingMode
);


}




// =================================================
// READ WEBSITE COMMAND
// =================================================


void readCommand(){


if(
Firebase.ready()
){


if(
Firebase.RTDB.getString(
&fbdo,
"/devices/device001/control/mode"
)

){


String command =
fbdo.stringData();



if(command.length()>0){


if(command != dryingMode){


applyMode(command);


}


}


}



}


}






// =================================================
// SEND DATA TO FIREBASE
// =================================================


void sendData(

float temp1,

float temp2,

float humidity

){



if(
Firebase.ready()
){


Firebase.RTDB.setFloat(

&fbdo,

"/devices/device001/sensors/temp1",

temp1

);



Firebase.RTDB.setFloat(

&fbdo,

"/devices/device001/sensors/temp2",

temp2

);



Firebase.RTDB.setFloat(

&fbdo,

"/devices/device001/sensors/humidity",

humidity

);



Firebase.RTDB.setString(

&fbdo,

"/devices/device001/status/mode",

dryingMode

);



Firebase.RTDB.setInt(

&fbdo,

"/devices/device001/status/pwm",

pwmValue

);



Firebase.RTDB.setInt(

&fbdo,

"/devices/device001/status/online",

1

);



Serial.println(
"Firebase Updated"
);



}


}






// =================================================
// SETUP
// =================================================

void setup(){



Serial.begin(115200);



delay(2000);



// LCD

Wire.begin(
SDA_PIN,
SCL_PIN
);



lcd.init();

lcd.backlight();



lcd.clear();


lcd.setCursor(
0,
0
);


lcd.print(
"SINAG-ANI"
);



lcd.setCursor(
0,
1
);


lcd.print(
"Starting..."
);




// Sensors

tempSensor1.begin();

tempSensor2.begin();

dht.begin();




// PWM

ledcAttach(

MOSFET_PIN,

PWM_FREQ,

PWM_RESOLUTION

);


ledcWrite(

MOSFET_PIN,

0

);




// WIFI

connectWiFi();




// FIREBASE


config.api_key =
API_KEY;


config.database_url =
DATABASE_URL;



Firebase.begin(

&config,

&auth

);



Firebase.reconnectWiFi(true);



if(
Firebase.signUp(
&config,
&auth,
"",
""
)

){


Serial.println(
"Firebase Connected"
);


}

else{


Serial.println(
"Firebase Failed"
);


}



lcd.clear();


lcd.setCursor(
0,
0
);


lcd.print(
"ONLINE"
);


lcd.setCursor(
0,
1
);


lcd.print(
"SINAG-ANI Ready"
);



delay(2000);



}







// =================================================
// LOOP
// =================================================


void loop(){



// Check dashboard command

readCommand();




// Read DS18B20

tempSensor1.requestTemperatures();

tempSensor2.requestTemperatures();



float temp1 =
tempSensor1.getTempCByIndex(0);



float temp2 =
tempSensor2.getTempCByIndex(0);




// Read DHT22

float humidity =
dht.readHumidity();





// Serial output


Serial.println(
"================"
);


Serial.print(
"Temp1: "
);

Serial.println(temp1);



Serial.print(
"Temp2: "
);

Serial.println(temp2);



Serial.print(
"Humidity: "
);

Serial.println(humidity);



Serial.print(
"Mode: "
);

Serial.println(dryingMode);





// LCD


lcd.clear();



lcd.setCursor(
0,
0
);


lcd.print(
"T1:"
);

lcd.print(
temp1,
1
);

lcd.print(
"C"
);




lcd.setCursor(
0,
1
);


lcd.print(
dryingMode
);

lcd.print(
" H:"
);

lcd.print(
humidity,
0
);

lcd.print(
"%"
);






// Upload every 5 seconds


if(
millis()-lastUpload >= uploadDelay
){


sendData(

temp1,

temp2,

humidity

);



lastUpload =
millis();


}



delay(1000);



}