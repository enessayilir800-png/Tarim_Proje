/**
 * agro-advisor.js - TarımYol Akıllı Tarımsal Karar Desteği
 * Tarlanın koordinatına ve NASA POWER / Meteoroloji verilerine göre
 * Rüzgar ve Yağmur analizli: İlaçlama, Fıskiye (Yağmurlama) Sulama, Gübreleme & Karar Takvimi
 */

// ============================================================================
// NASA POWER & AppEEARS API AYARI (KOD İÇİNDEN GİRİŞ)
// ============================================================================
// NASA POWER veya NASA Earthdata API anahtarınızı / token'ınızı tırnakların içine yapıştırabilirsiniz.
// Eğer boş bırakırsanız sistem NASA POWER açık veri (open-data) protokolüyle ücretsiz çalışmaya devam eder.
const NASA_POWER_API_KEY = ""; 
// ============================================================================

(() => {
  const $ = id => document.getElementById(id);

  // Hava durumu kodları (WMO) açıklamaları ve ikonları
  const WMO_CODES = {
    0: { text: 'Clear / Sunny', icon: '☀️' },
    1: { text: 'Mainly Clear', icon: '🌤️' },
    2: { text: 'Partly Cloudy', icon: '⛅' },
    3: { text: 'Overcast', icon: '☁️' },
    45: { text: 'Fog', icon: '🌫️' },
    48: { text: 'Rime Fog', icon: '🌫️' },
    51: { text: 'Light Drizzle', icon: '🌦️' },
    53: { text: 'Drizzle', icon: '🌦️' },
    55: { text: 'Dense Drizzle', icon: '🌧️' },
    61: { text: 'Light Rain', icon: '🌧️' },
    63: { text: 'Moderate Rain', icon: '🌧️' },
    65: { text: 'Heavy Rain', icon: '⛈️' },
    71: { text: 'Light Snow', icon: '🌨️' },
    73: { text: 'Snowfall', icon: '❄️' },
    75: { text: 'Heavy Snow', icon: '❄️' },
    80: { text: 'Rain Showers', icon: '🌦️' },
    81: { text: 'Heavy Showers', icon: '🌧️' },
    82: { text: 'Violent Rain Showers', icon: '⛈️' },
    95: { text: 'Thunderstorm', icon: '⛈️' },
  };

  function getWeatherDesc(code) {
    return WMO_CODES[code] || { text: 'Variable', icon: '🌤️' };
  }

  // Rüzgar yönü dereceyi yön metnine çevirir
  function getWindDirection(deg) {
    if (deg == null) return '—';
    const directions = ['North (N)', 'Northeast (NE)', 'East (E)', 'Southeast (SE)', 'South (S)', 'Southwest (SW)', 'West (W)', 'Northwest (NW)'];
    return directions[Math.round(deg / 45) % 8];
  }

  // İLAÇLAMA DEĞERLENDİRMESİ (Rüzgar & Yağmur Kriterleri)
  function evaluateSpraying(windSpeed, rain) {
    if (rain > 0.5) {
      return {
        level: 'danger',
        badge: '🔴 Do Not Spray',
        title: 'Rain Risk',
        desc: `Expected rainfall (${rain.toFixed(1)} mm) may wash the product off leaves and into the soil. Avoid spraying under these conditions.`
      };
    }
    if (windSpeed > 18) {
      return {
        level: 'danger',
        badge: '🔴 Do Not Spray',
        title: 'Strong Wind',
        desc: `Wind speed (${windSpeed.toFixed(0)} km/h) is above 18 km/h. Spray may drift off target and affect neighboring fields.`
      };
    }
    if (windSpeed >= 12 && windSpeed <= 18) {
      return {
        level: 'warning',
        badge: '🟡 Use Caution',
        title: 'Moderate Wind',
        desc: `Wind speed is ${windSpeed.toFixed(0)} km/h. If conditions allow, spray only during calmer early-morning or evening hours and use a nozzle that produces larger droplets.`
      };
    }
    return {
      level: 'success',
      badge: '🟢 Favorable for Spraying',
      title: 'Favorable Conditions',
      desc: `Winds are light (${windSpeed.toFixed(0)} km/h) and no rain is expected. These conditions can support good leaf coverage.`
    };
  }

  // FISKİYE (YAĞMURLAMA) SULAMA DEĞERLENDİRMESİ (Rüzgara Göre Savrulma Riski)
  function evaluateSprinkler(windSpeed) {
    if (windSpeed > 15) {
      return {
        level: 'danger',
        badge: '🔴 Avoid Sprinkler Irrigation',
        title: 'Strong Wind (Drift Risk)',
        desc: `Winds are very strong (${windSpeed.toFixed(0)} km/h). Sprinkler water may drift, causing uneven irrigation. Wait for calmer conditions or consider drip irrigation.`
      };
    }
    if (windSpeed >= 8 && windSpeed <= 15) {
      return {
        level: 'warning',
        badge: '🟡 Use Sprinklers with Caution',
        title: 'Moderate Wind (Some Drift Possible)',
        desc: `Wind speed is ${windSpeed.toFixed(0)} km/h. Water droplets may drift. If possible, irrigate in the evening or at night when winds ease, or lower the sprinkler height.`
      };
    }
    return {
      level: 'success',
      badge: '🟢 Favorable for Sprinkler Irrigation',
      title: 'Calm Conditions (Even Distribution)',
      desc: `Winds are light (${windSpeed.toFixed(0)} km/h), reducing drift and supporting more even sprinkler coverage.`
    };
  }

  // GÜBRELEME DEĞERLENDİRMESİ (Yağmur Kriterleri)
  function evaluateFertilization(rain, nextRain) {
    const totalRain = rain + (nextRain || 0);

    if (totalRain >= 5 && totalRain <= 20) {
      return {
        level: 'success',
        badge: '🟢 Favorable Fertilizer Window',
        title: 'Moderate Rain Expected',
        desc: `${totalRain.toFixed(1)} mm of light to moderate rain is forecast, which may help move nitrogen and urea fertilizer into the root zone.`
      };
    }
    if (totalRain > 25) {
      return {
        level: 'danger',
        badge: '🔴 Avoid Fertilizing',
        title: 'Leaching and Runoff Risk',
        desc: `Heavy rainfall (${totalRain.toFixed(1)} mm) may wash fertilizer off the field and into waterways, causing nutrient loss.`
      };
    }
    return {
      level: 'warning',
      badge: '🟡 Coordinate with Irrigation',
      title: 'Limited Rain Expected',
      desc: `Only ${totalRain.toFixed(1)} mm of rain is forecast. Apply nitrogen fertilizer in line with soil conditions and irrigation plans to reduce losses.`
    };
  }

  // GENEL TOPRAK SULAMA İHTİYACI
  function evaluateIrrigation(rainSum3Days, maxTemp) {
    if (rainSum3Days >= 12) {
      return {
        level: 'danger',
        badge: '🔴 Pause Irrigation',
        title: 'Rainfall May Meet Crop Needs',
        desc: `${rainSum3Days.toFixed(1)} mm of rain is forecast over the next three days. Consider pausing irrigation to conserve water and energy.`
      };
    }
    if (rainSum3Days < 4 && maxTemp > 24) {
      return {
        level: 'success',
        badge: '🟢 Irrigation May Be Needed',
        title: 'High Evaporative Demand',
        desc: `Warm conditions (${maxTemp.toFixed(0)}°C) and no rain are forecast. Consider irrigation to help prevent crop water stress.`
      };
    }
    return {
      level: 'warning',
      badge: '🟡 Check Soil Moisture',
      title: 'Moderate Conditions',
      desc: `Check soil moisture in the root zone. Avoid unnecessary irrigation if soil moisture is adequate.`
    };
  }

  // Hava verilerini çek (Yerel FastAPI proxy -> Yedek Açık Open-Meteo)
  async function fetchForecast(lat, lon) {
    const localUrl = `/api/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
    const remoteUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,winddirection_10m_dominant&timezone=auto`;

    try {
      const res = await fetch(localUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.daily && data.daily.time) return normalizeDailyForecast(data.daily);
      }
    } catch (_) {}

    // Yedek doğrudan çağrı
    const resRemote = await fetch(remoteUrl);
    if (!resRemote.ok) throw new Error('Weather data could not be retrieved.');
    const remoteData = await resRemote.json();
    return normalizeDailyForecast(remoteData.daily);
  }

  function normalizeDailyForecast(daily) {
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      throw new Error('The forecast returned no data.');
    }

    const aliases = {
      weathercode: ['weathercode', 'weather_code'],
      windspeed_10m_max: ['windspeed_10m_max', 'wind_speed_10m_max']
    };
    const normalized = { ...daily };
    Object.entries(aliases).forEach(([target, keys]) => {
      const values = keys.map(key => daily[key]).find(Array.isArray);
      if (values) normalized[target] = values;
    });

    const required = ['weathercode', 'windspeed_10m_max', 'precipitation_sum', 'temperature_2m_max', 'temperature_2m_min'];
    const missing = required.filter(key => !Array.isArray(normalized[key]) || normalized[key].length === 0);
    if (missing.length) {
      throw new Error(`Required forecast data is missing: ${missing.join(', ')}.`);
    }

    return normalized;
  }

  // Veriyi analiz edip arayüze döken ana fonksiyon
  async function loadForCoordinates(lat, lon, fieldInfo = {}) {
    const container = $('agro-advisor-container');
    if (!container) return;

    container.hidden = false;
    container.innerHTML = `
      <div class="agro-loading">
        <div class="loader"></div>
        <p>Analyzing wind, sprinkler irrigation, and rainfall for <strong>${escapeHtml(fieldInfo.name || 'Field')}</strong>…</p>
        <small>Location: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°</small>
      </div>
    `;

    try {
      const daily = await fetchForecast(lat, lon);
      renderAdvisor(daily, lat, lon, fieldInfo);

      // Harita üzerine hava durumu rozeti ekle
      if (window.addWeatherBadgeToMap) {
        window.addWeatherBadgeToMap(lat, lon, {
          wind: daily.windspeed_10m_max[0] || 0,
          rain: daily.precipitation_sum[0] || 0,
          temp: daily.temperature_2m_max[0] || 0,
          fieldName: fieldInfo.name || 'Field'
        });
      }

    } catch (err) {
      container.innerHTML = `
        <div class="agro-error-box">
          <p>⚠️ Weather and agricultural analysis could not be loaded: ${escapeHtml(err.message)}</p>
          <button type="button" onclick="window.AgroAdvisor.loadForCoordinates(${lat}, ${lon})">Try again</button>
        </div>
      `;
    }
  }

  function renderAdvisor(daily, lat, lon, fieldInfo) {
    const container = $('agro-advisor-container');
    if (!container) return;

    const todayWind = daily.windspeed_10m_max[0] || 0;
    const todayWindDir = daily.winddirection_10m_dominant ? daily.winddirection_10m_dominant[0] : null;
    const todayRain = daily.precipitation_sum[0] || 0;
    const todayRainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
    const tomorrowRain = daily.precipitation_sum[1] || 0;
    const todayTempMax = daily.temperature_2m_max[0] || 0;
    const todayTempMin = daily.temperature_2m_min[0] || 0;
    const todayWeather = getWeatherDesc(daily.weathercode[0]);

    // 3 günlük toplam yağış
    const rainSum3Days = (daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + (b || 0), 0));

    // Kararlar
    const sprayDecision = evaluateSpraying(todayWind, todayRain);
    const sprinklerDecision = evaluateSprinkler(todayWind);
    const fertDecision = evaluateFertilization(todayRain, tomorrowRain);
    const irrigDecision = evaluateIrrigation(rainSum3Days, todayTempMax);

    // Günlük tablo satırları
    const tableRows = daily.time.map((dateStr, i) => {
      const date = new Date(dateStr);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
      const wDesc = getWeatherDesc(daily.weathercode[i]);
      const wSpeed = daily.windspeed_10m_max[i] || 0;
      const pSum = daily.precipitation_sum[i] || 0;
      const tMax = daily.temperature_2m_max[i] || 0;
      const tMin = daily.temperature_2m_min[i] || 0;

      const sp = evaluateSpraying(wSpeed, pSum);
      const spk = evaluateSprinkler(wSpeed);
      const ft = evaluateFertilization(pSum, daily.precipitation_sum[i + 1] || 0);

      return `
        <tr class="${i === 0 ? 'today-row' : ''}">
          <td><strong>${dayName}</strong></td>
          <td><span title="${wDesc.text}">${wDesc.icon} ${wDesc.text}</span></td>
          <td><b>${tMax.toFixed(0)}°</b> / <small>${tMin.toFixed(0)}°</small></td>
          <td><span class="agro-wind-pill ${wSpeed > 18 ? 'danger' : wSpeed > 12 ? 'warning' : 'ok'}">💨 ${wSpeed.toFixed(0)} km/h</span></td>
          <td><span class="agro-rain-pill ${pSum > 10 ? 'rain-high' : pSum > 0 ? 'rain-light' : 'rain-none'}">🌧️ ${pSum.toFixed(1)} mm</span></td>
          <td><span class="agro-status-chip ${sp.level}">${sp.badge}</span></td>
          <td><span class="agro-status-chip ${spk.level}">${spk.badge}</span></td>
          <td><span class="agro-status-chip ${ft.level}">${ft.badge}</span></td>
        </tr>
      `;
    }).join('');

    const fieldTitle = fieldInfo.name ? `"${escapeHtml(fieldInfo.name)}"` : 'Selected field';
    const adaParselText = (fieldInfo.block && fieldInfo.parcel) ? `(Block: ${fieldInfo.block}, Parcel: ${fieldInfo.parcel})` : '';

    container.innerHTML = `
      <section class="agro-advisor-card">
        <div class="agro-advisor-header">
          <div>
            <div class="agro-badge-row">
              <span class="agro-tag">📡 LIVE FIELD WEATHER REPORT</span>
              <span class="agro-tag-field">🌾 ${fieldTitle} ${escapeHtml(adaParselText)}</span>
            </div>
            <h3>Today's Field Operations & Guidance</h3>
            <p>Wind-based guidance for <b>sprinkler irrigation</b> and <b>spraying</b>, plus rainfall-based <b>fertilizer timing</b>.</p>
          </div>
          <div class="agro-weather-today-box">
            <span class="today-icon">${todayWeather.icon}</span>
            <div class="today-temp-wrap">
              <strong>${todayTempMax.toFixed(0)}°C</strong>
              <small>${todayWeather.text}</small>
            </div>
          </div>
        </div>

        <!-- Four key weather indicators -->
        <div class="agro-kpi-grid">
          <div class="agro-kpi-card">
            <span class="kpi-label">💨 Wind Speed & Direction</span>
            <strong class="kpi-value ${todayWind > 18 ? 'text-danger' : todayWind > 12 ? 'text-warning' : 'text-ok'}">
              ${todayWind.toFixed(1)} <small>km/h</small>
            </strong>
            <span class="kpi-sub">${getWindDirection(todayWindDir)}</span>
          </div>

          <div class="agro-kpi-card">
            <span class="kpi-label">🌧️ Rainfall Expected Today</span>
            <strong class="kpi-value ${todayRain > 5 ? 'text-danger' : 'text-ok'}">
              ${todayRain.toFixed(1)} <small>mm</small>
            </strong>
            <span class="kpi-sub">Chance of rain: ${todayRainProb}%</span>
          </div>

          <div class="agro-kpi-card">
            <span class="kpi-label">💧 Three-Day Rainfall Total</span>
            <strong class="kpi-value text-accent">
              ${rainSum3Days.toFixed(1)} <small>mm</small>
            </strong>
            <span class="kpi-sub">Soil moisture contribution</span>
          </div>

          <div class="agro-kpi-card">
            <span class="kpi-label">🌡️ Temperature (Day / Night)</span>
            <strong class="kpi-value">
              ${todayTempMax.toFixed(0)}° / ${todayTempMin.toFixed(0)}°
            </strong>
            <span class="kpi-sub">Air temperature</span>
          </div>
        </div>

        <!-- Four agricultural guidance cards -->
        <div class="agro-decisions-grid agro-decisions-grid-4">
          <!-- 1. İLAÇLAMA -->
          <div class="agro-decision-card decision-${sprayDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">🚜</span>
              <div>
                <h4>Spraying Conditions</h4>
                <span class="dec-badge badge-${sprayDecision.level}">${sprayDecision.badge}</span>
              </div>
            </div>
            <strong>${sprayDecision.title}</strong>
            <p>${sprayDecision.desc}</p>
          </div>

          <!-- 2. Sprinkler irrigation -->
          <div class="agro-decision-card decision-${sprinklerDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">💦</span>
              <div>
                <h4>Sprinkler Irrigation</h4>
                <span class="dec-badge badge-${sprinklerDecision.level}">${sprinklerDecision.badge}</span>
              </div>
            </div>
            <strong>${sprinklerDecision.title}</strong>
            <p>${sprinklerDecision.desc}</p>
          </div>

          <!-- 3. Fertilization -->
          <div class="agro-decision-card decision-${fertDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">🌾</span>
              <div>
                <h4>Fertilizer Conditions</h4>
                <span class="dec-badge badge-${fertDecision.level}">${fertDecision.badge}</span>
              </div>
            </div>
            <strong>${fertDecision.title}</strong>
            <p>${fertDecision.desc}</p>
          </div>

          <!-- 4. Field water needs -->
          <div class="agro-decision-card decision-${irrigDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">💧</span>
              <div>
                <h4>Field Water Needs</h4>
                <span class="dec-badge badge-${irrigDecision.level}">${irrigDecision.badge}</span>
              </div>
            </div>
            <strong>${irrigDecision.title}</strong>
            <p>${irrigDecision.desc}</p>
          </div>
        </div>

        <!-- Seven-day field operations schedule -->
        <div class="agro-schedule-section">
          <div class="schedule-head">
            <h4>📅 Seven-Day Field Guidance (Wind, Sprinklers & Rain)</h4>
            <small>See which upcoming days may be suitable for spraying or sprinkler irrigation.</small>
          </div>
          <div class="table-responsive">
            <table class="agro-schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weather</th>
                  <th>Temperature</th>
                  <th>Wind</th>
                  <th>Rain</th>
                  <th>Spraying</th>
                  <th>Sprinkler irrigation</th>
                  <th>Fertilization</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.AgroAdvisor = {
    loadForCoordinates,
    evaluateSpraying,
    evaluateSprinkler,
    evaluateFertilization,
    evaluateIrrigation
  };
})();
