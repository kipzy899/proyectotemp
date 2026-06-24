#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <time.h>

// ============== CONFIGURACIÓN DE RED ==============
// Red 1
const char* ssid1 = "micromicro";
const char* password1 = "micromicro";

// Red 2
const char* ssid2 = "Carlucci";
const char* password2 = "valu1107";

// ============== CONFIGURACIÓN MQTT ==============
const char* mqtt_server = "1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "tu_usuario_mqtt";      // CAMBIAR
const char* mqtt_password = "tu_contraseña_mqtt"; // CAMBIAR
const char* mqtt_topic = "esp32/temperatura_humedad";

// ============== CONFIGURACIÓN DHT11 ==============
#define DHTPIN 18
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ============== VARIABLES GLOBALES ==============
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 60000; // 60 segundos (1 minuto)
bool mqtt_connected = false;
int reconnect_attempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 5;

// ============== PROTOTIPOS ==============
void setup();
void loop();
void setupWiFi();
void connectToWiFi(const char* ssid, const char* password);
void setupMQTT();
void reconnectMQTT();
void publishSensorData();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void printStatus();

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n=== ESP32 DHT11 MQTT ===");
  Serial.println("Inicializando...");
  
  // Inicializar DHT
  dht.begin();
  delay(1000);
  
  // Configurar WiFi
  setupWiFi();
  
  // Configurar MQTT
  setupMQTT();
  
  // Sincronizar hora (importante para certificados SSL)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Esperando sincronización de hora...");
  time_t now = time(nullptr);
  int attempts = 0;
  while (now < 24 * 3600 * 2 && attempts < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }
  Serial.println();
  
  lastSensorRead = 0; // Leer sensor inmediatamente
}

void loop() {
  // Mantener conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Intentando reconectar...");
    setupWiFi();
  }
  
  // Mantener conexión MQTT
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Leer sensor cada 60 segundos
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    publishSensorData();
  }
  
  delay(100);
}

void setupWiFi() {
  Serial.println("\n=== Iniciando WiFi ===");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(100);
  
  Serial.println("Buscando redes disponibles...");
  int n = WiFi.scanNetworks();
  Serial.print("Se encontraron ");
  Serial.print(n);
  Serial.println(" redes");
  
  bool found_ssid1 = false;
  bool found_ssid2 = false;
  
  for (int i = 0; i < n; ++i) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    Serial.print("  ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.print(ssid);
    Serial.print(" (RSSI: ");
    Serial.print(rssi);
    Serial.println(")");
    
    if (ssid == ssid1) found_ssid1 = true;
    if (ssid == ssid2) found_ssid2 = true;
  }
  
  // Intentar conectar a la primera red disponible
  if (found_ssid1) {
    Serial.println("\nIntentando conectar a: micromicro");
    connectToWiFi(ssid1, password1);
  } else if (found_ssid2) {
    Serial.println("\nIntentando conectar a: Carlucci");
    connectToWiFi(ssid2, password2);
  } else {
    Serial.println("ERROR: No se encontraron las redes configuradas");
  }
}

void connectToWiFi(const char* ssid, const char* password) {
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado");
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n✗ No se pudo conectar a WiFi");
  }
}

void setupMQTT() {
  Serial.println("\n=== Configurando MQTT ===");
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void reconnectMQTT() {
  if (!client.connected()) {
    reconnect_attempts++;
    
    if (reconnect_attempts > MAX_RECONNECT_ATTEMPTS) {
      Serial.println("Demasiados intentos de reconexión MQTT. Reiniciando WiFi...");
      setupWiFi();
      reconnect_attempts = 0;
      return;
    }
    
    Serial.print("Conectando a MQTT (intento ");
    Serial.print(reconnect_attempts);
    Serial.print("/");
    Serial.print(MAX_RECONNECT_ATTEMPTS);
    Serial.print(")... ");
    
    if (client.connect("ESP32-DHT11", mqtt_user, mqtt_password)) {
      Serial.println("✓ Conectado a MQTT");
      mqtt_connected = true;
      reconnect_attempts = 0;
      
      // Suscribirse a tópicos si es necesario
      // client.subscribe("esp32/commands");
    } else {
      Serial.print("✗ Error: ");
      Serial.println(client.state());
      mqtt_connected = false;
    }
  }
}

void publishSensorData() {
  // Leer sensores
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Verificar lecturas
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("✗ Error al leer el DHT11");
    return;
  }
  
  // Obtener marca de tiempo
  time_t now = time(nullptr);
  struct tm timeinfo = *localtime(&now);
  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  
  // Crear JSON
  StaticJsonDocument<200> doc;
  doc["temperatura"] = round(temperature * 10) / 10.0; // Redondear a 1 decimal
  doc["humedad"] = round(humidity * 10) / 10.0;       // Redondear a 1 decimal
  doc["timestamp"] = timestamp;
  doc["dispositivo"] = "ESP32-DHT11";
  
  // Serializar JSON
  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  
  // Publicar
  if (client.publish(mqtt_topic, buffer)) {
    Serial.println("\n=== DATOS ENVIADOS ===");
    Serial.print("Temperatura: ");
    Serial.print(temperature);
    Serial.println(" °C");
    Serial.print("Humedad: ");
    Serial.print(humidity);
    Serial.println(" %");
    Serial.print("Timestamp: ");
    Serial.println(timestamp);
    Serial.print("JSON: ");
    Serial.println(buffer);
    Serial.println("========================\n");
  } else {
    Serial.println("✗ Error al publicar en MQTT");
  }
  
  printStatus();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Callback para mensajes MQTT recibidos
  Serial.print("Mensaje recibido en tópico: ");
  Serial.println(topic);
  
  // Si necesitas procesar comandos, hazlo aquí
}

void printStatus() {
  Serial.println("\n=== ESTADO DEL SISTEMA ===");
  Serial.print("WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("✓ Conectado (");
    Serial.print(WiFi.SSID());
    Serial.print(" - ");
    Serial.print(WiFi.localIP());
    Serial.println(")");
  } else {
    Serial.println("✗ Desconectado");
  }
  
  Serial.print("MQTT: ");
  if (client.connected()) {
    Serial.println("✓ Conectado");
  } else {
    Serial.println("✗ Desconectado");
  }
  
  Serial.println("==========================\n");
}
