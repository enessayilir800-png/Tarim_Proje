// Bitkileri Tanı - Dinamik Bitki Rehberi
(function () {
  const PLANTS_DATA = [
    {
      id: 'wheat', name: 'Buğday', category: 'Tahıl', subgroup: 'Tahıllar', group: 'field', type: 'Kışlık tahıl',
      img: 'assets/plants/wheat.jpg',
      season: 'Kışlık / erken ilkbahar', sow: 'Ekim - Kasım', sowTiming: 'Toprak tavındayken; soğuk yüksek kesimlerde erken, ılıman ovalarda daha geç ekim yapılır.',
      harvest: 'Haziran - Temmuz', harvestTiming: 'Başak ve sap sararıp dane sertleştiğinde; yağıştan önce, dane nemi uygunken biçerdöverle hasat edilir.',
      duration: 'Yaklaşık 7 - 9 ay', climate: 'Serin gelişme dönemi, kış soğuğuna dayanıklı çeşit ve dane dolumunda ılık-kuru hava ister.',
      regions: 'İç Anadolu (Konya, Ankara), Trakya ve Güneydoğu Anadolu.',
      water: 'Orta; yağış yetersizse sapa kalkma ve başaklanmada destek sulama', temp: 'Gelişme için yaklaşık 10 - 22 °C',
      soil: 'Derin, drenajlı tınlı veya killi-tınlı toprak; su tutan ağır taban arazilerden kaçının.',
      summary: 'Un, bulgur ve yem sanayisinin temel hammaddesi; ekim nöbetinde baklagillerle iyi sonuç verir.',
      tips: 'Sertifikalı ve yöreye uygun çeşidi seçin. Tohum yatağı, ekim sıklığı ve gübreyi toprak analizine göre planlayın; azotu bölerek verin.',
      market: 'TMO alım noktaları (açıklanan alım şartlarıyla), lisanslı depolar, un ve yem fabrikaları, tüccarlar ve kooperatifler. Malatya ve çevresinde alıcı/teslim koşullarını ekimden önce teyit edin.'
    },
    {
      id: 'barley', name: 'Arpa', category: 'Tahıl', subgroup: 'Tahıllar', group: 'field', type: 'Kışlık tahıl / yem-malt',
      img: 'assets/plants/barley.jpg',
      season: 'Kışlık', sow: 'Ekim - Kasım', sowTiming: 'Kış sertliği ve rakıma göre ekim tarihi erkene alınabilir; bölge çeşidi ve toprak tavı belirleyicidir.',
      harvest: 'Haziran', harvestTiming: 'Dane sertleşip sap sarardığında; maltlık ürün için alıcının nem ve kalite şartları ayrıca kontrol edilir.',
      duration: 'Yaklaşık 7 - 9 ay', climate: 'Serin iklim ve kışa dayanıklılık; buğdaya göre kuraklığa ve tuzluluğa daha toleranslıdır.',
      regions: 'İç Anadolu, Doğu Anadolu ve Güneydoğu Anadolu.',
      water: 'Düşük - orta; yağışa dayalı üretime uygundur', temp: 'Yaklaşık 8 - 20 °C',
      soil: 'Drenajlı, hafif-orta bünyeli topraklar; taban suyu yüksek tarlalardan kaçının.',
      summary: 'Yemlik, maltlık ve gıda amaçlı değerlendirilen, kurak koşullara dayanıklı bir tahıldır.',
      tips: 'Maltlık üretimde çeşit saflığı ve protein düzeyi alıcı şartlarına uymalıdır. Ekim nöbeti ve yabancı ot takibini ihmal etmeyin.',
      market: 'Yem fabrikaları, malt ve bira sanayisi, TMO alım noktaları, lisanslı depolar ve tüccarlar. Maltlık satış çoğunlukla önceden kalite şartı teyidi gerektirir.'
    },
    {
      id: 'red-lentil', name: 'Kırmızı Mercimek', category: 'Yemeklik Tane Baklagiller', subgroup: 'Yemeklik Tane Baklagiller', group: 'field', type: 'Kışlık baklagil',
      img: 'assets/plants/lentil.jpg',
      season: 'Kışlık', sow: 'Kasım', sowTiming: 'Kırmızı mercimek sonbaharda ekilir; yerel iklim ve çeşide göre ekim zamanı değişebilir.',
      harvest: 'Haziran', harvestTiming: 'Bitkilerin alt kısımları sararıp baklalar olgunlaşınca, dane dökümünü azaltmak için uygun zamanda hasat edilir.',
      duration: 'Yaklaşık 5 - 8 ay', climate: 'Serin-kurak koşullara uyumlu; çiçeklenme ve dane doldurmada aşırı sıcak/kuraklık verimi etkiler.',
      regions: 'Güneydoğu Anadolu (Şanlıurfa, Diyarbakır).',
      water: 'Düşük - orta; çoğunlukla kış yağışından yararlanır', temp: 'Yaklaşık 8 - 23 °C',
      soil: 'Hafif-orta bünyeli, kireçli ve iyi drene toprak.',
      summary: 'Kırmızı veya yeşil dane olarak pazarlanır; kuru tarıma ve münavebeye uygun bir baklagildir.',
      tips: 'Yabancı ot kontrolünü erken yapın; hasat zamanında gecikme dane dökülmesine yol açabilir. Çeşit ve hasat ekipmanını yöreye göre belirleyin.',
      market: 'Bakliyat işleme/paketleme tesisleri, kooperatifler, tüccarlar ve dönemsel TMO alımı. Kırmızı-yeşil tür, dane rengi ve kalite sınıfına göre alıcı değişebilir.'
    },
    {
      id: 'cotton', name: 'Pamuk', category: 'Endüstri (Sanayi) Bitkileri', subgroup: 'Endüstri (Sanayi) Bitkileri', group: 'field', type: 'Endüstri bitkisi',
      img: 'assets/plants/cotton.jpg',
      season: 'Yazlık', sow: 'Nisan - Mayıs (toprak yeterince ısınınca)', sowTiming: 'Don riski geçip toprak ısındıktan sonra ekilir; kısa sezonlu ve serin Malatya ilçeleri için genel olarak uygun değildir.',
      harvest: 'Eylül - Ekim', harvestTiming: 'Kozalar açıldıkça birden fazla toplama yapılabilir; yağış ve çiğ lif kalitesini etkiler.',
      duration: 'Yaklaşık 5 - 7 ay', climate: 'Uzun, sıcak ve donsuz sezon; yüksek ısı toplamı ve sulama suyu gerektirir.',
      regions: 'Güneydoğu Anadolu (Şanlıurfa), Ege (Aydın) ve Akdeniz.',
      water: 'Yüksek; sulama altyapısı ve su tahsisi olmadan ekim risklidir', temp: 'Yaklaşık 20 - 32 °C',
      soil: 'Derin, verimli, alüvyal ve iyi drene olan toprak.',
      summary: 'Lif tekstil sanayisine, çiğit ve küspesi yağ/yem sanayisine gider; sözleşmeli üretim yaygındır.',
      tips: 'Ekimden önce su kaynağını, sezon uzunluğunu ve alım sözleşmesini kesinleştirin. Hasat öncesi ilaçlama ve bekleme süresini ürün etiketine göre yönetin.',
      market: 'Çırçır-prese tesisleri, tekstil ve yağ fabrikaları, üretici birlikleri. Çoğu bölgede çırçır işletmesi ve alım şartı ekimden önce bulunup teyit edilmelidir.'
    },
    {
      id: 'rice', name: 'Çeltik', category: 'Tahıl', subgroup: 'Tahıllar', group: 'field', type: 'Sulu tarla tahılı',
      img: 'assets/plants/rice.webp',
      season: 'Yazlık; sürekli su yönetimi gerektirir', sow: 'Mayıs', sowTiming: 'Toprak sıcaklığı ve su kaynağı uygun olduğunda; ekim öncesi su kullanım izni/planı ve tarla tesviyesi yapılır.',
      harvest: 'Eylül - Ekim', harvestTiming: 'Daneler olgunlaşıp nem uygun düzeye geldiğinde; hasat ve kurutma hızla planlanmalıdır.',
      duration: 'Yaklaşık 4 - 5 ay', climate: 'Sıcak, uzun ve donsuz sezon; kontrollü sulama suyu ve tesviyeli tarla ister.',
      regions: 'Marmara (Edirne, Balıkesir) ve Karadeniz (Samsun).',
      water: 'Çok yüksek; su kaynağı, drenaj ve yasal kullanım koşulları kesinleşmeden ekilmemelidir', temp: 'Yaklaşık 20 - 30 °C',
      soil: 'Su tutabilen, tesviyeli, geçirimsizliği uygun ağır bünyeli toprak.',
      summary: 'Pirinç değirmenlerinde işlenerek sofralık ürüne dönüşür; su yönetimi üretimin belirleyici maliyetidir.',
      tips: 'Ekim öncesi su tahsisi, drenaj, tesviye, çeşit ve çeltik ekim iznini yerel kurumlarla doğrulayın. Malatya’da su kısıtı varsa uygun alternatif ürün seçin.',
      market: 'Çeltik fabrikaları ve pirinç değirmenleri, kooperatifler ve tüccarlar. Teslim öncesi randıman, tane özellikleri, nem ve alım şartlarını alıcıyla görüşün.'
    },
    {
      id: 'dry-bean', name: 'Kuru Fasulye', category: 'Yemeklik Tane Baklagiller', subgroup: 'Yemeklik Tane Baklagiller', group: 'field', type: 'Yemeklik tane baklagil',
      img: 'assets/plants/bean.jpg',
      season: 'Yazlık', sow: 'Nisan - Mayıs', sowTiming: 'İlkbaharda toprak ısındıktan ve don riski geçtikten sonra ekilir; yetiştiricilik çoğunlukla sulama veya yeterli yağış gerektirir.',
      harvest: 'Ağustos - Eylül', harvestTiming: 'Bitkiler ve baklalar sararıp kuruduğunda; dane çatlaması ve dökülmesini azaltacak zamanda hasat edilir.',
      duration: 'Yaklaşık 3 - 4 ay', climate: 'Ilıman-sıcak, don olmayan sezon; çiçeklenmede aşırı sıcak ve düzensiz sulama verimi azaltır.',
      regions: 'İç Anadolu (Niğde, Konya), Karadeniz ve Doğu Anadolu.',
      water: 'Orta; çiçeklenme ve bakla bağlamada düzenli su', temp: 'Yaklaşık 18 - 27 °C',
      soil: 'İyi drene olan, organik maddeli tınlı toprak; su birikmesinden kaçının.',
      summary: 'Kuru dane olarak tüketilir; yöresel pazar, bakliyat paketleme ve gıda sanayisine satılabilir.',
      tips: 'Tohum çeşidini alıcının dane iriliği ve renk tercihine göre belirleyin. Münavebe yapın; hasat ve kurutma ekipmanını önceden ayarlayın.',
      market: 'Bakliyat eleme/paketleme tesisleri, kooperatifler, tüccarlar, yerel pazarlar ve doğrudan tüketici. Alım fiyatı ve kalite sınıfı için ekim öncesi birden fazla alıcıyla görüşün.'
    },
    {
      id: 'vetch', name: 'Fiğ', category: 'Yem Bitkisi', subgroup: 'Baklagil Yem Bitkileri', group: 'forage', type: 'Yemlik baklagil',
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
      id: 'sainfoin', name: 'Korunga', category: 'Yem Bitkisi', subgroup: 'Baklagil Yem Bitkileri', group: 'forage', type: 'Çok yıllık yem bitkisi',
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
      id: 'sugar-beet', name: 'Şeker Pancarı', category: 'Endüstri (Sanayi) Bitkileri', subgroup: 'Endüstri (Sanayi) Bitkileri', group: 'field', type: 'Sözleşmeli endüstri bitkisi',
      img: 'assets/plants/sugar-beet.webp',
      season: 'İlkbahar',       sow: 'Mart - Nisan', sowTiming: 'İşlenebilir tavda, toprak ısındığında; fabrika kotası, tohum ve teslim planı netleşmeden ekilmemelidir.',
      harvest: 'Eylül - Ekim', harvestTiming: 'Fabrikanın söküm ve teslim programına göre; pancar sökümü ve nakliye aynı plan içinde yürütülür.',
      duration: 'Yaklaşık 6 - 8 ay', climate: 'Ilıman gelişme dönemi, yeterli güneş ve uzun kök gelişme süresi ister.',
      regions: 'Malatya’da yalnızca alım kotası, fabrika sevki ve su imkânı yazılı olarak doğrulanırsa düşünülmeli. Türkiye: Konya, Eskişehir, Afyonkarahisar, Yozgat ve Amasya.',
      water: 'Orta - yüksek; düzenli su ve drenaj gerekir', temp: 'Yaklaşık 15 - 25 °C',
      soil: 'Derin, taşsız, verimli ve iyi drene toprak.',
      summary: 'Şeker fabrikasına işlenmek üzere teslim edilen, alımı çoğunlukla kota ve sözleşmeyle yürüyen üründür.',
      tips: 'Ekimden önce fabrikanın pancar ekim sözleşmesi, kota, polar şeker, fire, nakliye ve teslim koşullarını yazılı alın; münavebeyi gözetin.',
      market: 'Şeker fabrikaları ve fabrika ile sözleşmeli üretim organizasyonları temel alıcıdır. Malatya Şeker Fabrikası ve bölgesel kampanya/ekim alanı şartları güncel olarak teyit edilmeden alıcı garantisi varsaymayın.'
    },
    {
      id: 'alfalfa', name: 'Yonca', category: 'Yem Bitkisi', subgroup: 'Baklagil Yem Bitkileri', group: 'forage', type: 'Çok yıllık yem bitkisi',
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

  const guidePlantDefaults = {
    field: {
      duration: 'Yaklaşık 4 - 8 ay; çeşit ve bölgeye göre değişir',
      climate: 'Yetişme dönemi boyunca ürünün sıcaklık, ışık ve yağış isteğine uygun koşullar gerekir.',
      water: 'Ürüne ve yağışa göre düşükten yükseğe değişir; su planı ekim öncesinde yapılmalıdır.',
      temp: 'İklim ve sıcaklık isteği çeşide, gelişme dönemine ve bölgeye göre değişir',
      soil: 'İyi drenajlı, yapısı ve besin durumu ürünün isteğine uygun tarla toprağı; toprak analizi önerilir.'
    },
    orchard: {
      duration: 'Çok yıllık; verime yatma süresi anaç, çeşit ve bakıma göre değişir',
      climate: 'Işık, kış soğuklaması ve ilkbahar donu riski tür ve çeşide göre değerlendirilmelidir.',
      water: 'Kuruluş döneminde ve meyve gelişiminde düzenli su; sulama miktarı toprak ve iklime göre ayarlanmalıdır.',
      temp: 'Ilıman iklim; don ve sıcaklık isteği türe göre değişir',
      soil: 'Derin, verimli ve iyi drene olan tınlı toprak; taban suyu yüksek alanlardan kaçınılmalıdır.'
    },
    vegetable: {
      duration: 'Yaklaşık 2 - 6 ay; tür, çeşit ve yetiştirme sistemine göre değişir',
      climate: 'Açık alan veya örtüaltı koşulları ürünün sıcaklık ve ışık isteğine göre seçilmelidir.',
      water: 'Düzenli toprak nemi gerekir; su miktarı tür, gelişme dönemi ve yetiştirme sistemine göre ayarlanmalıdır.',
      temp: 'Ilıman veya sıcak dönem; türe göre değişir',
      soil: 'Organik maddesi yeterli, verimli ve iyi drene olan tınlı toprak.'
    },
    vine: {
      duration: 'Çok yıllık; verime yatma süresi fidan, çeşit ve terbiye sistemine göre değişir',
      climate: 'Güneşli ve uzun bir gelişme dönemi ister; don riski ve bölgesel olgunlaşma zamanı dikkate alınmalıdır.',
      water: 'Kuruluş döneminde ve gerektiğinde düzenli su; aşırı sulama ve su göllenmesinden kaçınılmalıdır.',
      temp: 'Ilıman-sıcak iklim; çeşit ve rakıma göre değişir',
      soil: 'İyi drene olan, kök gelişimine elverişli tınlı veya kumlu-tınlı toprak.'
    },
    medicinal: {
      duration: 'Türüne göre tek veya çok yıllık; 1. veya 2. yıldan itibaren etken madde hasadı yapılır',
      climate: 'Bol güneşli ve havadar iklim; etken madde ve uçucu yağ birikimi için yüksek güneşlenme ister.',
      water: 'Düşük - orta; aşırı sulama ve su göllenmesi kök çürüklüğüne ve etken madde kaybına yol açar.',
      temp: 'Ilıman - sıcak iklim; gelişme ve çiçeklenme dönemi için yaklaşık 16 - 28 °C',
      soil: 'Geçirgen, tınlı-kireçli ve iyi havalanan toprak; taban suyu düşük araziler uygundur.'
    },
    aromatic: {
      duration: 'Çoğunlukla çok yıllık yarı çalı; tesis edildikten sonra 8 - 12 yıl boyunca verim verir',
      climate: 'Akdeniz tipi bol güneşli ve sıcak iklim; aromatik bileşenlerin ve koku kalitesinin garantisidir.',
      water: 'Düşük - orta; kuraklığa yüksek dayanıklıdır, çiçek öncesi destek sulama yeterlidir.',
      temp: 'Sıcak ve ılıman iklim; gelişme dönemi için yaklaşık 18 - 30 °C',
      soil: 'Hafif-orta bünyeli, taşlı, kireççe zengin ve süzek toprak; aşırı nemden kaçınılmalıdır.'
    },
    forage: {
      duration: 'Tek yıllık (fiğ, yem bezelyesi) veya çok yıllık (yonca, korunga: 3 - 5+ yıl)',
      climate: 'Geniş iklim adaptasyonu; kış soğuklarına ve kuraklığa dayanıklı çeşitler mevcuttur.',
      water: 'Orta - yüksek; düzenli sulamayla yılda 3 ila 6 biçim yüksek verim alınabilir.',
      temp: 'Gelişme için yaklaşık 12 - 25 °C',
      soil: 'Derin, geçirgen, kireçli veya tınlı toprak; taban suyu drenajı iyi olmalıdır.'
    }
  };

  function createGuidePlant(product) {
    const defaults = guidePlantDefaults[product.kind] || guidePlantDefaults.field;
    const isPerennial = product.kind === 'orchard' || product.kind === 'vine' || product.perennial;
    const plantingLabel = product.plantingLabel || (isPerennial ? 'Fidan/çelik/fide dikimi' : 'Ekim dönemi');
    return {
      id: product.id,
      name: product.name,
      category: product.subgroup,
      subgroup: product.subgroup,
      group: product.group,
      type: product.type || product.subgroup,
      img: product.img || '',
      imageCredit: product.imageCredit || '',
      imageSource: product.imageSource || '',
      season: product.season,
      sow: product.sow,
      plantingLabel,
      sowTiming: product.sowTiming,
      harvest: product.harvest,
      harvestTiming: product.harvestTiming || 'Takvim bölge ve çeşide göre değişebilir; ürün olgunluğuna ve yerel üretim takvimine göre hasat edin.',
      duration: product.duration || defaults.duration,
      climate: product.climate || defaults.climate,
      regions: product.regions,
      water: product.water || defaults.water,
      temp: product.temp || defaults.temp,
      soil: product.soil || defaults.soil,
      summary: product.summary,
      tips: product.tips || 'Ekim/dikim tarihini ilçe iklimi, rakım, çeşit ve toprak koşullarına göre yerel tarım danışmanlığıyla doğrulayın. Sulama, gübreleme ve bitki koruma uygulamalarını toprak analizi ve ürün etiketine göre planlayın.',
      market: product.market || 'Satış kanalı ürünün çeşidine, kalite sınıfına ve yöresel alıcıya göre değişir. Hasattan önce alıcı, teslim standardı, ambalaj ve nakliye koşullarını araştırın.'
    };
  }

  const seasonalGuidePlants = [
    { id: 'corn', name: 'Mısır (Dane)', group: 'field', subgroup: 'Tahıllar', kind: 'field', img: 'assets/plants/corn.jpg', season: 'Yazlık', sow: 'Nisan - Mayıs', sowTiming: 'Toprak ısındığında, ilkbahar donları geçtikten sonra ekilir.', harvest: 'Ağustos - Ekim', regions: 'Akdeniz (Çukurova), Güneydoğu Anadolu ve Ege’de sulu tarım alanları.', summary: 'Dane mısır; yem, nişasta ve gıda sanayisinde kullanılan önemli bir sıcak iklim tahılıdır.' },
    { id: 'oats', name: 'Yulaf', group: 'field', subgroup: 'Tahıllar', kind: 'field', img: 'assets/plants/oats.jpg', season: 'Kışlık veya ilkbaharlık', sow: 'Ekim - Kasım', sowTiming: 'Sonbaharda ekilir; yöre ve çeşide göre ilkbahar ekimi de yapılabilir.', harvest: 'Temmuz - Ağustos', regions: 'Marmara ve Karadeniz; serin ve nemli yöreler.', summary: 'Yulaf; tane, kaba yem ve yeşil ot amacıyla yetiştirilen serin iklim tahılıdır.' },
    { id: 'rye', name: 'Çavdar', group: 'field', subgroup: 'Tahıllar', kind: 'field', img: 'assets/plants/rye.jpg', season: 'Kışlık', sow: 'Ekim - Kasım', sowTiming: 'Sonbaharda, yöreye uygun ekim zamanı ve tohum yatağında ekilir.', harvest: 'Temmuz - Ağustos', regions: 'İç Anadolu ve soğuk-yüksek kesimler; verimliliği düşük topraklara uyumludur.', summary: 'Çavdar; ekmeklik tane ve hayvan yemi için değerlendirilen, soğuğa dayanıklı bir tahıldır.' },
    { id: 'green-lentil', name: 'Yeşil Mercimek', group: 'field', subgroup: 'Yemeklik Tane Baklagiller', kind: 'field', img: 'assets/plants/lentil.jpg', season: 'İlkbaharlık', sow: 'Mart', sowTiming: 'İlkbaharda toprak tavına geldiğinde ekilir.', harvest: 'Temmuz - Ağustos', regions: 'İç Anadolu; özellikle Yozgat, Çorum ve Kırşehir.', summary: 'Yeşil mercimek, bitkisel protein kaynağı ve kuru tarıma uygun bir yemeklik tane baklagildir.' },
    { id: 'chickpea', name: 'Nohut', group: 'field', subgroup: 'Yemeklik Tane Baklagiller', kind: 'field', img: 'assets/plants/chickpea.jpg', season: 'İlkbaharlık', sow: 'Mart - Nisan', sowTiming: 'Toprak işlenebilir hâle geldiğinde ilkbaharda ekilir.', harvest: 'Temmuz - Ağustos', regions: 'İç Anadolu, Ege ve Güneydoğu Anadolu.', summary: 'Nohut; kurak koşullara dayanıklı, gıda ve bakliyat sanayisinde değerlendirilen bir baklagildir.' },
    { id: 'sunflower', name: 'Ayçiçeği (Yağlık)', group: 'field', subgroup: 'Endüstri (Sanayi) Bitkileri', kind: 'field', img: 'assets/plants/sunflower.jpg', season: 'Yazlık', sow: 'Nisan', sowTiming: 'İlkbaharda toprak tavı ve sıcaklığı uygun olduğunda ekilir.', harvest: 'Ağustos - Eylül', regions: 'Marmara (Tekirdağ, Edirne), İç Anadolu ve Karadeniz.', summary: 'Ayçiçeği tohumu yağ üretiminde, küspesi ise yem sanayisinde değerlendirilir.' },
    { id: 'tobacco', name: 'Tütün', group: 'field', subgroup: 'Endüstri (Sanayi) Bitkileri', kind: 'field', img: 'assets/plants/tobacco.jpg', season: 'İlkbahar dikimi', sow: 'Nisan - Mayıs', sowTiming: 'Fideler ilkbaharda, don tehlikesi geçtikten sonra tarlaya dikilir.', harvest: 'Temmuz - Ağustos', regions: 'Ege (Manisa, Denizli), Karadeniz (Samsun) ve Güneydoğu Anadolu.', summary: 'Tütün, yaprakları sanayide işlenen bir endüstri bitkisidir; üretimi izin ve sözleşme koşullarına bağlı olabilir.' },
    { id: 'potato', name: 'Patates (Yumru)', group: 'field', subgroup: 'Endüstri (Sanayi) Bitkileri', kind: 'field', img: 'assets/plants/potato.jpg', season: 'İlkbahar veya yazlık', sow: 'Mart - Nisan', sowTiming: 'Tohumluk yumrular uygun tavdaki toprağa dikilir; don ve aşırı sıcak dönemlerden kaçınılır.', harvest: 'Yaz ve sonbahar', regions: 'İç Anadolu (Niğde, Nevşehir) ve Ege (Ödemiş).', summary: 'Patates, yumruyla çoğaltılan ve sofralık tüketim ile gıda sanayisinde kullanılan bir tarla bitkisidir.' },
    { id: 'rapeseed', name: 'Kanola', group: 'field', subgroup: 'Endüstri (Sanayi) Bitkileri', kind: 'field', img: 'assets/plants/rapeseed.jpg', season: 'Kışlık', sow: 'Eylül - Ekim', sowTiming: 'Sonbaharda, kışı güvenle geçirecek gelişmeyi sağlayacak dönemde ekilir.', harvest: 'Haziran - Temmuz', regions: 'Marmara Bölgesi, özellikle Trakya.', summary: 'Kanola tohumu bitkisel yağ üretiminde, yan ürünü ise yem sanayisinde değerlendirilir.' },
    { id: 'apple', name: 'Elma', group: 'garden', subgroup: 'Meyvecilik', kind: 'orchard', img: 'assets/plants/apple.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kasım - Mart', sowTiming: 'Fidanlar kış dinlenmesinde, don olmayan ve toprağın işlenebilir olduğu dönemde dikilir.', harvest: 'Eylül - Ekim', regions: 'Göller Yöresi (Isparta) ve İç Anadolu (Karaman, Niğde).', summary: 'Elma, taze tüketim ve işleme sanayisi için yetiştirilen, kış soğuklaması isteyen ılıman iklim meyvesidir.' },
    { id: 'apricot', name: 'Kayısı', group: 'garden', subgroup: 'Meyvecilik', kind: 'orchard', img: 'assets/plants/apricot.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kasım - Mart', sowTiming: 'Fidanlar kış dinlenmesinde dikilir; ilkbahar geç don riski olan yerler değerlendirilmelidir.', harvest: 'Haziran - Temmuz', regions: 'Doğu Anadolu (Malatya) ve Akdeniz (Mersin-Mut).', summary: 'Kayısı taze tüketim ve kurutmalık üretimde değerlendirilen, çiçeklenme döneminde ilkbahar donlarına duyarlı bir meyvedir.' },
    { id: 'fig', name: 'İncir', group: 'garden', subgroup: 'Meyvecilik', kind: 'orchard', img: 'assets/plants/fig.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kasım - Mart', sowTiming: 'Fidanlar kış dinlenmesinde, don riski ve toprak koşulları gözetilerek dikilir.', harvest: 'Ağustos - Eylül', regions: 'Ege Bölgesi, özellikle Aydın ve İzmir.', summary: 'İncir; taze veya kuru meyve olarak pazarlanan, sıcak ve ılıman iklime uyumlu bir meyvedir.' },
    { id: 'cherry', name: 'Kiraz', group: 'garden', subgroup: 'Meyvecilik', kind: 'orchard', img: 'assets/plants/cherry.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kasım - Mart', sowTiming: 'Fidanlar kış dinlenmesinde dikilir; uygun tozlayıcı çeşit ve don riski dikkate alınır.', harvest: 'İlkbahar sonu - yaz başı', regions: 'Ege (İzmir-Kemalpaşa), İç Anadolu ve Marmara.', summary: 'Kiraz, taze tüketim ve ihracat değeri yüksek; çeşit ve tozlanma planı gerektiren bir meyvedir.' },
    { id: 'peach', name: 'Şeftali', group: 'garden', subgroup: 'Meyvecilik', kind: 'orchard', img: 'assets/plants/peach.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kasım - Mart', sowTiming: 'Fidanlar kış dinlenmesinde, don olmayan dönemde dikilir.', harvest: 'Temmuz - Ağustos', regions: 'Marmara (Bursa, Çanakkale) ve Akdeniz (Mersin).', summary: 'Şeftali, sofralık ve işlenmiş ürün olarak tüketilen, düzenli budama ve sulama isteyen bir meyvedir.' },
    { id: 'nectarine', name: 'Nektarin', group: 'garden', subgroup: 'Meyvecilik', kind: 'orchard', img: 'assets/plants/nectarine.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kasım - Mart', sowTiming: 'Fidanlar kış dinlenmesinde, don olmayan dönemde dikilir.', harvest: 'Temmuz - Ağustos', regions: 'Marmara (Bursa, Çanakkale) ve Akdeniz (Mersin).', summary: 'Nektarin, tüysüz kabuklu sert çekirdekli bir meyvedir; sofralık ve işleme amacıyla yetiştirilir.' },
    { id: 'hazelnut', name: 'Fındık', group: 'garden', subgroup: 'Sert Kabuklu Meyveler', kind: 'orchard', img: 'assets/plants/hazelnut.jpg', season: 'Çok yıllık çalı formunda meyve', sow: 'Kış dinlenmesi', sowTiming: 'Ocak - Şubat döneminde, don olmayan günlerde dikim yapılabilir.', harvest: 'Ağustos', regions: 'Karadeniz (Ordu, Giresun, Trabzon) ve Sakarya.', summary: 'Fındık, çerez ve gıda sanayisinde kullanılan önemli bir sert kabuklu meyvedir.' },
    { id: 'pistachio', name: 'Antep Fıstığı', group: 'garden', subgroup: 'Sert Kabuklu Meyveler', kind: 'orchard', img: 'assets/plants/pistachio.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kış dinlenmesi', sowTiming: 'Fidanlar kış dinlenmesinde, don olmayan ve toprağın işlenebilir olduğu dönemde dikilir.', harvest: 'Eylül başı', regions: 'Güneydoğu Anadolu (Gaziantep, Şanlıurfa, Siirt).', summary: 'Antep fıstığı kurak ve sıcak koşullara uyumlu, erkek-tozlayıcı ve dişi ağaç planlaması gerektiren bir meyvedir.' },
    { id: 'walnut', name: 'Ceviz', group: 'garden', subgroup: 'Sert Kabuklu Meyveler', kind: 'orchard', img: 'assets/plants/walnut.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kış dinlenmesi', sowTiming: 'Fidanlar kış dinlenmesinde, don olmayan dönemde dikilir.', harvest: 'Eylül - Ekim', regions: 'İç Anadolu (Kaman), Ege (Denizli) ve Marmara.', summary: 'Ceviz, taze ve kuru tüketimin yanı sıra gıda sanayisinde değerlendirilen sert kabuklu bir meyvedir.' },
    { id: 'almond', name: 'Badem', group: 'garden', subgroup: 'Sert Kabuklu Meyveler', kind: 'orchard', img: 'assets/plants/almond.jpg', season: 'Çok yıllık meyve ağacı', sow: 'Kış dinlenmesi', sowTiming: 'Fidanlar kış dinlenmesinde, geç don riski ve yöre koşulları dikkate alınarak dikilir.', harvest: 'Ağustos - Eylül', regions: 'Akdeniz, Ege (Datça) ve Güneydoğu Anadolu.', summary: 'Badem, sıcak ve kuraklığa görece dayanıklı; erken çiçeklenmesi nedeniyle ilkbahar donlarına hassas bir meyvedir.' },
    { id: 'orange', name: 'Portakal', group: 'garden', subgroup: 'Turunçgiller (Narenciye)', kind: 'orchard', img: 'assets/plants/orange.jpg', season: 'Çok yıllık, herdemyeşil meyve ağacı', sow: 'İlkbahar (don riski sonrası)', sowTiming: 'Fidanlar ilkbaharda, don tehlikesi geçtikten sonra dikilir.', harvest: 'Kasım - Şubat', regions: 'Akdeniz (Antalya, Adana, Mersin) ve Ege (Muğla).', summary: 'Portakal, taze tüketim ve meyve suyu sanayisinde değerlendirilen, dona duyarlı bir turunçgildir.' },
    { id: 'mandarin', name: 'Mandalina', group: 'garden', subgroup: 'Turunçgiller (Narenciye)', kind: 'orchard', img: 'assets/plants/mandarin.jpg', season: 'Çok yıllık, herdemyeşil meyve ağacı', sow: 'İlkbahar (don riski sonrası)', sowTiming: 'Fidanlar ilkbaharda, don tehlikesi geçtikten sonra dikilir.', harvest: 'Sonbahar sonu - kış', regions: 'Akdeniz (Hatay, Adana) ve Ege (İzmir-Seferihisar).', summary: 'Mandalina, taze tüketilen ve erkenci-geççi çeşitleriyle hasadı mevsime yayılan bir turunçgildir.' },
    { id: 'lemon', name: 'Limon', group: 'garden', subgroup: 'Turunçgiller (Narenciye)', kind: 'orchard', img: 'assets/plants/lemon.jpg', season: 'Çok yıllık, herdemyeşil meyve ağacı', sow: 'İlkbahar (don riski sonrası)', sowTiming: 'Fidanlar ilkbaharda, don tehlikesi geçtikten sonra dikilir.', harvest: 'Kış boyunca', regions: 'Akdeniz, özellikle Mersin-Erdemli ve Adana.', summary: 'Limon, taze tüketim ve gıda işleme için yetiştirilen; soğuğa duyarlı bir turunçgil meyvesidir.' },
    { id: 'seedless-grape', name: 'Çekirdeksiz Üzüm', group: 'garden', subgroup: 'Bağcılık', kind: 'vine', img: 'assets/plants/grape.jpg', season: 'Çok yıllık odunsu asma', sow: 'Kış - erken ilkbahar', sowTiming: 'Asma çeliği veya fidanı, yöreye ve dikim materyaline uygun dönemde dikilir.', harvest: 'Ağustos - Eylül', regions: 'Ege (Manisa, İzmir, Denizli).', summary: 'Çekirdeksiz üzüm sofralık ve kurutmalık olarak değerlendirilir; terbiye ve budama sistemi önemlidir.' },
    { id: 'wine-table-grape', name: 'Şıralık / Sofralık Üzüm', group: 'garden', subgroup: 'Bağcılık', kind: 'vine', img: 'assets/plants/table-grape.jpg', season: 'Çok yıllık odunsu asma', sow: 'Kış - erken ilkbahar', sowTiming: 'Asma çeliği veya fidanı, yöreye ve dikim materyaline uygun dönemde dikilir.', harvest: 'Eylül - Ekim', regions: 'Güneydoğu Anadolu (Diyarbakır, Gaziantep) ve İç Anadolu.', summary: 'Üzüm; sofralık tüketim, şıra ve pekmez üretimi için yetiştirilir; kullanım amacı çeşit seçimini belirler.' },
    { id: 'tomato', name: 'Domates', group: 'vegetable', subgroup: 'Sebzecilik (Meyvesi Yenenler)', kind: 'vegetable', img: 'assets/plants/tomato.jpg', season: 'Yazlık; örtüaltında sezon uzatılabilir', sow: 'Nisan - Mayıs (ekim / fide dikimi)', sowTiming: 'Açık alanda fide dikimi ilkbaharda don riski geçince yapılır; örtüaltında takvim değişir.', harvest: 'Yaz boyunca - sonbahar', regions: 'Akdeniz’de sera üretimi; Ege, Marmara ve İç Anadolu’da açık alan üretimi.', summary: 'Domates, taze tüketim ve salça gibi işlenmiş ürünler için yetiştirilen yaygın bir sebzedir.' },
    { id: 'pepper', name: 'Biber', group: 'vegetable', subgroup: 'Sebzecilik (Meyvesi Yenenler)', kind: 'vegetable', img: 'assets/plants/pepper.jpg', season: 'Yazlık; örtüaltında sezon uzatılabilir', sow: 'Nisan - Mayıs (ekim / fide dikimi)', sowTiming: 'Fideler ilkbaharda, don riski geçip toprak ısındıktan sonra dikilir.', harvest: 'Yaz boyunca - sonbahar', regions: 'Akdeniz’de sera üretimi; Ege, Marmara ve İç Anadolu’da açık alan üretimi.', summary: 'Biber taze, kurutulmuş veya işlenmiş olarak değerlendirilir; sıcak ve güneşli gelişme dönemi ister.' },
    { id: 'eggplant', name: 'Patlıcan', group: 'vegetable', subgroup: 'Sebzecilik (Meyvesi Yenenler)', kind: 'vegetable', img: 'assets/plants/eggplant.jpg', season: 'Yazlık sebze', sow: 'Nisan - Mayıs (fide dikimi)', sowTiming: 'Toprak ısındıktan sonra, ilkbahar don tehlikesi geçince dikilir.', harvest: 'Temmuz - Ekim', regions: 'Akdeniz (Antalya), Ege (Aydın) ve Marmara (Bursa).', summary: 'Sıcak iklim sebzesidir; taze tüketim, kurutmalık ve konserve sanayisinde geniş pazar bulur.' },
    { id: 'cucumber', name: 'Hıyar / Salatalık', group: 'vegetable', subgroup: 'Sebzecilik (Kabakgiller)', kind: 'vegetable', img: 'assets/plants/cucumber.jpg', season: 'İlkbahar ve yaz', sow: 'Nisan - Mayıs (örtüaltında erken)', sowTiming: 'Ilık toprak tavında tohum ekilir veya fide dikilir; düzenli sulanmalıdır.', harvest: 'Haziran - Eylül', regions: 'Akdeniz (Antalya, Mersin sera), Ege ve Marmara.', summary: 'Su oranı yüksek, sofralık taze tüketim ve turşuluk sanayisi için üretilen kabakgil sebzesidir.' },
    { id: 'melon', name: 'Kavun', group: 'vegetable', subgroup: 'Sebzecilik (Kabakgiller)', kind: 'vegetable', img: 'assets/plants/melon.jpg', season: 'Yazlık', sow: 'Mart - Mayıs', sowTiming: 'İlkbaharda toprak ısındıktan sonra doğrudan ekilir veya fide dikilir.', harvest: 'Haziran - Ağustos', regions: 'Akdeniz (Adana), Güneydoğu Anadolu (Diyarbakır) ve Ege.', summary: 'Kavun, sıcak iklimde yetiştirilen ve taze tüketilen bir kabakgil sebzesidir.' },
    { id: 'watermelon', name: 'Karpuz', group: 'vegetable', subgroup: 'Sebzecilik (Kabakgiller)', kind: 'vegetable', img: 'assets/plants/watermelon.jpg', season: 'Yazlık', sow: 'Mart - Mayıs', sowTiming: 'İlkbaharda toprak ısındıktan sonra doğrudan ekilir veya fide dikilir.', harvest: 'Haziran - Ağustos', regions: 'Akdeniz (Adana), Güneydoğu Anadolu (Diyarbakır) ve Ege.', summary: 'Karpuz, sıcak ve uzun bir yetişme dönemi isteyen; taze tüketim değeri yüksek bir üründür.' },
    { id: 'onion', name: 'Soğan', group: 'vegetable', subgroup: 'Sebzecilik (Yumru ve Soğansı)', kind: 'vegetable', img: 'assets/plants/onion.jpg', season: 'İlkbahar veya sonbahar ekimi', sow: 'Mart (ilkbahar) / sonbahar', sowTiming: 'Tohum, arpacık veya fideyle üretim yöntemine ve bölgeye göre ekilir.', harvest: 'Temmuz - Ağustos', regions: 'İç Anadolu (Ankara, Amasya) ve Marmara.', summary: 'Soğan, taze ve kuru tüketim ile gıda sanayisinde kullanılan temel bir sebzedir.' },
    { id: 'garlic', name: 'Sarımsak', group: 'vegetable', subgroup: 'Sebzecilik (Yumru ve Soğansı)', kind: 'vegetable', img: 'assets/plants/garlic.jpg', season: 'Sonbaharlık', sow: 'Ekim - Kasım', sowTiming: 'Dişler sonbaharda, iyi drene olan toprağa dikilir.', harvest: 'Haziran - Temmuz', regions: 'Karadeniz (Kastamonu-Taşköprü) ve Güneydoğu Anadolu.', summary: 'Sarımsak, dişleriyle çoğaltılan ve taze ya da kuru olarak tüketilen bir sebzedir.' },
    { id: 'sage', name: 'Tıbbi Adaçayı', group: 'medicinal', subgroup: 'Tıbbi Bitkiler', kind: 'medicinal', img: 'assets/plants/sage.jpg', season: 'Çok yıllık şifalı çalı', sow: 'Mart - Nisan (fide/çelik)', sowTiming: 'Fideler ilkbaharda taşsız, süzek toprağa dikilir.', harvest: 'Mayıs - Eylül (çiçeklenme öncesi)', regions: 'Ege (İzmir, Muğla) ve Akdeniz kuşağı.', summary: 'Uçucu yağı ve yaprakları bitkisel çay, gargara, gıda takviyesi ve fitoterapi sanayisinde aranan tıbbi türdür.' },
    { id: 'st-johns-wort', name: 'Sarı Kantaron', group: 'medicinal', subgroup: 'Tıbbi Bitkiler', kind: 'medicinal', img: 'assets/plants/st-johns-wort.jpg', season: 'Çok yıllık otsu tıbbi bitki', sow: 'Mart - Nisan veya Sonbahar', sowTiming: 'İyi işlenmiş, süzek tohum yatağına yüzlek ekilir ya da fide dikilir.', harvest: 'Haziran - Temmuz (tam çiçeklenme)', regions: 'Ege, Marmara, Akdeniz ve Doğu Anadolu yaylaları.', summary: 'Hiperisin etken maddeli çiçekleri zeytinyağında maserasyon yağı yapılarak ve fitofarmaside değerlendirilir.' },
    { id: 'echinacea', name: 'Ekinezya', group: 'medicinal', subgroup: 'Tıbbi Bitkiler', kind: 'medicinal', img: 'assets/plants/echinacea.jpg', season: 'Çok yıllık otsu tıbbi bitki', sow: 'Mart - Nisan', sowTiming: 'İlkbaharda don riski geçince tarlaya fide olarak şaşırtılır.', harvest: 'Temmuz - Ağustos', regions: 'Ege, Marmara ve İç Anadolu sulanabilir arazileri.', summary: 'Bağışıklık güçlendirici bitkisel ilaçlar, pastiller ve şuruplar için kök ve çiçekleri yüksek talep görür.' },
    { id: 'chamomile', name: 'Tıbbi Papatya', group: 'medicinal', subgroup: 'Tıbbi Bitkiler', kind: 'medicinal', img: 'assets/plants/chamomile.jpg', season: 'Tek yıllık otsu tıbbi bitki', sow: 'Eylül - Ekim veya Şubat - Mart', sowTiming: 'Tohumlar çok küçük olduğundan yüzlek ekilir, hafif bastırılır.', harvest: 'Nisan - Mayıs', regions: 'Ege, Akdeniz, İç Anadolu ve Marmara.', summary: 'Mavi kamasulen uçucu yağı ve flavonoidleri tıbbi çay, bebek kozmetiği ve yatıştırıcı ürünlerde kullanılır.' },
    { id: 'lemon-balm', name: 'Melisa (Oğul Otu)', group: 'medicinal', subgroup: 'Tıbbi Bitkiler', kind: 'medicinal', img: 'assets/plants/lemon-balm.jpg', season: 'Çok yıllık otsu tıbbi bitki', sow: 'Mart - Nisan', sowTiming: 'Fide dikimiyle tesis edilir; yarı gölge ve ılık yerleri sever.', harvest: 'Haziran - Ağustos (çiçek açmadan önce)', regions: 'Akdeniz, Ege ve Karadeniz kıyı kuşağı.', summary: 'Limon kokulu yaprakları stres ve uyku destek çaylarında, aromaterapide ve etken madde ekstraksiyonunda değerlendirilir.' },
    { id: 'licorice', name: 'Meyan Kökü', group: 'medicinal', subgroup: 'Tıbbi Kök Bitkileri', kind: 'medicinal', img: 'assets/plants/licorice.jpg', season: 'Çok yıllık derin köklü baklagil', sow: 'İlkbaharda kök çelikleriyle', sowTiming: 'Nemli taban arazilere ve nehir yataklarına dikilir.', harvest: 'Ekim - Kasım (3-4. yıl kök sökümü)', regions: 'Güneydoğu Anadolu (Şanlıurfa, Gaziantep), Çukurova.', summary: 'Glisirizik asit içeren kökleri şerbet sanayisi, ilaç sanayisi ve tütün harmanlarında değerli bir ihracat ürünüdür.' },
    { id: 'lavender', name: 'Tıbbi Lavanta', group: 'aromatic', subgroup: 'Aromatik & Uçucu Yağ', kind: 'aromatic', img: 'assets/plants/lavender.jpg', season: 'Çok yıllık yarı çalımsı aromatik', sow: 'Kasım - Mart (tüplü fide dikimi)', sowTiming: 'Fideler kış dinlenmesinde veya erken ilkbaharda dikilir.', harvest: 'Temmuz - Ağustos', regions: 'Isparta (Kuyucak), Burdur, Afyonkarahisar ve Trakya.', summary: 'Uçucu yağı parfümeri, kozmetik ve aromaterapide küresel talep görür; kıraç ve kireçli yamaçlarda yüksek gelir sağlar.' },
    { id: 'thyme', name: 'Dağ Kekiği / İzmir Kekiği', group: 'aromatic', subgroup: 'Aromatik & Uçucu Yağ', kind: 'aromatic', img: 'assets/plants/thyme.jpg', season: 'Çok yıllık aromatik çalı', sow: 'İlkbahar veya sonbahar (fide dikimi)', sowTiming: 'Süzek, güneş alan yamaç tarlalara fide dikimi yapılır.', harvest: 'Haziran - Temmuz (çiçeklenme başı)', regions: 'Ege (Denizli - Pamukkale), Akdeniz ve Batı Anadolu.', summary: 'Türkiye dünya kekik ticaretinde liderdir; timol ve karvakrolce zengin yaprakları baharat ve distilasyon yağı olarak ihraç edilir.' },
    { id: 'rosemary', name: 'Biberiye', group: 'aromatic', subgroup: 'Aromatik & Uçucu Yağ', kind: 'aromatic', img: 'assets/plants/rosemary.jpg', season: 'Çok yıllık herdemyeşil aromatik çalı', sow: 'İlkbahar (çelik veya fide dikimi)', sowTiming: 'Don riski olmayan, kireçli ve geçirgen yerlere dikilir.', harvest: 'Yılda 2-3 defa taze sürgün hasadı', regions: 'Akdeniz (Mersin, Adana, Antalya) ve Ege kıyıları.', summary: 'Karnozik asit içeren yaprakları doğal gıda koruyucusu, baharat, et marinasyonu ve kozmetikte yoğun talep görür.' },
    { id: 'mint', name: 'Tıbbi Nane (İngiliz Nanesi)', group: 'aromatic', subgroup: 'Aromatik & Uçucu Yağ', kind: 'aromatic', img: 'assets/plants/mint.jpg', season: 'Çok yıllık rizomlu aromatik', sow: 'Mart - Nisan (kök sürgünü/fide)', sowTiming: 'Nemli, organik maddeli toprağa dikilir; düzenli sulama ister.', harvest: 'Haziran - Eylül (yılda 2-3 biçim)', regions: 'Akdeniz, Ege ve Güneydoğu Anadolu sulu arazileri.', summary: 'Yüksek mentol oranına sahip uçucu yağı ve yaprakları şekerleme, sakız, ağız bakım ve ecza sanayisinde kullanılır.' },
    { id: 'basil', name: 'Fesleğen / Mor Reyhan', group: 'aromatic', subgroup: 'Baharat & Çeşni Bitkileri', kind: 'aromatic', img: 'assets/plants/basil.jpg', season: 'Tek yıllık sıcak mevsim aromatiği', sow: 'Nisan - Mayıs (fide dikimi)', sowTiming: 'İlkbahar donları tamamen bittikten sonra sıcak havada dikilir.', harvest: 'Yaz boyunca çiçek tomurcuğunda biçim', regions: 'Malatya (Arapgir mor reyhanı), Ege ve Akdeniz.', summary: 'Yeşil fesleğen ve coğrafi işaretli mor reyhan; şerbet, sos (pesto), baharat ve kurutmalık olarak yüksek katma değer üretir.' },
    { id: 'black-cumin', name: 'Çörek Otu', group: 'aromatic', subgroup: 'Tohum Baharat Bitkileri', kind: 'aromatic', img: 'assets/plants/black-cumin.jpg', season: 'Tek yıllık kışlık/ilkbaharlık', sow: 'Ekim - Kasım veya Şubat - Mart', sowTiming: 'Tohum yatağı iyi ufalanmış tarlaya mibzerle ekilir.', harvest: 'Haziran - Temmuz (kapsüller kahverengileşince)', regions: 'İç Anadolu (Afyonkarahisar, Konya) ve Burdur.', summary: 'Timokinon zengini tohumları ve soğuk sıkım yağı gıda takviyesi, fırıncılık ve doğal tıp alanında yüksek fiyatla alıcı bulur.' },
    { id: 'forage-pea', name: 'Yem Bezelyesi', group: 'forage', subgroup: 'Baklagil Yem Bitkileri', kind: 'forage', img: 'assets/plants/forage-pea.jpg', season: 'Kışlık veya ilkbaharlık yem baklagili', sow: 'Ekim - Kasım veya Mart', sowTiming: 'Tahıllarla (arpa/yulaf) karışık veya yalın ekilir.', harvest: 'Mayıs - Haziran (çiçeklenme sonu / bakla bağlama)', regions: 'İç Anadolu, Trakya, Ege ve Marmara.', summary: 'Tahıllarla mükemmel karışım oluşturan, yüksek proteinli kuru ot ve silaj sağlayan tek yıllık yem baklagilidir.' },
    { id: 'sudan-grass', name: 'Sorgum - Sudan Otu', group: 'forage', subgroup: 'Buğdaygil Yem Bitkileri', kind: 'forage', img: 'assets/plants/sudan-grass.jpg', season: 'Yazlık hızlı gelişen buğdaygil', sow: 'Mayıs - Haziran', sowTiming: 'Toprak sıcaklığı 15 °C üzerine çıktığında ekilir.', harvest: 'Temmuz - Ekim (sezonda 3-4 biçim)', regions: 'Ege, Akdeniz (Çukurova), Güneydoğu ve İç Anadolu sulu arazileri.', summary: 'Kuraklığa ve sıcağa yüksek toleranslı, yaz aylarında bol yeşil ot, kuru ot ve silaj üreten hızlı gelişen yem bitkisidir.' }
  ].map(createGuidePlant);

  PLANTS_DATA.forEach(plant => {
    if (!plant.subgroup) plant.subgroup = plant.category;
    if (!plant.plantingLabel) plant.plantingLabel = 'Ekim dönemi';
  });
  PLANTS_DATA.push(...seasonalGuidePlants);

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function createCardHTML(plant) {
    return `
      <article class="plant-card-item" data-id="${plant.id}" tabindex="0" role="button" aria-label="${plant.name} hakkında detayları gör">
        <div class="plant-card-photo" style="${plant.img ? `background-image: url('${plant.img}')` : 'background-image: linear-gradient(135deg, #e7efe4, #f5f2e7)'}">
          <span class="plant-card-tag">${plant.type}</span>
        </div>
        <div class="plant-card-details">
          <div class="plant-card-title-row">
            <h3>${plant.name}</h3>
            <span class="plant-card-badge-season">${plant.season}</span>
          </div>
          <p class="plant-card-desc">${plant.summary}</p>
          <div class="plant-card-meta">
            <span>🌱 <b>Ekim / dikim:</b> ${plant.sow}</span>
            <span>🌾 <b>Hasat:</b> ${plant.harvest}</span>
          </div>
          <span class="plant-card-action-btn">Yetiştirme ve satış bilgileri ↗</span>
        </div>
      </article>
    `;
  }

  function renderCropGroups() {
    const groups = ['field', 'garden', 'vegetable', 'medicinal', 'aromatic', 'forage'];
    const renderGroup = (container, group) => {
      if (!container) return;
      const subgroupMap = new Map();
      PLANTS_DATA.filter(plant => plant.group === group).forEach(plant => {
        if (!subgroupMap.has(plant.subgroup)) subgroupMap.set(plant.subgroup, []);
        subgroupMap.get(plant.subgroup).push(plant);
      });
      container.innerHTML = Array.from(subgroupMap, ([subgroup, plants]) => `
        <section class="plant-crop-subgroup" aria-label="${subgroup}">
          <h3>${subgroup}</h3>
          <div class="plants-grid">${plants.map(createCardHTML).join('')}</div>
        </section>
      `).join('');
    };
    groups.forEach(group => {
      renderGroup(document.getElementById(`${group}-crops-grid`), group);
    });
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
      <div class="modal-banner" style="${plant.img ? `background-image: url('${plant.img}')` : 'background-image: linear-gradient(135deg, #e7efe4, #f5f2e7)'}">
        <span class="modal-type-chip">${plant.type}</span>
      </div>
      ${plant.imageCredit ? `<p class="plant-image-credit">Fotoğraf: <a href="${plant.imageSource}" target="_blank" rel="noopener noreferrer">${plant.imageCredit}</a></p>` : ''}
      <div class="modal-info-wrap">
        <div class="modal-header-line">
          <h2>${plant.name}</h2>
          <span class="modal-subtext">${plant.season}</span>
        </div>
        <p class="modal-summary">${plant.summary}</p>

        <div class="modal-spec-grid">
          <div class="spec-box"><span class="spec-label">🌱 ${plant.plantingLabel || 'Ekim dönemi'}</span><strong>${plant.sow}</strong><small>${plant.sowTiming}</small></div>
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
        <p class="plant-info-disclaimer">Bu takvimler genel aralıktır; çeşit, rakım, hava, toprak ve su koşulları tarihleri değiştirebilir. Uygulama takvimini yerel koşullar ve güncel üretim önerileriyle doğrulayın.</p>
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
