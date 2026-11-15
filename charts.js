// TarımYol - Dashboard İklim Grafikleri (Chart.js)
(function () {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  window.renderDashboardCharts = function (monthlyStats, cropKey) {
    if (!window.Chart || !monthlyStats || !monthlyStats.length) return;

    const reportEl = document.getElementById('report');
    if (!reportEl) return;

    // Remove the previous chart container, if present.
    const oldSection = document.getElementById('dashboard-charts-box');
    if (oldSection) oldSection.remove();

    // Create the new chart container.
    const container = document.createElement('div');
    container.id = 'dashboard-charts-box';
    container.className = 'dashboard-charts-section';
    container.innerHTML = `
      <div class="timeline-title">CLIMATE AND CROP GROWTH CHARTS (NASA POWER)</div>
      <div class="dashboard-charts-grid">
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <h4>Monthly Temperature and Crop Suitability Range (°C)</h4>
            <span class="dash-chart-badge">Temperature & Tolerance</span>
          </div>
          <div class="canvas-wrap"><canvas id="chart-temp-suitability"></canvas></div>
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <h4>Average Monthly Rainfall (mm)</h4>
            <span class="dash-chart-badge">Water Input</span>
          </div>
          <div class="canvas-wrap"><canvas id="chart-rainfall"></canvas></div>
        </div>
        <div class="dash-chart-card dash-chart-card-full">
          <div class="dash-chart-head">
            <h4>Humidity (%) and Solar Radiation (kWh/m²/day)</h4>
            <span class="dash-chart-badge">Evaporation Dynamics</span>
          </div>
          <div class="canvas-wrap"><canvas id="chart-humidity-solar"></canvas></div>
        </div>
      </div>
    `;

    // Insert immediately after the report summary.
    const summaryCard = reportEl.querySelector('.report-summary') || reportEl.firstElementChild;
    if (summaryCard) {
      summaryCard.after(container);
    } else {
      reportEl.appendChild(container);
    }

    const temps = monthlyStats.map(m => m.temp !== null ? Number(m.temp.toFixed(1)) : null);
    const rains = monthlyStats.map(m => m.rain !== null ? Math.round(m.rain * 30.4) : 0);
    const humidities = monthlyStats.map(m => m.humidity !== null ? Math.round(m.humidity) : null);
    const solars = monthlyStats.map(m => m.solar !== null ? Number(m.solar.toFixed(2)) : null);

    const cropData = window.CROPS ? window.CROPS[cropKey] : null;
    const minTemp = cropData ? cropData.temp[0] : 10;
    const maxTemp = cropData ? cropData.temp[1] : 25;

    // 1. Temperature and suitability chart
    const tempCanvas = document.getElementById('chart-temp-suitability');
    if (tempCanvas) {
      new Chart(tempCanvas, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [
            {
              label: 'Regional Temperature (°C)',
              data: temps,
              borderColor: '#e19a54',
              backgroundColor: 'rgba(225, 154, 84, 0.15)',
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#e19a54',
              pointRadius: 4
            },
            {
              label: `Suitable Upper Limit (${maxTemp}°C)`,
              data: Array(12).fill(maxTemp),
              borderColor: '#387049',
              borderDash: [5, 5],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false
            },
            {
              label: `Suitable Lower Limit (${minTemp}°C)`,
              data: Array(12).fill(minTemp),
              borderColor: '#6b9e77',
              borderDash: [5, 5],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          },
          scales: {
            y: { title: { display: true, text: '°C' }, grid: { color: '#f0f3eb' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Rainfall distribution chart
    const rainCanvas = document.getElementById('chart-rainfall');
    if (rainCanvas) {
      new Chart(rainCanvas, {
        type: 'bar',
        data: {
          labels: MONTHS,
          datasets: [
            {
              label: 'Monthly Rainfall (mm)',
              data: rains,
              backgroundColor: 'rgba(74, 144, 217, 0.75)',
              borderColor: '#3a7ec9',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          },
          scales: {
            y: { title: { display: true, text: 'mm / ay' }, grid: { color: '#f0f3eb' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 3. Dual-axis humidity and radiation chart
    const humCanvas = document.getElementById('chart-humidity-solar');
    if (humCanvas) {
      new Chart(humCanvas, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [
            {
              label: 'Humidity (%)',
              data: humidities,
              borderColor: '#4b88a2',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              tension: 0.3,
              yAxisID: 'y'
            },
            {
              label: 'Solar Radiation (kWh/m²)',
              data: solars,
              borderColor: '#d48834',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              borderDash: [4, 4],
              tension: 0.3,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          },
          scales: {
            y: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'Nem (%)' },
              grid: { color: '#f0f3eb' },
              min: 0,
              max: 100
            },
            y1: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'kWh / m²' },
              grid: { drawOnChartArea: false }
            },
            x: { grid: { display: false } }
          }
        }
      });
    }
  };
})();
