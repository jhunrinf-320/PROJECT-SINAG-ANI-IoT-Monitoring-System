
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <Preferences.h>

#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"


// ============================================================
// WIFI SETTINGS
// ============================================================

#define WIFI_SSID "MALA CHAI"
#define WIFI_PASSWORD "02282012"

#define AP_SSID "PROJECT-ANI"
#define AP_PASSWORD "SINAG-ANI"


// ============================================================
// FIREBASE
// ============================================================

#define API_KEY "AIzaSyAcFpxULijePBCmRsZgw5FSWpUUY10XKAU"

#define DATABASE_URL \
"https://sinag-ani-iot-default-rtdb.asia-southeast1.firebasedatabase.app/"

#define DEVICE_ID "device001"

#define BASE_PATH "/devices/" DEVICE_ID


FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;


// ============================================================
// TEST MODE
// ============================================================
//
// false = actual drying time
//
// INITIAL = 1 hour
// MAIN    = 2 hours
// FINAL   = 2 hours
//
// true = 1 minute per stage for testing
// ============================================================

#define TEST_MODE false


// ============================================================
// PIN CONFIGURATION
// ============================================================

// DS18B20 #1
#define TEMP1_PIN 15

// DS18B20 #2
#define TEMP2_PIN 16

// DHT11
#define DHT_PIN 26
#define DHT_TYPE DHT11

// LCD I2C
#define SDA_PIN 25
#define SCL_PIN 27

// MOSFET fan
#define MOSFET_FAN_PIN 18

// Cool-air relay
#define COOL_FAN_RELAY_PIN 19


// ============================================================
// RELAY LOGIC
// ============================================================

#define RELAY_ON LOW
#define RELAY_OFF HIGH


// ============================================================
// PWM
// ESP32 CORE 3.x
// ============================================================

#define PWM_FREQUENCY 25000
#define PWM_RESOLUTION 8

int currentFanPWM = 0;


// ============================================================
// LCD
// ============================================================

LiquidCrystal_I2C lcd(0x27, 16, 2);


// ============================================================
// DS18B20
// ============================================================

OneWire oneWire1(TEMP1_PIN);
OneWire oneWire2(TEMP2_PIN);

DallasTemperature tempSensor1(&oneWire1);
DallasTemperature tempSensor2(&oneWire2);


// ============================================================
// DHT11
// ============================================================

DHT dht(DHT_PIN, DHT_TYPE);


// ============================================================
// PREFERENCES
// ============================================================

Preferences preferences;


// ============================================================
// SAFETY
// ============================================================

#define MAX_SAFE_TEMP 45.0

#define MAX_SENSOR_FAILURES 3


// ============================================================
// DRYING STAGES
// ============================================================

enum DryingStage {

  STAGE_OFF,

  STAGE_INITIAL,

  STAGE_MAIN,

  STAGE_FINAL,

  STAGE_COMPLETE,

  STAGE_PAUSED,

  STAGE_SAFETY
};


DryingStage currentStage = STAGE_OFF;


// ============================================================
// DRYING DURATIONS
// ============================================================

// Real durations

const unsigned long INITIAL_DURATION =
  60UL * 60UL * 1000UL;

const unsigned long MAIN_DURATION =
  2UL * 60UL * 60UL * 1000UL;

const unsigned long FINAL_DURATION =
  2UL * 60UL * 60UL * 1000UL;


// Test duration

const unsigned long TEST_STAGE_DURATION =
  60UL * 1000UL;


// ============================================================
// SYSTEM STATE
// ============================================================

bool automaticMode = false;

bool pausedMode = false;


// ============================================================
// TIMING VARIABLES
// ============================================================

unsigned long stageStartMillis = 0;

unsigned long totalStartMillis = 0;

unsigned long pausedStageElapsed = 0;

unsigned long pausedTotalElapsed = 0;


// ============================================================
// SENSOR VALUES
// ============================================================

float temperature1 = NAN;

float temperature2 = NAN;

float dhtTemperature = NAN;

float humidity = NAN;


// ============================================================
// SENSOR HEALTH
// ============================================================

bool temp1Healthy = false;

bool temp2Healthy = false;

bool humidityHealthy = false;


int temp1Failures = 0;

int temp2Failures = 0;

int humidityFailures = 0;


// ============================================================
// LCD ROTATION
// ============================================================
//
// SENSOR DISPLAY:
// 1 minute
//
// MODE/TIMER DISPLAY:
// 10 minutes
//
// Then repeats.
//
// Total LCD cycle = 11 minutes
// ============================================================

bool lcdSensorScreen = true;

unsigned long lcdScreenStartMillis = 0;

const unsigned long LCD_SENSOR_TIME =
  1UL * 60UL * 1000UL;

const unsigned long LCD_MODE_TIME =
  10UL * 60UL * 1000UL;


// ============================================================
// OTHER TIMERS
// ============================================================

unsigned long lastSensorRead = 0;

unsigned long lastFirebaseSend = 0;

unsigned long lastHeartbeat = 0;

unsigned long lastHistory = 0;

unsigned long lastLCDUpdate = 0;

unsigned long lastRecoverySave = 0;

unsigned long lastCommandCheck = 0;


// ============================================================
// INTERVALS
// ============================================================

const unsigned long SENSOR_INTERVAL =
  2000;

const unsigned long FIREBASE_INTERVAL =
  5000;

