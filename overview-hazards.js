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

    if (risks) state.textContent = `${risks} risk sinyali`;
    else if (waiting) state.textContent = 'Veriler yükleniyor';
    else if (unavailable) state.textContent = 'Kısmi veri';
    else if (forecastComplete && fireComplete) state.textContent = 'Belirgin risk yok';
  }

  function readableDate(date) {
    const parsed = new Date(`${date}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
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
    const rainChance = Number.isFinite(probability) ? ` · yağış olasılığı %${Math.round(probability)}` : '';
    const dayLabel = dates[rainDay] ? ` · ${readableDate(dates[rainDay])}` : '';

    if (!rain.length && !rainProbability.length) {
      setCard('rain', 'unavailable', 'Yağış verisi yok', 'Tahminde yağış miktarı ve olasılık verisi bulunamadı.');
    } else if (maxRain >= 20 || (maxRain >= 10 && probability >= 70)) {
      setCard('rain', 'danger', 'Kuvvetli yağış olasılığı', `En yağışlı gün ${maxRain.toLocaleString('tr-TR')} mm${rainChance}${dayLabel}.`);
    } else if (maxRain >= 5 || probability >= 50) {
      setCard('rain', 'warning', 'Yağış bekleniyor', `En yağışlı gün ${maxRain.toLocaleString('tr-TR')} mm${rainChance}${dayLabel}.`);
    } else {
      setCard('rain', 'ok', 'Belirgin yağış görünmüyor', `10 günlük tahminde günlük yağış en fazla ${maxRain.toLocaleString('tr-TR')} mm${dayLabel}.`);
    }

    const hailDay = codes.findIndex(code => code === 96 || code === 99);
    const stormDay = codes.findIndex(code => code === 95 || code === 82);
    if (!codes.length) {
      setCard('hail', 'unavailable', 'Hava durumu kodu yok', 'Dolu ve fırtına tahmini için gerekli veri bulunamadı.');
    } else if (hailDay >= 0) {
      setCard('hail', codes[hailDay] === 99 ? 'danger' : 'warning', 'Dolu ihtimali', `Tahminde dolu kodu var${dates[hailDay] ? ` · ${readableDate(dates[hailDay])}` : ''}.`);
    } else if (stormDay >= 0) {
      setCard('hail', 'warning', 'Fırtına ihtimali', `Gök gürültülü fırtına tahmini${dates[stormDay] ? ` · ${readableDate(dates[stormDay])}` : ''}.`);
    } else {
      setCard('hail', 'ok', 'Dolu / fırtına sinyali yok', '10 günlük tahminde dolu veya kuvvetli fırtına kodu görülmedi.');
    }

    const maxTemp = maxTemperatures.length ? Math.max(...maxTemperatures) : null;
    const minTemp = minTemperatures.length ? Math.min(...minTemperatures) : null;
    if (maxTemp === null && minTemp === null) {
      setCard('heat', 'unavailable', 'Sıcaklık verisi yok', 'Tahminde sıcaklık verisi bulunamadı.');
    } else if (maxTemp !== null && maxTemp >= 40) {
      setCard('heat', 'danger', 'Aşırı sıcak', `Tahmini en yüksek ${Math.round(maxTemp)}°C${minTemp !== null ? ` · en düşük ${Math.round(minTemp)}°C` : ''}.`);
    } else if (maxTemp !== null && maxTemp >= 35) {
      setCard('heat', 'warning', 'Sıcak hava', `Tahmini en yüksek ${Math.round(maxTemp)}°C${minTemp !== null ? ` · en düşük ${Math.round(minTemp)}°C` : ''}.`);
    } else if (minTemp !== null && minTemp <= 0) {
      setCard('heat', 'warning', 'Don ihtimali', `Tahmini en düşük ${Math.round(minTemp)}°C${maxTemp !== null ? ` · en yüksek ${Math.round(maxTemp)}°C` : ''}.`);
    } else {
      const details = [
        maxTemp !== null ? `en yüksek ${Math.round(maxTemp)}°C` : '',
        minTemp !== null ? `en düşük ${Math.round(minTemp)}°C` : ''
      ].filter(Boolean).join(' · ');
      setCard('heat', 'ok', 'Belirgin sıcaklık riski yok', `Tahmini ${details}.`);
    }
    forecastComplete = true;
    updateSummary();
  }

  function updateForecastError(currentRequestId) {
    if (currentRequestId !== requestId) return;
    forecastComplete = true;
    setCard('rain', 'unavailable', 'Tahmin alınamadı', 'Hava durumu servisi şu anda yanıt vermiyor.');
    setCard('hail', 'unavailable', 'Tahmin alınamadı', 'Dolu ve fırtına verisi şu anda alınamıyor.');
    setCard('heat', 'unavailable', 'Tahmin alınamadı', 'Sıcaklık verisi şu anda alınamıyor.');
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
              ? 'NASA FIRMS anahtarı yapılandırılmamış.'
              : 'NASA FIRMS servisi şu anda erişilemiyor.'
          };
        }
        const detections = Number(data.detections);
        if (!Number.isFinite(detections)) return { available: false, message: 'NASA FIRMS yanıtında tespit sayısı bulunamadı.' };
        return { available: true, detections, windowDays: Number(data.window_days) || 1 };
      })
      .catch(() => ({ available: false, message: 'NASA FIRMS servisine bağlanılamadı.' }));
    return fireCachePromise;
  }

  function updateFire(result, currentRequestId) {
    if (currentRequestId !== requestId) return;
    fireComplete = true;
    if (!result.available) {
      setCard('fire', 'unavailable', 'Yangın verisi alınamadı', result.message);
    } else if (result.detections > 0) {
      setCard('fire', 'warning', `${result.detections} uydu tespiti`, `NASA FIRMS · yakın çevrede son ${result.windowDays} gün. Tespit, tarla içi yangın doğrulaması değildir.`);
    } else {
      setCard('fire', 'ok', 'Uydu tespiti yok', `NASA FIRMS · yakın çevrede son ${result.windowDays} gün. Tespit olmaması yangın olmadığını garanti etmez.`);
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
    document.getElementById('overview-hazard-state').textContent = 'Veriler yükleniyor';

    const locationInput = document.getElementById('location');
    const savedField = document.getElementById('quick-field-select');
    const crop = document.getElementById('crop');
    const selectedLocation = locationInput.value.trim()
      || (savedField.selectedIndex > 0 ? savedField.options[savedField.selectedIndex].text : '');
    const cropName = crop.options[crop.selectedIndex]?.text;
    document.getElementById('overview-hazard-location').textContent = [selectedLocation, cropName].filter(Boolean).join(' · ');
    document.getElementById('overview-hazard-source').textContent = 'Hava: Open-Meteo · Yangın: NASA FIRMS uydu tespiti. Bu özet erken uyarıdır; yerel saha kontrolünün yerini tutmaz.';

    Object.keys(cards).forEach(type => setCard(type, 'pending', 'Veri bekleniyor', 'Seçilen tarla için veri alınıyor.'));
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
