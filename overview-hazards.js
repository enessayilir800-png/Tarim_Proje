(function () {
  const panel = document.getElementById('overview-hazard-panel');
  const stage = document.getElementById('overview-hazard-stage');
  const form = document.getElementById('farm-form');
  if (!panel || !stage || !form) return;

  const cards = {
    rain: ['overview-rain-status', 'overview-rain-detail'],
    hail: ['overview-hail-status', 'overview-hail-detail'],
    fire: ['overview-fire-status', 'overview-fire-detail'],
    heat: ['overview-heat-status', 'overview-heat-detail']
  };
  let requestId = 0;
  let fireCacheKey = '';
  let fireCachePromise = null;
  let forecastComplete = false;
  let fireComplete = false;

  function setCard(type, level, title, detail) {
    const card = panel.querySelector(`[data-risk="${type}"]`);
    const [statusId, detailId] = cards[type];
    card.dataset.level = level;
    document.getElementById(statusId).textContent = title;
    document.getElementById(detailId).textContent = detail;
    updateSummary();
  }

  function updateSummary() {
    const levels = Array.from(panel.querySelectorAll('.overview-risk-card'), card => card.dataset.level);
    const risks = levels.filter(level => level === 'warning' || level === 'danger').length;
    const waiting = levels.some(level => level === 'pending');
    const unavailable = levels.some(level => level === 'unavailable');
    const state = document.getElementById('overview-hazard-state');

    if (risks) state.textContent = `${risks} risk alert${risks === 1 ? '' : 's'}`;
    else if (waiting) state.textContent = 'Loading data';
    else if (unavailable) state.textContent = 'Partial data';
    else if (forecastComplete && fireComplete) state.textContent = 'No significant risks detected';
  }

  function readableDate(date) {
    const parsed = new Date(`${date}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en', { day: 'numeric', month: 'short' });
  }

  function numericValues(values) {
    return Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [];
  }

  function updateForecast(data, currentRequestId) {
    if (currentRequestId !== requestId) return;
    const daily = data && data.daily;
    const dates = daily && Array.isArray(daily.time) ? daily.time : [];
    if (!dates.length) {
      updateForecastError(currentRequestId);
      return;
    }

    const rain = numericValues(daily.precipitation_sum);
    const rainProbability = numericValues(daily.precipitation_probability_max);
    const codes = numericValues(daily.weather_code);
    const maxTemperatures = numericValues(daily.temperature_2m_max);
    const minTemperatures = numericValues(daily.temperature_2m_min);
    const rainDay = rain.reduce((best, value, index) => value > (rain[best] ?? -1) ? index : best, 0);
    const maxRain = rain[rainDay] ?? 0;
    const probability = rainProbability[rainDay];
    const rainChance = Number.isFinite(probability) ? ` · ${Math.round(probability)}% chance of rain` : '';
    const dayLabel = dates[rainDay] ? ` · ${readableDate(dates[rainDay])}` : '';

    if (!rain.length && !rainProbability.length) {
      setCard('rain', 'unavailable', 'Rain data unavailable', 'The forecast does not include rainfall amount or probability data.');
    } else if (maxRain >= 20 || (maxRain >= 10 && probability >= 70)) {
      setCard('rain', 'danger', 'Heavy rain likely', `Wettest day: ${maxRain.toLocaleString('en-US')} mm${rainChance}${dayLabel}.`);
    } else if (maxRain >= 5 || probability >= 50) {
      setCard('rain', 'warning', 'Rain expected', `Wettest day: ${maxRain.toLocaleString('en-US')} mm${rainChance}${dayLabel}.`);
    } else {
      setCard('rain', 'ok', 'No significant rain expected', `Daily rainfall reaches at most ${maxRain.toLocaleString('en-US')} mm in the 10-day forecast${dayLabel}.`);
    }

    const hailDay = codes.findIndex(code => code === 96 || code === 99);
    const stormDay = codes.findIndex(code => code === 95 || code === 82);
    if (!codes.length) {
      setCard('hail', 'unavailable', 'Weather code unavailable', 'Required data for hail and storm forecasts was not found.');
    } else if (hailDay >= 0) {
      setCard('hail', codes[hailDay] === 99 ? 'danger' : 'warning', 'Dolu ihtimali', `Tahminde dolu kodu var${dates[hailDay] ? ` · ${readableDate(dates[hailDay])}` : ''}.`);
    } else if (stormDay >= 0) {
      setCard('hail', 'warning', 'Storm possible', `Thunderstorm forecast${dates[stormDay] ? ` · ${readableDate(dates[stormDay])}` : ''}.`);
    } else {
      setCard('hail', 'ok', 'No hail or storm signal', 'No hail or severe storm code appears in the 10-day forecast.');
    }

    const maxTemp = maxTemperatures.length ? Math.max(...maxTemperatures) : null;
    const minTemp = minTemperatures.length ? Math.min(...minTemperatures) : null;
    if (maxTemp === null && minTemp === null) {
      setCard('heat', 'unavailable', 'Temperature data unavailable', 'The forecast does not include temperature data.');
    } else if (maxTemp !== null && maxTemp >= 40) {
      setCard('heat', 'danger', 'Extreme heat', `Forecast high ${Math.round(maxTemp)}°C${minTemp !== null ? ` · low ${Math.round(minTemp)}°C` : ''}.`);
    } else if (maxTemp !== null && maxTemp >= 35) {
      setCard('heat', 'warning', 'Hot weather', `Forecast high ${Math.round(maxTemp)}°C${minTemp !== null ? ` · low ${Math.round(minTemp)}°C` : ''}.`);
    } else if (minTemp !== null && minTemp <= 0) {
      setCard('heat', 'warning', 'Frost possible', `Forecast low ${Math.round(minTemp)}°C${maxTemp !== null ? ` · high ${Math.round(maxTemp)}°C` : ''}.`);
    } else {
      const details = [
        maxTemp !== null ? `en yüksek ${Math.round(maxTemp)}°C` : '',
        minTemp !== null ? `en düşük ${Math.round(minTemp)}°C` : ''
      ].filter(Boolean).join(' · ');
      setCard('heat', 'ok', 'No significant temperature risk', `Forecast: ${details}.`);
    }
    forecastComplete = true;
    updateSummary();
  }

  function updateForecastError(currentRequestId) {
    if (currentRequestId !== requestId) return;
    forecastComplete = true;
    setCard('rain', 'unavailable', 'Forecast unavailable', 'The weather service is not responding right now.');
    setCard('hail', 'unavailable', 'Forecast unavailable', 'Hail and storm data cannot be retrieved right now.');
    setCard('heat', 'unavailable', 'Forecast unavailable', 'Temperature data cannot be retrieved right now.');
  }

  async function getFireData(latitude, longitude) {
    const key = `${latitude},${longitude}`;
    if (key === fireCacheKey && fireCachePromise) return fireCachePromise;
    fireCacheKey = key;
    fireCachePromise = fetch(`/api/fires?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`)
      .then(async response => {
        let data = {};
        try {
          data = await response.json();
        } catch (_error) {
          data = {};
        }
        if (!response.ok) {
          const detail = typeof data.detail === 'string' ? data.detail : '';
          return {
            available: false,
            message: detail.includes('NASA_FIRMS_MAP_KEY')
              ? 'The NASA FIRMS key is not configured.'
              : 'The NASA FIRMS service is currently unavailable.'
          };
        }
        const detections = Number(data.detections);
        if (!Number.isFinite(detections)) return { available: false, message: 'The NASA FIRMS response did not include a detection count.' };
        return { available: true, detections, windowDays: Number(data.window_days) || 1 };
      })
      .catch(() => ({ available: false, message: 'Could not connect to the NASA FIRMS service.' }));
    return fireCachePromise;
  }

  function updateFire(result, currentRequestId) {
    if (currentRequestId !== requestId) return;
    fireComplete = true;
    if (!result.available) {
      setCard('fire', 'unavailable', 'Fire data unavailable', result.message);
    } else if (result.detections > 0) {
      setCard('fire', 'warning', `${result.detections} satellite detections`, `NASA FIRMS · within the past ${result.windowDays} days nearby. A detection does not confirm a fire inside the field.`);
    } else {
      setCard('fire', 'ok', 'No satellite detections', `NASA FIRMS · within the past ${result.windowDays} days nearby. No detection does not guarantee there is no fire.`);
    }
    updateSummary();
  }

  function start(latitude, longitude) {
    requestId += 1;
    forecastComplete = false;
    fireComplete = false;
    fireCacheKey = '';
    fireCachePromise = null;
    panel.classList.remove('hidden');
    stage.classList.add('has-hazards');
    document.getElementById('overview-hazard-state').textContent = 'Loading data';

    const locationInput = document.getElementById('location');
    const savedField = document.getElementById('quick-field-select');
    const crop = document.getElementById('crop');
    const selectedLocation = locationInput.value.trim()
      || (savedField.selectedIndex > 0 ? savedField.options[savedField.selectedIndex].text : '');
    const cropName = crop.options[crop.selectedIndex]?.text;
    document.getElementById('overview-hazard-location').textContent = [selectedLocation, cropName].filter(Boolean).join(' · ');
    document.getElementById('overview-hazard-source').textContent = 'Weather: Open-Meteo · Fire: NASA FIRMS satellite detections. This is an early-warning summary and does not replace local field checks.';

    Object.keys(cards).forEach(type => setCard(type, 'pending', 'Waiting for data', 'Retrieving data for the selected field.'));
    const currentRequestId = requestId;
    getFireData(latitude, longitude).then(result => updateFire(result, currentRequestId));
    return currentRequestId;
  }

  window.OverviewHazards = {
    start,
    currentRequestId: () => requestId,
    updateForecast,
    updateForecastError,
    getFireData
  };
})();
