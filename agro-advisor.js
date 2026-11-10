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
    0: { text: 'Açık / Güneşli', icon: '☀️' },
    1: { text: 'Çoğunlukla Açık', icon: '🌤️' },
    2: { text: 'Parçalı Bulutlu', icon: '⛅' },
    3: { text: 'Kapalı / Bulutlu', icon: '☁️' },
    45: { text: 'Sisli', icon: '🌫️' },
    48: { text: 'Kırağı / Sis', icon: '🌫️' },
    51: { text: 'Hafif Çisenti', icon: '🌦️' },
    53: { text: 'Çisenti', icon: '🌦️' },
    55: { text: 'Yoğun Çisenti', icon: '🌧️' },
    61: { text: 'Hafif Yağmur', icon: '🌧️' },
    63: { text: 'Orta Şiddetli Yağmur', icon: '🌧️' },
    65: { text: 'Kuvvetli Yağmur', icon: '⛈️' },
    71: { text: 'Hafif Kar', icon: '🌨️' },
    73: { text: 'Kar Yağışlı', icon: '❄️' },
    75: { text: 'Yoğun Kar', icon: '❄️' },
    80: { text: 'Sağanak Yağış', icon: '🌦️' },
    81: { text: 'Şiddetli Sağanak', icon: '🌧️' },
    82: { text: 'Çok Şiddetli Fırtınalı Yağış', icon: '⛈️' },
    95: { text: 'Gök Gürültülü Fırtına', icon: '⛈️' },
  };

  function getWeatherDesc(code) {
    return WMO_CODES[code] || { text: 'Değişken', icon: '🌤️' };
  }

  // Rüzgar yönü dereceyi yön metnine çevirir
  function getWindDirection(deg) {
    if (deg == null) return '—';
    const directions = ['Kuzey (K)', 'Kuzeydoğu (KD)', 'Doğu (D)', 'Güneydoğu (GD)', 'Güney (G)', 'Güneybatı (GB)', 'Batı (B)', 'Kuzeybatı (KB)'];
    return directions[Math.round(deg / 45) % 8];
  }

  // İLAÇLAMA DEĞERLENDİRMESİ (Rüzgar & Yağmur Kriterleri)
  function evaluateSpraying(windSpeed, rain) {
    if (rain > 0.5) {
      return {
        level: 'danger',
        badge: '🔴 İlaçlama Yapılamaz!',
        title: 'Yağmur Riski',
        desc: `Beklenen yağış (${rain.toFixed(1)} mm) ilacı yapraktan yıkar ve toprağa akıtır. İlaç tamamen ziyan olur, kesinlikle yapmayın.`
      };
    }
    if (windSpeed > 18) {
      return {
        level: 'danger',
        badge: '🔴 İlaçlama Yapılamaz!',
        title: 'Kuvvetli Rüzgar',
        desc: `Rüzgar hızı (${windSpeed.toFixed(0)} km/s > 18 km/s). İlaç hedefe varamaz, havada savrulup komşu tarlaya zarar verir.`
      };
    }
    if (windSpeed >= 12 && windSpeed <= 18) {
      return {
        level: 'warning',
        badge: '🟡 Dikkatli Yapılabilir',
        title: 'Orta Seviye Rüzgar',
        desc: `Rüzgar (${windSpeed.toFixed(0)} km/s). Sadece sabah erken veya akşam rüzgarsız saatte, iri damlacıklı püskürtme memesiyle yapılabilir.`
      };
    }
    return {
      level: 'success',
      badge: '🟢 İlaçlama İçin Çok Uygun',
      title: 'Kusursuz Şartlar',
      desc: `Rüzgar sakin (${windSpeed.toFixed(0)} km/s) ve yağış yok. İlacın yaprağa tam tutunması için en ideal hava koşulları.`
    };
  }

  // FISKİYE (YAĞMURLAMA) SULAMA DEĞERLENDİRMESİ (Rüzgara Göre Savrulma Riski)
  function evaluateSprinkler(windSpeed) {
    if (windSpeed > 15) {
      return {
        level: 'danger',
        badge: '🔴 Fıskiye İle Sulama YAPILAMAZ!',
        title: 'Şiddetli Rüzgar (Su Savrulur)',
        desc: `Rüzgar çok sert (${windSpeed.toFixed(0)} km/s). Fıskiyeden çıkan su havada savrulur, tarlanın bir tarafı çamur olurken diğer tarafı kupkuru kalır. Elektrik ve su tamamen boşa gider. Rüzgar dinene kadar fıskiyeyi çalıştırmayın veya damla sulama yapın.`
      };
    }
    if (windSpeed >= 8 && windSpeed <= 15) {
      return {
        level: 'warning',
        badge: '🟡 Fıskiyeyi Dikkatli Çalıştırın',
        title: 'Orta Rüzgar (Hafif Sürüklenme)',
        desc: `Rüzgar ${windSpeed.toFixed(0)} km/s hızında. Su damlaları hafifçe sürüklenebilir. Mümkünse rüzgarın durulduğu akşam/gece saatlerini bekleyin veya meme yüksekliğini alçaltın.`
      };
    }
    return {
      level: 'success',
      badge: '🟢 Fıskiye / Yağmurlama İçin İdeal',
      title: 'Sakin Hava (Eşit Dağılım)',
      desc: `Rüzgar sakin (${windSpeed.toFixed(0)} km/s). Fıskiye suyu havada savrulmadan tarlanın her köşesine eşit ve dengeli dağılır. Yağmurlama sulama için en uygun zaman.`
    };
  }

  // GÜBRELEME DEĞERLENDİRMESİ (Yağmur Kriterleri)
  function evaluateFertilization(rain, nextRain) {
    const totalRain = rain + (nextRain || 0);

    if (totalRain >= 5 && totalRain <= 20) {
      return {
        level: 'success',
        badge: '🟢 İdeal Gübreleme Zamanı',
        title: 'Mükemmel Çözünme',
        desc: `Beklenen ${totalRain.toFixed(1)} mm hafif/orta yağış, azot ve üre gübrelerinin eriyip bitki köküne inmesini sağlar.`
      };
    }
    if (totalRain > 25) {
      return {
        level: 'danger',
        badge: '🔴 Gübre Atmayın!',
        title: 'Yıkanma ve Akıntı Riski',
        desc: `Aşırı şiddetli yağış (${totalRain.toFixed(1)} mm) gübreyi tarla yüzeyinden süpürüp dereye akıtır, gübre kaybı yaşanır.`
      };
    }
    return {
      level: 'warning',
      badge: '🟡 Sulama ile Birlikte Verin',
      title: 'Toprak Kuru',
      desc: `Yetersiz yağış (${totalRain.toFixed(1)} mm). Kuru toprağa atılan azot gübresi gaz haline gelip uçar; sulama ile birlikte uygulayın.`
    };
  }

  // GENEL TOPRAK SULAMA İHTİYACI
  function evaluateIrrigation(rainSum3Days, maxTemp) {
    if (rainSum3Days >= 12) {
      return {
        level: 'danger',
        badge: '🔴 Sulamayı Kapatın',
        title: 'Doğal Yağış Yeterli',
        desc: `Önümüzdeki 3 günde toplam ${rainSum3Days.toFixed(1)} mm yağmur bekleniyor. Sulama vanalarını kapatın, su ve elektrik tasarrufu yapın.`
      };
    }
    if (rainSum3Days < 4 && maxTemp > 24) {
      return {
        level: 'success',
        badge: '🟢 Sulama Tavsiye Edilir',
        title: 'Buharlaşma Yüksek',
        desc: `Hava sıcak (${maxTemp.toFixed(0)}°C) ve yağış yok. Bitkide su stresini önlemek için sulama yapılması önerilir.`
      };
    }
    return {
      level: 'warning',
      badge: '🟡 Toprak Nemini Kontrol Edin',
      title: 'Dengeli Nem',
      desc: `Kök bölgesindeki toprak nemini kontrol edin. Toprak tavındaysa gereksiz sulamadan kaçının.`
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
    if (!resRemote.ok) throw new Error('Hava durumu verisi alınamadı.');
    const remoteData = await resRemote.json();
    return normalizeDailyForecast(remoteData.daily);
  }

  function normalizeDailyForecast(daily) {
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      throw new Error('Tahmin verisi boş döndü.');
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
      throw new Error(`Hava tahmininde gerekli veriler eksik: ${missing.join(', ')}.`);
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
        <p><strong>${escapeHtml(fieldInfo.name || 'Tarla')}</strong> için rüzgar, fıskiye ve yağmur analizi yapılıyor…</p>
        <small>Konum: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°</small>
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
          fieldName: fieldInfo.name || 'Tarla'
        });
      }

    } catch (err) {
      container.innerHTML = `
        <div class="agro-error-box">
          <p>⚠️ Hava durumu ve tarımsal analiz yüklenemedi: ${escapeHtml(err.message)}</p>
          <button type="button" onclick="window.AgroAdvisor.loadForCoordinates(${lat}, ${lon})">Tekrar Dene</button>
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
      const dayName = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
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
          <td><span class="agro-wind-pill ${wSpeed > 18 ? 'danger' : wSpeed > 12 ? 'warning' : 'ok'}">💨 ${wSpeed.toFixed(0)} km/s</span></td>
          <td><span class="agro-rain-pill ${pSum > 10 ? 'rain-high' : pSum > 0 ? 'rain-light' : 'rain-none'}">🌧️ ${pSum.toFixed(1)} mm</span></td>
          <td><span class="agro-status-chip ${sp.level}">${sp.badge}</span></td>
          <td><span class="agro-status-chip ${spk.level}">${spk.badge}</span></td>
          <td><span class="agro-status-chip ${ft.level}">${ft.badge}</span></td>
        </tr>
      `;
    }).join('');

    const fieldTitle = fieldInfo.name ? `"${escapeHtml(fieldInfo.name)}"` : 'Seçili Tarla';
    const adaParselText = (fieldInfo.block && fieldInfo.parcel) ? `(Ada: ${fieldInfo.block}, Parsel: ${fieldInfo.parcel})` : '';

    container.innerHTML = `
      <section class="agro-advisor-card">
        <div class="agro-advisor-header">
          <div>
            <div class="agro-badge-row">
              <span class="agro-tag">📡 CANLI TARLA HAVA RAPORU</span>
              <span class="agro-tag-field">🌾 ${fieldTitle} ${escapeHtml(adaParselText)}</span>
            </div>
            <h3>Günün Tarla İşlem Haritası & Kararları</h3>
            <p>Rüzgara göre <b>fıskiye ile sulama</b> ve <b>ilaçlama</b> uygunluğu; yağışa göre <b>gübreleme</b> zamanlaması.</p>
          </div>
          <div class="agro-weather-today-box">
            <span class="today-icon">${todayWeather.icon}</span>
            <div class="today-temp-wrap">
              <strong>${todayTempMax.toFixed(0)}°C</strong>
              <small>${todayWeather.text}</small>
            </div>
          </div>
        </div>

        <!-- 4 Önemli Hava Göstergesi -->
        <div class="agro-kpi-grid">
          <div class="agro-kpi-card">
            <span class="kpi-label">💨 Rüzgar Hızı & Yönü</span>
            <strong class="kpi-value ${todayWind > 18 ? 'text-danger' : todayWind > 12 ? 'text-warning' : 'text-ok'}">
              ${todayWind.toFixed(1)} <small>km/s</small>
            </strong>
            <span class="kpi-sub">${getWindDirection(todayWindDir)}</span>
          </div>

          <div class="agro-kpi-card">
            <span class="kpi-label">🌧️ Bugün Beklenen Yağış</span>
            <strong class="kpi-value ${todayRain > 5 ? 'text-danger' : 'text-ok'}">
              ${todayRain.toFixed(1)} <small>mm</small>
            </strong>
            <span class="kpi-sub">Yağış İhtimali: %${todayRainProb}</span>
          </div>

          <div class="agro-kpi-card">
            <span class="kpi-label">💧 3 Günlük Yağmur Toplamı</span>
            <strong class="kpi-value text-accent">
              ${rainSum3Days.toFixed(1)} <small>mm</small>
            </strong>
            <span class="kpi-sub">Toprak nem desteği</span>
          </div>

          <div class="agro-kpi-card">
            <span class="kpi-label">🌡️ Sıcaklık (Gündüz / Gece)</span>
            <strong class="kpi-value">
              ${todayTempMax.toFixed(0)}° / ${todayTempMin.toFixed(0)}°
            </strong>
            <span class="kpi-sub">Hava Sıcaklığı</span>
          </div>
        </div>

        <!-- 4 BÜYÜK TARIMSAL KARAR KARTI -->
        <div class="agro-decisions-grid agro-decisions-grid-4">
          <!-- 1. İLAÇLAMA -->
          <div class="agro-decision-card decision-${sprayDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">🚜</span>
              <div>
                <h4>İlaçlama Durumu</h4>
                <span class="dec-badge badge-${sprayDecision.level}">${sprayDecision.badge}</span>
              </div>
            </div>
            <strong>${sprayDecision.title}</strong>
            <p>${sprayDecision.desc}</p>
          </div>

          <!-- 2. FISKİYE (YAĞMURLAMA) İLE SULAMA -->
          <div class="agro-decision-card decision-${sprinklerDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">💦</span>
              <div>
                <h4>Fıskiye (Yağmurlama) Sulama</h4>
                <span class="dec-badge badge-${sprinklerDecision.level}">${sprinklerDecision.badge}</span>
              </div>
            </div>
            <strong>${sprinklerDecision.title}</strong>
            <p>${sprinklerDecision.desc}</p>
          </div>

          <!-- 3. GÜBRELEME -->
          <div class="agro-decision-card decision-${fertDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">🌾</span>
              <div>
                <h4>Gübreleme Durumu</h4>
                <span class="dec-badge badge-${fertDecision.level}">${fertDecision.badge}</span>
              </div>
            </div>
            <strong>${fertDecision.title}</strong>
            <p>${fertDecision.desc}</p>
          </div>

          <!-- 4. TOPRAK SULAMA İHTİYACI -->
          <div class="agro-decision-card decision-${irrigDecision.level}">
            <div class="dec-head">
              <span class="dec-icon">💧</span>
              <div>
                <h4>Toprak Su İhtiyacı</h4>
                <span class="dec-badge badge-${irrigDecision.level}">${irrigDecision.badge}</span>
              </div>
            </div>
            <strong>${irrigDecision.title}</strong>
            <p>${irrigDecision.desc}</p>
          </div>
        </div>

        <!-- 7 Günlük Tarla İşlem Çizelgesi -->
        <div class="agro-schedule-section">
          <div class="schedule-head">
            <h4>📅 7 Günlük Tarla Karar Takvimi (Rüzgar, Fıskiye & Yağış)</h4>
            <small>Önümüzdeki günlerde hangi gün ilaç veya fıskiye çalıştırabileceğinizi önceden görün</small>
          </div>
          <div class="table-responsive">
            <table class="agro-schedule-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Hava</th>
                  <th>Sıcaklık</th>
                  <th>Rüzgar</th>
                  <th>Yağış</th>
                  <th>İlaçlama</th>
                  <th>Fıskiye Sulama</th>
                  <th>Gübreleme</th>
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
