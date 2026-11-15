// ===== fetch-guard.js =====
// Keeps the location search readable when the page is opened directly or a stale server responds with HTML.
(function(){
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    let url=typeof input==='string'?input:input.url;
    const isApi=url.includes('/api/');
    const isGeo=url.includes('/api/geocode');
    // The page may be opened by VS Code Live Server (5500), file://, or another static host.
    // Route API requests through the local backend. Browser-side TKGM HTTP errors do not
    // reject fetch(), so a catch-based fallback can leave the location dropdowns broken.
    if(isApi && (window.location.protocol==='file:' || window.location.port!=='8000')){
      const path=url.slice(url.indexOf('/api/'));
      const host=window.location.hostname||'127.0.0.1';
      url=`http://${host}:8000${path}`;
    }
    return nativeFetch(url,init).then(async response=>{
      if(isGeo){
        const type=response.headers.get('content-type')||'';
        if(!type.includes('application/json')) return new Response(JSON.stringify({error:'The location service returned a web page instead of JSON. Restart the server and try again.'}),{status:503,headers:{'Content-Type':'application/json'}});
      }
      return response;
    });
  };
})();

// ===== app.js =====
const CROPS = {
  wheat: { name:'Wheat', season:'Winter cereal', sow:[9,10,11], harvest:[6,7], temp:[10,22], water:420, seed:'Prepare the seedbed before planting; choose a certified cultivar suited to the region.', fertilizer:'Apply basal fertilizer at planting based on soil test results. Split nitrogen applications and schedule top-dressing around tillering.', spray:'Monitor weeds around tillering. Avoid routine spraying before correctly identifying a pest or disease.', irrigate:'If rainfall is insufficient, monitor water needs during stem elongation and heading.' },
  barley: { name:'Barley', season:'Winter cereal', sow:[9,10,11], harvest:[6,7], temp:[8,20], water:380, seed:'Prepare the seedbed and select a barley cultivar suited to the region and intended use.', fertilizer:'Apply basal fertilizer based on soil test results. Split nitrogen according to crop needs and growth stage.', spray:'Monitor weeds and disease regularly; intervene only when thresholds and product labels support it.', irrigate:'During drought, monitor water availability at stem elongation and heading.' },
  corn: { name:'Corn', season:'Summer field crop', sow:[4,5], harvest:[9,10], temp:[18,30], water:600, seed:'Plant once the soil is sufficiently warm. Choose row spacing and a hybrid suited to local recommendations.', fertilizer:'Test the soil before planting. Split nitrogen applications between planting and rapid growth.', spray:'Monitor weeds early after emergence. Base pest control on field scouting.', irrigate:'If irrigating, prioritize flowering and grain fill; monitor rainfall and soil conditions.' },
  sunflower: { name:'Sunflower', season:'Summer oilseed crop', sow:[3,4,5], harvest:[8,9], temp:[15,28], water:450, seed:'Plant after frost risk declines and the soil warms. Choose a locally suitable hybrid and seeding rate.', fertilizer:'Use soil test results to guide basal phosphorus and potassium; apply nitrogen in balance.', spray:'Weed monitoring is especially important during early growth. Follow registered product labels when making spray decisions.', irrigate:'In dry conditions, monitor water stress during head formation and flowering.' },
  chickpea: { name:'Chickpea', season:'Legume', sow:[2,3,4], harvest:[7,8], temp:[12,26], water:300, seed:'Set planting time according to local frost and disease risks; use clean, suitable seed.', fertilizer:'Test the soil before planting. Avoid increasing nitrogen on legumes without expert advice.', spray:'Monitor for Ascochyta blight and weeds. In fields with disease history, consider resistant cultivars and crop rotation.', irrigate:'Chickpea can grow with limited water in many conditions; monitor severe stress during flowering.' },
  lentil: { name:'Lentil', season:'Winter / early spring legume', sow:[10,11,2,3], harvest:[6,7], temp:[8,23], water:280, seed:'Choose a red or green lentil cultivar adapted to local winter conditions and follow the regional planting calendar.', fertilizer:'Test the soil and avoid unnecessary high nitrogen applications to legumes.', spray:'Monitor weeds, rust, and root diseases. Base intervention on diagnosis and registered product information.', irrigate:'Usually grown on rainfall. During prolonged drought, monitor flowering and pod set.' },
  cotton: { name:'Cotton', season:'Summer industrial crop', sow:[4,5], harvest:[9,10,11], temp:[20,32], water:700, seed:'Plant after the soil warms and frost risk passes. Choose a cultivar suited to the season length.', fertilizer:'Base fertilization on soil tests and yield targets; split nitrogen and avoid excess.', spray:'Scout for aphids, whiteflies, and bollworms. Protect beneficial insects and use action thresholds.', irrigate:'Reliable irrigation is critical; schedule regular water during flowering and boll development.' },
  tomato: { name:'Tomato', season:'Vegetable', sow:[3,4,5], harvest:[7,8,9,10], temp:[18,30], water:550, seed:'Choose a cultivar suited to field or greenhouse production; transplant after frost risk passes.', fertilizer:'Build a nutrient program from soil and, where possible, irrigation water tests. Split fertilizer by growth stage.', spray:'Scout frequently for downy mildew, whiteflies, and other problems. Follow diagnosis, registration, label, and pre-harvest interval requirements.', irrigate:'Water regularly and evenly; fluctuations can increase fruit cracking and blossom-end rot.' },
  potato: { name:'Potato', season:'Tuber crop', sow:[2,3,4,8], harvest:[6,7,8,11], temp:[15,25], water:500, seed:'Select certified seed potatoes and a locally suitable early or late cultivar.', fertilizer:'Base fertilization on soil tests and soil structure; excess nitrogen can impair tuber formation.', spray:'Monitor insect and late blight risks. Crop rotation and healthy seed support disease management.', irrigate:'Maintain even moisture during tuber formation and growth; avoid waterlogging.' }
};
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const $=id=>document.getElementById(id);
let locationSearchTimer;
let locationSearchRequest = 0;
function applyResolvedFarmLocation(location) {
  const status = $('location-status');
  $('latitude').value = Number(location.latitude).toFixed(6);
  $('longitude').value = Number(location.longitude).toFixed(6);
  if (location.name) $('location').value = location.name;
  status.textContent = `✓ ${location.name || 'Location found'}`;
  status.dataset.state = 'ok';
  window.dispatchEvent(new CustomEvent('tarimyol:location-resolved', { detail: location }));
  const form = $('farm-form');
  if (form.checkValidity()) form.requestSubmit();
  else status.textContent = `✓ ${location.name || 'Location found'}. Complete the field area and crop details to generate your plan.`;
}
window.applyResolvedFarmLocation = applyResolvedFarmLocation;
async function resolveFarmLocation() {
  const text = $('location').value.trim(), status = $('location-status'), button = $('find-location');
  if (text.length < 2) {
    status.textContent = 'Enter a province, district, village, or place.';
    status.dataset.state = 'error';
    return;
  }
  const requestId = ++locationSearchRequest;
  button.disabled = true;
  button.textContent = 'Searching…';
  status.textContent = 'Searching for location…';
  status.dataset.state = 'loading';
  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`), data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Location not found.');
    if (requestId !== locationSearchRequest) return;
    const displayName = data.display_name || text;
    applyResolvedFarmLocation({ latitude: Number(data.latitude), longitude: Number(data.longitude), name: displayName });
  } catch (error) {
    if (requestId !== locationSearchRequest) return;
    status.textContent = error.message;
    status.dataset.state = 'error';
  } finally {
    if (requestId === locationSearchRequest) {
      button.disabled = false;
      button.textContent = 'Konumu bul';
    }
  }
}
$('find-location').addEventListener('click', resolveFarmLocation);
$('location').addEventListener('input', () => {
  locationSearchRequest += 1;
  clearTimeout(locationSearchTimer);
  const text = $('location').value.trim();
  if (text.length >= 3) {
    locationSearchTimer = setTimeout(resolveFarmLocation, 800);
  } else {
    $('find-location').disabled = false;
    $('find-location').textContent = 'Konumu bul';
    if ($('location-status').dataset.state === 'loading') {
      $('location-status').textContent = text ? 'Keep typing to search for a location.' : 'Start typing a location or select a saved field.';
      $('location-status').dataset.state = '';
    }
  }
});
$('location').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    clearTimeout(locationSearchTimer);
    resolveFarmLocation();
  }
});
function generatePlanAfterLocationIsReady() {
  const form = $('farm-form');
  if ($('location-status').dataset.state === 'ok' && form.checkValidity()) form.requestSubmit();
}
$('area').addEventListener('change', generatePlanAfterLocationIsReady);
$('crop').addEventListener('change', generatePlanAfterLocationIsReady);
const mean=values=>{const valid=values.filter(v=>Number.isFinite(v)&&v>-900);return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null};
const fmt=(v,d=0)=>v===null?'—':v.toLocaleString('tr-TR',{maximumFractionDigits:d,minimumFractionDigits:d});
function getClimateStats(parameters){const keys=Object.keys(parameters.T2M||{}).filter(k=>/^\d{8}$/.test(k));const years={};keys.forEach(k=>{const m=Number(k.slice(4,6))-1;(years[m]??=[]).push(k)});const monthly=Array.from({length:12},(_,m)=>{const days=years[m]||[];return{temp:mean(days.map(k=>Number(parameters.T2M?.[k]))),rain:mean(days.map(k=>Number(parameters.PRECTOTCORR?.[k]))),humidity:mean(days.map(k=>Number(parameters.RH2M?.[k]))),solar:mean(days.map(k=>Number(parameters.ALLSKY_SFC_SW_DWN?.[k])))}});const rainfall=mean(monthly.map(x=>x.rain===null?null:x.rain*30.4));return{monthly,rainfall,temp:mean(monthly.map(x=>x.temp)),humidity:mean(monthly.map(x=>x.humidity))}}
function makePlan(crop,stats,irrigation,soil){const start=crop.sow.map(m=>MONTHS[m-1]).join(' / '), tasks=Array.from({length:12},(_,i)=>({month:i,items:[]}));const add=(months,label,text)=>months.forEach(m=>tasks[m-1].items.push([label,text]));add(crop.sow,'EKİM / DİKİM',crop.seed);add([crop.sow[crop.sow.length-1]],'GÜBRE',crop.fertilizer);const growth=crop.sow[crop.sow.length-1]+1;add([((growth-1)%12)+1], 'GÖZLEM',crop.spray);if(crop.harvest.length>1)add(crop.harvest.slice(0,1),'HARVEST ÖNCESİ','Olgunluk ve hava koşullarını takip et; hasat ekipmanını ve ürün depolama koşullarını hazırla.');add(crop.harvest,'HARVEST',`Hasadı olgunlukta yap. ${crop.harvest.map(m=>MONTHS[m-1]).join('–')} döneminde ürün nemi ve hava koşullarını kontrol et.`);if(irrigation)add([((growth)%12)+1], 'IRRIGATION',crop.irrigate);const post=(crop.harvest[crop.harvest.length-1]%12)+1;add([post],'AFTER HARVEST','Bitki artıklarını, münavebeyi ve gelecek sezon için toprak analizini planla.');
 const statusMonths=crop.sow.map(m=>stats.monthly[m-1].temp).filter(v=>v!==null);const tempOk=statusMonths.length?statusMonths.some(v=>v>=crop.temp[0]-4&&v<=crop.temp[1]+3):null;const rainOk=stats.rainfall===null?null:stats.rainfall>=crop.water*.45;let score=50;if(tempOk===true)score+=25;else if(tempOk===false)score-=15;if(rainOk===true)score+=20;else if(rainOk===false)score-=12;if(irrigation)score+=8;if(soil==='unknown')score-=3;score=Math.max(15,Math.min(95,score));let title=score>=72?'İklim kaynaklı verim görünümü: destekleyici':score>=50?'İklim kaynaklı verim görünümü: temkinli':'İklim kaynaklı verim görünümü: riskli';let summary=`NASA POWER’ın ${stats.period||'son üç tamamlanmış yıl'} günlük verisine göre ${stats.temp===null?'ortalama sıcaklık hesaplanamadı':`ortalama sıcaklık ${fmt(stats.temp,1)} °C`}, tahmini yağış ${stats.rainfall===null?'hesaplanamadı':`${fmt(stats.rainfall)} mm/ay`}. Bu görünüm yalnızca genel iklim uygunluğunu özetler; ürün miktarı tahmini, bu yılın hava tahmini veya verim garantisi değildir.`;return{tasks:tasks.filter(x=>x.items.length),score,title,summary,start,soilNote:soil==='unknown'?'Toprak tipi bilinmediğinden gübre miktarı önerilmedi. Toprak analizi yaptır.':`Seçilen toprak yapısı (${({clay:'killi',loam:'tınlı',sandy:'kumlu',silty:'siltli'})[soil]}) için drenaj ve su tutma durumunu tarlada doğrula.`}}
function renderReport({crop,stats,plan,lat,lon,area,period}){const report=$('report');const tasks=plan.tasks.map(row=>`<div class="month-row"><div class="month-name">${MONTHS[row.month]}</div><div class="month-tasks">${row.items.map(([label,text])=>`<b>${label}:</b> ${text}`).join('<br>')}</div></div>`).join('');report.innerHTML=`<div class="report-head"><div><div class="report-location">${lat.toFixed(3)}°, ${lon.toFixed(3)}° · ${fmt(area,1)} dekar</div><h2>Season roadmap</h2></div><span class="crop-badge">♧ ${crop.name}</span></div><p class="report-summary">${plan.summary}</p><div class="climate-grid"><div class="metric"><small>Ort. sıcaklık</small><strong>${fmt(stats.temp,1)}<em>°C</em></strong></div><div class="metric"><small>Tahmini yağış</small><strong>${fmt(stats.rainfall)}<em>mm/ay</em></strong></div><div class="metric"><small>Avg. humidity</small><strong>${fmt(stats.humidity)}<em>%</em></strong></div></div><div class="score-line"><div class="score-ring">${plan.score}</div><div class="score-copy"><strong>${plan.title}</strong><small>${crop.season} · Tahmini ekim/dikim: ${plan.start}</small></div></div><div class="alert"><b>Soil note:</b> ${plan.soilNote} Gübre miktarını toprak analizi olmadan belirleme.</div><div class="timeline-title">AYLIK İŞ TAKVİMİ · 2026 SEZONU</div><div class="timeline">${tasks}</div><div class="report-foot">Kaynak: NASA POWER günlük nokta verisi (${period.start}–${period.end}). İklim uyumu puanı kaba bir ön değerlendirmedir; verim miktarı tahmini değildir. İlaçlama yalnızca doğru teşhis, ruhsatlı ürün etiketi, hasat aralığı ve yerel uzman önerisiyle planlanmalıdır.</div>`;}
$('farm-form').addEventListener('submit',async e=>{e.preventDefault();const lat=Number($('latitude').value),lon=Number($('longitude').value),area=Number($('area').value),crop=CROPS[$('crop').value];if(!crop||!Number.isFinite(lat)||!Number.isFinite(lon)||area<=0)return;window.OverviewHazards?.start(lat,lon);$('empty-state').classList.add('hidden');$('report').classList.add('hidden');$('loading-state').classList.remove('hidden');$('results-panel').scrollIntoView({behavior:'smooth',block:'nearest'});try{const response=await fetch(`/api/climate?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`);const data=await response.json();if(!response.ok)throw new Error(data.error||'İklim verisi alınamadı.');const stats=getClimateStats(data.parameters);stats.period=`${data.period.start.slice(0,4)}–${data.period.end.slice(0,4)}`;const plan=makePlan(crop,stats,$('irrigation').checked,$('soil').value);renderReport({crop,stats,plan,lat,lon,area,period:data.period});if(window.renderDashboardCharts){window.renderDashboardCharts(stats.monthly,$('crop').value);}if(window.renderCostAnalysis){window.renderCostAnalysis($('crop').value,area,$('irrigation').checked);}if(window.attachPdfDownloadButton){window.attachPdfDownloadButton();}$('loading-state').classList.add('hidden');$('report').classList.remove('hidden')}catch(error){$('loading-state').classList.add('hidden');$('empty-state').classList.remove('hidden');const p=$('empty-state').querySelector('p');p.textContent=`${error.message} İnternet bağlantını kontrol edip tekrar deneyebilirsin.`;p.style.color='#a45e44';}});

// ===== rotation.js =====
(function(){
  const traits={wheat:['Tahıl',2,0],barley:['Tahıl',2,0],corn:['Tahıl',4,-1],sunflower:['Yağlı tohum',3,-1],chickpea:['Baklagil',1,3],lentil:['Baklagil',1,3],cotton:['Endüstri',5,-1],tomato:['Sebze',4,-1],potato:['Yumru',4,-1]};
  const names={wheat:'Buğday',barley:'Arpa',corn:'Mısır',sunflower:'Ayçiçeği',chickpea:'Chickpea',lentil:'Lentil',cotton:'Cotton',tomato:'Tomato',potato:'Potato'};
  const pool=['wheat','chickpea','barley','sunflower','lentil','corn'];
  function insert(){const report=document.getElementById('report');if(!report||report.classList.contains('hidden')||report.querySelector('.rotation-box'))return;const selected=document.getElementById('crop').value,previous=document.getElementById('previous-crop').value,priority=document.getElementById('priority').value,irrigation=document.getElementById('irrigation').checked,current=traits[selected]||traits.wheat;let choices=pool.filter(id=>id!==selected).sort((a,b)=>{const A=traits[a],B=traits[b];const score=x=>(x[0]!==current[0]?3:0)+(x[2]>0?3:0)+(priority==='water'?(5-x[1]):0)+(priority==='soil'?x[2]:0)+(priority==='risk'?(x[2]>=0?2:0):0)+(irrigation?0:-(x[1]));return score(B)-score(A)});let years=[selected,choices[0],choices[1]];if(previous!=='none'&&traits[previous]&&traits[previous][0]===current[0])years[0]=choices.find(id=>traits[id][0]!==current[0])||selected;const reasons=['Bu sezon seçtiğin ürün.','Önceki ürün ailesini kırar; toprağı dinlendirmeye yardımcı olur.','Farklı kök yapısıyla hastalık baskısını ve besin tekdüzeliğini azaltır.'];const html=`<div class="rotation-box"><div class="timeline-title">3 YILLIK ÜRÜN ROTASYONU</div><div class="rotation-grid">${years.map((id,i)=>`<div class="rotation-card"><span>${2026+i}</span><strong>${names[id]}</strong><small>${reasons[i]}</small></div>`).join('')}</div><p class="rotation-note"><b>Toprak sağlığı yaklaşımı:</b> Baklagilleri ve farklı kök derinliklerini rotasyona alarak besin döngüsünü, toprak yapısını ve su tutmayı destekle.</p></div>`;report.insertAdjacentHTML('afterbegin',html)}
  new MutationObserver(insert).observe(document.getElementById('report'),{childList:true,subtree:true,attributes:true});
})();

// ===== quality-fixes.js =====
(function(){
  const names={wheat:'Wheat',barley:'Barley',corn:'Corn',sunflower:'Sunflower',chickpea:'Chickpea',lentil:'Lentil',cotton:'Cotton',tomato:'Tomato',potato:'Potato'};
  const traits={wheat:'Cereal',barley:'Cereal',corn:'Cereal',sunflower:'Oilseed',chickpea:'Legume',lentil:'Legume',cotton:'Industrial crop',tomato:'Vegetable',potato:'Tuber'};
  const pool=['wheat','chickpea','barley','sunflower','lentil','corn'];
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function rotation(){
    const box=document.querySelector('.rotation-box'), selected=document.getElementById('crop')?.value;
    if(!box||!selected||!names[selected])return;
    const priority=document.getElementById('priority')?.value||'soil'; const previous=document.getElementById('previous-crop')?.value||'none';
    const future=pool.filter(id=>id!==selected).sort((a,b)=>{
      const score=id=>(traits[id]!==traits[selected]?3:0)+(traits[id]==='Legume'?3:0)+(priority==='water'&&['corn','cotton'].includes(id)?-4:0)+(priority==='soil'&&traits[id]==='Legume'?4:0);
      return score(b)-score(a);
    });
    const years=[selected,future[0],future[1]];
    const reasons=['Crop selected for this season.','Break the disease cycle by rotating to a different crop family.','Support soil health with legumes or a different root structure.'];
    box.innerHTML=`<div class="timeline-title">3-YEAR CROP ROTATION <span style="font-weight:400;letter-spacing:0">· A plan to avoid repeating the same crop family each year</span></div><div class="rotation-grid">${years.map((id,i)=>`<div class="rotation-card"><span>Year ${2026+i}</span><strong>${names[id]}</strong><small>${reasons[i]}</small></div>`).join('')}</div><p class="rotation-note"><b>Soil health:</b> Rotating crop families can reduce disease pressure, support nutrient cycling with legumes, and improve soil structure through varied root systems.</p>`;
  }
  function rows(items){return items.map(x=>`<div class="month-row"><div class="month-name">${x[0]}</div><div class="month-tasks"><b>${x[1]}:</b> ${x[2]}</div></div>`).join('')}
  function timeline(){
    const selected=document.getElementById('crop')?.value, timeline=document.querySelector('.timeline'); if(!timeline||!selected)return;
    if(selected==='wheat'){
      timeline.innerHTML=rows([
        ['Eylül','TARLA HAZIRLIĞI','Toprak analizini kontrol et, ekim yatağını hazırla. Bölgenin yağış ve toprak nemine göre zamanı ayarla.'],
        ['October','EKİM','Buğdayı uygun toprak neminde ve bölgeye uygun çeşitle ek. October tarihini rakım ve yerel ziraat takvimine göre kesinleştir.'],
        ['Kasım','KIŞA GİRİŞ','Çıkışı ve yabancı otları gözle. Gereksiz sulama ve takvim dışı ilaçlamadan kaçın.'],
        ['Aralık','KIŞ DİNLENME DÖNEMİ','Tarla gelişimini gözle; ağır makineyle ıslak toprağa girme. Anız yakma, çöp ve sigara izmariti bırakma.'],
        ['January','KIŞ DİNLENME DÖNEMİ','Tarla boş görünse de toprak korunuyor: anız yakma, yangın riskine karşı kuru ot ve izmaritleri kontrol et.'],
        ['Şubat','GÖZLEM','Kardeşlenme başlangıcını ve su birikmesini kontrol et. Gübre kararını toprak analizi ve bitki durumuna göre ver.'],
        ['March','ÜST GÜBRE / GÖZLEM','Azotu analiz ve gelişme durumuna göre bölerek uygula; yabancı ot ve hastalık için tarla gözlemi yap.'],
        ['April','BAŞAKLANMA','Su stresi ve hastalık belirtilerini izle. İlaç kararı yalnızca doğru teşhis ve ruhsatlı etiketle ver.'],
        ['Mayıs','HARVEST HAZIRLIĞI','Olgunluk, tane nemi ve hava durumunu takip et; hasat ve depolama planını hazırla.'],
        ['June','HARVEST','Bölgeye ve çeşide göre hasadı uygun olgunlukta yap; ürünü temiz ve kuru depola.'],
        ['July','HARVEST SONRASI','Anız yakma. Anız yönetimini toprak analizi, münavebe ve yerel öneriye göre yap; tarlayı yangın riskine karşı temiz tut.'],
        ['Ağustos','TARLA DİNLENMESİ','Toprak analizini yenile, sonraki rotasyon ürününü planla; gereksiz sürüm ve su tüketiminden kaçın.']
      ]);
    }
  }
  let done=false; new MutationObserver(()=>{const report=document.getElementById('report');if(!report||report.classList.contains('hidden')||done)return;if(document.querySelector('.rotation-box')&&document.querySelector('.timeline')){done=true;rotation();timeline();setTimeout(()=>{done=false},100)}}).observe(document.getElementById('report'),{childList:true,subtree:true,attributes:true});
})();

// ===== field-data.js =====
/* Optional regional agronomy override. See README for the response format. */
(function(){
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function render(data){
    const timeline=document.querySelector('.timeline'); if(!timeline||!data){if(data)setTimeout(()=>render(data),250);return;}
    const tasks=data.tasks||data.monthly_tasks; if(!tasks)return;
    window.__fieldDataApplied=true;
    const names=['January','Şubat','March','April','Mayıs','June','July','Ağustos','Eylül','October','Kasım','Aralık'];
    const rows=Object.entries(tasks).map(([month,items])=>{const index=Math.max(0,Math.min(11,Number(month)-1));const list=Array.isArray(items)?items:[items];return `<div class="month-row"><div class="month-name">${names[index]}</div><div class="month-tasks">${list.map(item=>typeof item==='string'?esc(item):`<b>${esc(item.label||item.title||'PLAN')}:</b> ${esc(item.text||item.description||'')}`).join('<br>')}</div></div>`}).join('');
    timeline.innerHTML=rows;
    const report=document.getElementById('report');const note=document.createElement('div');note.className='alert field-api-note';note.innerHTML=`<b>Bölgesel tarla takvimi:</b> ${esc(data.source||'Harici tarım veri servisi')} verisi kullanıldı. ${esc(data.season_note||'October ve hasat tarihleri bölgesel veriye göre güncellendi.')}`;report.querySelector('.report-summary')?.after(note);
  }
  document.getElementById('farm-form')?.addEventListener('submit',async()=>{
    const lat=document.getElementById('latitude')?.value,lon=document.getElementById('longitude')?.value,crop=document.getElementById('crop')?.value;
    if(!lat||!lon||!crop)return;
    try{const response=await fetch(`/api/field-data?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&crop=${encodeURIComponent(crop)}`);if(!response.ok)return;const data=await response.json();render(data)}catch(_error){/* Optional API unavailable: keep the general plan. */}
  });
})();

// ===== perenual.js =====
(function(){
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function value(v){if(Array.isArray(v))return v.join(', ');if(v&&typeof v==='object')return Object.values(v).filter(Boolean).join(' ');return v||''}
  document.getElementById('farm-form')?.addEventListener('submit',async()=>{
    const crop=document.getElementById('crop')?.value;if(!crop)return;
    try{const response=await fetch(`/api/plant-profile?crop=${encodeURIComponent(crop)}`);if(!response.ok)return;const data=await response.json();const plant=data.plant||{};const report=document.getElementById('report');if(!report)return;const soil=value(plant.soil)||'Perenual profilinde belirtilmemiş';const water=value(plant.watering)||'Belirtilmemiş';const sun=value(plant.sunlight)||'Belirtilmemiş';const pests=value(plant.pest_susceptibility)||'Belirtilmemiş';const card=document.createElement('div');card.className='plant-profile';card.innerHTML=`<div class="timeline-title">ÜRÜN PROFİLİ · PERENUAL</div><strong>${esc(plant.common_name||plant.commonName||crop)}</strong><div class="profile-grid"><span><small>Sulama</small>${esc(water)}</span><span><small>Güneş</small>${esc(sun)}</span><span><small>Toprak</small>${esc(soil)}</span><span><small>Zararlılar</small>${esc(pests)}</span></div><small class="profile-source">Bitki özellikleri Perenual’dan; bölgesel ekim ve hasat tarihi değildir.</small>`;report.querySelector('.report-summary')?.after(card)}catch(_error){/* Optional profile source; keep the report usable. */}
  });
})();

// ===== soil.js =====
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function flatten(properties){const out={};(properties.layers||[]).forEach(layer=>{const depth=(layer.depths||[])[0]||{};const values=depth.values||{};const raw=values.mean??depth.mean??layer.mean;if(raw!==undefined&&raw!==null)out[layer.name]=Number(raw)/(Number(layer.unit_measure?.d_factor)||1)});return out}
  document.getElementById('farm-form')?.addEventListener('submit',async()=>{const lat=document.getElementById('latitude')?.value,lon=document.getElementById('longitude')?.value;if(!lat||!lon)return;try{const response=await fetch(`/api/soil?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`);if(!response.ok)return;const data=await response.json(),soil=flatten(data.properties||{}),report=document.getElementById('report');if(!report)return;const has=Object.keys(soil).length;const card=document.createElement('div');card.className='soil-profile';card.innerHTML=`<div class="timeline-title">TOPRAK PROFİLİ · SOILGRIDS</div>${has?`<div class="soil-grid">${[['clay','Kil','%'],['sand','Kum','%'],['silt','Silt','%'],['phh2o','pH',''],['soc','Organik karbon','g/kg'],['nitrogen','Azot','mg/kg']].filter(x=>soil[x[0]]!==undefined).map(x=>`<span><small>${x[1]}</small><b>${esc(soil[x[0]])}</b> ${x[2]}</span>`).join('')}</div><p>Bu harita tahminidir; gübre kararından önce tarladan laboratuvar numunesi al.</p>`:'<p>SoilGrids bu koordinat için şu anda katman döndürmedi. Tarladaki toprak analizi ve kullanıcı seçimi korunuyor.</p>'}<small class="soil-source">Kaynak: ISRIC SoilGrids · 250 m tahmini grid · servis beta olabilir.</small>`;report.querySelector('.report-summary')?.after(card)}catch(_error){}});
})();

// ===== agronomy.js =====
(function(){
  const months=['January','Şubat','March','April','Mayıs','June','July','Ağustos','Eylül','October','Kasım','Aralık'];
  const soils={unknown:['Toprak sınıfı belirlenmedi','Gübre ve sulama kararını kesinleştirmeden laboratuvar analizi yaptır.'],clay:['Killi toprak','Su tutma yüksek; ıslakken sürüm toprağı sıkıştırır. Buğday için drenajı ve tavı takip et.'],loam:['Tınlı toprak','Su ve hava dengesi genellikle elverişlidir; buğdayda verim için en kritik konu doğru ekim tavıdır.'],sandy:['Kumlu toprak','Su ve azot hızlı kaybolabilir; küçük ve kontrollü sulama/gübre bölmeleri daha güvenlidir.'],silty:['Siltli toprak','Kaymak tabakası ve erozyon riski vardır; yüzeyi çıplak bırakmamak ve ağır makineden kaçınmak gerekir.'],red:['Kırmızı toprak','Demir oksitçe zengin olabilir; çoğu zaman kireç ve fosfor bağlama durumunu analizle kontrol et. Renk tek başına verim göstergesi değildir.'],white:['Beyaz / kireçli toprak','Yüksek kireç pH ve fosfor alımını etkileyebilir; pH, kireç ve fosfor analizine göre gübrele.'],gravel:['Çakıllı toprak','Kök bölgesi sığ ve su tutma düşük olabilir; tarla kapasitesini ve taş yoğunluğunu dikkate al, erozyonu azalt.'],alluvial:['Alüvyal / taban toprak','Besin ve su potansiyeli yüksek olabilir; su baskısı ve drenajı mutlaka kontrol et.'],saline:['Tuzlu / alkali toprak','Çimlenme ve kök gelişimi baskılanabilir; EC, pH ve drenaj analizi olmadan ürün/gübre kararı verme.'],humus:['Humuslu / organik maddece zengin','Su tutma ve biyolojik aktivite avantajdır; gereksiz azot verme, münavebeyle organik maddeyi koru.']};
  const cropNames={wheat:'Buğday',barley:'Arpa',corn:'Mısır',sunflower:'Ayçiçeği',chickpea:'Chickpea',lentil:'Lentil',cotton:'Cotton',tomato:'Tomato',potato:'Potato'};
  function region(lat,lon){if(lat>=36&&lat<38.7&&lon>=36&&lon<=43)return{name:'Güneydoğu Anadolu',harvest:'Mayıs sonu–June başı',reason:'Sıcak ve kuraklaşan ilkbahar, tane doldurma sonunu erkene çekebilir; kuraklık riskini azaltmak için erkenci/kuraklığa dayanıklı buğday ve baklagil rotasyonu daha anlamlıdır.'};if(lat>=38&&lat<40.7&&lon>=29&&lon<=37)return{name:'İç Anadolu',harvest:'June–July başı',reason:'Kışlık tahıllarda yağışa dayalı üretim yaygındır; başaklanma ve tane doldurma dönemindeki su stresi verimi belirler. Nadas yerine uygun baklagil rotasyonu toprağı koruyabilir.'};if(lat>=38&&lat<42&&lon>=26&&lon<30.8)return{name:'Marmara/Ege geçişi',harvest:'Mayıs sonu–June',reason:'Kış yağışları ve bahar sıcaklığı ekim tarihini etkiler; yatma ve hastalık riskine karşı dengeli azot ve sık gözlem gerekir.'};return{name:'yerel bölge',harvest:'June–July aralığı',reason:'Koordinat için bölgesel tarım takvimi bulunmadığından hasat aralığı iklim ortalamasına dayalı yaklaşık penceredir; ilçe çeşidi ve fenolojik gözlemle daraltılmalıdır.'}}
  function row(month,label,text){return `<div class="month-row"><div class="month-name">${month}</div><div class="month-tasks"><b>${label}:</b> ${text}</div></div>`}
  function apply(){const report=document.getElementById('report'),crop=document.getElementById('crop')?.value;if(!report||report.classList.contains('hidden')||!crop||report.dataset.agronomy==='1')return;const lat=Number(document.getElementById('latitude')?.value),lon=Number(document.getElementById('longitude')?.value),soil=document.getElementById('soil')?.value||'unknown',r=region(lat,lon),s=soils[soil]||soils.unknown;report.dataset.agronomy='1';const timeline=report.querySelector('.timeline');if(crop==='wheat'&&timeline&&!window.__fieldDataApplied){const harvest=r.harvest;timeline.innerHTML=[row('Eylül','TARLA HAZIRLIĞI','Toprak analizini ve tavı kontrol et; ekim yatağını bölgenin yağışına göre hazırla.'),row('October','EKİM','Bölgeye uygun kışlık çeşidi, yeterli toprak neminde ek. Geç veya kuru ekim çıkışı ve kardeşlenmeyi azaltabilir.'),row('Kasım','ÇIKIŞ / KIŞA GİRİŞ','Çıkış homojenliğini ve yabancı otları izle; gereksiz ilaçlama yapma.'),row('Aralık–January','KIŞ DİNLENMESİ','Islak toprağa ağır makineyle girme. Anız yakma, çöp ve sigara izmariti bırakma; yangın ve erozyon riskini azalt.'),row('Şubat–March','KARDEŞLENME / ÜST GÜBRE','Azotu toprak analizi ve bitki gelişimine göre bölerek değerlendir; su birikmesi ve yabancı otları kontrol et.'),row('April','SAPA KALKMA / BAŞAKLANMA','Kuraklık, pas ve yaprak hastalıklarını gözle. Müdahale yalnızca doğru teşhis ve ruhsatlı etiketle yapılmalı.'),row(harvest.split('–')[0],'HARVEST PENCERESİ BAŞLANGICI',`Bölgesel yaklaşık pencere: ${harvest}. Tane nemi, sararma, hava tahmini ve parsel olgunluğuna göre başlat; yalnızca aya bakarak hasat etme.`),row(harvest.includes('July')?'July':'June','HARVEST SONRASI','Anızı yakma ve tarlaya atık bırakma. Sap yönetimini toprak analizi, münavebe ve yerel uzman önerisiyle yap; sonraki rotasyonu planla.')].join('')}
    const box=document.createElement('div');box.className='agronomy-rationale';box.innerHTML=`<div class="timeline-title">ÖNERİNİN GEREKÇESİ · ${r.name.toUpperCase()}</div><h3>${cropNames[crop]} için neden bu plan?</h3><p>${r.reason}</p><p><b>Toprak değerlendirmesi:</b> ${s[0]} — ${s[1]}</p><p><b>Hasat notu:</b> ${r.harvest} yaklaşık fenoloji penceresidir; kesin tarih için başak/tane olgunluğu, toprak nemi ve kısa vadeli hava tahmini birlikte kontrol edilmelidir.</p>`;report.querySelector('.report-summary')?.after(box)}
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,80)}).observe(document.getElementById('report'),{childList:true,subtree:true,attributes:true});
})();

// ===== forecast.js =====
(function(){
  const codes={0:'Açık',1:'Çoğunlukla açık',2:'Parçalı bulutlu',3:'Kapalı',45:'Sisli',48:'Kırağı/sis',51:'Hafif çiseleme',53:'Çiseleme',55:'Yoğun çiseleme',61:'Hafif yağmur',63:'Yağmurlu',65:'Kuvvetli yağmur',71:'Hafif kar',73:'Kar',75:'Yoğun kar',80:'Sağanak',81:'Sağanak',82:'Kuvvetli sağanak',95:'Gök gürültülü',96:'Dolu ihtimali',99:'Dolu ihtimali'};
  const days=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function render(data){const report=document.getElementById('report');if(!report||report.classList.contains('hidden')){setTimeout(()=>render(data),250);return}if(report.querySelector('.forecast-box'))return;const d=data.daily||{},dates=d.time||[];if(!dates.length)return;const cards=dates.slice(0,7).map((date,i)=>{const dt=new Date(`${date}T12:00:00`);return `<div class="forecast-day"><span>${i===0?'Bugün':days[dt.getDay()]}</span><strong>${dt.getDate()} ${dt.toLocaleDateString('tr-TR',{month:'short'})}</strong><b>${codes[d.weather_code?.[i]]||'Değişken'}</b><div><em>${Math.round(d.temperature_2m_max?.[i]??0)}°</em><small>${Math.round(d.temperature_2m_min?.[i]??0)}°</small></div><small>${Math.round(d.precipitation_probability_max?.[i]??0)}% yağış</small></div>`}).join('');const box=document.createElement('div');box.className='forecast-box';box.innerHTML=`<div class="timeline-title">ÖNÜMÜZDEKİ 7 GÜN · ${esc(data.timezone||'yerel saat')}</div><div class="forecast-grid">${cards}</div><p class="forecast-note">Tahmin Open‑Meteo’dan alınır. Yağışlı veya don riski görünen günlerde ekim, ilaçlama ve ağır makine işlerini yeniden planla.</p>`;report.querySelector('.report-summary')?.after(box)}
  document.getElementById('farm-form')?.addEventListener('submit',async()=>{const lat=document.getElementById('latitude')?.value,lon=document.getElementById('longitude')?.value;if(!lat||!lon)return;const requestId=window.OverviewHazards?.currentRequestId();try{const r=await fetch(`/api/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`);if(!r.ok){window.OverviewHazards?.updateForecastError(requestId);return}const data=await r.json();window.OverviewHazards?.updateForecast(data,requestId);render(data)}catch(_e){window.OverviewHazards?.updateForecastError(requestId)}});
})();

// ===== seasonal.js =====
(function(){
  const names=['January','Şubat','March','April','Mayıs','June','July','Ağustos','Eylül','October','Kasım','Aralık'];
  const cropNames={wheat:'Buğday',barley:'Arpa',corn:'Mısır',sunflower:'Ayçiçeği',chickpea:'Chickpea',lentil:'Lentil',cotton:'Cotton',tomato:'Tomato',potato:'Potato'};
  function schedule(crop,lat,lon){const se=lat>=36&&lat<38.7&&lon>=36&&lon<=43,central=lat>=38&&lat<40.7&&lon>=29&&lon<=37;const winter=crop==='wheat'||crop==='barley'||crop==='lentil';if(winter){if(crop==='lentil'&&central)return{seed:[2,3],harvest:[6,7],region:'İç Anadolu ilkbahar mercimeği'};return{seed:se?[10,11]:[9,10],harvest:se?[5,6]:[6,7],region:se?'Güneydoğu Anadolu kışlık üretim':'bölgesel kışlık üretim'}}const map={chickpea:{seed:[2,3,4],harvest:[7,8],region:'ilkbahar baklagili'},corn:{seed:[4,5],harvest:[9,10],region:'yazlık tarla bitkisi'},sunflower:{seed:[4,5],harvest:[8,9],region:'yazlık yağ bitkisi'},cotton:{seed:[4,5],harvest:[9,10,11],region:'uzun sezon yazlık bitki'},tomato:{seed:[3,4,5],harvest:[7,8,9,10],region:'sebze/fide dönemi'},potato:{seed:[2,3,4],harvest:[6,7,8],region:'yumru bitkisi'}};return map[crop]||map.chickpea}
  function row(month,label,text){return `<div class="month-row"><div class="month-name">${month}</div><div class="month-tasks"><b>${label}:</b> ${text}</div></div>`}
  function apply(){const report=document.getElementById('report'),crop=document.getElementById('crop')?.value;if(!report||report.classList.contains('hidden')||!crop||report.dataset.seasonal==='1'||window.__fieldDataApplied)return;const lat=Number(document.getElementById('latitude')?.value),lon=Number(document.getElementById('longitude')?.value),s=schedule(crop,lat,lon),timeline=report.querySelector('.timeline');if(!timeline)return;report.dataset.seasonal='1';const seedText=`${names[s.seed[0]-1]}–${names[s.seed[s.seed.length-1]-1]} penceresi; toprak sıcaklığı, tavı ve yerel çeşide göre günü belirle.`;const harvestText=`${names[s.harvest[0]-1]}–${names[s.harvest[s.harvest.length-1]-1]} penceresi; ürün olgunluğu ve hava tahminine göre başlat.`;const items=[];items.push(row(names[s.seed[0]-1],'EKİM / DİKİM',seedText));if(s.seed[0]>3||s.seed[0]<9)items.push(row('Aralık–January','SEZON ARASI','October/dikim dönemi değilse tarla dinlenir. Anız yakma, atık ve sigara izmariti bırakma; ıslak toprağa ağır makineyle girme.'));items.push(row(names[s.harvest[0]-1],'GELİŞİM / GÖZLEM','Yabancı ot, hastalık, su stresi ve beslenmeyi düzenli izle; uygulamayı eşik ve etiket bilgisine göre yap.'));items.push(row(names[s.harvest[0]-1]+'–'+names[s.harvest[s.harvest.length-1]-1],'HARVEST',harvestText));items.push(row('Hasat sonrası','AFTER HARVEST','Sap ve anız yönetimini yakmadan, toprağı ve sonraki rotasyonu koruyacak şekilde planla.'));timeline.innerHTML=items.join('');const note=document.createElement('div');note.className='season-window';note.innerHTML=`<b>${cropNames[crop]} · ${s.region}:</b> Takvim ürünün gerçek ekim penceresine göre oluşturuldu. October ve hasat ayları iklim, çeşit, rakım ve toprak tavına göre birkaç hafta değişebilir.`;timeline.before(note)}
  let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(apply,120)}).observe(document.getElementById('report'),{childList:true,subtree:true,attributes:true});
})();

// ===== water.js =====
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  document.getElementById('farm-form')?.addEventListener('submit',async()=>{const lat=document.getElementById('latitude')?.value,lon=document.getElementById('longitude')?.value,crop=document.getElementById('crop')?.value,area=document.getElementById('area')?.value;if(!lat||!lon||!crop)return;try{const response=await fetch(`/api/water?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&crop=${encodeURIComponent(crop)}&area=${encodeURIComponent(area)}`);if(!response.ok)return;const data=await response.json(),report=document.getElementById('report');if(!report)return;for(let attempt=0;attempt<25&&!report.querySelector('.report-summary');attempt++)await new Promise(resolve=>setTimeout(resolve,200));if(report.querySelector('.water-box'))return;const recent=(data.daily||[]).slice(-7),avg=recent.length?recent.reduce((s,x)=>s+x.deficit,0)/recent.length:0,card=document.createElement('div');card.className='water-box';card.innerHTML=`<div class="timeline-title">SU BİLANÇOSU · NASA POWER ET₀</div><div class="water-main"><div><small>Son 7 gün tahmini açık</small><strong>${esc(data.total_deficit_mm)} mm</strong></div><div><small>Bitki katsayısı (Kc)</small><strong>${esc(data.kc)}</strong></div>${data.suggested_liters!==null?`<div><small>${esc(area)} dekar için eşdeğer</small><strong>${Math.round(data.suggested_liters).toLocaleString('tr-TR')} L</strong></div>`:''}</div><p>${avg>5?'Su açığı yüksek: sulamayı tek seferde değil, toprağın tutma kapasitesine göre bölerek planla.':avg>2?'Hafif/orta su açığı var: kök bölgesi nemini kontrol et.':'Son günlerde belirgin su açığı görünmüyor; gereksiz sulamadan kaçın.'} Yağış, toprak ve gerçek tarla nemi ölçümü bu hesabı değiştirebilir.</p><small class="water-source">ET₀ Hargreaves yaklaşımıyla NASA POWER sıcaklık ve güneş verisinden hesaplandı; saha sensörü yerine geçmez.</small>`;report.querySelector('.report-summary')?.after(card)}catch(_e){}});
})();

// ===== sustainability.js =====
(function(){
  const traits={wheat:[0,1],barley:[0,1],corn:[-1,0],sunflower:[-1,0],chickpea:[3,2],lentil:[3,2],cotton:[-1,0],tomato:[-1,0],potato:[-1,0]};
  document.getElementById('farm-form')?.addEventListener('submit',()=>{setTimeout(()=>{const report=document.getElementById('report'),crop=document.getElementById('crop')?.value,priority=document.getElementById('priority')?.value;if(!report||report.classList.contains('hidden')||report.querySelector('.sustainability-box'))return;const t=traits[crop]||[0,0];let score=50+t[0]*8+(priority==='soil'?12:0)+(priority==='water'?7:0);score=Math.max(20,Math.min(95,score));const card=document.createElement('div');card.className='sustainability-box';card.innerHTML=`<div class="timeline-title">SÜRDÜRÜLEBİLİRLİK SKOR KARTI</div><div class="sustainability-main"><strong>${score}/100</strong><span>${score>=70?'Toprak onarımına uygun rotasyon':'İyileştirme fırsatı yüksek'}</span></div><div class="sustainability-list"><span>♧ Baklagil katkısı <b>${t[0]>0?'Yüksek':'Rotasyona eklenmeli'}</b></span><span>◌ Su baskısı <b>${['corn','cotton'].includes(crop)?'Yüksek':'Orta/düşük'}</b></span><span>↺ Önerilen uygulama <b>Anız yakma, toprak analizini yenile</b></span></div><p>Bu skor ürün ailesi, su ihtiyacı ve seçilen önceliğe dayalı karar desteğidir; organik madde artışı için saha ölçümü gerekir.</p>`;report.querySelector('.report-summary')?.after(card)},2200)});
})();

// ===== resilience.js =====
(function(){
  document.getElementById('farm-form')?.addEventListener('submit',()=>setTimeout(async()=>{const report=document.getElementById('report');if(!report||report.classList.contains('hidden')||report.querySelector('.resilience-box'))return;const lat=document.getElementById('latitude')?.value,lon=document.getElementById('longitude')?.value;if(!lat||!lon)return;let fires='NASA FIRMS verisi alınamadı',projection='NEX-GDDP-CMIP6 veri erişimi bekleniyor';try{const result=await window.OverviewHazards?.getFireData(Number(lat),Number(lon));if(result?.available)fires=`Yakın çevrede son ${result.windowDays} günde ${result.detections} uydu tespiti; tespit olmaması yangın olmadığını garanti etmez.`;else if(result?.message)fires=result.message}catch(_e){fires='NASA FIRMS servisi şu anda erişilemiyor.'}try{const r=await fetch(`/api/projection?latitude=${lat}&longitude=${lon}`);if(r.ok){const d=await r.json();projection='Projeksiyon verisi alındı; model ve senaryo ayrıntısı rapora eklenecek.'}}catch(_e){}const card=document.createElement('div');card.className='resilience-box';card.innerHTML=`<div class="timeline-title">İKLİM RİSKİ VE ERKEN UYARI</div><div class="risk-grid"><span>🔥 <b>Yangın</b><small>${fires}</small></span><span>🌡 <b>10 yıllık projeksiyon</b><small>${projection}</small></span><span>🌧 <b>Aşırı yağış</b><small>Önümüzdeki günler hava tahmin kartında izleniyor.</small></span></div><p>NEX-GDDP-CMIP6 projeksiyonu model, senaryo ve dönem seçimi gerektirir; veri bağlanmadan sıcaklık artışı yüzdesi uydurulmaz.</p>`;report.querySelector('.report-summary')?.after(card)},2300));
})();