const unsigned long HEARTBEAT_INTERVAL =
  10000;

const unsigned long HISTORY_INTERVAL =
  60000;

const unsigned long LCD_INTERVAL =
  1000;

const unsigned long RECOVERY_INTERVAL =
  30000;

const unsigned long COMMAND_INTERVAL =
  1000;


// ============================================================
// FUNCTION DECLARATIONS
// ============================================================

void connectWiFi();

void initializeFirebase();

void readSensors();

void checkSensorSafety();

void processFirebaseCommand();

void startAutomaticDrying();

void pauseDrying();

void resumeDrying();

void stopDrying();

void updateAutomaticDrying();

void setStage(DryingStage stage);

void applyOutputs();

void setFanPWM(int value);

void setCoolFan(bool state);

void sendSensorData();

void sendStatus();

void sendHeartbeat();

void sendHistory();

void updateLCD();

void resetLCDRotation();

void saveRecovery();

void restoreRecovery();

void clearRecovery();

String getStageString();

String getModeString();

unsigned long getStageDuration();

unsigned long getStageElapsed();

unsigned long getStageRemaining();

unsigned long getTotalElapsed();

unsigned long getTotalRemaining();

bool validTemperature(float value);

bool validHumidity(float value);


// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("          SINAG-ANI STARTING");
  Serial.println("========================================");


  // ----------------------------------------------------------
  // RELAY
  // ----------------------------------------------------------

  pinMode(
    COOL_FAN_RELAY_PIN,
    OUTPUT
  );

  digitalWrite(
    COOL_FAN_RELAY_PIN,
    RELAY_OFF
  );


  // ----------------------------------------------------------
  // MOSFET PWM
  // ESP32 CORE 3.x
  // ----------------------------------------------------------

  ledcAttach(
    MOSFET_FAN_PIN,
    PWM_FREQUENCY,
    PWM_RESOLUTION
  );

  setFanPWM(0);


  // ----------------------------------------------------------
  // I2C
  // ----------------------------------------------------------

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );


  // ----------------------------------------------------------
  // LCD
  // ----------------------------------------------------------

  lcd.init();

  lcd.backlight();

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("SINAG-ANI");

  lcd.setCursor(0, 1);
  lcd.print("Starting...");

  delay(1500);


  // ----------------------------------------------------------
  // DS18B20
  // ----------------------------------------------------------

  tempSensor1.begin();

  tempSensor2.begin();

  tempSensor1.setResolution(12);

  tempSensor2.setResolution(12);


  // ----------------------------------------------------------
  // DHT11
  // ----------------------------------------------------------

  dht.begin();


  // ----------------------------------------------------------
  // PREFERENCES
  // ----------------------------------------------------------

  preferences.begin(
    "sinagani",
    false
  );


  // ----------------------------------------------------------
  // WIFI
  // ----------------------------------------------------------

  connectWiFi();


  // ----------------------------------------------------------
  // FIREBASE
  // ----------------------------------------------------------

  initializeFirebase();


  // ----------------------------------------------------------
  // RECOVERY
  // ----------------------------------------------------------

  restoreRecovery();


  // ----------------------------------------------------------
  // OUTPUTS
  // ----------------------------------------------------------

  applyOutputs();


  // ----------------------------------------------------------
  // LCD TIMER RESET
  // ----------------------------------------------------------

  resetLCDRotation();


  Serial.println();
  Serial.println("========================================");
  Serial.println("          SINAG-ANI READY");
  Serial.println("========================================");


  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("SINAG-ANI");

  lcd.setCursor(0, 1);
  lcd.print("READY");

  delay(1500);
}


// ============================================================
// LOOP
// ============================================================

void loop() {

  unsigned long now = millis();


  // ----------------------------------------------------------
  // READ SENSORS
  // ----------------------------------------------------------

  if (
    now - lastSensorRead >=
    SENSOR_INTERVAL
  ) {

    lastSensorRead = now;

    readSensors();

    checkSensorSafety();
  }


  // ----------------------------------------------------------
  // FIREBASE COMMAND
  // ----------------------------------------------------------

  if (
    now - lastCommandCheck >=
    COMMAND_INTERVAL
  ) {

    lastCommandCheck = now;

    processFirebaseCommand();
  }


  // ----------------------------------------------------------
  // AUTOMATIC DRYING
  // ----------------------------------------------------------

  updateAutomaticDrying();


  // ----------------------------------------------------------
  // FIREBASE SENSOR + STATUS
  // ----------------------------------------------------------

  if (
    now - lastFirebaseSend >=
    FIREBASE_INTERVAL
  ) {

    lastFirebaseSend = now;

    sendSensorData();

    sendStatus();
  }


  // ----------------------------------------------------------
  // HEARTBEAT
  // ----------------------------------------------------------

  if (
    now - lastHeartbeat >=
    HEARTBEAT_INTERVAL
  ) {

    lastHeartbeat = now;

    sendHeartbeat();
  }


  // ----------------------------------------------------------
  // HISTORY
  // ----------------------------------------------------------

  if (
    now - lastHistory >=
    HISTORY_INTERVAL
  ) {

    lastHistory = now;

    sendHistory();
  }


  // ----------------------------------------------------------
  // LCD
  // ----------------------------------------------------------

  if (
    now - lastLCDUpdate >=
    LCD_INTERVAL
  ) {

    lastLCDUpdate = now;

    updateLCD();
  }


  // ----------------------------------------------------------
  // RECOVERY
  // ----------------------------------------------------------

  if (
    now - lastRecoverySave >=
    RECOVERY_INTERVAL
  ) {

    lastRecoverySave = now;

    if (
      automaticMode ||
      pausedMode
    ) {

      saveRecovery();
    }
  }
}


