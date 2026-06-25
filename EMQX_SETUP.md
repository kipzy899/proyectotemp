# 🚀 Configuración del Servidor en EMQX

Esta guía te ayudará a instalar y ejecutar el servidor Node.js que conecta MQTT con Supabase.

---

## 📋 Requisitos

- **Node.js** 16+ instalado ([descargar](https://nodejs.org/))
- **npm** (viene con Node.js)
- Credenciales de **HiveMQ Cloud**
- Credenciales de **Supabase**
- Acceso a un servidor o máquina para ejecutar el script (puede ser tu PC local para empezar)

---

## 🔧 Instalación Local (Para Probar)

### 1️⃣ Navega a la carpeta del servidor

```bash
cd backend/nodejs
```

### 2️⃣ Instala las dependencias

```bash
npm install
```

Esto descargará:
- `mqtt`: Cliente para conectarse al broker MQTT
- `@supabase/supabase-js`: Cliente para guardar datos en Supabase

### 3️⃣ Configura tus credenciales

Edita `mqtt-server.js` y reemplaza los valores:

```javascript
// Supabase
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_PUBLICA'

// MQTT
const MQTT_USER = 'TU_USUARIO_HIVEMQ'
const MQTT_PASSWORD = 'TU_CONTRASEÑA_HIVEMQ'
```

**¿Dónde encontrar estas credenciales?**

📌 **Supabase URL y Key:**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En **Settings → API** encontrarás:
   - `Project URL` (es tu SUPABASE_URL)
   - `anon` key (es tu SUPABASE_ANON_KEY)

📌 **HiveMQ Cloud Credenciales:**
1. Ve a https://www.hivemq.cloud
2. Abre tu cluster
3. En **Cluster Overview** encontrarás:
   - **Broker Address** (ya está en MQTT_BROKER)
   - **Username y Password** (bajo "Authentication")

### 4️⃣ Ejecuta el servidor

```bash
npm start
```

**Deberías ver:**
```
============================================================
🚀 SERVIDOR MQTT → SUPABASE INICIADO
============================================================
📍 Supabase: https://tu-proyecto.supabase.co
📍 Broker MQTT: mqtts://1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud:8883
📡 Tópico: esp32/temperatura_humedad
💾 Tabla: lecturas_dht22
============================================================

✅ Conectado al broker MQTT (HiveMQ Cloud)
📍 Broker: mqtts://...
📡 Suscrito al tópico: esp32/temperatura_humedad
⏳ Esperando mensajes del ESP32...
```

---

## ☁️ Despliegue en un Servidor (Opciones)

Si quieres que el servidor se ejecute **24/7** sin necesidad de tu PC:

### Opción A: Render (Recomendado para principiantes)

1. Sube tu código a GitHub
2. Ve a https://render.com
3. **New → Web Service**
4. Conecta tu repo
5. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Agrega las variables de entorno en **Environment**:
   ```
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   MQTT_USER=...
   MQTT_PASSWORD=...
   ```

### Opción B: Railway

1. Ve a https://railway.app
2. **New Project → GitHub Repo**
3. Selecciona tu repo
4. Railway detectará Node.js automáticamente
5. Agrega variables de entorno

### Opción C: Google Cloud / AWS / Azure

Más complejo pero más potente. Requiere una tarjeta de crédito.

### Opción D: Tu propia máquina con PM2 (Localhost)

Si tienes una PC que puede estar siempre encendida:

```bash
npm install -g pm2

# Inicia el servidor
pm2 start mqtt-server.js --name "mqtt-supabase"

# Configurar autostart
pm2 startup
pm2 save

# Ver logs
pm2 logs mqtt-supabase
```

---

## ✅ Verificar que Funciona

### 1️⃣ Revisa los logs

Si ves esto, ¡está funcionando!:
```
📥 Mensaje #1
   Temperatura: 25.3°C
   Humedad: 62.5%
   ✅ Guardado en Supabase correctamente
```

### 2️⃣ Verifica en Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta:
```sql
SELECT * FROM lecturas_dht22 ORDER BY creado_en DESC LIMIT 10;
```

Deberías ver tus datos más recientes.

### 3️⃣ Verifica en HiveMQ Cloud (Opcional)

1. Ve a https://www.hivemq.cloud
2. Abre tu cluster
3. Ve a **WebSocket Client**
4. Conéctate y suscríbete a `esp32/temperatura_humedad`

---

## 🐛 Solución de Problemas

### ❌ "Cannot find module 'mqtt'"
```bash
npm install
```

### ❌ "Error: getaddrinfo ENOTFOUND"
- Verifica tu conexión a internet
- Verifica que el MQTT_BROKER sea correcto

### ❌ "Unauthorized" en MQTT
- Verifica usuario y contraseña de HiveMQ
- Asegúrate de usar `mqtts://` (con SSL)

### ❌ "No data in Supabase"
- Verifica que la tabla `lecturas_dht22` existe
- Verifica que las columnas sean: `temperatura`, `humedad`, `creado_en`
- Verifica tus credenciales de Supabase

### ❌ "Connection refused"
- ¿El ESP32 está publicando en `esp32/temperatura_humedad`?
- ¿El ESP32 está conectado al Wi-Fi?
- Revisa la consola serial del ESP32

---

## 📊 Flujo Completo

```
┌─────────────────┐
│    ESP32 + DHT  │ (Mide temperatura/humedad)
└────────┬────────┘
         │ Publica MQTT
         ▼
┌─────────────────────────────────┐
│ HiveMQ Cloud Broker             │ (Broker MQTT)
└────────┬────────────────────────┘
         │ Suscrito a tópico
         ▼
┌─────────────────────────────────┐
│ mqtt-server.js (Este script)    │ (Tu servidor)
└────────┬────────────────────────┘
         │ Inserta datos
         ▼
┌─────────────────────────────────┐
│ Supabase (Base de datos)        │ (Almacena datos)
└────────┬────────────────────────┘
         │ Suscripción en tiempo real
         ▼
┌─────────────────────────────────┐
│ app.js (Frontend/Gráficos)      │ (Tu página web)
└─────────────────────────────────┘
```

---

## 🎯 Próximos Pasos

1. ✅ Prueba el servidor localmente
2. ✅ Verifica que los datos llegan a Supabase
3. ✅ Verifica que tu frontend (app.js) recibe los datos en tiempo real
4. ✅ Despliega en un servidor cloud si quieres que esté 24/7

---

## 📚 Documentación Útil

- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [HiveMQ Cloud Documentation](https://www.hivemq.cloud/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/)

---

## ❓ ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs del servidor (`npm start`)
2. Verifica que todas las credenciales sean correctas
3. Comprueba la conectividad de red
4. Abre un issue en el repositorio

¡Buena suerte! 🚀
