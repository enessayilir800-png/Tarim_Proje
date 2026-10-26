# Yapay Zekâ Modülü — Ekip Rehberi

> Sorumlu: Zeynep (yapay zekâ) · Durum: **Faz 0 tamamlandı (27 Ekim 2026)** · Karar notu: [`KARAR_NOTU.md`](KARAR_NOTU.md)

Bu klasör iki şey yapar:

1. **Uydudan tarla geçmişi:** NASA MODIS NDVI serisinden her tarla pikseli için yıllık *ürün sezonunu* ve 5 yıllık *rotasyon örüntüsünü* çıkarır (monokültür mü, buğday-nadas mı, rotasyon var mı).
2. **Senaryo sıralama:** Rotasyon motorunun ürettiği senaryoları çiftçinin önceliklerine (toprak / su / gelir / risk) göre puanlar, en iyisini ve *nedenini* söyler.

---

## Hızlı başlangıç

```bash
pip install numpy scipy pandas scikit-learn matplotlib pytest
python -m pytest ai            # 14 test geçmeli
python -m ai.run_prototype     # CSV + grafikleri yeniden üretir (veri repoda hazır)
```

NDVI verisini sıfırdan indirmek gerekirse: `python -m ai.ndvi_fetch` (ilk sefer ~25 dk; NASA ORNL servisi, token gerekmez).

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `ndvi_fetch.py` | 5 Malatya alanı için MOD13Q1 NDVI + piksel güvenilirlik verisini indirir → `data/malatya/ndvi/*.npz` |
| `phenology.py` | Temizleme, yumuşatma, fenoloji özellikleri, sezon sınıfı, rotasyon örüntüsü |
| `ranking.py` | `rank_scenarios()` — çok amaçlı senaryo sıralama |
| `run_prototype.py` | Uçtan uca analiz, grafikler, doğrulama örneklemi |
| `test_phenology.py`, `test_ranking.py` | Testler |
| `figures/` | Sunumda kullanılabilecek grafikler |

## Sezon sınıfları

250 m çözünürlükte buğday ile nohut ayrılamaz; ayrılan şey ürünün **sezonudur**. Rotasyon kararı için bu yeterlidir.

| Sınıf | Anlamı | NDVI eğrisi |
|---|---|---|
| `erken_sezon` | Buğday, arpa, mercimek, nohut | Nisan-Mayıs tepe, Haziran-Temmuz hasatla düşüş |
| `yaz_sezonu` | Mısır, ayçiçeği, şeker pancarı, sebze | Temmuz-Ağustos tepe |
| `cift_urun` | Aynı yıl iki ürün | İki ayrı tepe |
| `bahce` | Kayısı bahçesi, yonca | Mayıs'tan Eylül'e uzun yeşil dönem |
| `sabit_yesil` | Orman, mera | Yıl boyu az değişen |
| `nadas_ciplak` | Nadas, çıplak toprak, yerleşim | Hiç yeşillenmiyor |
| `belirsiz` | Kurallara uymayan (çoğu karışık piksel) | — |

---

## 👥 Kimden ne bekleniyor?

### 🌾 Ziraat — Doğrulama etiketleri (son tarih: 2 Kasım)
Modelin doğruluk yüzdesi sunuma girecek; bunu ancak senin etiketlerinle ölçebiliriz.

1. `data/malatya/ndvi/dogrulama_ornekleri.csv` dosyasını Excel'de aç (70 satır).
2. Her satırdaki `harita` linkine tıkla → Google uydu görüntüsü açılır.
3. O noktada **2025 yılında** ne olduğunu `uzman_sinifi` sütununa yukarıdaki tablodaki sınıf adlarından biriyle yaz.
4. Emin değilsen `?` yaz, `not` sütununa kısa açıklama ekle ("kenarda bahçe var" gibi).
5. Kaydet, commit'le ya da dosyayı bana gönder.

> Modelin tahmini bu dosyada **bilerek yok** (kör etiketleme) — cevap anahtarı `dogrulama_anahtar.csv`'de. Lütfen önce ona bakma, yoksa ölçüm geçersiz olur.
>
> İpucu: Google Earth Pro'nun "geçmiş görüntüler" özelliğiyle farklı yıllara bakılabilir. Kayısı bahçeleri düzenli sıra ağaçlar olarak görünür.

### 💻 Yazılım 1 (Enes) — Metrik sözleşmesi (29 Ekim atölyesi)
Rotasyon motoru her senaryo için şu sözlüğü üretmeli; `rank_scenarios()` doğrudan bunu kullanır:

```json
{
  "id": "A",
  "crops": ["wheat", "chickpea", "wheat", "lentil"],
  "metrics": {
    "soil_organic_trend": 3,          // toprak organik maddesi eğilimi (puan, yüksek = iyi)
    "nitrogen_balance": 4,            // kg N/da (yüksek = iyi)
    "water_demand_mm": 1400,          // toplam su ihtiyacı (düşük = iyi)
    "water_deficit_mm": 300,          // yağışla karşılanmayan su (düşük = iyi)
    "disease_risk": 0.3,              // 0-1 (düşük = iyi)
    "drought_risk": 0.35,             // 0-1 (düşük = iyi)
    "climate_2040_robustness": 70,    // 2040 iklimine dayanıklılık % (yüksek = iyi)
    "income": 8200                    // TL/da (yüksek = iyi)
  }
}
```

Öncelikler `{"soil": 40, "water": 30, "yield": 20, "risk": 10}` biçiminde gelir (ölçek önemsiz). Eksik metrik olursa sıralama çalışır, yanıtta `ignored_metrics` olarak bildirilir.

### 🛰️ Bilgisayar müh. (Arhat) — Sprint 2
HLS (Landsat + Sentinel, 30 m) NDVI erişimi. Aynı `phenology.py` parsel ölçeğinde çalışabilir; 16 günlük yerine daha sık gözlem olduğu için `clean_series` küçük bir uyarlama ister.

### 🎨 Yazılım 2 — Arayüz için bilgi
`rank_scenarios()` her senaryo için şunları döndürür; kartlarda gösterilebilir:
`score` (0-100), `rank`, `pareto_optimal`, `confidence` (%), `explanation.text` (Türkçe cümle), `contributions` (metrik bazında puan katkısı → yığılmış çubuk grafik).

---

## İlk sonuçlar (2021-2025, 7.225 piksel-yıl)

| Alan | Baskın sınıf | Yorum |
|---|---|---|
| Doğanşehir | %39 bahçe | Kayısı bölgesi ✅ |
| Akçadağ | %45 erken sezon | Tahıl ✅ |
| Yazıhan | %27 erken + %21 yaz sezonu | Sulu tarla ✅ |
| Darende platosu | %50 nadas, %16 pikselde buğday-nadas döngüsü | Kuru tarım ✅ |
| Battalgazi ovası | Bahçe beklenenden az | ⚠️ Doğrulama bekliyor |

Bilinen sınırlar ve sonraki adımlar için: [`KARAR_NOTU.md`](KARAR_NOTU.md)