// ============================================================
// WIFI
// ============================================================

void connectWiFi() {

  Serial.println();

  Serial.println("Connecting to WiFi...");


  WiFi.mode(WIFI_AP_STA);


  // ----------------------------------------------------------
  // ESP32 ACCESS POINT
  // ----------------------------------------------------------

  WiFi.softAP(
    AP_SSID,
    AP_PASSWORD
  );


  Serial.print("ESP32 AP: ");

  Serial.println(AP_SSID);


  Serial.print("AP IP: ");

  Serial.println(
    WiFi.softAPIP()
  );


  // ----------------------------------------------------------
  // ROUTER WIFI
  // ----------------------------------------------------------

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );


  unsigned long startAttempt =
    millis();


  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - startAttempt < 20000
  ) {

    delay(500);

    Serial.print(".");
  }


  Serial.println();


  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    Serial.println(
      "WiFi connected!"
    );


    Serial.print(
      "IP address: "
    );

    Serial.println(
      WiFi.localIP()
    );

  } else {

    Serial.println(
      "WiFi connection failed."
    );
  }
}


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

void initializeFirebase() {

  Serial.println(
    "Initializing Firebase..."
  );


  config.api_key =
    API_KEY;


  config.database_url =
    DATABASE_URL;


  config.token_status_callback =
    tokenStatusCallback;


  Firebase.reconnectNetwork(
    true
  );


  Firebase.begin(
    &config,
    &auth
  );


  Firebase.signUp(
    &config,
    &auth,
    "",
    ""
  );


  Serial.println(
    "Firebase initialized."
  );
}


// ============================================================
// READ SENSORS
// ============================================================

void readSensors() {


  // ==========================================================
  // DS18B20 #1
  // ==========================================================

  tempSensor1.requestTemperatures();

  float t1 =
    tempSensor1.getTempCByIndex(0);


  if (
    validTemperature(t1)
  ) {

    temperature1 = t1;

    temp1Healthy = true;

    temp1Failures = 0;

  } else {

    temp1Healthy = false;

    temp1Failures++;
  }


  // ==========================================================
  // DS18B20 #2
  // ==========================================================

  tempSensor2.requestTemperatures();

  float t2 =
    tempSensor2.getTempCByIndex(0);


  if (
    validTemperature(t2)
  ) {

    temperature2 = t2;

    temp2Healthy = true;

    temp2Failures = 0;

  } else {

    temp2Healthy = false;

    temp2Failures++;
  }


  // ==========================================================
  // DHT11
  // ==========================================================

  float h =
    dht.readHumidity();


  float dt =
    dht.readTemperature();


  // ----------------------------------------------------------
  // HUMIDITY
  // ----------------------------------------------------------

  if (
    validHumidity(h)
  ) {

    humidity = h;

    humidityHealthy = true;

    humidityFailures = 0;

  } else {

    humidityHealthy = false;

    humidityFailures++;
  }


  // ----------------------------------------------------------
  // DHT11 TEMPERATURE
  // ----------------------------------------------------------

  if (
    !isnan(dt)
  ) {

    dhtTemperature = dt;

  } else {

    dhtTemperature = NAN;
  }


  // ==========================================================
  // SERIAL MONITOR
  // ==========================================================

  Serial.println(
    "----------------------------------------"
  );


  Serial.print(
    "DS18B20 #1: "
  );


  if (
    validTemperature(temperature1)
  ) {

    Serial.print(
      temperature1,
      2
    );

    Serial.println(" C");

  } else {

    Serial.println("ERROR");
  }


  Serial.print(
    "DS18B20 #2: "
  );


  if (
    validTemperature(temperature2)
  ) {

    Serial.print(
      temperature2,
      2
    );

    Serial.println(" C");

  } else {

    Serial.println("ERROR");
  }


  Serial.print(
    "DHT11 Temp: "
  );


  if (
    !isnan(dhtTemperature)
  ) {

    Serial.print(
      dhtTemperature,
      2
    );

    Serial.println(" C");

  } else {

    Serial.println("ERROR");
  }


  Serial.print(
    "Humidity: "
  );


  if (
    validHumidity(humidity)
  ) {

    Serial.print(
      humidity,
      1
    );

    Serial.println(" %");

  } else {

    Serial.println("ERROR");
  }
}


// ============================================================
// SENSOR VALIDATION
// ============================================================

bool validTemperature(
  float value
) {

  return
    !isnan(value) &&
    value > -50.0 &&
    value < 125.0;
}


bool validHumidity(
  float value
) {

  return
    !isnan(value) &&
    value >= 0.0 &&
    value <= 100.0;
}


// ============================================================
// SENSOR SAFETY
// ============================================================

