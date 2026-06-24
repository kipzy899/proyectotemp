require('dotenv').config();
const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

// ============== CONFIGURACIÓN ==============
const HIVEMQ_BROKER = process.env.HIVEMQ_BROKER;
const HIVEMQ_PORT = process.env.HIVEMQ_PORT;
const HIVEMQ_USER = process.env.HIVEMQ_USER;
const HIVEMQ_PASSWORD = process.env.HIVEMQ_PASSWORD;
const MQTT_TOPIC = process.env.MQTT_TOPIC;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ============== INICIALIZAR SUPABASE ==============
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============== VERIFICAR CONFIGURACIÓN ==============
if (!HIVEMQ_USER || HIVEMQ_USER === 'tu_usuario_mqtt') {
  console.error('❌ ERROR: Edita HIVEMQ_USER en el archivo .env');
  process.exit(1);
}

if (!SUPABASE_URL || SUPABASE_URL === 'https://tu-proyecto.supabase.co') {
  console.error('❌ ERROR: Edita SUPABASE_URL en el archivo .env');
  process.exit(1);
}

// ============== CONECTAR A MQTT ==============
const mqttUrl = `mqtts://${HIVEMQ_USER}:${HIVEMQ_PASSWORD}@${HIVEMQ_BROKER}:${HIVEMQ_PORT}`;

const client = mqtt.connect(mqttUrl, {
  rejectUnauthorized: false,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
  keepalive: 60,
});

console.log('\n' + '='.repeat(50));
console.log('🚀 Iniciando integración HiveMQ ↔ Supabase');
console.log('='.repeat(50) + '\n');

let messageCount = 0;
let errorCount = 0;

client.on('connect', () => {
  console.log(`✅ Conectado a HiveMQ`);
  console.log(`   Broker: ${HIVEMQ_BROKER}`);
  console.log(`   Puerto: ${HIVEMQ_PORT}`);
  console.log(`📡 Suscrito al tema: ${MQTT_TOPIC}\n`);
  client.subscribe(MQTT_TOPIC);
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    
    console.log('📨 Mensaje recibido:');
    console.log(`   Temperatura: ${payload.temperatura}°C`);
    console.log(`   Humedad: ${payload.humedad}%`);
    console.log(`   Timestamp: ${payload.timestamp}`);
    console.log(`   Dispositivo: ${payload.dispositivo}\n`);

    // Validar datos
    if (!payload.temperatura || !payload.humedad) {
      console.error('❌ Datos inválidos (falta temperatura o humedad)');
      errorCount++;
      return;
    }

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('lecturas')
      .insert([
        {
          temperatura: parseFloat(payload.temperatura),
          humedad: parseFloat(payload.humedad),
          timestamp: payload.timestamp || new Date().toISOString(),
          dispositivo: payload.dispositivo || 'ESP32-DHT11'
        }
      ]);

    if (error) {
      console.error('❌ Error al insertar en Supabase:');
      console.error(`   ${error.message}\n`);
      errorCount++;
    } else {
      console.log('✅ Datos guardados en Supabase\n');
      messageCount++;
    }

  } catch (err) {
    console.error('❌ Error al procesar mensaje:');
    console.error(`   ${err.message}\n`);
    errorCount++;
  }
});

client.on('error', (err) => {
  console.error('❌ Error de conexión MQTT:');
  console.error(`   ${err.message}\n`);
});

client.on('disconnect', () => {
  console.log('🔌 Desconectado de HiveMQ');
});

// ============== MANEJAR Ctrl+C ==============
process.on('SIGINT', () => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Estadísticas');
  console.log(`   ✅ Mensajes procesados: ${messageCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log('='.repeat(50) + '\n');
  console.log('⏸️  Script detenido\n');
  client.end();
  process.exit(0);
});
