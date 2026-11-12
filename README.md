# TarımYol

TarımYol, FastAPI tabanlı tarımsal karar destek uygulamasıdır. Mevcut web arayüzü aynı uygulamadan sunulur.

Arayüzde tarla planı, parsel haritası ve hava koşullarına dayalı saha kararları tek Tarla Yönetimi ekranında; ürün rehberi ise ayrı ekranda sunulur.
Bitki Rehberi'nde Tarla Bitkileri ve Bahçe Bitkileri kategorileri ürün kartlarıyla sunulur. Kartlar ürünlerin ekim/dikim ve hasat zamanlarını, yetiştiği bölgeleri ve yetiştiricilik notlarını içerir; bahçe ürünleri meyvecilik, sert kabuklu meyveler, turunçgiller, bağcılık ve sebzecilik alt gruplarında listelenir.
Tarla Yönetimi ekranındaki konum araması koordinatları otomatik bulur; geçerli ürün ve alan bilgileri girildiğinde sezon planı oluşturulur. Kayıtlı tarla seçildiğinde konum, ürün ve alan forma aktarılır, plan ve saha görünümü seçilen tarlaya göre güncellenir.
Parsel haritasında NDVI, EVI, SMAP yüzey toprak nemi, MODIS gündüz yüzey sıcaklığı ve SRTM yükselti katmanları ayrı ayrı görüntülenebilir. Aynı beş NASA GIBS katmanı, seçili tarla konumuna odaklanan senkron mini haritalar olarak da sunulur; küçük parsellerde uydu piksel çözünürlüğü göz önünde bulundurulmalıdır.
Parsel alanı TKGM alan bilgisinden (m² → dekar) alınır; çizilen sınırdan küresel geometri hesabıyla tahmin edilir. Alan verisi yoksa sabit bir büyüklük varsayılmaz ve kayıt öncesi kullanıcıdan gerçek alanı girmesi istenir.

## Kurulum ve çalıştırma

Proje klasöründe PowerShell ile:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Arayüz: `http://127.0.0.1:8000`  
Swagger UI: `http://127.0.0.1:8000/docs`

## Rotasyon ve SQLite önbelleği

Rotasyon önerisi `POST /api/v1/rotation/calculate` ile alınır. Girdi alanları `selected_crop`, isteğe bağlı `previous_crop`, `priority` ve `irrigation_available` değerleridir. `priority`, `soil`, `water` veya `risk` olabilir. Ürün anahtarları: `wheat`, `barley`, `corn`, `sunflower`, `chickpea`, `lentil`, `cotton`, `tomato`, `potato`.

Örnek:

```json
{
  "selected_crop": "wheat",
  "previous_crop": "barley",
  "priority": "soil",
  "irrigation_available": false
}
```

Sonuçlar varsayılan olarak `data/cache.sqlite3` içinde altı saat saklanır. `CACHE_DB_PATH` ortam değişkeniyle veritabanı yolunu değiştirebilirsiniz. Önbellek kaydı sorgu girdilerinin SHA-256 anahtarı, JSON sonuç, oluşturulma zamanı ve TTL değerini içerir. Yanıttaki `cached` alanı sonucun SQLite'tan gelip gelmediğini belirtir.

SQLite Python standart kütüphanesindedir; ayrıca paket kurulumu gerektirmez.

## Diğer API uçları

- `GET /api/climate`, `/api/geocode`, `/api/soil`, `/api/forecast`, `/api/water`
- `GET /api/field-data`, `/api/plant-profile`, `/api/fires`, `/api/projection`
- `GET /api/tkgm/locations`, `/api/tkgm/parcel`
- `GET /api/ndvi/health`, `POST /api/ndvi/task`, `GET /api/ndvi/status`

Harici servis anahtarları proje kökündeki `.env` dosyasında yapılandırılır. `.env.example` örnek başlangıç dosyasıdır.

NDVI raster sonuçları için `numpy` ve `rasterio` gerekir. Rotasyon önerileri karar desteğidir; yerel münavebe kuralları, hastalık geçmişi ve toprak analiziyle doğrulanmalıdır.
