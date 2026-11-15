(() => {
  const mapEl = document.getElementById('parcel-map');
  if (!mapEl) return;
  const $ = id => document.getElementById(id);
  const status = $('parcel-status');
  if (!window.L) { status.textContent = 'The map library could not be loaded. Check your internet connection and refresh the page.'; return; }
  const map = L.map(mapEl, { scrollWheelZoom: false }).setView([39.0, 35.0], 6);
  const streetTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  // NASA GIBS supplies a rendered 8-day MODIS NDVI raster immediately, while AppEEARS computes parcel statistics in its queue.
  const gibsEpoch = Date.UTC(2016, 6, 30), gibsLagDays = 16;
  const gibsDay = Math.floor((Date.now() - gibsEpoch) / 86400000) - gibsLagDays;
  const gibsDate = new Date(gibsEpoch + Math.floor(gibsDay / 8) * 8 * 86400000).toISOString().slice(0, 10);
  const ndviTiles = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`, { maxNativeZoom: 9, maxZoom: 19, opacity: .68, attribution: '&copy; NASA GIBS MODIS Terra NDVI 8-day' }).addTo(map);
  const eviTiles = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_EVI_8Day/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png', { maxNativeZoom: 9, maxZoom: 19, opacity: .68, attribution: '&copy; NASA GIBS MODIS Terra EVI 8-day' });
  const smapTiles = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png', { maxNativeZoom: 6, maxZoom: 19, opacity: .72, attribution: '&copy; NASA GIBS SMAP L4' });
  const lstTiles = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png', { maxNativeZoom: 7, maxZoom: 19, opacity: .68, attribution: '&copy; NASA GIBS MODIS Terra daytime LST 8-day' });
  const srtmTiles = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png', { maxNativeZoom: 12, maxZoom: 19, opacity: .72, attribution: '&copy; NASA GIBS SRTM' });
  L.control.layers(
    {'Street Map · OpenStreetMap': streetTiles},
    {
      [`NDVI · MODIS Terra (${gibsDate})`]: ndviTiles,
      'EVI · MODIS Terra (8-day)': eviTiles,
      'Toprak nemi · SMAP L4': smapTiles,
      'Surface Temperature · MODIS Terra (daytime, 8-day)': lstTiles,
      'Elevation · SRTM': srtmTiles
    },
    {collapsed: false}
  ).addTo(map);
  const previewLayerConfigs = [
    {id:'ndvi', mapId:'ndvi-preview-map', layer:ndviTiles, url:`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`, maxNativeZoom:9, opacity:.68, attribution:'&copy; NASA GIBS MODIS Terra NDVI 8-day'},
    {id:'evi', mapId:'evi-preview-map', layer:eviTiles, url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_EVI_8Day/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png', maxNativeZoom:9, opacity:.68, attribution:'&copy; NASA GIBS MODIS Terra EVI 8-day'},
    {id:'smap', mapId:'smap-preview-map', layer:smapTiles, url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png', maxNativeZoom:6, opacity:.72, attribution:'&copy; NASA GIBS SMAP L4'},
    {id:'lst', mapId:'lst-preview-map', layer:lstTiles, url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png', maxNativeZoom:7, opacity:.68, attribution:'&copy; NASA GIBS MODIS Terra daytime LST 8-day'},
    {id:'srtm', mapId:'srtm-preview-map', layer:srtmTiles, url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png', maxNativeZoom:12, opacity:.72, attribution:'&copy; NASA GIBS SRTM'}
  ];
  const mainLayersById = Object.fromEntries(previewLayerConfigs.map(config => [config.id, config.layer]));
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
  let drawing = false, points = [], draftLine = null, searchMarker = null;
  const ndviColor = value => value < 0.25 ? '#c94f42' : value < 0.55 ? '#e8bd45' : '#58a65c';
  const hasApiNdvi = parcel => Number.isFinite(parcel.ndvi) && Boolean(parcel.ndviSource);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const parseAreaSquareMeters = value => {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
    const text = String(value ?? '').trim().replace(/[^\d,.-]/g, '');
    const normalized = text.includes(',')
      ? text.replace(/\./g, '').replace(',', '.')
      : /^\d{1,3}(?:\.\d{3})+$/.test(text) ? text.replace(/\./g, '') : text;
    const area = Number(normalized);
    return Number.isFinite(area) && area > 0 ? area : null;
  };
  function ringAreaSquareMeters(ring) {
    if (!Array.isArray(ring) || ring.length < 3) return 0;
    const earthRadius = 6371008.8;
    let total = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const current = ring[index], next = ring[(index + 1) % ring.length];
      if (!Array.isArray(current) || !Array.isArray(next)) continue;
      const lon1 = Number(current[0]) * Math.PI / 180, lat1 = Number(current[1]) * Math.PI / 180;
      const lon2 = Number(next[0]) * Math.PI / 180, lat2 = Number(next[1]) * Math.PI / 180;
      if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) continue;
      total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs(total * earthRadius * earthRadius / 2);
  }
  function geometryAreaSquareMeters(geometry) {
    if (!geometry?.coordinates) return 0;
    const polygonArea = polygon => {
      if (!Array.isArray(polygon) || !polygon.length) return 0;
      return Math.max(0, ringAreaSquareMeters(polygon[0]) - polygon.slice(1).reduce((sum, hole) => sum + ringAreaSquareMeters(hole), 0));
    };
    if (geometry.type === 'Polygon') return polygonArea(geometry.coordinates);
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.reduce((sum, polygon) => sum + polygonArea(polygon), 0);
    return 0;
  }
  function areaDekarForGeometry(geometry) {
    const squareMeters = geometryAreaSquareMeters(geometry);
    return squareMeters > 0 ? squareMeters / 1000 : null;
  }
  window.getSavedParcelAreaForField = field => {
    if (!field) return null;
    const normalize = value => String(value || '').trim().toLocaleLowerCase('tr-TR');
    const fieldName = normalize(field.name);
    const block = normalize(field.block), parcelNumber = normalize(field.parcel);
    const neighborhood = normalize(field.neighborhood);
    const match = parcels.find(parcel => {
      if (fieldName && normalize(parcel.name) === fieldName) return true;
      const properties = parcel.properties || {};
      const sameCadastre = block && parcelNumber &&
        normalize(properties.adaNo) === block &&
        normalize(properties.parselNo) === parcelNumber;
      const sameNeighborhood = !neighborhood || normalize(properties.mahalleAd) === neighborhood;
      return sameCadastre && sameNeighborhood;
    });
    if (!match) return null;
    const officialArea = parseAreaSquareMeters(match.properties?.alan);
    return officialArea ? officialArea / 1000 : areaDekarForGeometry(geometryFor(match));
  };
  let inferredLegacyArea = false;
  parcels.forEach(parcel => {
    if (Number.isFinite(Number(parcel.area)) && Number(parcel.area) > 0) return;
    const officialArea = parseAreaSquareMeters(parcel.properties?.alan);
    parcel.area = officialArea ? officialArea / 1000 : areaDekarForGeometry(geometryFor(parcel));
    if (parcel.area) inferredLegacyArea = true;
  });
  if (inferredLegacyArea) persist();
  function persist() { localStorage.setItem(key, JSON.stringify(parcels)); }
  if (discardedManualNdvi) persist();
  function geometryFor(parcel) {
    if (parcel.geometry) return parcel.geometry;
    const ring = (parcel.points || []).map(([lat, lon]) => [lon, lat]);
    if (ring.length && (ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1])) ring.push([...ring[0]]);
    return {type:'Polygon', coordinates:[ring]};
  }
  const previewMaps = new Map();
  const previewMarkers = new Map();
  const previewBoundaries = new Map();
  let selectedPreviewField = null;
  let syncingPreviewMaps = false;
  function matchingParcelForField(field) {
    if (!field) return null;
    const normalize = value => String(value || '').trim().toLocaleLowerCase('tr-TR');
    const name = normalize(field.name), block = normalize(field.block), parcelNumber = normalize(field.parcel);
    const neighborhood = normalize(field.neighborhood);
    return parcels.find(item => {
      if (name && normalize(item.name) === name) return true;
      const properties = item.properties || {};
      return block && parcelNumber &&
        normalize(properties.adaNo) === block &&
        normalize(properties.parselNo) === parcelNumber &&
        (!neighborhood || normalize(properties.mahalleAd) === neighborhood);
    }) || null;
  }
  function syncPreviewMaps(sourceMap) {
    if (syncingPreviewMaps) return;
    syncingPreviewMaps = true;
    const center = sourceMap.getCenter(), zoom = sourceMap.getZoom();
    previewMaps.forEach(otherMap => {
      if (otherMap !== sourceMap) otherMap.setView(center, zoom, {animate:false});
    });
    syncingPreviewMaps = false;
  }
  function setPreviewField(field, zoom = 12) {
    if (!field) return;
    const lat = Number(field.lat ?? field.latitude), lon = Number(field.lon ?? field.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    selectedPreviewField = field;
    const point = [lat, lon];
    syncingPreviewMaps = true;
    previewMaps.forEach((previewMap, id) => {
      previewMap.setView(point, zoom, {animate:false});
      const marker = previewMarkers.get(id);
      if (marker) marker.setLatLng(point).setPopupContent(escapeHtml(field.name || 'Tarla konumu'));
      const boundary = previewBoundaries.get(id);
      if (boundary) {
        boundary.clearLayers();
        const parcel = matchingParcelForField(field);
        if (parcel) L.geoJSON(geometryFor(parcel), {style:{color:'#174c35', weight:2, fillColor:'#69a77a', fillOpacity:.2}}).addTo(boundary);
      }
    });
    syncingPreviewMaps = false;
    const locationParts = [field.province, field.district, field.neighborhood].filter(Boolean);
    $('field-layer-location').textContent = `📍 ${field.name || 'Field location'}${locationParts.length ? ` · ${locationParts.join(' / ')}` : ''}`;
  }
  previewLayerConfigs.forEach(config => {
    const element = $(config.mapId);
    if (!element) return;
    const previewMap = L.map(element, {zoomControl:false, attributionControl:false, scrollWheelZoom:false, doubleClickZoom:true, keyboard:false}).setView([39, 35], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; OpenStreetMap'}).addTo(previewMap);
    L.tileLayer(config.url, {maxNativeZoom:config.maxNativeZoom, maxZoom:19, opacity:config.opacity, attribution:config.attribution}).addTo(previewMap);
    const marker = L.marker([39, 35], {
      icon:L.divIcon({className:'field-layer-pin-wrap', html:'<span class="field-layer-pin"></span>', iconSize:[18,18], iconAnchor:[9,9]})
    }).bindPopup('Tarla konumu').addTo(previewMap);
    const boundary = L.featureGroup().addTo(previewMap);
    previewMaps.set(config.id, previewMap);
    previewMarkers.set(config.id, marker);
    previewBoundaries.set(config.id, boundary);
    previewMap.on('moveend', () => syncPreviewMaps(previewMap));
  });
  document.querySelectorAll('[data-focus-layer]').forEach(button => button.addEventListener('click', () => {
    const selectedLayer = mainLayersById[button.dataset.focusLayer];
    if (!selectedLayer) return;
    Object.values(mainLayersById).forEach(item => { if (map.hasLayer(item)) map.removeLayer(item); });
    selectedLayer.addTo(map);
    if (selectedPreviewField) {
      const lat = Number(selectedPreviewField.lat ?? selectedPreviewField.latitude);
      const lon = Number(selectedPreviewField.lon ?? selectedPreviewField.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) map.flyTo([lat, lon], 14, {duration:.6});
    }
    mapEl.scrollIntoView({behavior:'smooth', block:'center'});
  }));
  function initializePreviewField() {
    if (selectedPreviewField) return;
    const latitude = Number($('latitude')?.value), longitude = Number($('longitude')?.value);
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && $('latitude')?.value && $('longitude')?.value) {
      setPreviewField({latitude, longitude, name:$('location')?.value || 'Selected field'});
      return;
    }
    const firstField = window.FarmerAuth?.getFields?.()[0];
    if (firstField) setPreviewField(firstField);
  }
  window.addEventListener('tarimyol:fields-change', () => {
    const firstField = window.FarmerAuth?.getFields?.()[0];
    if (firstField) setPreviewField(firstField);
  });
  window.addEventListener('tarimyol:auth-change', () => {
    selectedPreviewField = null;
    const firstField = window.FarmerAuth?.getFields?.()[0];
    if (firstField) setPreviewField(firstField);
    else initializePreviewField();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePreviewField, {once:true});
  else initializePreviewField();
  setTimeout(initializePreviewField, 250);
  function redrawMap() {
    layer.clearLayers();
    parcels.forEach(parcel => {
      const hasNdvi = hasApiNdvi(parcel);
      const polygon = L.geoJSON(geometryFor(parcel), {style:{color: hasNdvi ? ndviColor(parcel.ndvi) : '#397149', weight: 3, fillColor: hasNdvi ? ndviColor(parcel.ndvi) : '#8eaf7c', fillOpacity: .38}});
      polygon.bindPopup(`<strong>${escapeHtml(parcel.name)}</strong><br>${hasNdvi ? `Latest NDVI mean: ${parcel.ndvi.toFixed(3)}` : 'No NDVI data yet'}${parcel.ndviSource ? `<br>${escapeHtml(parcel.ndviSource)}` : ''}`);
      polygon.addTo(layer);
    });
  }
  function redraw() { redrawMap(); renderList(); }
  function ndviInsight(parcel) {
    const value = parcel.ndvi;
    if (!hasApiNdvi(parcel)) return {
      title: 'Waiting for NASA NDVI measurement',
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
    return {title: `Measured NDVI: ${value.toFixed(3)}`, summary, trend, range};
  }
  function renderList() {
    const end = new Date(), start = new Date(); start.setDate(start.getDate()-60);
    $('parcel-list').innerHTML = parcels.map((p, i) => {
      const insight = ndviInsight(p);
      return `<article class="parcel-card"><div class="parcel-card-head"><h3>${escapeHtml(p.name)}</h3><button type="button" data-remove="${i}">Delete</button></div>${Number.isFinite(Number(p.area)) && Number(p.area) > 0 ? `<small class="parcel-area-note">Parcel area: ${Number(p.area).toLocaleString('en-US', {maximumFractionDigits:2})} decares${p.properties?.alan ? ' · TKGM' : p.geometry || p.points?.length ? ' · Calculated from map boundary' : ''}</small>` : ''}<div class="ndvi-date-row"><label>Start date<input type="date" data-start="${i}" value="${isoDate(start)}"></label><label>End date<input type="date" data-end="${i}" value="${isoDate(end)}"></label></div><button type="button" class="ndvi-fetch" data-ndvi-fetch="${i}">Fetch NDVI from NASA</button><small data-ndvi-status="${i}">${hasApiNdvi(p) ? `Latest NASA reading: ${p.ndvi.toFixed(3)} - ${p.ndviSource}` : 'MODIS - 250 m - 16-day measurement'}</small>${p.ndviSeries?.length && hasApiNdvi(p) ? `<details class="ndvi-history"><summary>View ${p.ndviSeries.length} periods</summary>${p.ndviSeries.map(x=>`<div><span>${escapeHtml(x.date)}</span><b>${x.mean.toFixed(3)}</b><span>min ${x.min.toFixed(3)} - max ${x.max.toFixed(3)}</span></div>`).join('')}</details>` : ''}<div class="ndvi-analysis"><strong>${escapeHtml(insight.title)}</strong><p>${escapeHtml(insight.summary)}</p>${insight.trend ? `<p>${escapeHtml(insight.trend)}</p>` : ''}${insight.range ? `<small>${escapeHtml(insight.range)}</small>` : ''}<small>Interpretation varies by season and crop. MODIS pixels are 250 m wide and may include neighboring areas for small parcels.</small></div></article>`;
    }).join('');
  }
  function stopDrawing(message) { drawing = false; points = []; draftLayer.clearLayers(); $('start-parcel').textContent = 'Draw parcel'; $('save-parcel').disabled = true; $('cancel-parcel').hidden = true; status.textContent = message; }
  $('start-parcel').addEventListener('click', () => {
    drawing = true; points = []; draftLayer.clearLayers(); $('start-parcel').textContent = 'Add boundary points'; $('save-parcel').disabled = true; $('cancel-parcel').hidden = false; status.textContent = 'Click the map to add boundary points (at least 3 points).'; map.doubleClickZoom.disable();
  });
  $('cancel-parcel').addEventListener('click', () => { stopDrawing('Drawing cancelled.'); map.doubleClickZoom.enable(); });
  map.on('click', event => {
    if (!drawing) return;
    points.push([event.latlng.lat, event.latlng.lng]);
    L.circleMarker(event.latlng, {radius: 5, color: '#fff', weight: 2, fillColor: '#235b3b', fillOpacity: 1}).addTo(draftLayer);
    if (draftLine) draftLayer.removeLayer(draftLine);
    if (points.length >= 2) draftLine = L.polyline(points, {color: '#235b3b', dashArray: '5 5'}).addTo(draftLayer);
    $('save-parcel').disabled = points.length < 3;
    status.textContent = `${points.length} boundary point${points.length === 1 ? '' : 's'} marked${points.length < 3 ? ' · at least 3 points are required to save' : ' · parcel is ready to save'}`;
  });
  $('save-parcel').addEventListener('click', () => {
    if (points.length < 3) return;
    const name = $('parcel-name').value.trim() || `Parsel ${parcels.length + 1}`;
    const parcelPoints = points.map(point => [...point]);
    const geometry = geometryFor({ points: parcelPoints });
    const area = areaDekarForGeometry(geometry);
    parcels.push({id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, name, points: parcelPoints, area, ndvi: null});
    const center = L.latLngBounds(parcelPoints).getCenter();
    lastActiveParcel = { name, points: parcelPoints, geometry, area, lat: center.lat, lon: center.lng };
    if (area) {
      $('parcel-area').value = area.toFixed(2);
      $('area').value = area.toFixed(2);
    }
    $('latitude').value = center.lat.toFixed(6);
    $('longitude').value = center.lng.toFixed(6);
    persist(); stopDrawing(`${name} saved. Enter an NDVI value below.`); map.doubleClickZoom.enable(); $('parcel-name').value = ''; redraw();
  });
  $('parcel-list').addEventListener('click', async event => {
    const button = event.target.closest('[data-ndvi-fetch]');
    if (!button) return;
    const i = Number(button.dataset.ndviFetch), parcel = parcels[i];
    if (!parcel) return;
    const card = button.closest('.parcel-card'), message = card.querySelector('[data-ndvi-status]');
    const start = card.querySelector('[data-start]').value, end = card.querySelector('[data-end]').value;
    if (!start || !end || start > end) { message.textContent = 'Select a valid date range.'; return; }
    button.disabled = true; message.textContent = 'Submitting AppEEARS area request…';
    try {
      // text/plain is a CORS-simple content type. This avoids a browser OPTIONS
      // preflight when Live Server (5500) calls the local API (8000).
      const submitted = await fetch('/api/ndvi/task', {method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'}, body:JSON.stringify({name:parcel.name,start,end,geometry:geometryFor(parcel)})});
      const task = await submitted.json();
      if (!submitted.ok) throw new Error([task.error, task.details].filter(Boolean).join(' · ') || 'Could not submit the AppEEARS request.');
      message.textContent = `NASA request queued (${task.task_id}). Processing may take several minutes.`;
      let result;
      const submittedAt = Date.now();
      for (let attempt=0; attempt<80; attempt++) {
        const waitMs = attempt < 10 ? 3000 : attempt < 30 ? 7000 : 15000;
        await new Promise(resolve => setTimeout(resolve, waitMs));
        const response = await fetch(`/api/ndvi/status?task_id=${encodeURIComponent(task.task_id)}`), state = await response.json();
        if (!response.ok) throw new Error(state.error || 'Could not retrieve NASA task status.');
        if (state.status === 'done') { result = state; break; }
        if (['error','failed','cancelled'].includes(state.status)) throw new Error(`NASA task failed: ${state.status}`);
        const elapsed = Math.floor((Date.now()-submittedAt)/60000);
        message.textContent = `NASA sirada: ${state.status} - ${elapsed} dk. NASA islemi suruyor; NDVI harita katmani simdi gorunur.`;
      }
      if (!result) throw new Error(`NASA gorevi hala sirada (${task.task_id}). NDVI harita katmani kullanilabilir; ayni istegi tekrar gonderme.`);
      if (!result.series?.length) throw new Error('No usable NDVI pixels were returned for this period and parcel.');
      parcels[i].ndviSeries = result.series;
      parcels[i].ndvi = result.series[result.series.length-1].mean;
      parcels[i].ndviSource = 'NASA MODIS MOD13Q1.061';
      persist(); redraw();
      map.fitBounds(layer.getBounds(), {padding:[25,25]});
    } catch (error) {
      message.textContent = error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'Could not reach the API server. Open the page at http://127.0.0.1:8000 or start the server with python server.py.'
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
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      map.setView([lat, lon], 14);
      setPreviewField({lat, lon, name:$('location')?.value || 'Selected field'});
      status.textContent = 'Map location updated. Select “Draw parcel” to outline a parcel.';
    }
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
    if (!response.ok) throw new Error(data.detail || data.error || 'Could not retrieve the TKGM location list.');
    const options = data.options || (data.features || []).map(feature => ({id:feature.properties?.id, name:feature.properties?.text}));
    fillSelect(select, options, placeholder);
  }
  let lastActiveParcel = null;
  let weatherMarker = null;

  // Focus the map on the field selected from the farmer account and run the advisor.
  window.focusFieldOnMap = function (field) {
    if (!field || !map) return;
    const lat = parseFloat(field.lat) || 39.0;
    const lon = parseFloat(field.lon) || 35.0;

    map.flyTo([lat, lon], 15, { duration: 1.2 });

    if (searchMarker) searchMarker.remove();

    const cropName = field.cropName || field.crop || 'Crop';
    const popupContent = `
      <div style="font-family:sans-serif;line-height:1.4;">
        <strong style="color:#1d4436;font-size:14px;">${escapeHtml(field.name)}</strong><br>
        <span style="font-size:12px;color:#556;">📍 ${escapeHtml(field.province)} / ${escapeHtml(field.district)} / ${escapeHtml(field.neighborhood)}</span><br>
        <span style="display:inline-block;margin-top:4px;padding:3px 8px;background:#edf4e8;color:#2e6a43;border-radius:4px;font-weight:600;font-size:11px;">
          Ada: ${escapeHtml(field.block || '—')} · Parsel: ${escapeHtml(field.parcel || '—')}
        </span><br>
        <small style="color:#777;">🌱 ${escapeHtml(cropName)} · ${field.area} Dekar</small>
      </div>
    `;

    searchMarker = L.marker([lat, lon]).addTo(map).bindPopup(popupContent).openPopup();
    lastActiveParcel = { ...field, lat, lon };

    if (status) {
      status.textContent = `Showing "${field.name}" (Block: ${field.block}, Parcel: ${field.parcel}) on the map.`;
    }
  };

  // Add a live wind and rainfall weather badge to the map.
  window.addWeatherBadgeToMap = function (lat, lon, data) {
    if (!map) return;
    if (weatherMarker) weatherMarker.remove();

    const wind = data.wind || 0;
    const rain = data.rain || 0;
    const temp = data.temp || 0;
    
    let statusText = '🟢 Ideal for spraying and sprinklers';
    let badgeColor = '#2e6a43';

    if (rain > 0.5) {
      statusText = '🌧️ Rain · Do not spray';
      badgeColor = '#c94f42';
    } else if (wind > 15) {
      statusText = '🔴 Windy · Sprinkler irrigation and spraying not advised';
      badgeColor = '#c94f42';
    } else if (wind >= 8) {
      statusText = '🟡 Moderate wind · Use sprinklers with caution';
      badgeColor = '#b37d1d';
    }

    const iconHtml = `
      <div style="background:#fff;border:2px solid ${badgeColor};border-radius:8px;padding:5px 10px;font-size:11.5px;font-family:sans-serif;font-weight:700;color:#183428;box-shadow:0 4px 14px rgba(0,0,0,0.2);white-space:nowrap;display:flex;align-items:center;gap:8px;">
        <span>💨 ${wind.toFixed(0)} km/s</span>
        <span>🌧️ ${rain.toFixed(1)} mm</span>
        <span style="color:${badgeColor};font-weight:800;">${statusText}</span>
      </div>
    `;

    const weatherIcon = L.divIcon({
      className: 'leaflet-weather-badge',
      html: iconHtml,
      iconSize: [220, 32],
      iconAnchor: [110, 44]
    });

    weatherMarker = L.marker([lat, lon], { icon: weatherIcon }).addTo(map);
  };

  // Save parcel to farmer account button.
  $('btn-save-to-farmer')?.addEventListener('click', () => {
    let name = $('parcel-name')?.value.trim();
    let block = $('tkgm-block')?.value.trim();
    let parcelNo = $('tkgm-parcel')?.value.trim();
    let prov = $('tkgm-province')?.selectedOptions[0]?.text || '';
    let dist = $('tkgm-district')?.selectedOptions[0]?.text || '';
    let neigh = $('tkgm-neighborhood')?.selectedOptions[0]?.text || '';

    let lat = parseFloat($('latitude')?.value);
    let lon = parseFloat($('longitude')?.value);

    // Use the map center or most recently active parcel when available.
    if (lastActiveParcel) {
      if (!block) block = lastActiveParcel.block || '';
      if (!parcelNo) parcelNo = lastActiveParcel.parcel || '';
      if (!name) name = lastActiveParcel.name || '';
      if (!prov && lastActiveParcel.province) prov = lastActiveParcel.province;
      if (!dist && lastActiveParcel.district) dist = lastActiveParcel.district;
      if (!neigh && lastActiveParcel.neighborhood) neigh = lastActiveParcel.neighborhood;
      if (Number.isFinite(Number(lastActiveParcel.lat))) lat = Number(lastActiveParcel.lat);
      if (Number.isFinite(Number(lastActiveParcel.lon))) lon = Number(lastActiveParcel.lon);
    }

    if (!name) name = `Tarla (Ada ${block || '—'} / Parsel ${parcelNo || '—'})`;

    if (isNaN(lat) || isNaN(lon)) {
      const center = map.getCenter();
      lat = center.lat;
      lon = center.lng;
    }
    const enteredArea = Number($('parcel-area')?.value);
    const area = Number.isFinite(enteredArea) && enteredArea > 0 ? enteredArea : Number(lastActiveParcel?.area);
    if (!Number.isFinite(area) || area <= 0) {
      status.textContent = 'The actual field area is unknown. Enter the area in decares before saving.';
      $('parcel-area')?.focus();
      return;
    }
    $('area').value = area;

    if (window.FarmerAuth && window.FarmerAuth.saveField) {
      const saved = window.FarmerAuth.saveField({
        name,
        province: prov === 'İl seç' ? '' : prov,
        district: dist === 'İlçe seç' ? '' : dist,
        neighborhood: neigh === 'Mahalle seç' ? '' : neigh,
        block,
        parcel: parcelNo,
        area,
        crop: $('crop')?.value || 'wheat',
        lat,
        lon
      });

      alert(`✓ "${saved.name}" · ${saved.area.toLocaleString('en-US')} decares (Block: ${saved.block || '—'}, Parcel: ${saved.parcel || '—'}) saved to your farmer account.`);
    }
  });

  const province = $('tkgm-province'), district = $('tkgm-district'), neighborhood = $('tkgm-neighborhood'), tkgmStatus = $('tkgm-status');
  loadLocations('province', '', province, 'Select province').then(() => { tkgmStatus.textContent = 'TKGM province list is ready.'; }).catch(error => { tkgmStatus.textContent = error.message; });
  province.addEventListener('change', async () => {
    fillSelect(district, [], 'İlçe seç'); fillSelect(neighborhood, [], 'Mahalle seç');
    if (!province.value) return;
    tkgmStatus.textContent = 'Loading districts…';
    try { await loadLocations('district', province.value, district, 'Select district'); tkgmStatus.textContent = 'Select a district.'; }
    catch (error) { tkgmStatus.textContent = error.message; }
  });
  district.addEventListener('change', async () => {
    fillSelect(neighborhood, [], 'Mahalle seç');
    if (!district.value) return;
    tkgmStatus.textContent = 'Loading neighborhoods…';
    try { await loadLocations('neighborhood', district.value, neighborhood, 'Select neighborhood'); tkgmStatus.textContent = 'Select a neighborhood.'; }
    catch (error) { tkgmStatus.textContent = error.message; }
  });
  $('tkgm-find').addEventListener('click', async event => {
    const button = event.currentTarget, block = $('tkgm-block').value.trim(), parcelNo = $('tkgm-parcel').value.trim();
    if (!neighborhood.value || !block || !parcelNo) { tkgmStatus.textContent = 'Complete the province, district, neighborhood, block, and parcel details.'; return; }
    button.disabled = true; tkgmStatus.textContent = 'Searching TKGM for the parcel…';
    try {
      const query = new URLSearchParams({neighborhood_id:neighborhood.value, block, parcel:parcelNo});
      const path = `/api/tkgm/parcel?${query}`;
      let response;
      try { response = await fetch(path); }
      catch (_) { response = await fetch(`${path}&proxy=1`); }
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || 'Parcel not found.');
      const properties = result.properties || {};
      const name = `${properties.mahalleAd || neighborhood.selectedOptions[0].text} · Ada ${properties.adaNo || block} / Parsel ${properties.parselNo || parcelNo}`;
      const bounds = L.geoJSON(result.geometry).getBounds();
      const officialAreaSquareMeters = parseAreaSquareMeters(properties.alan);
      const geometryArea = areaDekarForGeometry(result.geometry);
      const area = officialAreaSquareMeters ? officialAreaSquareMeters / 1000 : geometryArea;
      parcels.push({id:`tkgm-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name, geometry:result.geometry, points:[], area, source:'TKGM', properties, ndvi:null});
      persist(); redraw(); map.fitBounds(bounds, {padding:[35,35], maxZoom:17});
      const center = bounds.getCenter();
      if ($('latitude')) $('latitude').value = center.lat.toFixed(6);
      if ($('longitude')) $('longitude').value = center.lng.toFixed(6);
      const detail = [properties.ilAd,properties.ilceAd,properties.mahalleAd].filter(Boolean).join(' / ');
      tkgmStatus.innerHTML = `✓ <strong>${name}</strong>${detail ? ` · ${detail}` : ''}${properties.alan ? ` · ${properties.alan} m²` : ''} added to the map. <span style="color:#2e6a43;font-weight:600;">(Use "Save to My Fields" above to store it in your account.)</span>`;

      lastActiveParcel = {
        name,
        province: properties.ilAd || province.selectedOptions[0]?.text || '',
        district: properties.ilceAd || district.selectedOptions[0]?.text || '',
        neighborhood: properties.mahalleAd || neighborhood.selectedOptions[0]?.text || '',
        block,
        parcel: parcelNo,
        geometry: result.geometry,
        area,
        lat: center.lat,
        lon: center.lng
      };
      if (area) $('parcel-area').value = area.toFixed(2);
      if (area) $('area').value = area.toFixed(2);

      // Immediately analyze spraying, fertilizing, and irrigation for the field location.
      if (window.AgroAdvisor && window.AgroAdvisor.loadForCoordinates) {
        window.AgroAdvisor.loadForCoordinates(center.lat, center.lng, lastActiveParcel);
      }
    } catch (error) {
      tkgmStatus.innerHTML = `<span style="color:#b34033;">⚠️ ${escapeHtml(error.message)}</span><br><small>If the TKGM query does not respond, enter a village or district in the "Find by location or parcel number" search above, or save your details to your account with "Save to My Fields".</small>`;
    }
    finally { button.disabled = false; }
  });
  async function searchPlace() {
    const query = $('parcel-search-input').value.trim(), button = $('parcel-search-btn');
    if (query.length < 2) { tkgmStatus.textContent = 'Enter a province, district, village, or place name.'; return; }
    button.disabled = true; tkgmStatus.textContent = 'Searching for location…';
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`), result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || 'Location not found.');
      const point = [Number(result.latitude), Number(result.longitude)];
      const location = { latitude: point[0], longitude: point[1], name: result.display_name || query };
      if (window.applyResolvedFarmLocation) window.applyResolvedFarmLocation(location);
      else window.dispatchEvent(new CustomEvent('tarimyol:location-resolved', { detail: location }));
      tkgmStatus.textContent = `${location.name} · Map centered on the location. Use the fields below to search by block and parcel.`;

      lastActiveParcel = {
        name: query,
        lat: point[0],
        lon: point[1],
        province: query.split(',')[0] || query
      };

    } catch (error) { tkgmStatus.textContent = error.message; }
    finally { button.disabled = false; }
  }
  $('parcel-search-btn').addEventListener('click', searchPlace);
  $('parcel-search-input').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); searchPlace(); } });
  $('latitude')?.addEventListener('change', centerFromInputs); $('longitude')?.addEventListener('change', centerFromInputs);
  $('parcel-area')?.addEventListener('input', event => {
    const area = Number(event.currentTarget.value);
    if (Number.isFinite(area) && area > 0) $('area').value = area;
  });
  $('ndvi-check')?.addEventListener('click', async event => {
    const button = event.currentTarget, output = $('ndvi-connection-status');
    button.disabled = true; output.dataset.state = ''; output.textContent = 'Validating AppEEARS token…';
    try {
      const response = await fetch('/api/ndvi/health');
      const result = await response.json();
      if (!response.ok || !result.connected) throw new Error(result.error || 'NASA token could not be verified.');
      output.dataset.state = 'ok'; output.textContent = `Connection successful · ${result.product}`;
    } catch (error) {
      output.dataset.state = 'error';
      output.textContent = error.message === 'Failed to fetch'
        ? 'Could not reach the local API server. python server.py must be running.'
        : `${error.message} · Run python setup_appeears.py to configure a valid API token.`;
    } finally { button.disabled = false; }
  });
  window.addEventListener('tarimyol:location-resolved', event => {
    const { latitude, longitude, name } = event.detail || {};
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const point = [latitude, longitude];
    map.flyTo(point, 13, { duration: .8 });
    setPreviewField({lat:latitude, lon:longitude, name:name || 'Tarla konumu'});
    if (searchMarker) searchMarker.remove();
    searchMarker = L.marker(point).addTo(map).bindPopup(escapeHtml(name || 'Tarla konumu')).openPopup();
    if (window.AgroAdvisor && window.AgroAdvisor.loadForCoordinates) {
      window.AgroAdvisor.loadForCoordinates(latitude, longitude, { name: name || 'Tarla konumu' });
    }
  });
  window.addEventListener('tarimyol:field-selected', event => {
    const field = event.detail;
    if (!field) return;
    setPreviewField(field);
    window.focusFieldOnMap?.(field);
    if (window.AgroAdvisor && window.AgroAdvisor.loadForCoordinates) {
      window.AgroAdvisor.loadForCoordinates(Number(field.lat), Number(field.lon), field);
    }
  });
  window.addEventListener('tarimyol:show-parcels', () => {
    map.invalidateSize();
    previewMaps.forEach(previewMap => previewMap.invalidateSize());
  });
  redraw(); setTimeout(() => {
    map.invalidateSize();
    previewMaps.forEach(previewMap => previewMap.invalidateSize());
  }, 150);
})();
