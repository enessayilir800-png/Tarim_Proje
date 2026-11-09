// Bitkileri Tanı - Dinamik Bitki Rehberi
(function () {
  const PLANTS_DATA = [
    {
      id: 'wheat', name: 'Buğday', category: 'Tahıl', group: 'field', type: 'Kışlık tahıl',
      img: 'assets/plants/wheat.jpg',
      season: 'Kışlık / erken ilkbahar', sow: 'Eylül sonu - Kasım (rakım ve çeşide göre)', sowTiming: 'Toprak tavındayken; soğuk yüksek kesimlerde erken, ılıman ovalarda daha geç ekim yapılır.',
      harvest: 'Haziran sonu - Temmuz', harvestTiming: 'Başak ve sap sararıp dane sertleştiğinde; yağıştan önce, dane nemi uygunken biçerdöverle hasat edilir.',
      duration: 'Yaklaşık 7 - 9 ay', climate: 'Serin gelişme dönemi, kış soğuğuna dayanıklı çeşit ve dane dolumunda ılık-kuru hava ister.',
      regions: 'Malatya: Battalgazi, Yazıhan, Akçadağ ve uygun rakımlı ovalar. Türkiye: Konya, Ankara, Diyarbakır, Şanlıurfa ve Trakya.',
      water: 'Orta; yağış yetersizse sapa kalkma ve başaklanmada destek sulama', temp: 'Gelişme için yaklaşık 10 - 22 °C',
      soil: 'Derin, drenajlı tınlı veya killi-tınlı toprak; su tutan ağır taban arazilerden kaçının.',
      summary: 'Un, bulgur ve yem sanayisinin temel hammaddesi; ekim nöbetinde baklagillerle iyi sonuç verir.',
      tips: 'Sertifikalı ve yöreye uygun çeşidi seçin. Tohum yatağı, ekim sıklığı ve gübreyi toprak analizine göre planlayın; azotu bölerek verin.',
      market: 'TMO alım noktaları (açıklanan alım şartlarıyla), lisanslı depolar, un ve yem fabrikaları, tüccarlar ve kooperatifler. Malatya ve çevresinde alıcı/teslim koşullarını ekimden önce teyit edin.'
    },
    {
      id: 'barley', name: 'Arpa', category: 'Tahıl', group: 'field', type: 'Kışlık tahıl / yem-malt',
      img: 'assets/plants/barley.jpg',
      season: 'Kışlık', sow: 'Eylül sonu - Kasım', sowTiming: 'Kış sertliği ve rakıma göre ekim tarihi erkene alınabilir; bölge çeşidi ve toprak tavı belirleyicidir.',
      harvest: 'Haziran - Temmuz', harvestTiming: 'Dane sertleşip sap sarardığında; maltlık ürün için alıcının nem ve kalite şartları ayrıca kontrol edilir.',
      duration: 'Yaklaşık 7 - 9 ay', climate: 'Serin iklim ve kışa dayanıklılık; buğdaya göre kuraklığa ve tuzluluğa daha toleranslıdır.',
      regions: 'Malatya: Akçadağ, Darende, Hekimhan ve kuru tarım alanları. Türkiye: İç Anadolu, Güneydoğu Anadolu ve geçit bölgeleri.',
      water: 'Düşük - orta; yağışa dayalı üretime uygundur', temp: 'Yaklaşık 8 - 20 °C',
      soil: 'Drenajlı, hafif-orta bünyeli topraklar; taban suyu yüksek tarlalardan kaçının.',
      summary: 'Yemlik, maltlık ve gıda amaçlı değerlendirilen, kurak koşullara dayanıklı bir tahıldır.',
      tips: 'Maltlık üretimde çeşit saflığı ve protein düzeyi alıcı şartlarına uymalıdır. Ekim nöbeti ve yabancı ot takibini ihmal etmeyin.',
      market: 'Yem fabrikaları, malt ve bira sanayisi, TMO alım noktaları, lisanslı depolar ve tüccarlar. Maltlık satış çoğunlukla önceden kalite şartı teyidi gerektirir.'
    },
    {
      id: 'lentil', name: 'Mercimek', category: 'Baklagil', group: 'field', type: 'Kışlık / ilkbaharlık baklagil',
      img: 'assets/plants/lentil.jpg',
      season: 'Kışlık veya ilkbaharlık (çeşide ve yöreye göre)', sow: 'Ekim - Kasım; soğuk yörede Şubat - Mart', sowTiming: 'Kışa dayanıklı çeşitler sonbaharda, sert kışlı yörelerde ilkbaharda ekilebilir; yerel takvime uyun.',
      harvest: 'Haziran - Temmuz', harvestTiming: 'Bitkilerin alt kısımları sararıp baklalar olgunlaşınca, dane dökümünü azaltmak için uygun zamanda hasat edilir.',
      duration: 'Yaklaşık 5 - 8 ay', climate: 'Serin-kurak koşullara uyumlu; çiçeklenme ve dane doldurmada aşırı sıcak/kuraklık verimi etkiler.',
      regions: 'Malatya: kuru tarım alanları, uygun rakım ve çeşitle. Türkiye: Diyarbakır, Şanlıurfa, Mardin, Batman ve İç Anadolu’nun uygun kesimleri.',
      water: 'Düşük - orta; çoğunlukla kış yağışından yararlanır', temp: 'Yaklaşık 8 - 23 °C',
      soil: 'Hafif-orta bünyeli, kireçli ve iyi drene toprak.',
      summary: 'Kırmızı veya yeşil dane olarak pazarlanır; kuru tarıma ve münavebeye uygun bir baklagildir.',
      tips: 'Yabancı ot kontrolünü erken yapın; hasat zamanında gecikme dane dökülmesine yol açabilir. Çeşit ve hasat ekipmanını yöreye göre belirleyin.',
      market: 'Bakliyat işleme/paketleme tesisleri, kooperatifler, tüccarlar ve dönemsel TMO alımı. Kırmızı-yeşil tür, dane rengi ve kalite sınıfına göre alıcı değişebilir.'
    },
    {
      id: 'cotton', name: 'Pamuk', category: 'Endüstri Bitkisi', group: 'field', type: 'Endüstri bitkisi',
      img: 'assets/plants/cotton.jpg',
      season: 'Yazlık', sow: 'Nisan - Mayıs (toprak yeterince ısınınca)', sowTiming: 'Don riski geçip toprak ısındıktan sonra ekilir; kısa sezonlu ve serin Malatya ilçeleri için genel olarak uygun değildir.',
      harvest: 'Eylül - Kasım', harvestTiming: 'Kozalar açıldıkça birden fazla toplama yapılabilir; yağış ve çiğ lif kalitesini etkiler.',
      duration: 'Yaklaşık 5 - 7 ay', climate: 'Uzun, sıcak ve donsuz sezon; yüksek ısı toplamı ve sulama suyu gerektirir.',
      regions: 'Malatya için çoğu yerde sezon ve su kısıtı nedeniyle önerilmez. Türkiye: Şanlıurfa, Diyarbakır, Aydın, Hatay ve Adana.',
      water: 'Yüksek; sulama altyapısı ve su tahsisi olmadan ekim risklidir', temp: 'Yaklaşık 20 - 32 °C',
      soil: 'Derin, verimli, alüvyal ve iyi drene olan toprak.',
      summary: 'Lif tekstil sanayisine, çiğit ve küspesi yağ/yem sanayisine gider; sözleşmeli üretim yaygındır.',
      tips: 'Ekimden önce su kaynağını, sezon uzunluğunu ve alım sözleşmesini kesinleştirin. Hasat öncesi ilaçlama ve bekleme süresini ürün etiketine göre yönetin.',
      market: 'Çırçır-prese tesisleri, tekstil ve yağ fabrikaları, üretici birlikleri. Çoğu bölgede çırçır işletmesi ve alım şartı ekimden önce bulunup teyit edilmelidir.'
    },
    {
      id: 'rice', name: 'Çeltik', category: 'Tahıl', group: 'field', type: 'Sulu tarla tahılı',
      img: 'assets/plants/rice.webp',
      season: 'Yazlık; sürekli su yönetimi gerektirir', sow: 'Nisan sonu - Haziran (bölge ve yönteme göre)', sowTiming: 'Toprak sıcaklığı ve su kaynağı uygun olduğunda; ekim öncesi su kullanım izni/planı ve tarla tesviyesi yapılır.',
      harvest: 'Eylül - Ekim', harvestTiming: 'Daneler olgunlaşıp nem uygun düzeye geldiğinde; hasat ve kurutma hızla planlanmalıdır.',
      duration: 'Yaklaşık 4 - 5 ay', climate: 'Sıcak, uzun ve donsuz sezon; kontrollü sulama suyu ve tesviyeli tarla ister.',
      regions: 'Malatya’da iklim ve su nedeniyle genel öneri değildir. Türkiye: Edirne, Samsun, Çorum, Balıkesir ve Sinop’un uygun sulak alanları.',
      water: 'Çok yüksek; su kaynağı, drenaj ve yasal kullanım koşulları kesinleşmeden ekilmemelidir', temp: 'Yaklaşık 20 - 30 °C',
      soil: 'Su tutabilen, tesviyeli, geçirimsizliği uygun ağır bünyeli toprak.',
      summary: 'Pirinç değirmenlerinde işlenerek sofralık ürüne dönüşür; su yönetimi üretimin belirleyici maliyetidir.',
      tips: 'Ekim öncesi su tahsisi, drenaj, tesviye, çeşit ve çeltik ekim iznini yerel kurumlarla doğrulayın. Malatya’da su kısıtı varsa uygun alternatif ürün seçin.',
      market: 'Çeltik fabrikaları ve pirinç değirmenleri, kooperatifler ve tüccarlar. Teslim öncesi randıman, tane özellikleri, nem ve alım şartlarını alıcıyla görüşün.'
    },
    {
      id: 'bean', name: 'Fasulye', category: 'Baklagil', group: 'garden', type: 'Bahçe bitkisi / baklagil',
      img: 'assets/plants/bean.jpg',
      season: 'Yazlık', sow: 'Nisan sonu - Haziran', sowTiming: 'Toprak ısındıktan, don riski geçtikten sonra; bölgeye göre erkenci çeşit seçilir.',
      harvest: 'Ağustos - Eylül', harvestTiming: 'Bitkiler ve baklalar sararıp kuruduğunda; dane çatlaması ve dökülmesini azaltacak zamanda hasat edilir.',
      duration: 'Yaklaşık 3 - 4 ay', climate: 'Ilıman-sıcak, don olmayan sezon; çiçeklenmede aşırı sıcak ve düzensiz sulama verimi azaltır.',
      regions: 'Malatya: sulanabilir Battalgazi, Yazıhan ve çevre ovalar. Türkiye: Konya, Karaman, Niğde, Nevşehir, Bitlis ve Erzincan.',
      water: 'Orta; çiçeklenme ve bakla bağlamada düzenli su', temp: 'Yaklaşık 18 - 27 °C',
      soil: 'İyi drene olan, organik maddeli tınlı toprak; su birikmesinden kaçının.',
      summary: 'Kuru dane olarak tüketilir; yöresel pazar, bakliyat paketleme ve gıda sanayisine satılabilir.',
      tips: 'Tohum çeşidini alıcının dane iriliği ve renk tercihine göre belirleyin. Münavebe yapın; hasat ve kurutma ekipmanını önceden ayarlayın.',
      market: 'Bakliyat eleme/paketleme tesisleri, kooperatifler, tüccarlar, yerel pazarlar ve doğrudan tüketici. Alım fiyatı ve kalite sınıfı için ekim öncesi birden fazla alıcıyla görüşün.'
    },
    {
      id: 'vetch', name: 'Fiğ', category: 'Yem Bitkisi', group: 'field', type: 'Yemlik baklagil',
      img: 'assets/plants/vetch.jpg',
      season: 'Kışlık veya ilkbaharlık (türe göre)', sow: 'Eylül - Kasım; sert kışlı yerde Şubat - Mart', sowTiming: 'Kışlık türe göre sonbaharda; ilkbaharlık fiğ toprak işlenebilir olduğunda ekilir.',
      harvest: 'Yeşil ot: Nisan - Mayıs; tohum: Haziran - Temmuz', harvestTiming: 'Ot için çiçeklenme başlangıcı; kuru ot için uygun kuruma havasında biçim yapılır.',
      duration: 'Ot hasadı yaklaşık 5 - 8 ay; ilkbaharlıkta 3 - 4 ay', climate: 'Serin mevsime uyumlu, kuraklığa orta dayanıklı; kışlık türlerin soğuğa dayanımı farklıdır.',
      regions: 'Malatya: kuru ve yarı kuru tarım alanları. Türkiye: İç Anadolu, Doğu Anadolu, Ege ve geçit bölgeleri.',
      water: 'Düşük - orta; yağışla yetişebilir, erken gelişmede toprak nemi önemlidir', temp: 'Yaklaşık 8 - 22 °C',
      soil: 'İyi drene olan, hafif-orta bünyeli tarla toprakları.',
      summary: 'Kaba yem ve yeşil ot üretiminde kullanılır; tahıllarla karışık ekim yapılabilir.',
      tips: 'Tohum miktarı ve tahılla karışım oranını yerel tarım danışmanına sorun. Biçim sonrası hızlı kurutma ve balyalama yem kalitesini korur.',
      market: 'Hayvancılık işletmeleri, yem kooperatifleri, balya tüccarları ve tohumluk alıcıları. Ekimden önce yaş/kuru ot alıcısı, balya standardı ve nakliyeyi araştırın.'
    },
    {
      id: 'sainfoin', name: 'Korunga', category: 'Yem Bitkisi', group: 'field', type: 'Çok yıllık yem bitkisi',
      img: 'assets/plants/sainfoin.jpg',
      season: 'İlkbahar veya sonbahar', sow: 'Mart - Nisan; uygun yörede Ağustos - Eylül', sowTiming: 'Yabancı ot baskısı düşük, iyi hazırlanmış tarlaya; yöre ve toprak tavına göre ekilir.',
      harvest: 'İlk biçim: Mayıs - Haziran; sonraki biçimler gelişime göre', harvestTiming: 'Kaliteli ot için çiçeklenme başlangıcında biçilir; bitkinin yeniden gelişmesi için uygun yükseklik bırakılır.',
      duration: 'Çok yıllık; verimli kullanım çoğunlukla 3 - 5 yıl', climate: 'Kurak ve yarı kurak iklime, soğuğa ve kireçli toprağa dayanıklıdır.',
      regions: 'Malatya: Akçadağ, Darende, Hekimhan ve kuru yamaç alanları. Türkiye: Erzurum, Sivas, Yozgat, Kayseri ve İç Anadolu.',
      water: 'Düşük; kuruluş döneminde nem, biçim sonrası yağış yararlıdır', temp: 'Serin-ılıman iklime uyumlu; çeşit ve rakıma göre değişir',
      soil: 'Kireçli, derin ve iyi drene toprak; su göllenmesi uygun değildir.',
      summary: 'Proteinli kaba yem üretir; meraya ve kurak alanların yem bitkisi ekim nöbetine uygundur.',
      tips: 'Yavaş tesis olduğu için ilk yıl yabancı ot kontrolü önemlidir. Biçim zamanını hayvan besleme amacı ve yerel gelişime göre ayarlayın.',
      market: 'Balyalı ot tüccarları, kooperatifler, besi ve süt işletmeleri. Alıcıyı yakın çevrede arayın; taşıma maliyeti ve balya nemi satış fiyatını belirler.'
    },
    {
      id: 'sugar-beet', name: 'Şeker Pancarı', category: 'Endüstri Bitkisi', group: 'field', type: 'Sözleşmeli endüstri bitkisi',
      img: 'assets/plants/sugar-beet.webp',
      season: 'İlkbahar', sow: 'Mart - Nisan (toprak tavı ve ısısına göre)', sowTiming: 'İşlenebilir tavda, toprak ısındığında; fabrika kotası, tohum ve teslim planı netleşmeden ekilmemelidir.',
      harvest: 'Eylül - Kasım (fabrika kampanya takvimine göre)', harvestTiming: 'Fabrikanın söküm ve teslim programına göre; pancar sökümü ve nakliye aynı plan içinde yürütülür.',
      duration: 'Yaklaşık 6 - 8 ay', climate: 'Ilıman gelişme dönemi, yeterli güneş ve uzun kök gelişme süresi ister.',
      regions: 'Malatya’da yalnızca alım kotası, fabrika sevki ve su imkânı yazılı olarak doğrulanırsa düşünülmeli. Türkiye: Konya, Eskişehir, Afyonkarahisar, Yozgat ve Amasya.',
      water: 'Orta - yüksek; düzenli su ve drenaj gerekir', temp: 'Yaklaşık 15 - 25 °C',
      soil: 'Derin, taşsız, verimli ve iyi drene toprak.',
      summary: 'Şeker fabrikasına işlenmek üzere teslim edilen, alımı çoğunlukla kota ve sözleşmeyle yürüyen üründür.',
      tips: 'Ekimden önce fabrikanın pancar ekim sözleşmesi, kota, polar şeker, fire, nakliye ve teslim koşullarını yazılı alın; münavebeyi gözetin.',
      market: 'Şeker fabrikaları ve fabrika ile sözleşmeli üretim organizasyonları temel alıcıdır. Malatya Şeker Fabrikası ve bölgesel kampanya/ekim alanı şartları güncel olarak teyit edilmeden alıcı garantisi varsaymayın.'
    },
    {
      id: 'alfalfa', name: 'Yonca', category: 'Yem Bitkisi', group: 'field', type: 'Çok yıllık yem bitkisi',
      img: 'assets/plants/alfalfa.jpg',
      season: 'İlkbahar veya sonbahar', sow: 'Mart - Nisan; ılıman yörede Ağustos - Eylül', sowTiming: 'Yabancı ot kontrolü yapılmış, iyi hazırlanmış tohum yatağına yüzlek ekilir.',
      harvest: 'İlk biçim: Mayıs - Haziran; sezonda gelişime göre tekrarlı biçim', harvestTiming: 'Yem kalitesi için tomurcuklanma-çiçeklenme başlangıcında biçilir; biçimler arasında bitkinin toparlanması beklenir.',
      duration: 'Çok yıllık; uygun bakımda 3 - 5 yıl veya daha fazla', climate: 'Güneşli ve ılıman; kış soğuğuna dayanıklıdır, su birikmesi ve aşırı asitli topraktan hoşlanmaz.',
      regions: 'Malatya: Battalgazi, Yazıhan, Yeşilyurt ve sulanabilir alanlar. Türkiye: Konya, Kayseri, Isparta, Bursa ve Erzurum.',
      water: 'Orta - yüksek; sulama varsa biçim sonrası su yönetimi verimi artırır', temp: 'Yaklaşık 15 - 25 °C',
      soil: 'Derin, verimli, iyi drene, nötr-hafif alkali toprak; pH ve drenajı kontrol edin.',
      summary: 'Proteinli kuru ot ve balya üretir; yakın çevredeki hayvancılık işletmeleri için pazarlanabilir.',
      tips: 'Ekim derinliğini düşük tutun; ilk yıl yabancı otlarla mücadele edin. Biçim ve kurutmayı yağış tahminine göre planlayın.',
      market: 'Süt/besi işletmeleri, yem tüccarları, kooperatifler ve balya alıcıları. Malatya’da alıcıya mesafe, balya kalitesi ve nakliye çoğu zaman belirleyicidir.'
    }
  ];

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function createCardHTML(plant) {
    return `
      <article class="plant-card-item" data-id="${plant.id}" tabindex="0" role="button" aria-label="${plant.name} hakkında detayları gör">
        <div class="plant-card-photo" style="background-image: url('${plant.img}')">
          <span class="plant-card-tag">${plant.type}</span>
        </div>
        <div class="plant-card-details">
          <div class="plant-card-title-row">
            <h3>${plant.name}</h3>
            <span class="plant-card-badge-season">${plant.season}</span>
          </div>
          <p class="plant-card-desc">${plant.summary}</p>
          <div class="plant-card-meta">
            <span>🌱 <b>Ekim:</b> ${plant.sow}</span>
            <span>🌾 <b>Hasat:</b> ${plant.harvest}</span>
          </div>
          <span class="plant-card-action-btn">Yetiştirme ve satış bilgileri ↗</span>
        </div>
      </article>
    `;
  }

  function renderCropGroups() {
    const fieldGrid = document.getElementById('field-crops-grid');
    const gardenGrid = document.getElementById('garden-crops-grid');
    if (fieldGrid) fieldGrid.innerHTML = PLANTS_DATA.filter(plant => plant.group === 'field').map(createCardHTML).join('');
    if (gardenGrid) gardenGrid.innerHTML = PLANTS_DATA.filter(plant => plant.group === 'garden').map(createCardHTML).join('');
  }

  function openPlant(plantId) {
    const plant = PLANTS_DATA.find(entry => entry.id === plantId);
    if (plant) showModal(plant);
  }

  function initPlants() {
    renderCropGroups();

    document.addEventListener('click', event => {
      const card = event.target.closest('.plant-card-item');
      if (card) {
        openPlant(card.getAttribute('data-id'));
        return;
      }

      if (event.target.id === 'modal-close-btn' || event.target.closest('#modal-close-btn') || event.target.id === 'plant-modal') {
        closeModal();
      }
    });

    document.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.plant-card-item')) {
        event.preventDefault();
        openPlant(event.target.getAttribute('data-id'));
      }
      if (event.key === 'Escape') closeModal();
    });
  }

  function showModal(plant) {
    const modal = document.getElementById('plant-modal');
    const body = document.getElementById('plant-modal-body');
    if (!modal || !body) return;

    const currentMonth = monthNames[new Date().getMonth()];
    body.innerHTML = `
      <div class="modal-banner" style="background-image: url('${plant.img}')">
        <span class="modal-type-chip">${plant.type}</span>
      </div>
      <div class="modal-info-wrap">
        <div class="modal-header-line">
          <h2>${plant.name}</h2>
          <span class="modal-subtext">${plant.season}</span>
        </div>
        <p class="modal-summary">${plant.summary}</p>

        <div class="modal-spec-grid">
          <div class="spec-box"><span class="spec-label">🌱 Ekim dönemi</span><strong>${plant.sow}</strong><small>${plant.sowTiming}</small></div>
          <div class="spec-box"><span class="spec-label">🌾 Hasat / biçim zamanı</span><strong>${plant.harvest}</strong><small>${plant.harvestTiming}</small></div>
          <div class="spec-box"><span class="spec-label">📆 Üretim süresi</span><strong>${plant.duration}</strong></div>
          <div class="spec-box"><span class="spec-label">💧 Su ihtiyacı</span><strong>${plant.water}</strong></div>
          <div class="spec-box"><span class="spec-label">🌡️ İklim ve sıcaklık</span><strong>${plant.temp}</strong><small>${plant.climate}</small></div>
          <div class="spec-box"><span class="spec-label">🗓️ Bugünkü sezon</span><strong>${currentMonth}</strong><small>${plant.sow.includes(currentMonth) ? 'Bu ay ekim dönemine denk gelebilir; yerel hava ve toprak koşullarını kontrol edin.' : plant.harvest.includes(currentMonth) ? 'Bu ay hasat dönemine denk gelebilir; ürün olgunluğunu ve alıcı takvimini kontrol edin.' : 'Ekim/hasat takvimini ilçe iklimi ve çeşit özellikleriyle doğrulayın.'}</small></div>
        </div>

        <div class="modal-extra-info"><h4>📍 En verimli bölgeler ve şehirler</h4><p>${plant.regions}</p></div>
        <div class="modal-extra-info"><h4>🌍 Toprak isteği</h4><p>${plant.soil}</p></div>
        <div class="modal-extra-info tips-box"><h4>💡 Yetiştirme ve bakım notları</h4><p>${plant.tips}</p></div>
        <div class="modal-extra-info market-box"><h4>🏭 Satış kanalı ve olası alıcılar</h4><p>${plant.market}</p></div>
        <p class="plant-info-disclaimer">Bu takvimler genel aralıktır; çeşit, rakım, hava, toprak ve su koşulları tarihleri değiştirebilir. Fabrika/alıcının güncel kota, sözleşme, fiyat ve teslim şartlarını ekimden önce doğrudan doğrulayın; alım garantisi anlamına gelmez.</p>
      </div>
    `;

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close-btn').focus();
  }

  function closeModal() {
    const modal = document.getElementById('plant-modal');
    if (modal) modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlants);
  } else {
    initPlants();
  }
})();