void checkSensorSafety() {


  // ----------------------------------------------------------
  // TEMPERATURE 1
  // ----------------------------------------------------------

  if (
    validTemperature(temperature1) &&
    temperature1 >= MAX_SAFE_TEMP
  ) {

    Serial.println(
      "SAFETY: TEMP1 TOO HIGH"
    );


    currentStage =
      STAGE_SAFETY;


    automaticMode =
      false;


    pausedMode =
      false;


    applyOutputs();


    clearRecovery();


    return;
  }


  // ----------------------------------------------------------
  // TEMPERATURE 2
  // ----------------------------------------------------------

  if (
    validTemperature(temperature2) &&
    temperature2 >= MAX_SAFE_TEMP
  ) {

    Serial.println(
      "SAFETY: TEMP2 TOO HIGH"
    );


    currentStage =
      STAGE_SAFETY;


    automaticMode =
      false;


    pausedMode =
      false;


    applyOutputs();


    clearRecovery();


    return;
  }


  // ----------------------------------------------------------
  // SENSOR FAILURE
  // ----------------------------------------------------------

  if (
    automaticMode
  ) {

    if (
      temp1Failures >= MAX_SENSOR_FAILURES ||
      temp2Failures >= MAX_SENSOR_FAILURES ||
      humidityFailures >= MAX_SENSOR_FAILURES
    ) {

      Serial.println(
        "SAFETY: SENSOR FAILURE"
      );


      currentStage =
        STAGE_SAFETY;


      automaticMode =
        false;


      pausedMode =
        false;


      applyOutputs();


      clearRecovery();
    }
  }
}


// ============================================================
// FIREBASE COMMAND
// ============================================================

void processFirebaseCommand() {

  if (
    !Firebase.ready()
  ) {

    return;
  }


  String path =
    String(BASE_PATH) +
    "/control/mode";


  if (
    Firebase.RTDB.getString(
      &fbdo,
      path.c_str()
    )
  ) {

    String command =
      fbdo.stringData();


    command.trim();

    command.toUpperCase();


    if (
      command.length() == 0 ||
      command == "IDLE"
    ) {

      return;
    }


    Serial.print(
      "Firebase command: "
    );

    Serial.println(
      command
    );


    // --------------------------------------------------------
    // START
    // --------------------------------------------------------

    if (
      command == "START" ||
      command == "AUTO"
    ) {

      startAutomaticDrying();
    }


    // --------------------------------------------------------
    // PAUSE
    // --------------------------------------------------------

    else if (
      command == "PAUSE"
    ) {

      pauseDrying();
    }


    // --------------------------------------------------------
    // RESUME
    // --------------------------------------------------------

    else if (
      command == "RESUME"
    ) {

      resumeDrying();
    }


    // --------------------------------------------------------
    // STOP
    // --------------------------------------------------------

    else if (
      command == "STOP" ||
      command == "OFF"
    ) {

      stopDrying();
    }


    // --------------------------------------------------------
    // MANUAL HIGH
    // --------------------------------------------------------

    else if (
      command == "HIGH"
    ) {

      automaticMode = false;

      pausedMode = false;

      currentStage =
        STAGE_INITIAL;

      applyOutputs();
    }


    // --------------------------------------------------------
    // MANUAL MODERATE-HIGH
    // --------------------------------------------------------

    else if (
      command == "MODERATE-HIGH"
    ) {

      automaticMode = false;

      pausedMode = false;

      currentStage =
        STAGE_MAIN;

      applyOutputs();
    }


    // --------------------------------------------------------
    // MANUAL MODERATE
    // --------------------------------------------------------

    else if (
      command == "MODERATE"
    ) {

      automaticMode = false;

      pausedMode = false;

      currentStage =
        STAGE_FINAL;

      applyOutputs();
    }


    // --------------------------------------------------------
    // RESET COMMAND
    // --------------------------------------------------------

    Firebase.RTDB.setString(
      &fbdo,
      path.c_str(),
      "IDLE"
    );


    sendStatus();
  }
}


// ============================================================
// START AUTOMATIC DRYING
// ============================================================

void startAutomaticDrying() {

  Serial.println(
    "Starting automatic drying..."
  );


  automaticMode =
    true;


  pausedMode =
    false;


  pausedStageElapsed =
    0;


  pausedTotalElapsed =
    0;


  totalStartMillis =
    millis();


  stageStartMillis =
    millis();


  currentStage =
    STAGE_INITIAL;


  resetLCDRotation();


  applyOutputs();


  saveRecovery();


  sendStatus();
}


// ============================================================
// PAUSE
// ============================================================

void pauseDrying() {

  if (
    !automaticMode ||
    pausedMode
  ) {

    return;
  }


  pausedStageElapsed =
    getStageElapsed();


  pausedTotalElapsed =
    getTotalElapsed();


  pausedMode =
    true;


  automaticMode =
    false;


  currentStage =
    STAGE_PAUSED;


  applyOutputs();


  saveRecovery();


  sendStatus();


  Serial.println(
    "Drying PAUSED."
  );
}


// ============================================================
// RESUME
// ============================================================

void resumeDrying() {

  if (
    !pausedMode
  ) {

    return;
  }


  String savedStage =
    preferences.getString(
      "stage",
      "INITIAL"
    );


  if (
    savedStage == "INITIAL"
  ) {

    currentStage =
      STAGE_INITIAL;

  } else if (
    savedStage == "MAIN"
  ) {

    currentStage =
      STAGE_MAIN;

  } else if (
    savedStage == "FINAL"
  ) {

    currentStage =
      STAGE_FINAL;

  } else {

    currentStage =
      STAGE_INITIAL;
  }


  unsigned long now =
    millis();


  stageStartMillis =
    now - pausedStageElapsed;


  totalStartMillis =
    now - pausedTotalElapsed;


  pausedMode =
    false;


  automaticMode =
    true;


  applyOutputs();


  resetLCDRotation();


  saveRecovery();


  sendStatus();


  Serial.println(
    "Drying RESUMED."
  );
}


