// ============== CONFIGURACIÓN ==============
const API_BASE_URL = 'https://tu-proyecto.supabase.co/rest/v1'; // CAMBIAR
const SUPABASE_KEY = 'tu-anon-key'; // CAMBIAR
const TABLE_NAME = 'lecturas';

// ============== VARIABLES GLOBALES ==============
let currentData = {
    temperatura: '--',
    humedad: '--',
    timestamp: '--'
};

let historicalData = [];
let temperatureChart = null;
let humidityChart = null;

// ============== INICIALIZACIÓN ==============
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando aplicación...');
    setupEventListeners();
    loadCurrentData();
    loadHistoricalData();
    // Actualizar datos cada 30 segundos
    setInterval(loadCurrentData, 30000);
    // Actualizar histórico cada 5 minutos
    setInterval(loadHistoricalData, 300000);
});

// ============== EVENT LISTENERS ==============
function setupEventListeners() {
    // Botones de navegación
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('data-view');
            switchView(view);
        });
    });

    // Selector de rango de tiempo
    const timeRangeSelect = document.getElementById('time-range');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            loadHistoricalData();
        });
    }
}

// ============== NAVEGACIÓN ==============
function switchView(viewName) {
    // Ocultar todas las vistas
    const allViews = document.querySelectorAll('.view-section');
    allViews.forEach(view => view.classList.remove('active'));

    // Mostrar vista seleccionada
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
    }

    // Actualizar botones
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-view') === viewName) {
            button.classList.add('active');
        }
    });

    // Actualizar gráficas si cambias a histórico
    if (viewName === 'history' && temperatureChart) {
        setTimeout(() => {
            temperatureChart.resize();
            humidityChart.resize();
        }, 100);
    }
}

// ============== CARGAR DATOS ACTUALES ==============
async function loadCurrentData() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/${TABLE_NAME}?select=*&order=timestamp.desc&limit=1`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.length > 0) {
            const latestReading = data[0];
            currentData = {
                temperatura: latestReading.temperatura,
                humedad: latestReading.humedad,
                timestamp: latestReading.timestamp
            };

            updateCurrentDisplay();
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false);
        }
    } catch (error) {
        console.error('Error al cargar datos actuales:', error);
        updateConnectionStatus(false);
    }
}

// ============== ACTUALIZAR VISTA DE DATOS ACTUALES ==============
function updateCurrentDisplay() {
    // Temperatura
    const tempElement = document.getElementById('current-temp');
    if (tempElement) {
        tempElement.textContent = currentData.temperatura;
    }

    // Humedad
    const humidityElement = document.getElementById('current-humidity');
    if (humidityElement) {
        humidityElement.textContent = currentData.humedad;
    }

    // Última actualización
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement && currentData.timestamp !== '--') {
        const date = new Date(currentData.timestamp);
        lastUpdateElement.textContent = formatDateTime(date);
    }

    // Total de lecturas
    updateTotalReadings();
}

// ============== CARGAR DATOS HISTÓRICOS ==============
async function loadHistoricalData() {
    try {
        const timeRange = document.getElementById('time-range')?.value || 'day';
        const startDate = getStartDate(timeRange);
        const startDateISO = startDate.toISOString();

        const response = await fetch(
            `${API_BASE_URL}/${TABLE_NAME}?select=*&timestamp=gte.${startDateISO}&order=timestamp.asc`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        historicalData = await response.json();
        updateHistoricalDisplay();
    } catch (error) {
        console.error('Error al cargar datos históricos:', error);
        document.getElementById('data-table-body').innerHTML =
            '<tr><td colspan="3" class="no-data">Error al cargar datos</td></tr>';
    }
}

// ============== ACTUALIZAR VISTA DE HISTÓRICO ==============
function updateHistoricalDisplay() {
    updateDataTable();
    updateCharts();
}

// ============== ACTUALIZAR TABLA ==============
function updateDataTable() {
    const tableBody = document.getElementById('data-table-body');

    if (historicalData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="no-data">No hay datos disponibles</td></tr>';
        return;
    }

    const rows = historicalData.map(reading => `
        <tr>
            <td>${formatDateTime(new Date(reading.timestamp))}</td>
            <td>${reading.temperatura.toFixed(1)}°C</td>
            <td>${reading.humedad.toFixed(1)}%</td>
        </tr>
    `).join('');

    tableBody.innerHTML = rows;
}

// ============== ACTUALIZAR GRÁFICAS ==============
function updateCharts() {
    const timestamps = historicalData.map(d => formatTime(new Date(d.timestamp)));
    const temperatures = historicalData.map(d => d.temperatura);
    const humidities = historicalData.map(d => d.humedad);

    // Gráfica de temperatura
    updateTemperatureChart(timestamps, temperatures);

    // Gráfica de humedad
    updateHumidityChart(timestamps, humidities);
}

function updateTemperatureChart(labels, data) {
    const ctx = document.getElementById('temperature-chart');
    if (!ctx) return;

    if (temperatureChart) {
        temperatureChart.destroy();
    }

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperatura (°C)',
                data: data,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#2D3E27',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#6D7E67',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(172, 190, 167, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#6D7E67',
                        font: { size: 11 },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'rgba(172, 190, 167, 0.1)'
                    }
                }
            }
        }
    });
}

function updateHumidityChart(labels, data) {
    const ctx = document.getElementById('humidity-chart');
    if (!ctx) return;

    if (humidityChart) {
        humidityChart.destroy();
    }

    humidityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Humedad (%)',
                data: data,
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4ecdc4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#2D3E27',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#6D7E67',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(172, 190, 167, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#6D7E67',
                        font: { size: 11 },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'rgba(172, 190, 167, 0.1)'
                    }
                }
            }
        }
    });
}

// ============== ESTADO DE CONEXIÓN ==============
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        if (connected) {
            statusElement.textContent = 'Conectado';
            statusElement.classList.add('connected');
        } else {
            statusElement.textContent = 'Desconectado';
            statusElement.classList.remove('connected');
        }
    }
}

// ============== TOTAL DE LECTURAS ==============
async function updateTotalReadings() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/${TABLE_NAME}?select=count()`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Accept': 'application/json'
                }
            }
        );

        if (response.ok) {
            const countHeader = response.headers.get('content-range');
            const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
            const countElement = document.getElementById('total-readings');
            if (countElement) {
                countElement.textContent = count;
            }
        }
    } catch (error) {
        console.error('Error al obtener total de lecturas:', error);
    }
}

// ============== FUNCIONES AUXILIARES ==============
function getStartDate(range) {
    const now = new Date();
    switch (range) {
        case 'hour':
            now.setHours(now.getHours() - 1);
            break;
        case 'day':
            now.setDate(now.getDate() - 1);
            break;
        case 'week':
            now.setDate(now.getDate() - 7);
            break;
        case 'month':
            now.setMonth(now.getMonth() - 1);
            break;
    }
    return now;
}

function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return date.toLocaleString('es-ES', options);
}

function formatTime(date) {
    const options = {
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('es-ES', options);
}

// Manejo de errores global
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

console.log('Script cargado correctamente');
