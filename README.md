# ESP32 DHT11 MQTT - Sistema de Monitoreo de Temperatura y Humedad

## Descripción
Proyecto completo para monitorear temperatura y humedad usando un ESP32 Lilygo T-Display S3, sensor DHT11 y envío de datos vía MQTT a Supabase.

## Componentes
- **ESP32 Lilygo T-Display S3**
- **Sensor DHT11**
- **Broker MQTT**: HiveMQ Cloud
- **Base de datos**: Supabase
- **Frontend**: Web responsiva (HTML5 + CSS3 + JavaScript)

## Características
✅ Conexión automática a múltiples redes Wi-Fi  
✅ Lectura de temperatura y humedad cada minuto  
✅ Envío de datos por MQTT  
✅ Web responsiva con paleta de colores personalizada  
✅ Botones para alternar entre datos actuales e históricos  
✅ Almacenamiento en Supabase  

## Requisitos
- Arduino IDE 1.8.19 o superior
- Librerías necesarias (ver sección de instalación)
- Cuenta en HiveMQ Cloud
- Cuenta en Supabase

## Instalación en Arduino IDE

### 1. Añadir la placa ESP32
1. Ve a **Archivo → Preferencias**
2. En "URL adicionales de gestor de tarjetas", añade:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Ve a **Herramientas → Placa → Gestor de placas**
4. Busca "ESP32" e instala "esp32 by Espressif Systems"

### 2. Configurar la placa
- **Placa**: TTGO T-Display-S3
- **Upload Speed**: 921600
- **CPU Frequency**: 240MHz
- **Flash Size**: 16MB
- **Partition Scheme**: Huge APP (3MB No OTA/1MB SPIFFS)

### 3. Instalar librerías
Ve a **Herramientas → Gestionar librerías** e instala:
- DHT sensor library by Adafruit (v1.4.4)
- PubSubClient by Nick O'Leary (v2.8.0)
- ArduinoJson by Benoit Blanchon (v6.21.0)

### 4. Cargar el código
1. Copia el contenido de `esp32_code.ino`
2. Pega en Arduino IDE
3. Conecta el ESP32 por USB
4. Selecciona el puerto COM correcto
5. Haz clic en **Subir**

## Configuración de pines
```
DHT11 → GPIO 18 (Data)
GND → GND
5V → 5V
```

## Variables de conexión
Edita el archivo `esp32_code.ino` y configura:
```cpp
// Redes Wi-Fi
const char* ssid1 = "micromicro";
const char* password1 = "micromicro";
const char* ssid2 = "Carlucci";
const char* password2 = "valu1107";

// MQTT
const char* mqtt_server = "1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "TU_USUARIO";
const char* mqtt_password = "TU_CONTRASEÑA";
```

## Estructura de la Base de Datos (Supabase)

Crea una tabla llamada `lecturas` con las siguientes columnas:
```sql
CREATE TABLE lecturas (
  id BIGSERIAL PRIMARY KEY,
  temperatura FLOAT NOT NULL,
  humedad FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dispositivo VARCHAR(50) DEFAULT 'ESP32-DHT11'
);
```

## Tópicos MQTT
- **Publicar datos**: `esp32/temperatura_humedad`
- **Formato JSON**:
```json
{
  "temperatura": 24.5,
  "humedad": 65.3,
  "timestamp": "2026-06-24T15:30:00Z"
}
```

## Solución de problemas

### El ESP32 no aparece en Arduino IDE
- Instala los drivers CH340: https://sparks.gogo.co.nz/ch340.html
- Reinicia Arduino IDE

### No se conecta al Wi-Fi
- Verifica que las credenciales sean correctas
- Prueba primero con una sola red Wi-Fi
- Comprueba que el ESP32 esté dentro del rango de la red

### Los datos no llegan a MQTT
- Verifica credenciales MQTT en HiveMQ Cloud
- Comprueba que el puerto 8883 esté abierto
- Revisa la consola serial para mensajes de error

## Estructura del proyecto
```
esp32-dht11-mqtt/
├── README.md
├── esp32_code.ino
└── web/
    ├── index.html
    ├── styles.css
    └── script.js
```

## Licencia
MIT

## Autor
kipzy899