// ============================================================
// STOP
// ============================================================

void stopDrying() {

  Serial.println(
    "Drying STOPPED."
  );


  automaticMode =
    false;


  pausedMode =
    false;


  currentStage =
    STAGE_OFF;


  pausedStageElapsed =
    0;


  pausedTotalElapsed =
    0;


  applyOutputs();


  clearRecovery();


  resetLCDRotation();


  sendStatus();
}


// ============================================================
// AUTOMATIC DRYING UPDATE
// ============================================================

void updateAutomaticDrying() {

  if (
    !automaticMode
  ) {

    return;
  }


  unsigned long elapsed =
    getStageElapsed();


  unsigned long duration =
    getStageDuration();


  if (
    elapsed < duration
  ) {

    return;
  }


  // ----------------------------------------------------------
  // INITIAL -> MAIN
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_INITIAL
  ) {

    setStage(
      STAGE_MAIN
    );

    return;
  }


  // ----------------------------------------------------------
  // MAIN -> FINAL
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_MAIN
  ) {

    setStage(
      STAGE_FINAL
    );

    return;
  }


  // ----------------------------------------------------------
  // FINAL -> COMPLETE
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_FINAL
  ) {

    currentStage =
      STAGE_COMPLETE;


    automaticMode =
      false;


    pausedMode =
      false;


    applyOutputs();


    clearRecovery();


    sendStatus();


    Serial.println(
      "Drying COMPLETE."
    );
  }
}


// ============================================================
// SET STAGE
// ============================================================

void setStage(
  DryingStage stage
) {

  currentStage =
    stage;


  stageStartMillis =
    millis();


  pausedStageElapsed =
    0;


  applyOutputs();


  resetLCDRotation();


  saveRecovery();


  sendStatus();


  Serial.print(
    "New stage: "
  );

  Serial.println(
    getStageString()
  );
}


// ============================================================
// APPLY OUTPUTS
// ============================================================

void applyOutputs() {


  // ----------------------------------------------------------
  // INITIAL
  // 100%
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_INITIAL
  ) {

    setFanPWM(255);

    setCoolFan(true);

    return;
  }


  // ----------------------------------------------------------
  // MAIN
  // 75%
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_MAIN
  ) {

    setFanPWM(191);

    setCoolFan(true);

    return;
  }


  // ----------------------------------------------------------
  // FINAL
  // 50%
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_FINAL
  ) {

    setFanPWM(128);

    setCoolFan(true);

    return;
  }


  // ----------------------------------------------------------
  // PAUSED
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_PAUSED
  ) {

    setFanPWM(0);

    setCoolFan(false);

    return;
  }


  // ----------------------------------------------------------
  // COMPLETE
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_COMPLETE
  ) {

    setFanPWM(0);

    setCoolFan(false);

    return;
  }


  // ----------------------------------------------------------
  // SAFETY
  // ----------------------------------------------------------

  if (
    currentStage ==
    STAGE_SAFETY
  ) {

    setFanPWM(0);

    setCoolFan(false);

    return;
  }


  // ----------------------------------------------------------
  // OFF
  // ----------------------------------------------------------

  setFanPWM(0);

  setCoolFan(false);
}


// ============================================================
// FAN PWM
// ============================================================

void setFanPWM(
  int value
) {

  value =
    constrain(
      value,
      0,
      255
    );


  currentFanPWM =
    value;


  ledcWrite(
    MOSFET_FAN_PIN,
    value
  );
}


// ============================================================
// COOL FAN RELAY
// ============================================================

void setCoolFan(
  bool state
) {

  if (state) {

    digitalWrite(
      COOL_FAN_RELAY_PIN,
      RELAY_ON
    );

  } else {

    digitalWrite(
      COOL_FAN_RELAY_PIN,
      RELAY_OFF
    );
  }
}


// ============================================================
// STAGE STRING
// ============================================================

String getStageString() {

  switch (
    currentStage
  ) {

    case STAGE_INITIAL:
      return "INITIAL";

    case STAGE_MAIN:
      return "MAIN";

    case STAGE_FINAL:
      return "FINAL";

    case STAGE_COMPLETE:
      return "COMPLETE";

    case STAGE_PAUSED:
      return "PAUSED";

    case STAGE_SAFETY:
      return "SAFETY";

    default:
      return "OFF";
  }
}


// ============================================================
// MODE STRING
// ============================================================

String getModeString() {

  if (
    currentStage ==
    STAGE_SAFETY
  ) {

    return "SAFETY";
  }


  if (
    currentStage ==
    STAGE_COMPLETE
  ) {

    return "COMPLETE";
  }


  if (
    pausedMode
  ) {

    return "PAUSED";
  }


  if (
    automaticMode
  ) {

    return "AUTO";
  }


  return getStageString();
}


// ============================================================
// STAGE DURATION
// ============================================================

