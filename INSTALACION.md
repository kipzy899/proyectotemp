# 🚀 Guía Completa de Instalación y Configuración

## Paso 1: Preparar Arduino IDE

### 1.1 Descargar Arduino IDE
- Ve a https://www.arduino.cc/en/software
- Descarga la versión 1.8.19 o superior
- Instala normalmente

### 1.2 Agregar soporte para ESP32

1. Abre Arduino IDE
2. Ve a **Archivo → Preferencias**
3. En el campo "URLs adicionales de Gestor de Tarjetas", añade:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Haz clic en OK
5. Ve a **Herramientas → Placa → Gestor de Placas**
6. Busca "esp32" (escribe sin comillas)
7. Haz clic en la entrada "esp32 by Espressif Systems"
8. Selecciona versión **2.0.11 o superior**
9. Haz clic en **Instalar**
10. Espera a que termine (puede tardar varios minutos)

### 1.3 Instalar Drivers USB (si es necesario)

Para el Lilygo T-Display S3:
- **Windows**: Descarga e instala drivers CH340 desde: https://sparks.gogo.co.nz/ch340.html
- **macOS**: Por lo general no necesita drivers
- **Linux**: Ejecuta `sudo apt install ch340g` (o equivalente)

### 1.4 Instalar Librerías Necesarias

1. Ve a **Herramientas → Gestionar librerías**
2. Instala estas librerías (una por una):

   **Librería 1: DHT sensor library**
   - Busca: `DHT sensor library`
   - Autor: Adafruit
   - Versión: 1.4.4 o superior
   - Haz clic en INSTALAR

   **Librería 2: PubSubClient**
   - Busca: `PubSubClient`
   - Autor: Nick O'Leary
   - Versión: 2.8.0 o superior
   - Haz clic en INSTALAR

   **Librería 3: ArduinoJson**
   - Busca: `ArduinoJson`
   - Autor: Benoit Blanchon
   - Versión: 6.21.0 o superior
   - Haz clic en INSTALAR

## Paso 2: Conexión del Hardware

### 2.1 Esquema de conexión DHT11 → ESP32

```
DHT11 (Sensor de temperatura/humedad)
├─ Pin 1 (VCC) → 5V del ESP32
├─ Pin 2 (DATA) → GPIO 18 del ESP32
├─ Pin 3 (NC) → No conectar
└─ Pin 4 (GND) → GND del ESP32

Puedes usar una resistencia pull-up de 4.7kΩ entre VCC y DATA (opcional)
```

### 2.2 Conexión USB

1. Conecta el Lilygo T-Display S3 al computador con el cable USB-C
2. El ESP32 debería reconocerse automáticamente

## Paso 3: Configuración del Código Arduino

### 3.1 Editar credenciales

1. Abre el archivo `esp32_code.ino`
2. Localiza estas líneas y cámbialas:

```cpp
// Línea 11-12: Credenciales MQTT
const char* mqtt_user = "tu_usuario_mqtt";      // CAMBIAR
const char* mqtt_password = "tu_contraseña_mqtt"; // CAMBIAR
```

Obten tus credenciales MQTT de:
- https://www.hivemq.com/mqtt-cloud/
- Inicia sesión en tu cuenta
- Ve a Cluster → Details
- Copia el usuario y contraseña

### 3.2 Configurar la Placa en Arduino IDE

1. Ve a **Herramientas**
2. Selecciona:
   - **Placa**: `TTGO T-Display-S3` (busca en la lista desplegable)
   - **Upload Speed**: `921600`
   - **CPU Frequency**: `240MHz`
   - **Flash Size**: `16MB`
   - **Partition Scheme**: `Huge APP (3MB No OTA/1MB SPIFFS)`
   - **Core Debug Level**: `None`

### 3.3 Seleccionar Puerto

