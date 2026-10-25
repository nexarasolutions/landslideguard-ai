/*
 * ====================================================================
 * LandslideGuard AI — Production ESP32 Telemetry & Early-Warning Node
 * Hardware: ESP32 DevKit V1 (30/38 pin)
 * Backend Target: https://landslideguard-ai-flye.onrender.com/api/stations/STN-001/telemetry
 * Organization: Nexara Auto Tech Solutions
 * ====================================================================
 * 
 * SENSOR PINOUT (ADC1 ONLY — SAFE WITH WI-FI):
 * --------------------------------------------------------------------
 * 1. Capacitive/Resistive Soil Sensor : Analog OUT -> GPIO 32 (ADC1_CH4)
 * 2. Raindrop Sensor (FC-37/YL-83)    : Analog OUT -> GPIO 34 (ADC1_CH6 - Input only)
 * 3. Voltage Divider Module (0-25V)   : Signal (S) -> GPIO 35 (ADC1_CH7 - Input only)
 * 4. Vibration Sensor (SW-420/801S)   : Digital DO -> GPIO 18 (Input Pullup)
 * 5. I2C Bus (Shared by LCD & MPU6050):
 *      - SDA                           -> GPIO 21
 *      - SCL                           -> GPIO 22
 *      - LCD 16x2 I2C Address         -> 0x27 (or 0x3F)
 *      - MPU6050 Accelerometer/Gyro    -> 0x68 (AD0 to GND) or 0x69
 * 6. GPS Module (NEO-6M / NEO-7M)     :
 *      - GPS TX                        -> ESP32 RX2 (GPIO 16)
 *      - GPS RX                        -> ESP32 TX2 (GPIO 17)
 *      - Baud Rate                     -> 9600
 * 7. Power Supply:
 *      - ESP32 V5 / VIN to 5V (USB or 5V regulator)
 *      - ALL SENSORS share a COMMON GROUND (GND) with ESP32!
 * ====================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <math.h>

// ====================================================================
// 1. NETWORK & CLOUD BACKEND CONFIGURATION
// ====================================================================
// NOTE: ESP32 only supports 2.4 GHz Wi-Fi! If using phone hotspot:
// iPhone: Turn ON "Maximize Compatibility".
// Android: Select 2.4 GHz AP Band in Hotspot settings.
const char* WIFI_SSID     = "MyHotspot";      // CHANGE TO YOUR HOTSPOT NAME
const char* WIFI_PASSWORD = "password123";  // CHANGE TO YOUR HOTSPOT PASSWORD

const char* BACKEND_URL   = "https://landslideguard-ai-flye.onrender.com/api/stations/STN-001/telemetry";
const char* STATION_ID    = "STN-001";
const unsigned long UPLOAD_INTERVAL_MS = 10000; // Upload every 10 seconds

// ====================================================================
// 2. PIN ASSIGNMENTS
// ====================================================================
#define PIN_SOIL_ADC     32  // ADC1
#define PIN_RAIN_ADC     34  // ADC1
#define PIN_VOLTAGE_ADC  35  // ADC1
#define PIN_VIBRATION    18  // Digital Input

#define I2C_SDA          21
#define I2C_SCL          22

// Hardware Serial 2 for GPS
#define GPS_RX_PIN       16
#define GPS_TX_PIN       17
#define GPS_BAUD         9600

// ====================================================================
// 3. CALIBRATION CONSTANTS
// ====================================================================
// Soil Moisture Calibration (12-bit ADC: 0 - 4095)
// Submerge in cup of water = WET_ADC (~1400-1800)
// Hold in dry air = DRY_ADC (~3400-3800)
const int SOIL_DRY_ADC   = 3600;
const int SOIL_WET_ADC   = 1500;

// Rain Sensor Calibration
const int RAIN_DRY_ADC   = 4000;
const int RAIN_WET_ADC   = 1200;

// Voltage Sensor Divider Resistors (R1 = 30k, R2 = 7.5k -> 5:1 ratio)
const float VOLTAGE_DIVIDER_RATIO = 5.0;
const float ADC_REF_VOLTAGE       = 3.3;

// ====================================================================
// 4. HARDWARE OBJECTS & GLOBALS
// ====================================================================
LiquidCrystal_I2C lcd(0x27, 16, 2);
bool lcdAvailable = false;
bool mpuAvailable = false;
uint8_t mpuAddress = 0x68;

volatile unsigned long vibrationPulses = 0;
unsigned long lastUploadTime = 0;
unsigned long lastSampleTime = 0;

// Interrupt Service Routine for Vibration Sensor
void IRAM_ATTR onVibrationInterrupt() {
  vibrationPulses++;
}

// ====================================================================
// 5. I2C SCANNER & SENSOR INITIALIZERS
// ====================================================================
void scanI2CBus() {
  Serial.println("\n--- Scanning I2C Bus on SDA:21, SCL:22 ---");
  byte count = 0;
  for (byte i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.printf("[I2C] Found device at address 0x%02X\n", i);
      if (i == 0x27 || i == 0x3F) {
        lcdAvailable = true;
      }
      if (i == 0x68 || i == 0x69) {
        mpuAvailable = true;
        mpuAddress = i;
      }
      count++;
    }
  }
  if (count == 0) {
    Serial.println("[I2C] WARNING: No I2C devices found! Check 3.3V/5V and GND wires.");
  }
}

void initMPU6050() {
  if (!mpuAvailable) {
    Serial.println("[MPU6050] Not detected during I2C scan. Verifying address 0x68...");
    Wire.beginTransmission(0x68);
    if (Wire.endTransmission() == 0) {
      mpuAvailable = true;
      mpuAddress = 0x68;
    }
  }

  if (mpuAvailable) {
    // Wake up MPU6050 by writing 0 to Power Management 1 register (0x6B)
    Wire.beginTransmission(mpuAddress);
    Wire.write(0x6B);
    Wire.write(0x00);
    byte err = Wire.endTransmission();
    if (err == 0) {
      Serial.printf("[MPU6050] Successfully awakened at 0x%02X!\n", mpuAddress);
    } else {
      Serial.printf("[MPU6050] Wake-up write failed, error code: %d\n", err);
      mpuAvailable = false;
    }
  } else {
    Serial.println("[MPU6050] FAILED: MPU6050 accelerometer not detected. Connect AD0 to GND, VCC to 3.3V/5V.");
  }
}

// Read raw acceleration from MPU6050 and compute tilt angle (degrees)
float readMPU6050Tilt() {
  if (!mpuAvailable) return 0.0;

  Wire.beginTransmission(mpuAddress);
  Wire.write(0x3B); // ACCEL_XOUT_H register
  if (Wire.endTransmission(false) != 0) {
    return 0.0;
  }

  Wire.requestFrom(mpuAddress, (uint8_t)6, (uint8_t)true);
  if (Wire.available() < 6) return 0.0;

  int16_t ax = (Wire.read() << 8) | Wire.read();
  int16_t ay = (Wire.read() << 8) | Wire.read();
  int16_t az = (Wire.read() << 8) | Wire.read();

  // Convert to g-force
  float ax_g = (float)ax / 16384.0;
  float ay_g = (float)ay / 16384.0;
  float az_g = (float)az / 16384.0;

  // Calculate Pitch and Roll in degrees
  float pitch = atan2(-ax_g, sqrt(ay_g * ay_g + az_g * az_g)) * 180.0 / PI;
  float roll  = atan2(ay_g, az_g) * 180.0 / PI;

  float maxTilt = fmax(fabs(pitch), fabs(roll));
  return round(maxTilt * 100.0) / 100.0;
}

// ====================================================================
// 6. SENSOR READING FUNCTIONS
// ====================================================================

// Read Soil Moisture Percentage (0% to 100%)
float readSoilMoisture(int &rawOut) {
  rawOut = analogRead(PIN_SOIL_ADC);
  if (rawOut >= 4090) return 0.0;   // Sensor unplugged or fully dry
  if (rawOut <= 100) return 100.0;  // Direct short or fully saturated

  // Invert because higher ADC value = drier soil on analog sensors
  float pct = ((float)(SOIL_DRY_ADC - rawOut) / (float)(SOIL_DRY_ADC - SOIL_WET_ADC)) * 100.0;
  pct = constrain(pct, 0.0, 100.0);
  return round(pct * 10.0) / 10.0;
}

// Read Rain Rate (mm/h)
float readRainfall(int &rawOut) {
  rawOut = analogRead(PIN_RAIN_ADC);
  if (rawOut >= 3900) return 0.0; // Dry rain sensor plate

  float intensity = ((float)(RAIN_DRY_ADC - rawOut) / (float)(RAIN_DRY_ADC - RAIN_WET_ADC)) * 35.0;
  intensity = constrain(intensity, 0.0, 60.0);
  return round(intensity * 10.0) / 10.0;
}

// Read Battery / Solar DC Voltage (Volts)
float readVoltage(int &rawOut) {
  rawOut = analogRead(PIN_VOLTAGE_ADC);
  if (rawOut < 40) return 0.0; // Disconnected / floating ground

  float pinVoltage = ((float)rawOut / 4095.0) * ADC_REF_VOLTAGE;
  float actualVoltage = pinVoltage * VOLTAGE_DIVIDER_RATIO;
  return round(actualVoltage * 100.0) / 100.0;
}

// Read and reset vibration metric
float readVibration() {
  unsigned long pulses = vibrationPulses;
  vibrationPulses = 0; // Reset counter for next sample window
  float vibMmS = (float)pulses * 0.15;
  if (vibMmS > 25.0) vibMmS = 25.0;
  return round(vibMmS * 100.0) / 100.0;
}

// ====================================================================
// 7. WI-FI CONNECTION & RECONNECT
// ====================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 12000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    if (lcdAvailable) {
      lcd.setCursor(0, 0);
      lcd.print("WiFi Connected! ");
      lcd.setCursor(0, 1);
      lcd.print(WiFi.localIP());
      delay(1500);
    }
  } else {
    Serial.println("\n[WiFi] Failed to connect to hotspot!");
    Serial.println("[WiFi] Check: (1) 2.4 GHz only, (2) SSID/password spelling, (3) Maximize Compatibility enabled.");
    if (lcdAvailable) {
      lcd.setCursor(0, 0);
      lcd.print("WiFi Offline    ");
      lcd.setCursor(0, 1);
      lcd.print("Check 2.4G Phone");
    }
  }
}

// ====================================================================
// 8. TELEMETRY HTTPS UPLOAD TO RENDER BACKEND
// ====================================================================
bool uploadTelemetry(float soil, float rain, float tilt, float vib, float volt) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Cloud] Skipping upload: Wi-Fi is offline.");
    connectWiFi();
    return false;
  }

  // Calculate battery percentage from voltage
  int batteryPct = 100;
  if (volt > 0.5) {
    if (volt <= 5.0) {
      batteryPct = constrain((int)((volt / 4.2) * 100.0), 5, 100);
    } else {
      batteryPct = constrain((int)((volt / 13.6) * 100.0), 5, 100);
    }
  }

  // Create JSON payload matching backend TelemetryUpdate schema exactly
  String jsonPayload = "{";
  jsonPayload += "\"station_id\":\"" + String(STATION_ID) + "\",";
  jsonPayload += "\"soil\":" + String(soil, 1) + ",";
  jsonPayload += "\"rainfall\":" + String(rain, 1) + ",";
  jsonPayload += "\"tilt\":" + String(tilt, 2) + ",";
  jsonPayload += "\"vibration\":" + String(vib, 2) + ",";
  jsonPayload += "\"voltage\":" + String(volt, 2) + ",";
  jsonPayload += "\"battery\":" + String(batteryPct) + ",";
  jsonPayload += "\"lat\":11.4000,";
  jsonPayload += "\"lng\":76.7000";
  jsonPayload += "}";

  Serial.println("\n[Cloud] Sending Telemetry Payload to Render Backend:");
  Serial.println(jsonPayload);

  WiFiClientSecure client;
  client.setInsecure(); // Skip TLS certificate authority verification on ESP32

  HTTPClient https;
  https.setTimeout(6000);

  if (https.begin(client, BACKEND_URL)) {
    https.addHeader("Content-Type", "application/json");
    https.addHeader("User-Agent", "LandslideGuard-ESP32/1.0");

    int httpCode = https.POST(jsonPayload);
    String response = https.getString();

    Serial.printf("[Cloud] HTTP Response Code: %d\n", httpCode);

    if (httpCode == 200 || httpCode == 201) {
      Serial.println("[Cloud] SUCCESS: Telemetry saved & updated in Supabase!");
      Serial.printf("[Cloud] Backend Response: %s\n", response.c_str());
      https.end();
      return true;
    } else {
      Serial.printf("[Cloud] ERROR: Backend returned error code: %d\n", httpCode);
      Serial.printf("[Cloud] Error Body: %s\n", response.c_str());
      https.end();
      return false;
    }
  } else {
    Serial.println("[Cloud] ERROR: Unable to establish HTTPS connection to Render!");
    return false;
  }
}

// ====================================================================
// 9. SETUP
// ====================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==============================================");
  Serial.println("  LANDSLIDEGUARD AI — ESP32 TELEMETRY NODE");
  Serial.println("  Station ID: STN-001");
  Serial.println("==============================================");

  // Configure ADC & Pin Modes
  analogReadResolution(12); // 12-bit ADC (0 - 4095)
  pinMode(PIN_VIBRATION, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_VIBRATION), onVibrationInterrupt, FALLING);

  // Start I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  scanI2CBus();

  // Initialize LCD
  if (lcdAvailable) {
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("LandslideGuardAI");
    lcd.setCursor(0, 1);
    lcd.print("Booting node...");
  }

  // Initialize MPU6050
  initMPU6050();

  // Connect to Wi-Fi
  connectWiFi();

  Serial.println("\n[Setup] Node initialization complete. Starting loop...");
}

// ====================================================================
// 10. MAIN LOOP
// ====================================================================
void loop() {
  // Read all sensors
  int rawSoil = 0;
  int rawRain = 0;
  int rawVolt = 0;

  float soilPct = readSoilMoisture(rawSoil);
  float rainMm  = readRainfall(rawRain);
  float tiltDeg = readMPU6050Tilt();
  float vibMmS  = readVibration();
  float voltVal = readVoltage(rawVolt);

  // Print raw values and processed metrics to Serial Monitor
  Serial.println("\n===== [SENSOR TELEMETRY TELEMETRY] =====");
  Serial.printf("Soil Moisture : %5.1f %%  (Raw ADC: %4d) [Dry:%d, Wet:%d]\n", soilPct, rawSoil, SOIL_DRY_ADC, SOIL_WET_ADC);
  Serial.printf("Rainfall Rate : %5.1f mm/h(Raw ADC: %4d)\n", rainMm, rawRain);
  Serial.printf("Ground Tilt   : %5.2f deg (MPU: %s at 0x%02X)\n", tiltDeg, mpuAvailable ? "ACTIVE" : "OFFLINE", mpuAddress);
  Serial.printf("Vibration     : %5.2f mm/s(Pulses: %lu)\n", vibMmS, vibrationPulses);
  Serial.printf("Power Rail    : %5.2f V   (Raw ADC: %4d)\n", voltVal, rawVolt);
  Serial.printf("Wi-Fi Status  : %s (IP: %s)\n", (WiFi.status() == WL_CONNECTED) ? "ONLINE" : "OFFLINE", WiFi.localIP().toString().c_str());

  // Update 16x2 LCD
  if (lcdAvailable) {
    lcd.setCursor(0, 0);
    char line1[17];
    snprintf(line1, sizeof(line1), "S:%3.0f%% R:%4.1fmm", soilPct, rainMm);
    lcd.print(line1);

    lcd.setCursor(0, 1);
    char line2[17];
    const char* wifiTag = (WiFi.status() == WL_CONNECTED) ? "ON" : "OFF";
    snprintf(line2, sizeof(line2), "T:%3.1f V:%3.1f W:%s", tiltDeg, vibMmS, wifiTag);
    lcd.print(line2);
  }

  // Upload to Render Backend on interval
  unsigned long currentMillis = millis();
  if (currentMillis - lastUploadTime >= UPLOAD_INTERVAL_MS) {
    lastUploadTime = currentMillis;
    uploadTelemetry(soilPct, rainMm, tiltDeg, vibMmS, voltVal);
  }

  delay(2000);
}
