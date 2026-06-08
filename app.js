import { createClient } from '@supabase/supabase-js'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// 1. Configurá tus datos de Supabase
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_PUBLICA'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let chart

// 2. Inicializar gráfico
function initChart() {
  const ctx = document.getElementById('chart')
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperatura °C',
          data: [],
          borderColor: '#f87171',
          backgroundColor: '#f8717120',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Humedad %',
          data: [],
          borderColor: '#60a5fa',
          backgroundColor: '#60a5fa20',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '°C' } },
        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: '%' }, grid: { drawOnChartArea: false } }
      }
    }
  })
}

// 3. Cargar históricos de últimas 24h
async function cargarHistoricos() {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
   .from('lecturas_dht22')
   .select('*')
   .gte('creado_en', hace24h)
   .order('creado_en', { ascending: true })
   .limit(200)

  if (error) {
    console.error(error)
    return
  }

  const labels = data.map(d => new Date(d.creado_en).toLocaleTimeString())
  const temps = data.map(d => d.temperatura)
  const hums = data.map(d => d.humedad)

  chart.data.labels = labels
  chart.data.datasets[0].data = temps
  chart.data.datasets[1].data = hums
  chart.update()

  // Actualizar cards con último dato
  if (data.length > 0) {
    const ultimo = data[data.length - 1]
    document.getElementById('temp-actual').innerText = ultimo.temperatura.toFixed(1)
    document.getElementById('hum-actual').innerText = ultimo.humedad.toFixed(1)
    document.getElementById('ultima-fecha').innerText = new Date(ultimo.creado_en).toLocaleString()
    actualizarEstado(true)
  }
}

// 4. Suscripción en tiempo real a Supabase
function suscribirTiempoReal() {
  supabase
   .channel('lecturas_dht22')
   .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'lecturas_dht22' },
      (payload) => {
        const nuevo = payload.new
        const hora = new Date(nuevo.creado_en).toLocaleTimeString()

        // Actualizar gráfico
        chart.data.labels.push(hora)
        chart.data.datasets[0].data.push(nuevo.temperatura)
        chart.data.datasets[1].data.push(nuevo.humedad)

        // Mantener solo últimos 200 puntos
        if (chart.data.labels.length > 200) {
          chart.data.labels.shift()
          chart.data.datasets[0].data.shift()
          chart.data.datasets[1].data.shift()
        }
        chart.update()

        // Actualizar cards
        document.getElementById('temp-actual').innerText = nuevo.temperatura.toFixed(1)
        document.getElementById('hum-actual').innerText = nuevo.humedad.toFixed(1)
        document.getElementById('ultima-fecha').innerText = new Date(nuevo.creado_en).toLocaleString()
        actualizarEstado(true)
      }
    )
   .subscribe()
}

function actualizarEstado(online) {
  const status = document.getElementById('status')
  if (online) {
    status.innerHTML = '<span class="status online"></span>Online'
  } else {
    status.innerHTML = '<span class="status offline"></span>Desconectado'
  }
}

// Iniciar
initChart()
cargarHistoricos()
suscribirTiempoReal()

// Chequear si hace >2min que no llega nada
setInterval(async () => {
  const { data } = await supabase
   .from('lecturas_dht22')
   .select('creado_en')
   .order('creado_en', { ascending: false })
   .limit(1)

  if (data && data.length > 0) {
    const diff = Date.now() - new Date(data[0].creado_en).getTime()
    actualizarEstado(diff < 120000) // 2 minutos
  }
}, 30000)