unsigned long getStageDuration() {

  if (
    TEST_MODE
  ) {

    return TEST_STAGE_DURATION;
  }


  switch (
    currentStage
  ) {

    case STAGE_INITIAL:

      return INITIAL_DURATION;


    case STAGE_MAIN:

      return MAIN_DURATION;


    case STAGE_FINAL:

      return FINAL_DURATION;


    default:

      return 0;
  }
}


// ============================================================
// STAGE ELAPSED
// ============================================================

unsigned long getStageElapsed() {

  if (
    pausedMode
  ) {

    return pausedStageElapsed;
  }


  if (
    currentStage !=
      STAGE_INITIAL &&
    currentStage !=
      STAGE_MAIN &&
    currentStage !=
      STAGE_FINAL
  ) {

    return 0;
  }


  return
    millis() -
    stageStartMillis;
}


// ============================================================
// STAGE REMAINING
// ============================================================

unsigned long getStageRemaining() {

  unsigned long duration =
    getStageDuration();


  if (
    duration == 0
  ) {

    return 0;
  }


  unsigned long elapsed =
    getStageElapsed();


  if (
    elapsed >= duration
  ) {

    return 0;
  }


  return duration - elapsed;
}


// ============================================================
// TOTAL ELAPSED
// ============================================================

unsigned long getTotalElapsed() {

  if (
    pausedMode
  ) {

    return pausedTotalElapsed;
  }


  if (
    !automaticMode
  ) {

    return 0;
  }


  return
    millis() -
    totalStartMillis;
}


// ============================================================
// TOTAL REMAINING
// ============================================================

unsigned long getTotalRemaining() {

  const unsigned long totalDuration =
    INITIAL_DURATION +
    MAIN_DURATION +
    FINAL_DURATION;


  unsigned long elapsed =
    getTotalElapsed();


  if (
    elapsed >= totalDuration
  ) {

    return 0;
  }


  return
    totalDuration -
    elapsed;
}


// ============================================================
// LCD ROTATION RESET
// ============================================================

void resetLCDRotation() {

  lcdSensorScreen =
    true;


  lcdScreenStartMillis =
    millis();


  lcd.clear();
}


// ============================================================
// LCD UPDATE
// ============================================================
//
// 1 minute:
// SENSOR SCREEN
//
// 10 minutes:
// MODE + COUNTDOWN SCREEN
//
// ============================================================

void updateLCD() {

  unsigned long now =
    millis();


  unsigned long elapsed =
    now -
    lcdScreenStartMillis;


  // ==========================================================
  // SENSOR SCREEN -> AFTER 1 MINUTE
  // ==========================================================

  if (
    lcdSensorScreen &&
    elapsed >= LCD_SENSOR_TIME
  ) {

    lcdSensorScreen =
      false;


    lcdScreenStartMillis =
      now;


    lcd.clear();
  }


  // ==========================================================
  // MODE SCREEN -> AFTER 10 MINUTES
  // ==========================================================

  else if (
    !lcdSensorScreen &&
    elapsed >= LCD_MODE_TIME
  ) {

    lcdSensorScreen =
      true;


    lcdScreenStartMillis =
      now;


    lcd.clear();
  }


  // ==========================================================
  // SENSOR DISPLAY
  // ==========================================================

  if (
    lcdSensorScreen
  ) {

    lcd.clear();


    // --------------------------------------------------------
    // LINE 1
    // T1 + T2
    // --------------------------------------------------------

    lcd.setCursor(0, 0);


    lcd.print("T1:");

    if (
      validTemperature(temperature1)
    ) {

      lcd.print(
        temperature1,
        1
      );

    } else {

      lcd.print("ERR");
    }


    lcd.print("C ");


    lcd.print("T2:");

    if (
      validTemperature(temperature2)
    ) {

      lcd.print(
        temperature2,
        1
      );

    } else {

      lcd.print("ERR");
    }


    // --------------------------------------------------------
    // LINE 2
    // HUMIDITY + DHT11 TEMP
    // --------------------------------------------------------

    lcd.setCursor(0, 1);


    lcd.print("H:");

    if (
      validHumidity(humidity)
    ) {

      lcd.print(
        humidity,
        0
      );

      lcd.print("%");

    } else {

      lcd.print("ERR");
    }


    lcd.print(" D:");


    if (
      !isnan(dhtTemperature)
    ) {

      lcd.print(
        dhtTemperature,
        1
      );

      lcd.print("C");

    } else {

      lcd.print("ERR");
    }


    return;
  }


  // ==========================================================
  // MODE + TIMER DISPLAY
  // ==========================================================

  lcd.clear();


  // ----------------------------------------------------------
  // LINE 1
  // MODE
  // ----------------------------------------------------------

  lcd.setCursor(0, 0);


  lcd.print("MODE:");


  String mode =
    getStageString();


  lcd.print(mode);


  // ----------------------------------------------------------
  // LINE 2
  // COUNTDOWN
  // ----------------------------------------------------------

  lcd.setCursor(0, 1);


  lcd.print("TIME:");


  unsigned long remaining =
    getStageRemaining();


  unsigned long totalSeconds =
    remaining / 1000;


  unsigned long hours =
    totalSeconds / 3600;


  unsigned long minutes =
    (totalSeconds % 3600) / 60;


  unsigned long seconds =
    totalSeconds % 60;


  // ----------------------------------------------------------
  // HOURS
  // ----------------------------------------------------------

  if (
    hours < 10
  ) {

    lcd.print("0");
  }


  lcd.print(hours);

  lcd.print(":");


  // ----------------------------------------------------------
  // MINUTES
  // ----------------------------------------------------------

  if (
    minutes < 10
  ) {

    lcd.print("0");
  }


  lcd.print(minutes);

  lcd.print(":");


  // ----------------------------------------------------------
  // SECONDS
  // ----------------------------------------------------------

  if (
    seconds < 10
  ) {

    lcd.print("0");
  }


  lcd.print(seconds);
}