1. Ve a **Herramientas → Puerto**
2. Selecciona el puerto donde está conectado el ESP32 (generalmente COM3, COM4 en Windows, /dev/ttyUSB0 en Linux, /dev/cu.usbserial-* en macOS)

## Paso 4: Cargar el Código

1. Copia todo el contenido de `esp32_code.ino`
2. Pégalo en Arduino IDE
3. Haz clic en el botón **➜ (Subir)**
4. Espera a que termine (verás: "Sketch uses... bytes")
5. Abre el **Monitor Serial** (Herramientas → Monitor Serial)
6. Selecciona velocidad: `115200`
7. Deberías ver mensajes de conexión

## Paso 5: Configuración de Supabase

### 5.1 Crear tabla en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Crea un nuevo proyecto
4. Ve a **SQL Editor**
5. Ejecuta este script:

```sql
CREATE TABLE lecturas (
  id BIGSERIAL PRIMARY KEY,
  temperatura FLOAT NOT NULL,
  humedad FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dispositivo VARCHAR(50) DEFAULT 'ESP32-DHT11'
);

-- Crear índice para consultas más rápidas
CREATE INDEX idx_lecturas_timestamp ON lecturas(timestamp DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE lecturas ENABLE ROW LEVEL SECURITY;

-- Política pública de lectura
CREATE POLICY "Enable read access for all users"
  ON lecturas FOR SELECT
  USING (true);
```

### 5.2 Obtener credenciales de Supabase

1. Ve a **Settings → API**
2. Copia:
   - **Project URL**: URL de tu proyecto
   - **anon (public) key**: Tu clave pública
3. Nota: No compartir la clave privada públicamente

## Paso 6: Configuración de la Web

### 6.1 Editar script.js

1. Abre el archivo `web/script.js`
2. Busca las líneas 1-2 y cámbialas:

```javascript
const API_BASE_URL = 'https://tu-proyecto.supabase.co/rest/v1'; // CAMBIAR
const SUPABASE_KEY = 'tu-anon-key'; // CAMBIAR
```

Remplaza:
- `tu-proyecto` con tu nombre de proyecto Supabase
- `tu-anon-key` con tu clave pública de Supabase

### 6.2 Publicar en Tiiny.site (o similar)

#### Opción 1: Tiiny.site
1. Ve a https://tiiny.site
2. Sube los archivos:
   - `index.html`
   - `styles.css`
   - `script.js`
3. Haz clic en "Share"
4. Copia tu URL pública

#### Opción 2: GitHub Pages
1. Ve a tu repositorio en GitHub
2. Ve a **Settings → Pages**
3. Selecciona "Deploy from a branch"
4. Selecciona rama `main` y carpeta `/web`
5. Haz clic en Save
6. Tu sitio estará disponible en `https://tu-usuario.github.io/proyectotemp`

## Paso 7: Configuración de HiveMQ (Backend MQTT)

### 7.1 Crear broker en HiveMQ Cloud

1. Ve a https://www.hivemq.com/mqtt-cloud/
2. Crea una cuenta o inicia sesión
3. Haz clic en **"Create Cluster"**
4. Selecciona el plan gratuito
5. Elige una región cerca de ti
6. Haz clic en **"Create"**
7. Espera a que se cree el cluster (2-3 minutos)

### 7.2 Obtener credenciales

1. Ve a **Cluster → Details**
2. Copia:
   - **Broker Address**: URL del broker (ya está en el código)
   - **Username**: Tu usuario
   - **Password**: Tu contraseña

### 7.3 Verificar conexión

1. Abre el **Monitor Serial** en Arduino IDE
2. Deberías ver mensajes como:
   ```
   ✓ WiFi conectado
   ✓ Conectado a MQTT
   === DATOS ENVIADOS ===
   ```

## Paso 8: Integrando HiveMQ con Supabase (Backend)

### Opción A: Usar una función serverless

