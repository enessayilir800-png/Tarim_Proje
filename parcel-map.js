(() => {
  const mapEl = document.getElementById('parcel-map');
  if (!mapEl) return;
  const $ = id => document.getElementById(id);
  const status = $('parcel-status');
  if (!window.L) { status.textContent = 'Harita kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.'; return; }
  const map = L.map(mapEl).setView([39.0, 35.0], 6);
  const streetTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  // NASA GIBS supplies a rendered 8-day MODIS NDVI raster immediately, while AppEEARS computes parcel statistics in its queue.
  const gibsEpoch = Date.UTC(2016, 6, 30), gibsLagDays = 16;
  const gibsDay = Math.floor((Date.now() - gibsEpoch) / 86400000) - gibsLagDays;
  const gibsDate = new Date(gibsEpoch + Math.floor(gibsDay / 8) * 8 * 86400000).toISOString().slice(0, 10);
  const ndviTiles = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`, { maxNativeZoom: 9, maxZoom: 19, opacity: .68, attribution: '&copy; NASA GIBS MODIS Terra NDVI 8-day' }).addTo(map);
  L.control.layers({'Street map': streetTiles}, {[`NASA NDVI (${gibsDate})`]: ndviTiles}, {collapsed: true}).addTo(map);
  const layer = L.featureGroup().addTo(map);
  const draftLayer = L.featureGroup().addTo(map);
  const key = 'tarimyol-parcels-v1';
  let parcels = [];
  try { parcels = JSON.parse(localStorage.getItem(key) || '[]'); if (!Array.isArray(parcels)) parcels = []; } catch (_) { parcels = []; }
  let discardedManualNdvi = false;
  parcels.forEach(parcel => {
    if (Number.isFinite(parcel.ndvi) && !parcel.ndviSource) {
      parcel.ndvi = null; parcel.ndviSeries = []; discardedManualNdvi = true;
    }
  });
  let drawing = false, points = [], draftLine = null;
  const ndviColor = value => value < 0.25 ? '#c94f42' : value < 0.55 ? '#e8bd45' : '#58a65c';
  const hasApiNdvi = parcel => Number.isFinite(parcel.ndvi) && Boolean(parcel.ndviSource);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function persist() { localStorage.setItem(key, JSON.stringify(parcels)); }
  if (discardedManualNdvi) persist();
  function geometryFor(parcel) {
    if (parcel.geometry) return parcel.geometry;
    const ring = (parcel.points || []).map(([lat, lon]) => [lon, lat]);
    if (ring.length && (ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1])) ring.push([...ring[0]]);
    return {type:'Polygon', coordinates:[ring]};
  }
  function redrawMap() {
    layer.clearLayers();
    parcels.forEach(parcel => {
      const hasNdvi = hasApiNdvi(parcel);
      const polygon = L.geoJSON(geometryFor(parcel), {style:{color: hasNdvi ? ndviColor(parcel.ndvi) : '#397149', weight: 3, fillColor: hasNdvi ? ndviColor(parcel.ndvi) : '#8eaf7c', fillOpacity: .38}});
      polygon.bindPopup(`<strong>${escapeHtml(parcel.name)}</strong><br>${hasNdvi ? `Son NDVI ortalaması: ${parcel.ndvi.toFixed(3)}` : 'Henüz NDVI verisi yok'}${parcel.ndviSource ? `<br>${escapeHtml(parcel.ndviSource)}` : ''}`);
      polygon.addTo(layer);
    });
  }
  function redraw() { redrawMap(); renderList(); }
  function ndviInsight(parcel) {
    const value = parcel.ndvi;
    if (!hasApiNdvi(parcel)) return {
      title: 'NASA NDVI olcumu bekleniyor',
      summary: 'Parsel icin NASA verisini getirince olculen NDVI ve tarla yorumu burada otomatik gorunur. Manuel deger kullanilmiyor.'
    };
    let summary;
    if (value < 0.2) summary = 'Yesil ortu cok seyrek. Ekim veya hasat disi donemde normal olabilir; ekili buyume donemindeyse cikis, su stresi ve hastalik-zararli durumunu tarlada kontrol et.';
    else if (value < 0.45) summary = 'Yesil ortu dusuk-orta duzeyde. Bitkinin ekim tarihine ve gelisme donemine gore degerlendir; tarla icinde zayif alanlari yerinde kontrol et.';
    else if (value < 0.65) summary = 'Yesil ortu orta-yuksek duzeyde. Son donem trendini ve urunun gelisme evresini izle; bu deger tek basina sulama veya gubre ihtiyacini kanitlamaz.';
    else summary = 'Yesil ortu yogun. Bu genellikle sik bitki ortusune isaret eder; NDVI yogun ortude doygunluga ulasabileceginden bitki stresi tamamen dislanamaz.';
    let trend = '';
    const series = (parcel.ndviSeries || []).filter(point => Number.isFinite(point.mean));
    if (series.length > 1) {
      const delta = series[series.length - 1].mean - series[0].mean;
      if (delta > 0.05) trend = `Secilen donemde yesillik artmis (+${delta.toFixed(2)}).`;
      else if (delta < -0.05) trend = `Secilen donemde yesillik azalmis (${delta.toFixed(2)}). Hasat/mevsim etkisi beklenmiyorsa tarlayi kontrol et.`;
      else trend = 'Secilen donemde NDVI genel olarak benzer kalmis.';
    }
    const latest = series[series.length - 1];
    const range = latest && Number.isFinite(latest.min) && Number.isFinite(latest.max)
      ? `Son olcum min ${latest.min.toFixed(3)} - max ${latest.max.toFixed(3)}${latest.pixels ? ` - ${latest.pixels} MODIS pikseli` : ''}.`
      : '';
    return {title: `Olculen NDVI: ${value.toFixed(3)}`, summary, trend, range};
  }
  function renderList() {
    const end = new Date(), start = new Date(); start.setDate(start.getDate()-60);
    $('parcel-list').innerHTML = parcels.map((p, i) => {
      const insight = ndviInsight(p);
      return `<article class="parcel-card"><div class="parcel-card-head"><h3>${escapeHtml(p.name)}</h3><button type="button" data-remove="${i}">Sil</button></div><div class="ndvi-date-row"><label>Baslangic<input type="date" data-start="${i}" value="${isoDate(start)}"></label><label>Bitis<input type="date" data-end="${i}" value="${isoDate(end)}"></label></div><button type="button" class="ndvi-fetch" data-ndvi-fetch="${i}">NASA'dan NDVI getir</button><small data-ndvi-status="${i}">${hasApiNdvi(p) ? `Son NASA olcumu: ${p.ndvi.toFixed(3)} - ${p.ndviSource}` : 'MODIS - 250 m - 16 gunluk olcum'}</small>${p.ndviSeries?.length && hasApiNdvi(p) ? `<details class="ndvi-history"><summary>${p.ndviSeries.length} donem verisini gor</summary>${p.ndviSeries.map(x=>`<div><span>${escapeHtml(x.date)}</span><b>${x.mean.toFixed(3)}</b><span>min ${x.min.toFixed(3)} - max ${x.max.toFixed(3)}</span></div>`).join('')}</details>` : ''}<div class="ndvi-analysis"><strong>${escapeHtml(insight.title)}</strong><p>${escapeHtml(insight.summary)}</p>${insight.trend ? `<p>${escapeHtml(insight.trend)}</p>` : ''}${insight.range ? `<small>${escapeHtml(insight.range)}</small>` : ''}<small>Yorum mevsime/urun turune gore degisir. MODIS 250 m oldugundan kucuk parsellerde komsu alanlar olcume karisabilir.</small></div></article>`;
    }).join('');
  }
  function stopDrawing(message) { drawing = false; points = []; draftLayer.clearLayers(); $('start-parcel').textContent = 'Parsel çiz'; $('save-parcel').disabled = true; $('cancel-parcel').hidden = true; status.textContent = message; }
  $('start-parcel').addEventListener('click', () => {
    drawing = true; points = []; draftLayer.clearLayers(); $('start-parcel').textContent = 'Haritaya köşe ekle'; $('save-parcel').disabled = true; $('cancel-parcel').hidden = false; status.textContent = 'Sınır köşelerini haritaya tıklayarak ekle (en az 3 nokta).'; map.doubleClickZoom.disable();
  });
  $('cancel-parcel').addEventListener('click', () => { stopDrawing('Çizim iptal edildi.'); map.doubleClickZoom.enable(); });
  map.on('click', event => {
    if (!drawing) return;
    points.push([event.latlng.lat, event.latlng.lng]);
    L.circleMarker(event.latlng, {radius: 5, color: '#fff', weight: 2, fillColor: '#235b3b', fillOpacity: 1}).addTo(draftLayer);
    if (draftLine) draftLayer.removeLayer(draftLine);
    if (points.length >= 2) draftLine = L.polyline(points, {color: '#235b3b', dashArray: '5 5'}).addTo(draftLayer);
    $('save-parcel').disabled = points.length < 3;
    status.textContent = `${points.length} köşe işaretlendi${points.length < 3 ? ' · kaydetmek için en az 3 köşe gerekli' : ' · parseli kaydedebilirsin'}`;
  });
  $('save-parcel').addEventListener('click', () => {
    if (points.length < 3) return;
    const name = $('parcel-name').value.trim() || `Parsel ${parcels.length + 1}`;
    parcels.push({id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, name, points, ndvi: null});
    persist(); stopDrawing(`${name} kaydedildi. NDVI değerini aşağıdan gir.`); map.doubleClickZoom.enable(); $('parcel-name').value = ''; redraw();
  });
  $('parcel-list').addEventListener('click', async event => {
    const button = event.target.closest('[data-ndvi-fetch]');
    if (!button) return;
    const i = Number(button.dataset.ndviFetch), parcel = parcels[i];
    if (!parcel) return;
    const card = button.closest('.parcel-card'), message = card.querySelector('[data-ndvi-status]');
    const start = card.querySelector('[data-start]').value, end = card.querySelector('[data-end]').value;
    if (!start || !end || start > end) { message.textContent = 'Geçerli bir tarih aralığı seç.'; return; }
    button.disabled = true; message.textContent = 'AppEEARS alan isteği gönderiliyor…';
    try {
      // text/plain is a CORS-simple content type. This avoids a browser OPTIONS
      // preflight when Live Server (5500) calls the local API (8000).
      const submitted = await fetch('/api/ndvi/task', {method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'}, body:JSON.stringify({name:parcel.name,start,end,geometry:geometryFor(parcel)})});
      const task = await submitted.json();
      if (!submitted.ok) throw new Error([task.error, task.details].filter(Boolean).join(' · ') || 'AppEEARS isteği gönderilemedi.');
      message.textContent = `NASA isteği sırada (${task.task_id}). İşlenmesi birkaç dakika sürebilir.`;
      let result;
      const submittedAt = Date.now();
      for (let attempt=0; attempt<80; attempt++) {
        const waitMs = attempt < 10 ? 3000 : attempt < 30 ? 7000 : 15000;
        await new Promise(resolve => setTimeout(resolve, waitMs));
        const response = await fetch(`/api/ndvi/status?task_id=${encodeURIComponent(task.task_id)}`), state = await response.json();
        if (!response.ok) throw new Error(state.error || 'NASA görev durumu alınamadı.');
        if (state.status === 'done') { result = state; break; }
        if (['error','failed','cancelled'].includes(state.status)) throw new Error(`NASA görevi tamamlanamadı: ${state.status}`);
        const elapsed = Math.floor((Date.now()-submittedAt)/60000);
        message.textContent = `NASA sirada: ${state.status} - ${elapsed} dk. NASA islemi suruyor; NDVI harita katmani simdi gorunur.`;
      }
      if (!result) throw new Error(`NASA gorevi hala sirada (${task.task_id}). NDVI harita katmani kullanilabilir; ayni istegi tekrar gonderme.`);
      if (!result.series?.length) throw new Error('Bu dönem ve parsel için kullanılabilir NDVI pikseli dönmedi.');
      parcels[i].ndviSeries = result.series;
      parcels[i].ndvi = result.series[result.series.length-1].mean;
      parcels[i].ndviSource = 'NASA MODIS MOD13Q1.061';
      persist(); redraw();
      map.fitBounds(layer.getBounds(), {padding:[25,25]});
    } catch (error) {
      message.textContent = error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'API sunucusuna ulaşılamadı. Sayfayı http://127.0.0.1:8000 adresinden açın veya python server.py sunucusunu başlatın.'
        : error.message;
      button.disabled = false;
    }
  });
  $('parcel-list').addEventListener('click', event => {
    const i = Number(event.target.dataset.remove); if (!Number.isInteger(i)) return;
    parcels.splice(i, 1); persist(); redraw();
  });
  const centerFromInputs = () => {
    const latText = $('latitude')?.value, lonText = $('longitude')?.value;
    if (!latText || !lonText) return;
    const lat = Number(latText), lon = Number(lonText);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) { map.setView([lat, lon], 14); status.textContent = 'Harita konumu güncellendi. Parseli çizmek için “Parsel çiz”e bas.'; }
  };
  const fillSelect = (select, options, placeholder) => {
    select.replaceChildren(new Option(placeholder, ''));
    options.forEach(item => select.add(new Option(item.name, item.id)));
    select.disabled = options.length === 0;
  };
  async function loadLocations(type, parentId, select, placeholder) {
    const query = new URLSearchParams({type});
    if (parentId) query.set('parent_id', parentId);
    const path = `/api/tkgm/locations?${query}`;
    let response;
    try { response = await fetch(path); }
    catch (_) { response = await fetch(`${path}&proxy=1`); }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'TKGM konum listesi alınamadı.');
    const options = data.options || (data.features || []).map(feature => ({id:feature.properties?.id, name:feature.properties?.text}));
    fillSelect(select, options, placeholder);
  }
  const province = $('tkgm-province'), district = $('tkgm-district'), neighborhood = $('tkgm-neighborhood'), tkgmStatus = $('tkgm-status');
  loadLocations('province', '', province, 'İl seç').then(() => { tkgmStatus.textContent = 'TKGM il listesi hazır.'; }).catch(error => { tkgmStatus.textContent = error.message; });
  province.addEventListener('change', async () => {
    fillSelect(district, [], 'İlçe seç'); fillSelect(neighborhood, [], 'Mahalle seç');
    if (!province.value) return;
    tkgmStatus.textContent = 'İlçeler yükleniyor…';
    try { await loadLocations('district', province.value, district, 'İlçe seç'); tkgmStatus.textContent = 'İlçe seç.'; }
    catch (error) { tkgmStatus.textContent = error.message; }
  });
  district.addEventListener('change', async () => {
    fillSelect(neighborhood, [], 'Mahalle seç');
    if (!district.value) return;
    tkgmStatus.textContent = 'Mahalleler yükleniyor…';
    try { await loadLocations('neighborhood', district.value, neighborhood, 'Mahalle seç'); tkgmStatus.textContent = 'Mahalle seç.'; }
    catch (error) { tkgmStatus.textContent = error.message; }
  });
  $('tkgm-find').addEventListener('click', async event => {
    const button = event.currentTarget, block = $('tkgm-block').value.trim(), parcelNo = $('tkgm-parcel').value.trim();
    if (!neighborhood.value || !block || !parcelNo) { tkgmStatus.textContent = 'İl, ilçe, mahalle, ada ve parsel bilgilerini tamamla.'; return; }
    button.disabled = true; tkgmStatus.textContent = 'TKGM parseli aranıyor…';
    try {
      const query = new URLSearchParams({neighborhood_id:neighborhood.value, block, parcel:parcelNo});
      const path = `/api/tkgm/parcel?${query}`;
      let response;
      try { response = await fetch(path); }
      catch (_) { response = await fetch(`${path}&proxy=1`); }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Parsel bulunamadı.');
      const properties = result.properties || {};
      const name = `${properties.mahalleAd || neighborhood.selectedOptions[0].text} · Ada ${properties.adaNo || block} / Parsel ${properties.parselNo || parcelNo}`;
      const bounds = L.geoJSON(result.geometry).getBounds();
      parcels.push({id:`tkgm-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name, geometry:result.geometry, points:[], source:'TKGM', properties, ndvi:null});
      persist(); redraw(); map.fitBounds(bounds, {padding:[35,35], maxZoom:17});
      const center = bounds.getCenter();
      if ($('latitude')) $('latitude').value = center.lat.toFixed(6);
      if ($('longitude')) $('longitude').value = center.lng.toFixed(6);
      const detail = [properties.ilAd,properties.ilceAd,properties.mahalleAd].filter(Boolean).join(' / ');
      tkgmStatus.textContent = `${name}${detail ? ` · ${detail}` : ''}${properties.alan ? ` · ${properties.alan} m²` : ''} haritaya eklendi.`;
    } catch (error) { tkgmStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });
  $('latitude')?.addEventListener('change', centerFromInputs); $('longitude')?.addEventListener('change', centerFromInputs);
  const geocodeButton = $('find-location'); geocodeButton?.addEventListener('click', () => [300, 800, 1600].forEach(delay => setTimeout(centerFromInputs, delay)));
  $('ndvi-check')?.addEventListener('click', async event => {
    const button = event.currentTarget, output = $('ndvi-connection-status');
    button.disabled = true; output.dataset.state = ''; output.textContent = 'AppEEARS tokeni doğrulanıyor…';
    try {
      const response = await fetch('/api/ndvi/health');
      const result = await response.json();
      if (!response.ok || !result.connected) throw new Error(result.error || 'NASA tokenı doğrulanamadı.');
      output.dataset.state = 'ok'; output.textContent = `Bağlantı çalışıyor · ${result.product}`;
    } catch (error) {
      output.dataset.state = 'error';
      output.textContent = error.message === 'Failed to fetch'
        ? 'Yerel API sunucusuna ulaşılamadı. python server.py çalışıyor olmalı.'
        : `${error.message} · Geçerli API tokenı için python setup_appeears.py çalıştır.`;
    } finally { button.disabled = false; }
  });
  window.addEventListener('tarimyol:show-parcels', () => map.invalidateSize());
  redraw(); setTimeout(() => map.invalidateSize(), 150);
})();