// ============================================================
// FIREBASE SENSOR DATA
// ============================================================

void sendSensorData() {

  if (
    !Firebase.ready()
  ) {

    return;
  }


  String base =
    String(BASE_PATH) +
    "/sensors";


  // ----------------------------------------------------------
  // TEMPERATURE 1
  // ----------------------------------------------------------

  if (
    validTemperature(temperature1)
  ) {

    Firebase.RTDB.setFloat(
      &fbdo,
      (base + "/temp1").c_str(),
      temperature1
    );
  }


  // ----------------------------------------------------------
  // TEMPERATURE 2
  // ----------------------------------------------------------

  if (
    validTemperature(temperature2)
  ) {

    Firebase.RTDB.setFloat(
      &fbdo,
      (base + "/temp2").c_str(),
      temperature2
    );
  }


  // ----------------------------------------------------------
  // HUMIDITY
  // ----------------------------------------------------------

  if (
    validHumidity(humidity)
  ) {

    Firebase.RTDB.setFloat(
      &fbdo,
      (base + "/humidity").c_str(),
      humidity
    );
  }
}


// ============================================================
// FIREBASE STATUS
// ============================================================

void sendStatus() {

  if (
    !Firebase.ready()
  ) {

    return;
  }


  String base =
    String(BASE_PATH) +
    "/status";


  // ----------------------------------------------------------
  // MODE
  // ----------------------------------------------------------

  Firebase.RTDB.setString(
    &fbdo,
    (base + "/mode").c_str(),
    getModeString()
  );


  // ----------------------------------------------------------
  // STAGE
  // ----------------------------------------------------------

  Firebase.RTDB.setString(
    &fbdo,
    (base + "/stage").c_str(),
    getStageString()
  );


  // ----------------------------------------------------------
  // PWM
  // ----------------------------------------------------------

  Firebase.RTDB.setInt(
    &fbdo,
    (base + "/pwm").c_str(),
    currentFanPWM
  );


  // ----------------------------------------------------------
  // AUTOMATIC
  // ----------------------------------------------------------

  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/automatic").c_str(),
    automaticMode
  );


  // ----------------------------------------------------------
  // PAUSED
  // ----------------------------------------------------------

  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/paused").c_str(),
    pausedMode
  );


  // ----------------------------------------------------------
  // COOL FAN
  // ----------------------------------------------------------

  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/coolFan").c_str(),
    digitalRead(
      COOL_FAN_RELAY_PIN
    ) == RELAY_ON
  );


  // ----------------------------------------------------------
  // SENSOR HEALTH
  // ----------------------------------------------------------

  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/temp1Healthy").c_str(),
    temp1Healthy
  );


  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/temp2Healthy").c_str(),
    temp2Healthy
  );


  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/humidityHealthy").c_str(),
    humidityHealthy
  );


  // ----------------------------------------------------------
  // STAGE ELAPSED
  // ----------------------------------------------------------

  Firebase.RTDB.setInt(
    &fbdo,
    (base + "/stageElapsedSeconds").c_str(),
    getStageElapsed() / 1000
  );


  // ----------------------------------------------------------
  // STAGE REMAINING
  // ----------------------------------------------------------

  Firebase.RTDB.setInt(
    &fbdo,
    (base + "/stageRemainingSeconds").c_str(),
    getStageRemaining() / 1000
  );


  // ----------------------------------------------------------
  // TOTAL ELAPSED
  // ----------------------------------------------------------

  Firebase.RTDB.setInt(
    &fbdo,
    (base + "/totalElapsedSeconds").c_str(),
    getTotalElapsed() / 1000
  );


  // ----------------------------------------------------------
  // TOTAL REMAINING
  // ----------------------------------------------------------

  Firebase.RTDB.setInt(
    &fbdo,
    (base + "/totalRemainingSeconds").c_str(),
    getTotalRemaining() / 1000
  );
}


// ============================================================
// FIREBASE HEARTBEAT
// ============================================================

void sendHeartbeat() {

  if (
    !Firebase.ready()
  ) {

    return;
  }


  String base =
    String(BASE_PATH) +
    "/status";


  // ----------------------------------------------------------
  // ONLINE
  // ----------------------------------------------------------

  Firebase.RTDB.setBool(
    &fbdo,
    (base + "/online").c_str(),
    true
  );


  // ----------------------------------------------------------
  // WIFI
  // ----------------------------------------------------------

  Firebase.RTDB.setString(
    &fbdo,
    (base + "/wifi").c_str(),
    WiFi.SSID()
  );


  // ----------------------------------------------------------
  // IP
  // ----------------------------------------------------------

  Firebase.RTDB.setString(
    &fbdo,
    (base + "/ip").c_str(),
    WiFi.localIP().toString()
  );


  // ----------------------------------------------------------
  // LAST SEEN
  // ----------------------------------------------------------

  FirebaseJson json;

  json.set(
    "lastSeen/.sv",
    "timestamp"
  );


  Firebase.RTDB.setJSON(
    &fbdo,
    (base + "/lastSeen").c_str(),
    &json
  );
}


