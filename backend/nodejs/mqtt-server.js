// ============================================
// SERVIDOR MQTT → SUPABASE BRIDGE
// Recibe datos del ESP32 vía MQTT y los guarda en Supabase
// ============================================

import mqtt from 'mqtt'
import { createClient } from '@supabase/supabase-js'

// ============================================
// 🔧 CONFIGURACIÓN - EDITA ESTOS VALORES
// ============================================

// Supabase
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_PUBLICA'

// MQTT Broker (HiveMQ Cloud)
const MQTT_BROKER = 'mqtts://1b65d1b8ece1466695a5bee919d500a3.s1.eu.hivemq.cloud:8883'
const MQTT_USER = 'TU_USUARIO_HIVEMQ'
const MQTT_PASSWORD = 'TU_CONTRASEÑA_HIVEMQ'

// Tópico MQTT donde el ESP32 publica los datos
const MQTT_TOPIC = 'esp32/temperatura_humedad'

// Nombre de la tabla en Supabase
const TABLE_NAME = 'lecturas_dht22'

// ============================================
// Inicializar clientes
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  clientId: 'nodejs-mqtt-bridge-' + Date.now(),
  reconnectPeriod: 5000,
  connectTimeout: 10000
})

// ============================================
// 📡 Eventos MQTT
// ============================================

mqttClient.on('connect', () => {
  console.log('\n✅ Conectado al broker MQTT (HiveMQ Cloud)')
  console.log(`📍 Broker: ${MQTT_BROKER}`)
  
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error(`❌ Error al suscribirse a ${MQTT_TOPIC}:`, err)
    } else {
      console.log(`📡 Suscrito al tópico: ${MQTT_TOPIC}`)
      console.log('⏳ Esperando mensajes del ESP32...\n')
    }
  })
})

mqttClient.on('error', (err) => {
  console.error('❌ Error de conexión MQTT:', err.message)
  console.log('💡 Verifica: URL del broker, usuario, contraseña y conectividad de red')
})

mqttClient.on('offline', () => {
  console.log('⚠️ Cliente MQTT offline - intentando reconectar...')
})

mqttClient.on('reconnect', () => {
  console.log('🔄 Reconectando al broker MQTT...')
})

// ============================================
// 📥 Recibir mensajes MQTT
// ============================================

let contador = 0

mqttClient.on('message', async (topic, message) => {
  contador++
  
  try {
    // Parsear el JSON del mensaje
    const payload = JSON.parse(message.toString())
    
    console.log(`\n[${new Date().toLocaleTimeString()}] 📥 Mensaje #${contador}`)
    console.log(`   Temperatura: ${payload.temperatura}°C`)
    console.log(`   Humedad: ${payload.humedad}%`)
    console.log(`   Timestamp: ${payload.timestamp}`)

    // Preparar datos para Supabase
    const dataToInsert = {
      temperatura: payload.temperatura,
      humedad: payload.humedad,
      creado_en: payload.timestamp || new Date().toISOString()
    }

    // Guardar en Supabase
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([dataToInsert])

    if (error) {
      console.error(`   ❌ Error al guardar en Supabase:`, error.message)
      console.log(`   💡 Verifica: URL de Supabase, credenciales y nombre de tabla (${TABLE_NAME})`)
    } else {
      console.log(`   ✅ Guardado en Supabase correctamente`)
    }

  } catch (err) {
    console.error(`   ❌ Error procesando mensaje:`, err.message)
    console.log(`   💡 Verifica que el mensaje sea válido JSON:`)
    console.log(`   ${message.toString()}`)
  }
})

// ============================================
// 🚀 Inicio
// ============================================

console.log('\n' + '='.repeat(60))
console.log('🚀 SERVIDOR MQTT → SUPABASE INICIADO')
console.log('='.repeat(60))
console.log(`📍 Supabase: ${SUPABASE_URL}`)
console.log(`📍 Broker MQTT: ${MQTT_BROKER}`)
console.log(`📡 Tópico: ${MQTT_TOPIC}`)
console.log(`💾 Tabla: ${TABLE_NAME}`)
console.log('='.repeat(60) + '\n')

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⛔ Cerrando servidor...')
  mqttClient.end()
  process.exit(0)
})
