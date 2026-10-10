# TarımYol

Konum, tarla büyüklüğü, toprak yapısı ve ürün seçimine göre NASA POWER günlük iklim verilerini inceleyen yerel web uygulaması.

## Çalıştırma

1. Python 3 kurulu olmalı (ek paket gerekmez).
2. Proje klasöründe `python server.py` komutunu çalıştır.
3. Tarayıcıda `http://127.0.0.1:8000` adresini aç.
4. İl/ilçe/köy veya açık adresi yazıp `Konumu bul` düğmesine bas; istersen enlem-boylamı elle de girebilirsin.

NASA POWER herkese açık olduğundan API anahtarı gerekmez. Adres ve yerel sunucu ayarları `.env` dosyasındadır. İklim isteği NASA POWER daily point endpoint'inden son üç tamamlanmış yıl için T2M, PRECTOTCORR, RH2M, WS2M ve ALLSKY_SFC_SW_DWN değişkenlerini alır.

Araç ayrıca çiftçinin önceliğini (toprak sağlığı, su tasarrufu, verim veya düşük risk), toprak yapısını, sulama durumunu ve geçen yılki ürünü kullanarak üç yıllık ürün rotasyonu önerir. Bu rotasyon bir karar desteği puanıdır; bölgesel münavebe kuralları, hastalık geçmişi ve toprak analiziyle doğrulanmalıdır.

## Bölgesel tarla takvimi API'si

`.env` içindeki `FIELD_DATA_API_URL` alanına kendi API adresini yazabilirsin. Uygulama bu adrese `latitude`, `longitude` ve `crop` sorgu parametrelerini gönderir. İsteğe bağlı `FIELD_DATA_API_KEY` değeri `Authorization: Bearer ...` başlığı olarak eklenir.

API'nin JSON yanıtı şu yapıda olmalı:

```json
{
  "source": "İlçe tarım takvimi",
  "season_note": "Bölgeye göre erkenci hasat takvimi",
  "tasks": {
    "9": [{"label": "TARLA HAZIRLIĞI", "text": "Ekim yatağını hazırla."}],
    "10": [{"label": "EKİM", "text": "Uygun toprak neminde ek."}],
    "6": [{"label": "HASAT", "text": "Olgunlukta hasat et."}]
  }
}
```

`tasks` içindeki aylar 1–12 arasındadır. API ayarlanmazsa uygulama mevcut genel ürün takvimini kullanır.

## Perenual ürün profili

`.env` içindeki `PERENUAL_API_KEY` alanına Perenual anahtarını yazabilirsin. Anahtar sunucuda kalır; tarayıcıya gönderilmez. Uygulama seçilen ürün için sulama, güneş, toprak ve zararlı profilini rapora ekler. Perenual bir bitki bilgi kaynağıdır; Türkiye'ye özel ekim/hasat tarihi yerine geçmez.

## Sınırlar

Takvimler ürün bazında genel başlangıç önerileridir; Türkiye'deki bölge, rakım, çeşit, ekim yöntemi ve güncel hava koşullarına göre değişir. NASA POWER verisi geçmiş iklim koşullarını verir, yıl içi hava tahmini ve ürün verimi garantisi değildir. Gübre dozu için toprak analizi, bitki koruma uygulaması için doğru teşhis, ruhsatlı ürün etiketi ve yerel ziraat uzmanı önerisi gerekir. Bu araç ilaç dozu veya gübre miktarı üretmez.
