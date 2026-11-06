// Bitkileri Tanı - Dinamik Bitki Rehberi
(function () {
  const PLANTS_DATA = [
    {
      id: 'wheat',
      name: 'Buğday',
      category: 'Tahıl',
      type: 'Kışlık Tahıl',
      img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
      season: 'Kışlık / Erken İlkbahar',
      sow: 'Ekim - Kasım',
      harvest: 'Haziran - Temmuz',
      water: 'Orta (400 - 450 mm)',
      temp: '10 - 22 °C',
      soil: 'Tınlı, killi-tınlı, derin ve geçirgen topraklar',
      summary: 'Temel besin kaynağı tahıl. Kardeşlenme ve başaklanma döneminde neme ihtiyaç duyar.',
      tips: 'Sertifikalı tohum kullanın. Taban gübresini ekimle birlikte, azotu kardeşlenme döneminde verin.'
    },
    {
      id: 'barley',
      name: 'Arpa',
      category: 'Tahıl',
      type: 'Kışlık Tahıl',
      img: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80',
      season: 'Kışlık',
      sow: 'Ekim - Kasım',
      harvest: 'Haziran - Temmuz',
      water: 'Düşük - Orta (350 - 400 mm)',
      temp: '8 - 20 °C',
      soil: 'Kumlu-tınlı, süzek topraklar',
      summary: 'Kuraklığa ve soğuğa buğdaydan daha dayanıklıdır. Yem ve malt sanayisinde kullanılır.',
      tips: 'Aşırı taban suyu olan arazilerden kaçının. Azotu ihtiyaca göre dengeli uygulayın.'
    },
    {
      id: 'corn',
      name: 'Mısır',
      category: 'Tahıl',
      type: 'Yazlık Tahıl',
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
      season: 'Yazlık',
      sow: 'Nisan - Mayıs',
      harvest: 'Eylül - Ekim',
      water: 'Yüksek (550 - 650 mm)',
      temp: '18 - 30 °C',
      soil: 'Organik maddece zengin, derin havalanan toprak',
      summary: 'Yüksek sıcaklık ve düzenli sulama isteyen, yüksek verimli bir sanayi/yem bitkisidir.',
      tips: 'Tepe püskülü ve dane bağlama döneminde su stresi verimi çok düşürür.'
    },
    {
      id: 'sunflower',
      name: 'Ayçiçeği',
      category: 'Endüstri Bitkisi',
      type: 'Yağ Bitkisi',
      img: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=600&q=80',
      season: 'Yazlık',
      sow: 'Mart - Mayıs',
      harvest: 'Ağustos - Eylül',
      water: 'Orta (400 - 500 mm)',
      temp: '15 - 28 °C',
      soil: 'Derin, su tutma kapasitesi iyi tınlı topraklar',
      summary: 'Kazık kök sistemi sayesinde toprağın derinindeki sudan yararlanabilen stratejik yağ bitkisi.',
      tips: 'Aynı tarlaya peş peşe ekmeyin. Çiçeklenme dönemindeki sulama dane dolumunu ciddi artırır.'
    },
    {
      id: 'chickpea',
      name: 'Nohut',
      category: 'Baklagil',
      type: 'Baklagil',
      img: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
      season: 'İlkbahar',
      sow: 'Şubat - Nisan',
      harvest: 'Temmuz - Ağustos',
      water: 'Düşük (250 - 300 mm)',
      temp: '12 - 25 °C',
      soil: 'Kumlu-tınlı, kireçli, drenajı iyi topraklar',
      summary: 'Havadaki azotu toprağa bağlar, toprağı dinlendirir ve sonraki ürünün gübre masrafını azaltır.',
      tips: 'Fazla sulamadan kaçının. Antraknoz riskine karşı dayanıklı tohum tercih edin.'
    },
    {
      id: 'lentil',
      name: 'Mercimek',
      category: 'Baklagil',
      type: 'Baklagil',
      img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      season: 'Kışlık / İlkbahar',
      sow: 'Ekim - Kasım veya Şubat - Mart',
      harvest: 'Haziran - Temmuz',
      water: 'Düşük (250 - 300 mm)',
      temp: '10 - 22 °C',
      soil: 'Hafif, kireçli tın topraklar',
      summary: 'Protein oranı zengin, kuraklığa dayanıklı; rotasyonda buğdaygillerle mükemmel uyum sağlar.',
      tips: 'İlk evrede yabancı ot kontrolüne dikkat edin, hasatta tohum dökülmesini önleyin.'
    },
    {
      id: 'cotton',
      name: 'Pamuk',
      category: 'Endüstri Bitkisi',
      type: 'Endüstri Bitkisi',
      img: 'https://images.unsplash.com/photo-1594488518002-3682977b28c8?auto=format&fit=crop&w=600&q=80',
      season: 'Yazlık',
      sow: 'Nisan - Mayıs',
      harvest: 'Eylül - Ekim',
      water: 'Yüksek (650 - 750 mm)',
      temp: '22 - 32 °C',
      soil: 'Derin, alüvyal ve geçirgen topraklar',
      summary: 'Sıcaklığı ve güneşi sever. Beyaz altın olarak anılan kritik tekstil hammaddesidir.',
      tips: 'Koza oluşturma döneminde sulamayı aksatmayın; hasat öncesinde lif kalitesi için suyu kesin.'
    },
    {
      id: 'tomato',
      name: 'Domates',
      category: 'Sebze',
      type: 'Sebze',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      season: 'İlkbahar / Yaz',
      sow: 'Nisan - Mayıs (fide)',
      harvest: 'Temmuz - Ekim',
      water: 'Yüksek ve Düzenli (500 - 600 mm)',
      temp: '18 - 28 °C',
      soil: 'Organik maddece zengin, tınlı toprak',
      summary: 'Sofralık ve salçalık üretilen, düzenli nem ve zengin besin isteyen popüler sebze.',
      tips: 'Damla sulama kullanın. Meyve çatlamalarını önlemek için su miktarını periyodik ve dengeli tutun.'
    },
    {
      id: 'potato',
      name: 'Patates',
      category: 'Sebze',
      type: 'Yumru Bitkisi',
      img: 'https://images.unsplash.com/photo-1518977676601-b53f8213886a?auto=format&fit=crop&w=600&q=80',
      season: 'İlkbahar / Yaz',
      sow: 'Mart - Nisan',
      harvest: 'Temmuz - Eylül',
      water: 'Orta - Yüksek (450 - 550 mm)',
      temp: '15 - 24 °C',
      soil: 'Gevşek, kumlu-tınlı, havalanan toprak',
      summary: 'Yumru kalitesi için gevşek toprak ve potasyum desteği isteyen enerji ve besin deposu.',
      tips: 'Boğaz doldurma işlemini aksatmayın; yumruların güneş görüp yeşillenmesini önleyin.'
    }
  ];

  let currentFilter = 'all';

  function createCardHTML(plant) {
    return `
      <div class="plant-card-item" data-id="${plant.id}" tabindex="0" role="button" aria-label="${plant.name} hakkında detayları gör">
        <div class="plant-card-photo" style="background-image: url('${plant.img}')">
          <span class="plant-card-tag">${plant.type}</span>
        </div>
        <div class="plant-card-details">
          <div class="plant-card-title-row">
            <h3>${plant.name}</h3>
            <span class="plant-card-badge-season">${plant.season.split('/')[0]}</span>
          </div>
          <p class="plant-card-desc">${plant.summary}</p>
          <div class="plant-card-meta">
            <span>🌱 <b>Ekim:</b> ${plant.sow}</span>
            <span>🌾 <b>Hasat:</b> ${plant.harvest}</span>
          </div>
          <button type="button" class="plant-card-action-btn">Fotoğrafa / Bilgiye Tıkla ↗</button>
        </div>
      </div>
    `;
  }

  function renderMainGrid() {
    const mainGrid = document.getElementById('plants-grid');
    if (!mainGrid) return;

    const filtered = currentFilter === 'all'
      ? PLANTS_DATA
      : PLANTS_DATA.filter(p => p.category === currentFilter || p.type.includes(currentFilter));

    mainGrid.innerHTML = filtered.map(createCardHTML).join('');
  }

  function initPlants() {
    const overviewGrid = document.getElementById('overview-plants-grid');
    if (overviewGrid) {
      overviewGrid.innerHTML = PLANTS_DATA.slice(0, 6).map(createCardHTML).join('');
    }

    renderMainGrid();

    // Filtre butonları dinleyicisi
    document.querySelectorAll('.plant-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.plant-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        renderMainGrid();
      });
    });

    // Kart tıklama dinleyicisi
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.plant-card-item');
      if (card) {
        const plantId = card.getAttribute('data-id');
        const plant = PLANTS_DATA.find(p => p.id === plantId);
        if (plant) showModal(plant);
        return;
      }

      // Kapatma butonu veya modal dışı karartı alanına tıklama
      if (e.target.id === 'modal-close-btn' || e.target.closest('#modal-close-btn') || e.target.id === 'plant-modal') {
        closeModal();
      }
    });

    // Klavye ile açma/kapama
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('plant-card-item')) {
        e.preventDefault();
        const plantId = e.target.getAttribute('data-id');
        const plant = PLANTS_DATA.find(p => p.id === plantId);
        if (plant) showModal(plant);
      }
      if (e.key === 'Escape') closeModal();
    });
  }

  function showModal(p) {
    const modal = document.getElementById('plant-modal');
    const body = document.getElementById('plant-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="modal-banner" style="background-image: url('${p.img}')">
        <span class="modal-type-chip">${p.type}</span>
      </div>
      <div class="modal-info-wrap">
        <div class="modal-header-line">
          <h2>${p.name}</h2>
          <span class="modal-subtext">${p.season}</span>
        </div>
        <p class="modal-summary">${p.summary}</p>

        <div class="modal-spec-grid">
          <div class="spec-box">
            <span class="spec-label">🌱 Ekim Dönemi</span>
            <strong>${p.sow}</strong>
          </div>
          <div class="spec-box">
            <span class="spec-label">🌾 Hasat Dönemi</span>
            <strong>${p.harvest}</strong>
          </div>
          <div class="spec-box">
            <span class="spec-label">💧 Su İhtiyacı</span>
            <strong>${p.water}</strong>
          </div>
          <div class="spec-box">
            <span class="spec-label">🌡️ Sıcaklık İsteği</span>
            <strong>${p.temp}</strong>
          </div>
        </div>

        <div class="modal-extra-info">
          <h4>🌍 Toprak İsteği</h4>
          <p>${p.soil}</p>
        </div>

        <div class="modal-extra-info tips-box">
          <h4>💡 Çiftçi İçin Pratik Bilgiler</h4>
          <p>${p.tips}</p>
        </div>
      </div>
    `;

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('plant-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
    document.body.style.overflow = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlants);
  } else {
    initPlants();
  }
})();