1. Crea una **Edge Function** en Supabase
2. O usa un servidor intermediario (Node.js, Python, etc.)
3. El servidor debe:
   - Suscribirse al tópico MQTT de HiveMQ
   - Recibir los datos
   - Insertarlos en la tabla `lecturas` de Supabase

### Opción B: Script Python (Recomendado para principiantes)

Crea un archivo `mqtt_to_supabase.py`:

```python
import paho.mqtt.client as mqtt
import json
import ssl
from supabase import create_client, Client
from datetime import datetime

# Configuración
HIVEMQ_BROKER = "1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud"
HIVEMQ_PORT = 8883
HIVEMQ_USER = "tu_usuario"
HIVEMQ_PASSWORD = "tu_contraseña"
MQTT_TOPIC = "esp32/temperatura_humedad"

SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-anon-key"

# Inicializar Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def on_connect(client, userdata, flags, rc):
    print(f"Conectado a HiveMQ. Código: {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Mensaje recibido: {payload}")
        
        # Insertar en Supabase
        data = {
            "temperatura": payload.get("temperatura"),
            "humedad": payload.get("humedad"),
            "timestamp": payload.get("timestamp", datetime.utcnow().isoformat()),
            "dispositivo": payload.get("dispositivo", "ESP32-DHT11")
        }
        
        response = supabase.table("lecturas").insert(data).execute()
        print(f"Datos insertados correctamente: {response}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1 if hasattr(mqtt, 'CallbackAPIVersion') else None)
    client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASSWORD)
    client.tls_set(certfile=None, keyfile=None, cert_reqs=ssl.CERT_REQUIRED, ciphers=None, keyfile_password=None)
    client.tls_insecure_set(False)
    
    client.on_connect = on_connect
    client.on_message = on_message
    
    client.connect(HIVEMQ_BROKER, HIVEMQ_PORT, keepalive=60)
    client.loop_forever()

if __name__ == "__main__":
    main()
```

Ejecutar:
```bash
pip install paho-mqtt supabase-py
python mqtt_to_supabase.py
```

## Paso 9: Pruebas

### 9.1 Verificar lecturas del sensor

1. Abre el Monitor Serial
2. Deberías ver cada minuto:
   ```
   === DATOS ENVIADOS ===
   Temperatura: 24.5 °C
   Humedad: 65.3 %
   ```

### 9.2 Verificar datos en Supabase

1. Ve a tu proyecto en Supabase
2. Ve a **Table Editor → lecturas**
3. Deberías ver filas con los datos enviados

### 9.3 Verificar web

1. Abre tu URL de Tiiny.site o GitHub Pages
2. Deberías ver:
   - Datos actuales (temperatura y humedad)
   - Estado de conexión
   - Botones funcionando

## 🆘 Solución de Problemas

### El ESP32 no aparece en Arduino IDE
```
✓ Solución: Instala drivers CH340
✓ Reinicia Arduino IDE
✓ Conecta el ESP32 nuevamente
```

### Error "No se puede conectar a WiFi"
```
✓ Verifica que las credenciales sean correctas
✓ Asegúrate de estar dentro del rango de la red
✓ Prueba con una sola red Wi-Fi primero
```

### Error "MQTT Timeout"
```
✓ Verifica usuario y contraseña MQTT
✓ Comprueba que el puerto 8883 esté abierto
✓ Verifica la URL del broker
```

### La web no muestra datos
```
✓ Abre la consola del navegador (F12)
✓ Verifica los errores de CORS
✓ Asegúrate de que las credenciales de Supabase sean correctas
✓ Verifica que la tabla tenga datos
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los mensajes del Monitor Serial
2. Abre la consola del navegador (F12) para ver errores JS
3. Consulta la documentación oficial:
   - Arduino ESP32: https://docs.espressif.com/projects/arduino-esp32/en/latest/
   - Supabase: https://supabase.com/docs
   - HiveMQ: https://www.hivemq.com/docs/

¡Listo! Ahora tu sistema debería estar completamente funcional. 🎉
