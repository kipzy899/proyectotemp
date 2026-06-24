# 🟢 Backend Node.js: Integración HiveMQ ↔ Supabase

## ¿Qué es Node.js?

Node.js es JavaScript para tu computadora (en lugar del navegador). Es **mucho más fácil** que Python.

## 📋 Requisitos

- **Node.js** (descargar de https://nodejs.org/)
- Las credenciales de HiveMQ Cloud
- Las credenciales de Supabase
- Una carpeta para los archivos

## 🚀 Instalación (5 minutos)

### Paso 1: Descargar Node.js

1. Ve a https://nodejs.org/
2. Descarga **LTS (Long Term Support)** - la versión estable
3. Instala normalmente (siguiente, siguiente, siguiente...)
4. Abre terminal/cmd y verifica:
   ```bash
   node --version
   npm --version
   ```
   Deberías ver números de versión

### Paso 2: Descargar archivos

1. Ve a tu repositorio: https://github.com/kipzy899/proyectotemp
2. Abre la carpeta `backend/nodejs/`
3. Descarga estos 3 archivos:
   - `package.json`
   - `.env.example`
   - `mqtt_to_supabase.js`
4. Crea una carpeta en tu computadora: `C:\mqtt_bridge\` (o donde prefieras)
5. Coloca los 3 archivos ahí

### Paso 3: Crear archivo .env

1. En la carpeta, copia `.env.example` y renómbralo a `.env`
2. Abre `.env` con un editor de texto (Notepad, VS Code, etc.)
3. Edita estas líneas:

```env
HIVEMQ_BROKER=1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud
HIVEMQ_PORT=8883
HIVEMQ_USER=tu_usuario_mqtt           # ← CAMBIAR
HIVEMQ_PASSWORD=tu_contrasena_mqtt    # ← CAMBIAR
MQTT_TOPIC=esp32/temperatura_humedad

SUPABASE_URL=https://tu-proyecto.supabase.co  # ← CAMBIAR
SUPABASE_KEY=tu-anon-key              # ← CAMBIAR
```

### Paso 4: Obtener credenciales

#### 🔑 De HiveMQ Cloud:

1. Ve a https://www.hivemq.com/mqtt-cloud/
2. Inicia sesión
3. Haz clic en tu cluster
4. Ve a **Details**
5. En "MQTT Credentials" encontrarás:
   - **Username** (copiar a `HIVEMQ_USER`)
   - **Password** (copiar a `HIVEMQ_PASSWORD`)

#### 🔑 De Supabase:

1. Ve a https://app.supabase.com
2. Abre tu proyecto
3. Ve a **Settings → API**
4. Copia:
   - **Project URL** (copiar a `SUPABASE_URL`)
   - **anon public key** (copiar a `SUPABASE_KEY`)

### Paso 5: Instalar dependencias

1. Abre terminal/cmd en tu carpeta (`C:\mqtt_bridge\`)
2. Ejecuta:
   ```bash
   npm install
   ```
   Esto descargará todas las librerías necesarias (tarda 1-2 minutos)

### Paso 6: Ejecutar

Desde la misma carpeta, ejecuta:
```bash
pm start
```

## ✅ ¿Funcionó?

Deberías ver algo así:

```
==================================================
🚀 Iniciando integración HiveMQ ↔ Supabase
==================================================

✅ Conectado a HiveMQ
   Broker: 1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud
   Puerto: 8883
📡 Suscrito al tema: esp32/temperatura_humedad

📨 Mensaje recibido:
   Temperatura: 24.5°C
   Humedad: 65.3%
   Timestamp: 2026-06-24T15:30:00Z
   Dispositivo: ESP32-DHT11

✅ Datos guardados en Supabase
```

Si ves esto, **¡funciona!** 🎉

## 🛑 Detener el script

Presiona **Ctrl+C** en la terminal. Verás:

```
==================================================
📊 Estadísticas
   ✅ Mensajes procesados: 5
   ❌ Errores: 0
==================================================

⏸️  Script detenido
```

## ⚠️ Problemas comunes

### Error: "Cannot find module 'mqtt'"
```
Error: Cannot find module 'mqtt'
```
**Solución:** Ejecuta `npm install` nuevamente

### Error: "Connection refused"
```
Error de conexión MQTT: Connection refused
```
**Solución:**
- Verifica que HIVEMQ_USER y HIVEMQ_PASSWORD sean correctos
- Sin espacios en blanco
- Asegúrate de tener internet

### Error: "Invalid API key"
```
Error: Invalid API key
```
**Solución:**
- Verifica que SUPABASE_URL y SUPABASE_KEY sean correctos
- No uses la clave privada (service_role), usa la pública (anon)

### Los datos no aparecen en Supabase
**Solución:**
1. Verifica que la tabla `lecturas` exista
2. Abre Supabase → Table Editor → lecturas
3. Busca los datos manualmente
4. Si no hay datos, verifica que el ESP32 esté enviando (Monitor Serial)

## 🔄 Mantenerlo corriendo 24/7

### Opción 1: Windows Task Scheduler

1. Presiona **Win+R** y escribe `taskschd.msc`
2. Haz clic en **Create Basic Task**
3. Nombre: `MQTT Bridge`
4. Ve a **Trigger** → **New**:
   - Selecciona "At startup"
   - Haz clic en OK
5. Ve a **Action** → **New**:
   - **Program**: `C:\Program Files\nodejs\node.exe` (o donde instalaste Node)
   - **Arguments**: `mqtt_to_supabase.js`
   - **Start in**: `C:\mqtt_bridge\` (tu carpeta)
   - Haz clic en OK
6. Ve a **Conditions** y marca:
   - "Wake the computer to run this task"
7. Ve a **Settings** y marca:
   - "If the task fails, restart every 1 minute"
   - "Stop the task if it runs longer than: 1 hour" (desmarca esto)
8. Haz clic en OK

**Para verificar:** Abre Task Scheduler y busca "MQTT Bridge"

### Opción 2: macOS/Linux (con screen)

```bash
cd /ruta/a/tu/carpeta
screen -S mqtt_bridge
npm start
# Presiona Ctrl+A luego D para desconectar
```

### Opción 3: Usar PM2 (recomendado)

```bash
npm install -g pm2
pm2 start mqtt_to_supabase.js --name "mqtt-bridge"
pm2 startup
pm2 save
```

## 📊 Verificar en Supabase

1. Ve a https://app.supabase.com
2. Abre tu proyecto
3. Ve a **Table Editor** → **lecturas**
4. Deberías ver las filas con los datos del ESP32
5. Cada minuto debería haber una fila nueva

## 🎉 ¡Listo!

Ya tienes tu backend corriendo. El flujo completo es:

```
ESP32 (cada 60 seg)
   ↓ envía JSON
HiveMQ Cloud
   ↓ recibe
Tu script Node.js
   ↓ inserta
Supabase (tabla lecturas)
   ↓ lee
Tu web (en Tiiny.site o GitHub Pages)
```

¿Necesitas ayuda con algo específico? 😊
