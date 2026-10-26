# Yapay Zekâ — Faz 0 Karar Notu (27 Ekim 2026)

## Sonuç: Ne yapacağız?

| # | Bileşen | Karar | Neden |
|---|---|---|---|
| 1 | **NDVI'dan sezon sınıfı + 5 yıllık rotasyon geçmişi** | ✅ Yapılacak (prototip hazır) | Gerçek NASA verisiyle çalışıyor; "geçen yıllarda ne ekildi" bilgisini çiftçiye sormadan çıkarır, monokültür ve ürün-nadas düzenini yakalar |
| 2 | **Senaryo sıralama (`rank_scenarios`)** | ✅ Yapılacak (çekirdek hazır, 14 test geçiyor) | Challenge'ın "çiftçi önceliklerine göre strateji keşfi" maddesinin doğrudan karşılığı |
| 3 | Türkçe açıklama asistanı (LLM) | 🟡 Sprint 2, zaman kalırsa | Raporu sade dille anlatır; doz/ilaç önerisi vermeyecek şekilde sınırlandırılmalı |
| 4 | Verim tahmini (ML) | ❌ Yapılmayacak | Türkiye'de tarla bazlı etiketli verim verisi yok; uydurma bir model jüride savunulamaz |
| 5 | Optimizasyon için genetik algoritma | ❌ Gerek yok | 12 ürün × 4 yıl, kurallarla budanınca birkaç bin senaryo — hepsi saniyeler içinde puanlanabilir |

## 1. NDVI sezon sınıflandırması — ilk sonuçlar

**Veri:** NASA MODIS MOD13Q1 (250 m, 16 günlük), ORNL DAAC servisi, token gerektirmez.
5 Malatya alanı × 289 piksel × 2021–2025 = **7.225 piksel-yıl**.

**Yöntem:** Bulut/kar maskesi → zamanda doldurma → Savitzky-Golay yumuşatma → fenoloji özellikleri
(tepe ayı, genlik, yeşil kalma süresi, ilkbahar/yaz ortalaması, tepe sayısı) → kural tabanlı sınıf.
250 m'de tek tek ürün (buğday/nohut) ayrılamaz; ayrılan şey **sezon**dur ve rotasyon için yeterlidir.

| Alan | Baskın sınıf | Beklenti ile uyumlu mu? |
|---|---|---|
| Doğanşehir | %39 bahçe | ✅ Kayısı bölgesi |
| Akçadağ | %45 erken sezon (tahıl) | ✅ |
| Yazıhan | %27 erken + %21 yaz sezonu | ✅ Sulu tarla |
| Darende platosu | %50 nadas/çıplak, piksellerin %16'sında **ürün-nadas** döngüsü | ✅ Kuru tarım buğday-nadas sistemi |
| Battalgazi ovası | %33 erken, %21 çift ürün, %26 belirsiz | ⚠️ Kayısı bahçeleri beklenenden az "bahçe" çıktı — doğrulanmalı |

Grafikler: `ai/figures/sinif_profilleri.png`, `ai/figures/harita_*.png`, `ai/figures/kmeans_kumeler.png`

**Bilinen sınırlar (dürüstçe):**
- Piksel-yılların %13–26'sı "belirsiz": çoğu Nisan–Mayıs tepeli ama yazın da yeşil kalan karışık pikseller (250 m'de tarla + bahçe aynı pikselde).
- "Çift ürün" oranı (%13) Malatya için yüksek görünüyor; bahçe/tarla karışımı olabilir.
- Kurallardan bağımsız KMeans ile uyum orta düzeyde (ARI = 0,21): nadas ve bahçe kümeleri net ayrılıyor, ara sınıflar karışıyor.
- **Henüz doğruluk ölçülmedi** — aşağıdaki doğrulama adımı bunun için.

## 2. Senaryo sıralama

`ai/ranking.py` → `rank_scenarios(senaryolar, öncelikler)`
- 4 öncelik kaydırıcısı (toprak / su / gelir / risk) → 8 metriğin ağırlıkları
- Çıktı: 0–100 skor, sıra, **Pareto-optimal mi**, **güven %** (ağırlıklar ±%20 oynatıldığında kaç kez birinci kalıyor), Türkçe "neden?" cümlesi
- Örnek: toprak %40 / su %30 / gelir %20 / risk %10 → buğday-nohut-buğday-mercimek **82/100, güven %99,7**; monokültür 23/100 ve Pareto dışı

## Ekipten ihtiyaçlar

| Kimden | Ne | Ne zaman |
|---|---|---|
| **Ziraat** | `data/malatya/ndvi/dogrulama_ornekleri.csv` — 70 noktayı Google uydu görüntüsü / saha bilgisiyle etiketlemek (kör: model cevabı görünmüyor) → modelin doğruluk yüzdesi sunuma girer | 2 Kasım |
| **Ziraat** | Ürün tablosunda metrikler için değerler (su, azot, organik madde katkısı, hastalık grubu, gelir) | Sprint 1 başı |
| **Yazılım 1 (Enes)** | Rotasyon motoru her senaryo için `ai/ranking.py` içindeki `METRICS` anahtarlarını üretsin (API sözleşmesi) | 29 Ekim atölyesi |
| **Bilgisayar müh. (Arhat)** | Sprint 2'de HLS 30 m NDVI erişimi → parsel ölçeğinde aynı sınıflandırıcı | 5 Kasım |

## Sonraki adımlar (yapay zekâ)
1. Doğrulama etiketleri gelince doğruluk/karışıklık matrisi → eşikleri ayarla.
2. Sınıflandırıcıyı API'ye bağla: parsel geometrisi → 5 yıllık sezon dizisi → formdaki "geçen yıl" alanını otomatik doldur.
3. `rank_scenarios`'u rotasyon motorunun çıktısına bağla (`/api/v1/scenarios`).
4. Zaman kalırsa: belirsiz pikseller için küçük bir denetimli model (etiketli örneklerle Random Forest), Türkçe LLM açıklayıcı.

## Çalıştırma
```bash
pip install numpy scipy pandas scikit-learn matplotlib pytest
python -m ai.ndvi_fetch        # ~25 dk ilk sefer, sonra önbellekten
python -m ai.run_prototype
python -m pytest ai
```
