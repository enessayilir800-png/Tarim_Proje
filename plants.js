// Crop guide - Dynamic crop profiles
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
      id: 'red-lentil', name: 'Red Lentil', category: 'Food Legumes', subgroup: 'Food Legumes', group: 'field', type: 'Winter legume',
      img: 'assets/plants/lentil.jpg',
      season: 'Winter crop', sow: 'November', sowTiming: 'Red lentils are generally planted in autumn; timing varies with local climate and cultivar.',
      harvest: 'June', harvestTiming: 'Harvest when lower plant parts yellow and pods mature, timing operations to reduce seed shattering.',
      duration: 'Approximately 5–8 months', climate: 'Adapted to cool, dry conditions; heat or drought during flowering and seed fill can reduce yield.',
      regions: 'Southeastern Anatolia (Şanlıurfa, Diyarbakır).',
      water: 'Low to moderate; mainly relies on winter rainfall', temp: 'Approximately 8–23 °C',
      soil: 'Light to medium-textured, calcareous, well-drained soil.',
      summary: 'Marketed as red or green seed; a legume suited to dryland farming and crop rotation.',
      tips: 'Control weeds early; delays at harvest can increase seed shattering. Choose cultivars and harvest equipment suited to local conditions.',
      market: 'Pulse processors and packers, cooperatives, traders, and seasonal TMO procurement. Buyers may differ by lentil type, seed color, and grade.'
    },
    {
      id: 'cotton', name: 'Cotton', category: 'Industrial Crops', subgroup: 'Industrial Crops', group: 'field', type: 'Industrial crop',
      img: 'assets/plants/cotton.jpg',
      season: 'Summer crop', sow: 'April–May (after the soil has warmed)', sowTiming: 'Plant after frost risk has passed and the soil has warmed. Cotton is generally unsuitable for Malatya districts with short, cool seasons.',
      harvest: 'September–October', harvestTiming: 'Pickings may be staggered as bolls open; rain and dew can affect fiber quality.',
      duration: 'Approximately 5–7 months', climate: 'Requires a long, hot, frost-free season, substantial heat accumulation, and irrigation water.',
      regions: 'Southeastern Anatolia (Şanlıurfa), Aegean (Aydın), and the Mediterranean region.',
      water: 'High; planting without irrigation infrastructure and a secure water allocation is risky', temp: 'Approximately 20–32 °C',
      soil: 'Deep, fertile, alluvial, well-drained soil.',
      summary: 'Fiber supplies the textile industry, while cottonseed and meal are used for oil and animal feed; contract production is common.',
      tips: 'Confirm water supply, season length, and purchase contract before planting. Follow product labels for pre-harvest treatments and re-entry or pre-harvest intervals.',
      market: 'Ginning and pressing facilities, textile and oil mills, and producer organizations. Identify a gin and confirm purchasing terms before planting.'
    },
    {
      id: 'rice', name: 'Rice', category: 'Cereals', subgroup: 'Cereals', group: 'field', type: 'Irrigated cereal',
      img: 'assets/plants/rice.webp',
      season: 'Summer crop; requires continuous water management', sow: 'May', sowTiming: 'Plant when soil temperature and water supply are suitable. Secure water-use approval, plan irrigation, and level the field before planting.',
      harvest: 'September–October', harvestTiming: 'Harvest when grains mature and moisture is suitable; arrange harvesting and drying promptly.',
      duration: 'Approximately 4–5 months', climate: 'Requires a warm, long, frost-free season, controlled irrigation, and a level field.',
      regions: 'Marmara (Edirne, Balıkesir) and the Black Sea region (Samsun).',
      water: 'Very high; do not plant until water supply, drainage, and legal use conditions are confirmed', temp: 'Approximately 20–30 °C',
      soil: 'Level, heavy-textured soil that retains water and has suitable permeability.',
      summary: 'Processed at rice mills for food markets; water management is a major production cost.',
      tips: 'Confirm water allocation, drainage, leveling, cultivar, and rice-planting permits with local authorities before planting. Where water is limited in Malatya, consider a suitable alternative crop.',
      market: 'Rice processors and mills, cooperatives, and traders. Discuss milling yield, grain characteristics, moisture, and delivery terms with buyers.'
    },
    {
      id: 'dry-bean', name: 'Dry Bean', category: 'Food Legumes', subgroup: 'Food Legumes', group: 'field', type: 'Food legume',
      img: 'assets/plants/bean.jpg',
      season: 'Summer crop', sow: 'April–May', sowTiming: 'Plant after the soil warms and frost risk passes; production usually requires irrigation or adequate rainfall.',
      harvest: 'August–September', harvestTiming: 'Harvest when plants and pods turn yellow and dry, before seeds crack or shatter.',
      duration: 'Approximately 3–4 months', climate: 'Mild to warm, frost-free season; excessive heat during flowering and irregular irrigation can reduce yield.',
      regions: 'Central Anatolia (Niğde, Konya), the Black Sea region, and Eastern Anatolia.',
      water: 'Moderate; provide regular water during flowering and pod set', temp: 'Approximately 18–27 °C',
      soil: 'Well-drained loam with organic matter; avoid waterlogging.',
      summary: 'Consumed as dry seed and sold to local markets, pulse packers, and food processors.',
      tips: 'Choose seed type according to buyer preferences for seed size and color. Rotate crops and arrange harvesting and drying equipment in advance.',
      market: 'Pulse cleaning and packing facilities, cooperatives, traders, local markets, and direct sales. Compare buyers and grades before planting.'
    },
    {
      id: 'vetch', name: 'Vetch', category: 'Forage Crops', subgroup: 'Forage Legumes', group: 'forage', type: 'Forage legume',
      img: 'assets/plants/vetch.jpg',
      season: 'Winter or spring crop, depending on species', sow: 'September–November; February–March in areas with harsh winters', sowTiming: 'Plant winter types in autumn; sow spring vetch when the soil is workable.',
      harvest: 'Green forage: April–May; seed: June–July', harvestTiming: 'Cut for forage at the start of flowering; make hay when weather allows suitable drying.',
      duration: 'Forage harvest in about 5–8 months; 3–4 months for spring types', climate: 'Adapted to cool seasons and moderately drought-tolerant; winter hardiness varies by species.',
      regions: 'Malatya: dryland and semi-arid areas. Türkiye: Central and Eastern Anatolia, the Aegean, and transition zones.',
      water: 'Low to moderate; can rely on rainfall, though soil moisture matters during early growth', temp: 'Approximately 8–22 °C',
      soil: 'Well-drained, light to medium-textured field soils.',
      summary: 'Grown for forage and green fodder; can be sown in mixtures with cereals.',
      tips: 'Ask local agricultural advisers about seeding rates and cereal mix ratios. Rapid drying and baling after cutting help preserve forage quality.',
      market: 'Livestock farms, feed cooperatives, hay traders, and seed buyers. Identify buyers and confirm bale standards and transport before planting.'
    },
    {
      id: 'sainfoin', name: 'Sainfoin', category: 'Forage Crops', subgroup: 'Forage Legumes', group: 'forage', type: 'Perennial forage crop',
      img: 'assets/plants/sainfoin.jpg',
      season: 'Spring or autumn', sow: 'March–April; August–September where conditions are suitable', sowTiming: 'Sow in a well-prepared field with low weed pressure; adjust timing to local conditions and soil moisture.',
      harvest: 'First cut: May–June; later cuts depend on regrowth', harvestTiming: 'Cut at the start of flowering for quality hay, leaving enough stubble for regrowth.',
      duration: 'Perennial; typically productive for 3–5 years', climate: 'Tolerant of dry and semi-arid climates, cold, and calcareous soils.',
      regions: 'Malatya: Akçadağ, Darende, Hekimhan, and dry slopes. Türkiye: Erzurum, Sivas, Yozgat, Kayseri, and Central Anatolia.',
      water: 'Low; moisture during establishment and rainfall after cutting are beneficial', temp: 'Adapted to cool-temperate conditions; varies by cultivar and elevation',
      soil: 'Deep, calcareous, well-drained soil; avoid waterlogging.',
      summary: 'Produces protein-rich forage and suits pastures and forage rotations in dry areas.',
      tips: 'Because establishment is slow, weed control is important in the first year. Set cutting times according to livestock needs and local growth.',
      market: 'Baled-hay traders, cooperatives, beef and dairy farms. Nearby buyers, transport costs, and bale moisture affect selling price.'
    },
    {
      id: 'sugar-beet', name: 'Sugar Beet', category: 'Industrial Crops', subgroup: 'Industrial Crops', group: 'field', type: 'Contract industrial crop',
      img: 'assets/plants/sugar-beet.webp',
      season: 'Spring', sow: 'March–April', sowTiming: 'Plant when the soil is warm and workable. Do not plant until the factory quota, seed supply, and delivery plan are confirmed.',
      harvest: 'September–October', harvestTiming: 'Follow the factory’s lifting and delivery schedule; coordinate beet lifting and transport.',
      duration: 'Approximately 6–8 months', climate: 'Requires a mild growing season, adequate sunlight, and a long period for root development.',
      regions: 'In Malatya, consider only after written confirmation of purchase quota, factory delivery, and water availability. Türkiye: Konya, Eskişehir, Afyonkarahisar, Yozgat, and Amasya.',
      water: 'Moderate to high; needs regular water and good drainage', temp: 'Approximately 15–25 °C',
      soil: 'Deep, stone-free, fertile, well-drained soil.',
      summary: 'Delivered to sugar factories for processing; purchasing is generally managed through quotas and contracts.',
      tips: 'Before planting, obtain written confirmation of the factory contract, quota, sugar content, tare, transport, and delivery terms. Follow crop rotation practices.',
      market: 'Sugar factories and their contract-growing programs are the primary buyers. Confirm current campaign and growing-area requirements before assuming a buyer is available in Malatya.'
    },
    {
      id: 'alfalfa', name: 'Alfalfa', category: 'Forage Crops', subgroup: 'Forage Legumes', group: 'forage', type: 'Perennial forage crop',
      img: 'assets/plants/alfalfa.jpg',
      season: 'Spring or autumn', sow: 'March–April; August–September in mild regions', sowTiming: 'Shallow-sow into a well-prepared seedbed with weeds controlled.',
      harvest: 'First cut: May–June; repeat cuts as growth allows', harvestTiming: 'Cut around budding to early flowering for quality forage; allow plants to recover between cuts.',
      duration: 'Perennial; 3–5 years or longer with suitable management', climate: 'Sunny, temperate conditions; winter-hardy, but sensitive to waterlogging and highly acidic soil.',
      regions: 'Malatya: Battalgazi, Yazıhan, Yeşilyurt, and irrigated areas. Türkiye: Konya, Kayseri, Isparta, Bursa, and Erzurum.',
      water: 'Moderate to high; irrigation after cutting can support regrowth and yield', temp: 'Approximately 15–25 °C',
      soil: 'Deep, fertile, well-drained, neutral to slightly alkaline soil; check pH and drainage.',
      summary: 'Produces protein-rich hay and bales for livestock farms in nearby markets.',
      tips: 'Sow shallowly and control weeds during the first year. Schedule cutting and drying around the rainfall forecast.',
      market: 'Dairy and beef farms, feed traders, cooperatives, and hay buyers. In Malatya, distance to buyers, bale quality, and transport costs are key factors.'
    }
  ];

  const guidePlantDefaults = {
    field: {
      duration: 'Approximately 4–8 months; varies by cultivar and region',
      climate: 'Conditions should meet the crop’s temperature, light, and rainfall needs throughout the growing season.',
      water: 'Water needs range from low to high depending on the crop and rainfall; plan water availability before planting.',
      temp: 'Climate and temperature requirements vary by cultivar, growth stage, and region',
      soil: 'Well-drained field soil with suitable structure and fertility; soil testing is recommended.'
    },
    orchard: {
      duration: 'Perennial; time to bearing depends on rootstock, cultivar, and care',
      climate: 'Consider light, winter chill requirements, and spring frost risk for each species and cultivar.',
      water: 'Regular water is important during establishment and fruit development; adjust irrigation to soil and climate.',
      temp: 'Temperate climate; frost tolerance and temperature needs vary by species',
      soil: 'Deep, fertile, well-drained loam; avoid sites with a high water table.'
    },
    vegetable: {
      duration: 'Approximately 2–6 months; varies by species, cultivar, and production system',
      climate: 'Choose open-field or protected growing conditions according to the crop’s temperature and light needs.',
      water: 'Maintain consistent soil moisture; adjust irrigation to species, growth stage, and production system.',
      temp: 'Mild to warm conditions; varies by species',
      soil: 'Fertile, well-drained loam with adequate organic matter.'
    },
    vine: {
      duration: 'Perennial; time to bearing varies by planting stock, cultivar, and training system',
      climate: 'Requires a sunny, long growing season; consider frost risk and regional ripening time.',
      water: 'Provide regular water during establishment and when needed; avoid overwatering and waterlogging.',
      temp: 'Temperate to warm climate; varies by cultivar and elevation',
      soil: 'Well-drained loam or sandy loam suited to root development.'
    },
    medicinal: {
      duration: 'Annual or perennial, depending on species; active compounds may be harvested from year one or two',
      climate: 'Sunny, well-ventilated conditions; strong sunlight supports active-compound and essential-oil production.',
      water: 'Low to moderate; overwatering and waterlogging can cause root rot and reduce active compounds.',
      temp: 'Temperate to warm; approximately 16–28 °C during growth and flowering',
      soil: 'Permeable, well-aerated loam or calcareous loam; sites with a low water table are suitable.'
    },
    aromatic: {
      duration: 'Usually a perennial subshrub; productive for 8–12 years after establishment',
      climate: 'Sunny, warm Mediterranean-type conditions support aromatic compounds and oil quality.',
      water: 'Low to moderate; drought-tolerant, with supplemental irrigation often helpful before flowering.',
      temp: 'Warm to mild climate; approximately 18–30 °C during growth',
      soil: 'Light to medium-textured, stony, calcareous, well-drained soil; avoid excessive moisture.'
    },
    forage: {
      duration: 'Annual (vetch, forage pea) or perennial (alfalfa, sainfoin: 3–5+ years)',
      climate: 'Adapted to a wide range of climates; winter-hardy and drought-tolerant cultivars are available.',
      water: 'Moderate to high; regular irrigation can support three to six cuts per year.',
      temp: 'Approximately 12–25 °C for active growth',
      soil: 'Deep, permeable calcareous or loamy soil with good drainage.'
    }
  };

  function createGuidePlant(product) {
    const defaults = guidePlantDefaults[product.kind] || guidePlantDefaults.field;
    const isPerennial = product.kind === 'orchard' || product.kind === 'vine' || product.perennial;
    const plantingLabel = product.plantingLabel || (isPerennial ? 'Planting stock / cuttings / seedlings' : 'Planting window');
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
      harvestTiming: product.harvestTiming || 'Timing varies by region and cultivar; harvest according to crop maturity and local production schedules.',
      duration: product.duration || defaults.duration,
      climate: product.climate || defaults.climate,
      regions: product.regions,
      water: product.water || defaults.water,
      temp: product.temp || defaults.temp,
      soil: product.soil || defaults.soil,
      summary: product.summary,
      tips: product.tips || 'Check planting dates with local agricultural guidance, taking district climate, elevation, cultivar, and soil into account. Plan irrigation, fertilization, and crop protection based on soil tests and product labels.',
      market: product.market || 'Sales channels vary by cultivar, quality grade, and local buyers. Research buyers, delivery standards, packaging, and transport before harvest.'
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

  // English display copy for the crop-guide catalog. Technical IDs and image paths remain unchanged.
  const englishPlantContent = {
    corn: ['Corn (Grain)', 'Summer crop', 'April–May', 'Plant after the soil warms and spring frost risk has passed.', 'August–October', 'Harvest at maturity when grain moisture is suitable for the intended market.', 'Irrigated areas of the Mediterranean (Çukurova), Southeastern Anatolia, and the Aegean.', 'A warm-season cereal used for animal feed, starch, and food processing.'],
    oats: ['Oats', 'Winter or spring crop', 'October–November', 'Usually sown in autumn; spring planting is also possible depending on the region and cultivar.', 'July–August', 'Harvest when grain is mature and dry enough for the intended use.', 'Marmara and the Black Sea region, especially cooler and more humid areas.', 'A cool-season cereal grown for grain, forage, or green fodder.'],
    rye: ['Rye', 'Winter crop', 'October–November', 'Sow in autumn at the locally suitable time into a prepared seedbed.', 'July–August', 'Harvest when grain is mature and field conditions are suitable.', 'Central Anatolia and cold, high-elevation areas; tolerates relatively low-fertility soils.', 'A cold-hardy cereal grown for bread grain and livestock feed.'],
    'green-lentil': ['Green Lentil', 'Spring crop', 'March', 'Sow in spring once the soil reaches suitable moisture and is workable.', 'July–August', 'Harvest when pods mature, taking care to limit seed shattering.', 'Central Anatolia, particularly Yozgat, Çorum, and Kırşehir.', 'A plant-based protein crop suited to dryland production.'],
    chickpea: ['Chickpea', 'Spring crop', 'March–April', 'Sow in spring when the soil is workable.', 'July–August', 'Harvest when plants and pods mature and dry.', 'Central Anatolia, the Aegean, and Southeastern Anatolia.', 'A drought-tolerant legume used for food and pulse processing.'],
    sunflower: ['Sunflower (Oilseed)', 'Summer crop', 'April', 'Sow in spring when soil temperature and moisture are suitable.', 'August–September', 'Harvest when heads and seeds mature and seed moisture suits storage or processing.', 'Marmara (Tekirdağ, Edirne), Central Anatolia, and the Black Sea region.', 'Seeds are processed for vegetable oil; sunflower meal is used in animal feed.'],
    tobacco: ['Tobacco', 'Spring transplanting', 'April–May', 'Transplant seedlings after the risk of frost has passed.', 'July–August', 'Harvest leaves as they mature, following local curing and buyer requirements.', 'Aegean (Manisa, Denizli), Black Sea (Samsun), and Southeastern Anatolia.', 'An industrial crop processed for its leaves; production may require permits and contracts.'],
    potato: ['Potato (Tuber)', 'Spring or summer crop', 'March–April', 'Plant seed tubers in workable soil; avoid frost and periods of extreme heat.', 'Summer and autumn', 'Harvest when plants mature and the skin has set, according to intended use.', 'Central Anatolia (Niğde, Nevşehir) and the Aegean (Ödemiş).', 'A tuber crop grown for fresh consumption and food processing.'],
    rapeseed: ['Canola (Rapeseed)', 'Winter crop', 'September–October', 'Sow in autumn early enough for plants to establish before winter.', 'June–July', 'Harvest when most pods mature, while minimizing seed shattering.', 'Marmara, especially Thrace.', 'Seeds are processed for vegetable oil and the by-product is used in animal feed.'],
    apple: ['Apple', 'Perennial fruit tree', 'November–March', 'Plant dormant trees when the soil is workable and severe frost is absent.', 'September–October', 'Pick at cultivar-specific maturity for fresh markets or storage.', 'Lake District (Isparta) and Central Anatolia (Karaman, Niğde).', 'A temperate fruit crop for fresh markets and processing that benefits from winter chill.'],
    apricot: ['Apricot', 'Perennial fruit tree', 'November–March', 'Plant during dormancy; assess sites with a risk of late spring frost.', 'June–July', 'Harvest at the maturity required for fresh sale or drying.', 'Eastern Anatolia (Malatya) and the Mediterranean (Mersin–Mut).', 'A fresh and dried fruit crop whose blossoms are vulnerable to spring frost.'],
    fig: ['Fig', 'Perennial fruit tree', 'November–March', 'Plant dormant trees, considering frost risk and soil conditions.', 'August–September', 'Harvest ripe fruit in multiple pickings as it matures.', 'Aegean region, especially Aydın and İzmir.', 'A warm-temperate fruit crop marketed fresh or dried.'],
    cherry: ['Cherry', 'Perennial fruit tree', 'November–March', 'Plant dormant trees and plan for compatible pollinizer cultivars and frost risk.', 'Late spring–early summer', 'Pick carefully at market maturity; fruit is sensitive to handling and rain cracking.', 'Aegean (İzmir–Kemalpaşa), Central Anatolia, and Marmara.', 'A high-value fresh and export fruit that requires cultivar and pollination planning.'],
    peach: ['Peach', 'Perennial fruit tree', 'November–March', 'Plant dormant trees during a frost-free period.', 'July–August', 'Harvest in multiple pickings as fruit reaches the desired maturity.', 'Marmara (Bursa, Çanakkale) and the Mediterranean (Mersin).', 'A fresh and processed fruit crop that benefits from regular pruning and irrigation.'],
    nectarine: ['Nectarine', 'Perennial fruit tree', 'November–March', 'Plant dormant trees during a frost-free period.', 'July–August', 'Pick at the maturity required for fresh sale or handling.', 'Marmara (Bursa, Çanakkale) and the Mediterranean (Mersin).', 'A smooth-skinned stone fruit grown for fresh markets and processing.'],
    hazelnut: ['Hazelnut', 'Perennial shrub crop', 'Winter dormancy', 'Plant in January–February on days without frost.', 'August', 'Harvest mature nuts and dry them promptly to protect quality.', 'Black Sea region (Ordu, Giresun, Trabzon) and Sakarya.', 'A nut crop used for snacks and food processing.'],
    pistachio: ['Pistachio', 'Perennial fruit tree', 'Winter dormancy', 'Plant dormant trees when there is no frost and the soil is workable.', 'Early September', 'Harvest at maturity and handle promptly to protect nut quality.', 'Southeastern Anatolia (Gaziantep, Şanlıurfa, Siirt).', 'A heat- and drought-adapted nut crop requiring planned male pollinizers and female trees.'],
    walnut: ['Walnut', 'Perennial fruit tree', 'Winter dormancy', 'Plant dormant trees during a frost-free period.', 'September–October', 'Harvest mature nuts and dry them carefully after collection.', 'Central Anatolia (Kaman), the Aegean (Denizli), and Marmara.', 'A nut crop for fresh and dried markets and food processing.'],
    almond: ['Almond', 'Perennial fruit tree', 'Winter dormancy', 'Plant dormant trees, considering local conditions and late-frost risk.', 'August–September', 'Harvest when hulls split and nuts reach maturity.', 'Mediterranean, Aegean (Datça), and Southeastern Anatolia.', 'A relatively heat- and drought-tolerant nut crop with blossoms vulnerable to spring frost.'],
    orange: ['Orange', 'Evergreen perennial fruit tree', 'Spring, after frost risk', 'Plant in spring after the danger of frost has passed.', 'November–February', 'Harvest according to cultivar maturity and local market timing.', 'Mediterranean (Antalya, Adana, Mersin) and Aegean (Muğla).', 'A citrus crop for fresh markets and juice processing that is sensitive to frost.'],
    mandarin: ['Mandarin', 'Evergreen perennial fruit tree', 'Spring, after frost risk', 'Plant in spring after the danger of frost has passed.', 'Late autumn–winter', 'Harvest at cultivar-specific maturity; early and late cultivars extend the season.', 'Mediterranean (Hatay, Adana) and Aegean (İzmir–Seferihisar).', 'A fresh-market citrus crop with cultivars that ripen across the season.'],
    lemon: ['Lemon', 'Evergreen perennial fruit tree', 'Spring, after frost risk', 'Plant in spring after the danger of frost has passed.', 'Winter', 'Harvest mature fruit according to cultivar and buyer requirements.', 'Mediterranean, especially Mersin–Erdemli and Adana.', 'A frost-sensitive citrus crop for fresh markets and food processing.'],
    'seedless-grape': ['Seedless Grapes', 'Perennial woody vine', 'Winter–early spring', 'Plant grape cuttings or vines at the locally suitable time for the planting material.', 'August–September', 'Harvest at the maturity and quality required for fresh sale or drying.', 'Aegean (Manisa, İzmir, Denizli).', 'Seedless grapes are grown for table use and raisins; training and pruning are important.'],
    'wine-table-grape': ['Juice / Table Grapes', 'Perennial woody vine', 'Winter–early spring', 'Plant grape cuttings or vines at the locally suitable time for the planting material.', 'September–October', 'Harvest at the maturity required for fresh use or juice and molasses processing.', 'Southeastern Anatolia (Diyarbakır, Gaziantep) and Central Anatolia.', 'Grapes are grown for fresh consumption, juice, and molasses; end use guides cultivar choice.'],
    tomato: ['Tomato', 'Summer crop; season can be extended under cover', 'April–May (sowing / transplanting)', 'Transplant outdoors after spring frost risk passes; protected-cropping calendars differ.', 'Summer–autumn', 'Pick repeatedly as fruit reaches market maturity.', 'Greenhouse production in the Mediterranean; open-field production in the Aegean, Marmara, and Central Anatolia.', 'A widely grown vegetable for fresh markets and processed products such as paste.'],
    pepper: ['Pepper', 'Summer crop; season can be extended under cover', 'April–May (sowing / transplanting)', 'Transplant after frost risk passes and the soil has warmed.', 'Summer–autumn', 'Pick repeatedly at the maturity required for fresh, dried, or processing markets.', 'Greenhouse production in the Mediterranean; open-field production in the Aegean, Marmara, and Central Anatolia.', 'Used fresh, dried, or processed; requires warm, sunny growing conditions.'],
    eggplant: ['Eggplant', 'Summer vegetable', 'April–May (transplanting)', 'Transplant after the soil warms and spring frost risk passes.', 'July–October', 'Harvest regularly while fruit is tender and at market size.', 'Mediterranean (Antalya), Aegean (Aydın), and Marmara (Bursa).', 'A warm-season vegetable sold fresh, dried, or for canning.'],
    cucumber: ['Cucumber', 'Spring and summer', 'April–May (earlier under cover)', 'Direct-sow into warm soil or transplant seedlings; maintain regular irrigation.', 'June–September', 'Harvest frequently while fruit is young and firm.', 'Mediterranean greenhouse areas (Antalya, Mersin), the Aegean, and Marmara.', 'A high-water-content cucurbit for fresh markets and pickling.'],
    melon: ['Melon', 'Summer crop', 'March–May', 'Direct-sow or transplant after the soil warms in spring.', 'June–August', 'Harvest when fruit reaches cultivar-specific maturity and aroma.', 'Mediterranean (Adana), Southeastern Anatolia (Diyarbakır), and the Aegean.', 'A warm-season cucurbit grown for fresh consumption.'],
    watermelon: ['Watermelon', 'Summer crop', 'March–May', 'Direct-sow or transplant after the soil warms in spring.', 'June–August', 'Harvest when fruit reaches maturity, using cultivar and field indicators.', 'Mediterranean (Adana), Southeastern Anatolia (Diyarbakır), and the Aegean.', 'A high-value fresh-market crop requiring warm conditions and a long growing season.'],
    onion: ['Onion', 'Spring or autumn planting', 'March (spring) / autumn', 'Plant seed, sets, or transplants according to the production system and region.', 'July–August', 'Harvest when tops fall and bulbs mature; cure before storage.', 'Central Anatolia (Ankara, Amasya) and Marmara.', 'A staple vegetable used fresh, dried, and in food processing.'],
    garlic: ['Garlic', 'Autumn crop', 'October–November', 'Plant cloves in autumn in well-drained soil.', 'June–July', 'Harvest when foliage yellows and bulbs mature; cure before storage.', 'Black Sea region (Kastamonu–Taşköprü) and Southeastern Anatolia.', 'A vegetable propagated from cloves and consumed fresh or dried.'],
    sage: ['Medicinal Sage', 'Perennial medicinal shrub', 'March–April (seedlings / cuttings)', 'Transplant seedlings in spring into a stone-free, well-drained field.', 'May–September (before flowering)', 'Harvest leaves before flowering according to the intended product and buyer specification.', 'Aegean (İzmir, Muğla) and the Mediterranean region.', 'Leaves and essential oil are used in herbal teas, food products, and botanical preparations.'],
    'st-johns-wort': ["St. John’s Wort", 'Perennial herb', 'March–April or autumn', 'Shallow-sow in a prepared, well-drained seedbed or transplant seedlings.', 'June–July (full bloom)', 'Harvest flowering tops at the required stage and handle according to buyer specifications.', 'Aegean, Marmara, Mediterranean, and Eastern Anatolian highlands.', 'Flowers containing hypericin are used in herbal products and botanical extracts.'],
    echinacea: ['Echinacea', 'Perennial herb', 'March–April', 'Transplant seedlings after spring frost risk has passed.', 'July–August', 'Harvest roots or flowers at the stage required for the intended product.', 'Irrigable areas of the Aegean, Marmara, and Central Anatolia.', 'Roots and flowers are used in botanical products, lozenges, and syrups.'],
    chamomile: ['Medicinal Chamomile', 'Annual herb', 'September–October or February–March', 'Shallow-sow the very small seeds and lightly firm the seedbed.', 'April–May', 'Harvest flower heads when fully open and dry them promptly in suitable conditions.', 'Aegean, Mediterranean, Central Anatolia, and Marmara.', 'Essential oil and flavonoids are used in herbal teas and cosmetic products.'],
    'lemon-balm': ['Lemon Balm', 'Perennial herb', 'March–April', 'Establish from seedlings; plants tolerate partial shade and prefer mild conditions.', 'June–August (before flowering)', 'Harvest leaves before flowering for aromatic quality.', 'Mediterranean, Aegean, and Black Sea coastal areas.', 'Lemon-scented leaves are used in herbal teas and aromatherapy products.'],
    licorice: ['Licorice', 'Deep-rooted perennial legume', 'Spring, from root cuttings', 'Plant in moist lowland soils and along suitable river terraces.', 'October–November (root harvest from year 3–4)', 'Harvest mature roots after several years, taking care to protect future regrowth.', 'Southeastern Anatolia (Şanlıurfa, Gaziantep) and Çukurova.', 'Roots containing glycyrrhizic acid are used in confectionery, pharmaceutical, and tobacco products.'],
    lavender: ['Medicinal Lavender', 'Perennial aromatic subshrub', 'November–March (container seedlings)', 'Plant seedlings during winter dormancy or early spring.', 'July–August', 'Harvest flowering stems at the stage required for oil or dried-flower production.', 'Isparta (Kuyucak), Burdur, Afyonkarahisar, and Thrace.', 'Essential oil is used in perfumery, cosmetics, and aromatherapy; the crop can suit dry, calcareous slopes.'],
    thyme: ['Wild / İzmir Thyme', 'Perennial aromatic shrub', 'Spring or autumn (transplanting)', 'Transplant into sunny, well-drained hillside fields.', 'June–July (early flowering)', 'Harvest at early flowering for dried herb or distillation, according to buyer requirements.', 'Aegean (Denizli–Pamukkale), Mediterranean, and western Anatolia.', 'Thymol- and carvacrol-rich leaves are exported as spice and distilled oil.'],
    rosemary: ['Rosemary', 'Evergreen perennial aromatic shrub', 'Spring (cuttings or seedlings)', 'Plant in frost-free locations with calcareous, well-drained soil.', 'Several fresh-shoot harvests per year', 'Harvest shoots as needed while maintaining the plant for regrowth.', 'Mediterranean (Mersin, Adana, Antalya) and Aegean coasts.', 'Leaves are used as a natural food preservative, spice, meat seasoning, and cosmetic ingredient.'],
    mint: ['Medicinal Mint (Peppermint)', 'Perennial rhizomatous herb', 'March–April (runners / seedlings)', 'Plant in moist, organic-rich soil and provide regular irrigation.', 'June–September (two to three cuts per year)', 'Cut before or at early flowering, according to the intended product.', 'Irrigated areas of the Mediterranean, Aegean, and Southeastern Anatolia.', 'Menthol-rich leaves and oil are used in confectionery, oral-care, and pharmaceutical products.'],
    basil: ['Basil / Purple Basil', 'Annual warm-season herb', 'April–May (transplanting)', 'Transplant in warm weather after the last spring frost.', 'Harvest through summer, before or at flowering', 'Harvest leaves and flowering shoots according to fresh, dried, or processing use.', 'Malatya (Arapgir purple basil), the Aegean, and the Mediterranean.', 'Green basil and locally distinctive purple basil are used in drinks, sauces, spices, and dried products.'],
    'black-cumin': ['Black Cumin', 'Annual winter or spring crop', 'October–November or February–March', 'Drill into a fine, well-prepared seedbed.', 'June–July (when capsules turn brown)', 'Harvest as capsules mature and brown, before seeds are lost.', 'Central Anatolia (Afyonkarahisar, Konya) and Burdur.', 'Seeds rich in thymoquinone and cold-pressed oil are sold for food, baking, and botanical products.'],
    'forage-pea': ['Forage Pea', 'Winter or spring forage legume', 'October–November or March', 'Sow alone or in a mixture with cereals such as barley or oats.', 'May–June (late flowering / pod set)', 'Cut for forage near the end of flowering or at pod set, depending on the intended use.', 'Central Anatolia, Thrace, the Aegean, and Marmara.', 'An annual forage legume that forms productive cereal mixtures and supplies protein-rich hay or silage.'],
    'sudan-grass': ['Sorghum–Sudan Grass', 'Fast-growing summer grass', 'May–June', 'Sow when soil temperature rises above 15 °C.', 'July–October (three to four cuts per season)', 'Cut at a suitable height and stage, allowing regrowth between harvests.', 'Irrigated areas of the Aegean, Mediterranean (Çukurova), Southeastern, and Central Anatolia.', 'A fast-growing forage crop with strong heat and drought tolerance that produces green fodder, hay, and silage.']
  };
  seasonalGuidePlants.forEach(plant => {
    const copy = englishPlantContent[plant.id];
    if (!copy) return;
    [plant.name, plant.season, plant.sow, plant.sowTiming, plant.harvest, plant.harvestTiming, plant.regions, plant.summary] = copy;
  });

  PLANTS_DATA.forEach(plant => {
    if (!plant.subgroup) plant.subgroup = plant.category;
    if (!plant.plantingLabel) plant.plantingLabel = 'Planting window';
  });
  PLANTS_DATA.push(...seasonalGuidePlants);

  const categoryEnglish = {
    'Tahıl': 'Cereals', 'Tahıllar': 'Cereals',
    'Yemeklik Tane Baklagiller': 'Food Legumes',
    'Endüstri (Sanayi) Bitkileri': 'Industrial Crops',
    'Yem Bitkisi': 'Forage Crops', 'Baklagil Yem Bitkileri': 'Forage Legumes',
    'Buğdaygil Yem Bitkileri': 'Forage Grasses', 'Meyvecilik': 'Fruit Crops',
    'Sert Kabuklu Meyveler': 'Nuts', 'Turunçgiller (Narenciye)': 'Citrus',
    'Bağcılık': 'Viticulture', 'Sebzecilik (Meyvesi Yenenler)': 'Fruiting Vegetables',
    'Sebzecilik (Kabakgiller)': 'Cucurbits', 'Sebzecilik (Yumru ve Soğansı)': 'Bulb and Root Vegetables',
    'Tıbbi Bitkiler': 'Medicinal Plants', 'Tıbbi Kök Bitkileri': 'Medicinal Root Crops',
    'Aromatik & Uçucu Yağ': 'Aromatic and Essential Oil Crops',
    'Baharat & Çeşni Bitkileri': 'Spice and Seasoning Plants', 'Tohum Baharat Bitkileri': 'Seed Spices'
  };
  const baseEnglishContent = {
    wheat: {
      name: 'Wheat', category: 'Cereals', subgroup: 'Cereals', type: 'Winter cereal',
      season: 'Winter / early spring', sow: 'October–November',
      sowTiming: 'Plant when soil moisture is suitable. Sow earlier in cold, high-elevation areas and later in mild lowlands.',
      harvest: 'June–July',
      harvestTiming: 'Harvest with a combine before rain when ears and stems yellow, grain hardens, and grain moisture is suitable.',
      duration: 'Approximately 7–9 months',
      climate: 'Needs a cool growing period, a winter-hardy cultivar, and warm, dry weather during grain filling.',
      regions: 'Central Anatolia (Konya, Ankara), Thrace, and Southeastern Anatolia.',
      water: 'Moderate; supplemental irrigation may help at stem elongation and heading when rainfall is insufficient',
      temp: 'Approximately 10–22 °C for growth',
      soil: 'Deep, well-drained loam or clay loam; avoid heavy soils that retain excess water.',
      summary: 'A staple raw material for flour, bulgur, and animal feed; performs well in rotations with legumes.',
      tips: 'Choose certified cultivars suited to the area. Base seedbed preparation, seeding rate, and fertilizer on soil tests; split nitrogen applications.',
      market: 'TMO procurement points under published terms, licensed warehouses, flour and feed mills, traders, and cooperatives. Confirm delivery and buyer terms in Malatya before planting.'
    },
    barley: {
      name: 'Barley', category: 'Cereals', subgroup: 'Cereals', type: 'Winter cereal / feed and malt',
      season: 'Winter crop', sow: 'October–November',
      sowTiming: 'Planting may be earlier in colder, higher areas; local cultivar and soil moisture guide timing.',
      harvest: 'June',
      harvestTiming: 'Harvest when grain hardens and stems yellow. For malting barley, confirm buyer moisture and quality requirements.',
      duration: 'Approximately 7–9 months',
      climate: 'Adapted to cool climates and winter cold; more tolerant of drought and salinity than wheat.',
      regions: 'Central Anatolia, Eastern Anatolia, and Southeastern Anatolia.',
      water: 'Low to moderate; suitable for rainfed production', temp: 'Approximately 8–20 °C',
      soil: 'Well-drained, light to medium-textured soils; avoid fields with a high water table.',
      summary: 'A drought-tolerant cereal used for feed, malt, and food.',
      tips: 'For malting, cultivar purity and protein content must meet buyer specifications. Maintain crop rotation and monitor weeds.',
      market: 'Feed mills, malt and brewing industries, TMO procurement points, licensed warehouses, and traders. Malting sales usually require advance confirmation of quality specifications.'
    }
  };
  PLANTS_DATA.forEach(plant => {
    if (baseEnglishContent[plant.id]) Object.assign(plant, baseEnglishContent[plant.id]);
    plant.category = categoryEnglish[plant.category] || plant.category;
    plant.subgroup = categoryEnglish[plant.subgroup] || plant.subgroup;
    if (plant.type) plant.type = categoryEnglish[plant.type] || plant.type;
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function createCardHTML(plant) {
    return `
      <article class="plant-card-item" data-id="${plant.id}" tabindex="0" role="button" aria-label="View details about ${plant.name}">
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
          <span class="plant-card-action-btn">Growing and market information ↗</span>
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

    const monthIndex = new Date().getMonth();
    const currentMonth = monthNames[monthIndex];
    body.innerHTML = `
      <div class="modal-banner" style="${plant.img ? `background-image: url('${plant.img}')` : 'background-image: linear-gradient(135deg, #e7efe4, #f5f2e7)'}">
        <span class="modal-type-chip">${plant.type}</span>
      </div>
      ${plant.imageCredit ? `<p class="plant-image-credit">Photo: <a href="${plant.imageSource}" target="_blank" rel="noopener noreferrer">${plant.imageCredit}</a></p>` : ''}
      <div class="modal-info-wrap">
        <div class="modal-header-line">
          <h2>${plant.name}</h2>
          <span class="modal-subtext">${plant.season}</span>
        </div>
        <p class="modal-summary">${plant.summary}</p>

        <div class="modal-spec-grid">
          <div class="spec-box"><span class="spec-label">🌱 ${plant.plantingLabel || 'Planting window'}</span><strong>${plant.sow}</strong><small>${plant.sowTiming}</small></div>
          <div class="spec-box"><span class="spec-label">🌾 Harvest / cutting window</span><strong>${plant.harvest}</strong><small>${plant.harvestTiming}</small></div>
          <div class="spec-box"><span class="spec-label">📆 Growing period</span><strong>${plant.duration}</strong></div>
          <div class="spec-box"><span class="spec-label">💧 Water needs</span><strong>${plant.water}</strong></div>
          <div class="spec-box"><span class="spec-label">🌡️ Climate and temperature</span><strong>${plant.temp}</strong><small>${plant.climate}</small></div>
          <div class="spec-box"><span class="spec-label">🗓️ Current season</span><strong>${currentMonth}</strong><small>${plant.sow.includes(currentMonth) ? 'This month may fall within the planting window; check local weather and soil conditions.' : plant.harvest.includes(currentMonth) ? 'This month may fall within the harvest window; check crop maturity and buyer schedules.' : 'Verify the planting/harvest calendar against the local climate and cultivar.'}</small></div>
        </div>

        <div class="modal-extra-info"><h4>📍 Main growing regions</h4><p>${plant.regions}</p></div>
        <div class="modal-extra-info"><h4>🌍 Soil requirements</h4><p>${plant.soil}</p></div>
        <div class="modal-extra-info tips-box"><h4>💡 Growing and care notes</h4><p>${plant.tips}</p></div>
        <div class="modal-extra-info market-box"><h4>🏭 Sales channels and potential buyers</h4><p>${plant.market}</p></div>
        <p class="plant-info-disclaimer">These calendars provide general windows; cultivar, elevation, weather, soil, and water conditions can shift dates. Check the calendar against local conditions and current production guidance.</p>
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