// ============================================================
// FIREBASE HISTORY
// ============================================================

void sendHistory() {

  if (
    !Firebase.ready()
  ) {

    return;
  }


  FirebaseJson json;


  // ----------------------------------------------------------
  // SENSOR VALUES
  // ----------------------------------------------------------

  if (
    validTemperature(temperature1)
  ) {

    json.set(
      "temp1",
      temperature1
    );
  }


  if (
    validTemperature(temperature2)
  ) {

    json.set(
      "temp2",
      temperature2
    );
  }


  if (
    validHumidity(humidity)
  ) {

    json.set(
      "humidity",
      humidity
    );
  }


  if (
    !isnan(dhtTemperature)
  ) {

    json.set(
      "dht11Temperature",
      dhtTemperature
    );
  }


  // ----------------------------------------------------------
  // SYSTEM DATA
  // ----------------------------------------------------------

  json.set(
    "stage",
    getStageString()
  );


  json.set(
    "mode",
    getModeString()
  );


  json.set(
    "pwm",
    currentFanPWM
  );


  json.set(
    "automatic",
    automaticMode
  );


  json.set(
    "paused",
    pausedMode
  );


  json.set(
    "stageRemainingSeconds",
    getStageRemaining() / 1000
  );


  json.set(
    "totalRemainingSeconds",
    getTotalRemaining() / 1000
  );


  json.set(
    "timestamp/.sv",
    "timestamp"
  );


  // ----------------------------------------------------------
  // PUSH HISTORY
  // ----------------------------------------------------------

  String path =
    String(BASE_PATH) +
    "/history";


  Firebase.RTDB.pushJSON(
    &fbdo,
    path.c_str(),
    &json
  );
}


// ============================================================
// SAVE RECOVERY
// ============================================================

void saveRecovery() {

  if (
    currentStage ==
    STAGE_INITIAL
  ) {

    preferences.putString(
      "stage",
      "INITIAL"
    );

  } else if (
    currentStage ==
    STAGE_MAIN
  ) {

    preferences.putString(
      "stage",
      "MAIN"
    );

  } else if (
    currentStage ==
    STAGE_FINAL
  ) {

    preferences.putString(
      "stage",
      "FINAL"
    );

  } else {

    preferences.putString(
      "stage",
      "OFF"
    );
  }


  preferences.putULong(
    "stageElapsed",
    getStageElapsed()
  );


  preferences.putULong(
    "totalElapsed",
    getTotalElapsed()
  );


  preferences.putBool(
    "automatic",
    automaticMode
  );


  preferences.putBool(
    "paused",
    pausedMode
  );
}


// ============================================================
// RESTORE RECOVERY
// ============================================================

void restoreRecovery() {

  bool savedAutomatic =
    preferences.getBool(
      "automatic",
      false
    );


  bool savedPaused =
    preferences.getBool(
      "paused",
      false
    );


  String savedStage =
    preferences.getString(
      "stage",
      "OFF"
    );


  unsigned long savedStageElapsed =
    preferences.getULong(
      "stageElapsed",
      0
    );


  unsigned long savedTotalElapsed =
    preferences.getULong(
      "totalElapsed",
      0
    );


  if (
    savedPaused
  ) {

    if (
      savedStage == "INITIAL"
    ) {

      currentStage =
        STAGE_INITIAL;

    } else if (
      savedStage == "MAIN"
    ) {

      currentStage =
        STAGE_MAIN;

    } else if (
      savedStage == "FINAL"
    ) {

      currentStage =
        STAGE_FINAL;

    } else {

      currentStage =
        STAGE_OFF;
    }


    pausedStageElapsed =
      savedStageElapsed;


    pausedTotalElapsed =
      savedTotalElapsed;


    pausedMode =
      true;


    automaticMode =
      false;


    Serial.println(
      "Recovered PAUSED state."
    );


    return;
  }


  if (
    savedAutomatic
  ) {

    if (
      savedStage == "INITIAL"
    ) {

      currentStage =
        STAGE_INITIAL;

    } else if (
      savedStage == "MAIN"
    ) {

      currentStage =
        STAGE_MAIN;

    } else if (
      savedStage == "FINAL"
    ) {

      currentStage =
        STAGE_FINAL;

    } else {

      currentStage =
        STAGE_OFF;
    }


    if (
      currentStage !=
        STAGE_OFF
    ) {

      unsigned long now =
        millis();


      stageStartMillis =
        now -
        savedStageElapsed;


      totalStartMillis =
        now -
        savedTotalElapsed;


      automaticMode =
        true;


      pausedMode =
        false;


      Serial.println(
        "Recovered automatic drying."
      );


      return;
    }
  }


  currentStage =
    STAGE_OFF;


  automaticMode =
    false;


  pausedMode =
    false;
}


// ============================================================
// CLEAR RECOVERY
// ============================================================

void clearRecovery() {

  preferences.putString(
    "stage",
    "OFF"
  );


  preferences.putULong(
    "stageElapsed",
    0
  );


  preferences.putULong(
    "totalElapsed",
    0
  );


  preferences.putBool(
    "automatic",
    false
  );


  preferences.putBool(
    "paused",
    false
);
}
