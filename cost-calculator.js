// TarımYol - Çiftçi Maliyet, Gelir ve Kârlılık Hesaplayıcı
(function () {
  // Ürün bazlı dekar (da) başına ortalama girdi maliyetleri ve piyasa verileri (TL)
  const FINANCIAL_DATA = {
    wheat: {
      name: 'Buğday',
      yieldPerDekar: 380, // kg/dekar
      pricePerKg: 10.5,   // TL/kg
      seedCost: 350,      // TL/da
      fertilizerCost: 650,// TL/da
      fuelLaborCost: 750, // TL/da
      irrigationCost: 200 // TL/da (sulama varsa)
    },
    barley: {
      name: 'Arpa',
      yieldPerDekar: 350,
      pricePerKg: 8.5,
      seedCost: 300,
      fertilizerCost: 550,
      fuelLaborCost: 700,
      irrigationCost: 150
    },
    corn: {
      name: 'Mısır',
      yieldPerDekar: 1100,
      pricePerKg: 8.0,
      seedCost: 750,
      fertilizerCost: 1400,
      fuelLaborCost: 1100,
      irrigationCost: 950
    },
    sunflower: {
      name: 'Ayçiçeği',
      yieldPerDekar: 260,
      pricePerKg: 18.0,
      seedCost: 400,
      fertilizerCost: 700,
      fuelLaborCost: 800,
      irrigationCost: 300
    },
    chickpea: {
      name: 'Nohut',
      yieldPerDekar: 160,
      pricePerKg: 35.0,
      seedCost: 550,
      fertilizerCost: 350,
      fuelLaborCost: 650,
      irrigationCost: 100
    },
    lentil: {
      name: 'Mercimek',
      yieldPerDekar: 150,
      pricePerKg: 32.0,
      seedCost: 500,
      fertilizerCost: 300,
      fuelLaborCost: 600,
      irrigationCost: 100
    },
    cotton: {
      name: 'Pamuk',
      yieldPerDekar: 450,
      pricePerKg: 24.0,
      seedCost: 600,
      fertilizerCost: 1600,
      fuelLaborCost: 1800,
      irrigationCost: 1200
    },
    tomato: {
      name: 'Domates',
      yieldPerDekar: 7500,
      pricePerKg: 3.5,
      seedCost: 1800,
      fertilizerCost: 3200,
      fuelLaborCost: 4500,
      irrigationCost: 1500
    },
    potato: {
      name: 'Patates',
      yieldPerDekar: 3800,
      pricePerKg: 8.5,
      seedCost: 3500,
      fertilizerCost: 2800,
      fuelLaborCost: 3200,
      irrigationCost: 1200
    }
  };

  const fmtCurrency = num => Math.round(num).toLocaleString('tr-TR') + ' ₺';

  window.renderCostAnalysis = function (cropKey, areaDekar, hasIrrigation) {
    const reportEl = document.getElementById('report');
    if (!reportEl || !cropKey) return;

    // Varsa eski maliyet kutusunu kaldır
    const oldBox = document.getElementById('cost-analysis-box');
    if (oldBox) oldBox.remove();

    const data = FINANCIAL_DATA[cropKey] || FINANCIAL_DATA.wheat;
    const dekar = Math.max(0.1, Number(areaDekar) || 10);

    const seedTotal = data.seedCost * dekar;
    const fertTotal = data.fertilizerCost * dekar;
    const fuelTotal = data.fuelLaborCost * dekar;
    const irrTotal = (hasIrrigation ? data.irrigationCost : 0) * dekar;

    const totalExpense = seedTotal + fertTotal + fuelTotal + irrTotal;
    const totalYieldKg = data.yieldPerDekar * dekar;
    const totalRevenue = totalYieldKg * data.pricePerKg;
    const netProfit = totalRevenue - totalExpense;
    const isProfit = netProfit >= 0;

    const box = document.createElement('div');
    box.id = 'cost-analysis-box';
    box.className = 'cost-analysis-box';
    box.innerHTML = `
      <div class="timeline-title">💰 TAHMİNİ GELİR, MALİYET VE KÂR ANALİZİ (${dekar} DEKAR)</div>
      <div class="financial-summary-grid">
        <div class="fin-card fin-card-expense">
          <span class="fin-label">Toplam Tahmini Gider</span>
          <strong class="fin-val text-expense">${fmtCurrency(totalExpense)}</strong>
          <small>Dekar başı: ${fmtCurrency(totalExpense / dekar)}</small>
        </div>
        <div class="fin-card fin-card-revenue">
          <span class="fin-label">Tahmini Brüt Gelir</span>
          <strong class="fin-val text-revenue">${fmtCurrency(totalRevenue)}</strong>
          <small>${Math.round(totalYieldKg).toLocaleString('tr-TR')} kg rekolte beklentisi</small>
        </div>
        <div class="fin-card ${isProfit ? 'fin-card-profit' : 'fin-card-loss'}">
          <span class="fin-label">${isProfit ? 'Tahmini Net Kâr' : 'Tahmini Risk / Zarar'}</span>
          <strong class="fin-val ${isProfit ? 'text-profit' : 'text-loss'}">${fmtCurrency(netProfit)}</strong>
          <small>Dekar başı net: ${fmtCurrency(netProfit / dekar)}</small>
        </div>
      </div>

      <div class="expense-breakdown">
        <h4>Gider Kalemleri Dağılımı</h4>
        <div class="expense-bars">
          <div class="exp-item">
            <span>🌱 Tohum / Fide:</span>
            <strong>${fmtCurrency(seedTotal)}</strong>
          </div>
          <div class="exp-item">
            <span>🧪 Taban ve Üst Gübre:</span>
            <strong>${fmtCurrency(fertTotal)}</strong>
          </div>
          <div class="exp-item">
            <span>🚜 Mazot, Sürüm ve İşçilik:</span>
            <strong>${fmtCurrency(fuelTotal)}</strong>
          </div>
          <div class="exp-item">
            <span>💧 Sulama & Enerji:</span>
            <strong>${fmtCurrency(irrTotal)}</strong>
          </div>
        </div>
        <p class="fin-disclaimer">
          * Fiyatlar ve rekolte değerleri Türkiye tarım piyasası ortalamalarına dayalı tahmini karar desteğidir. Akaryakıt, tohum çeşidi ve yerel pazar koşullarına göre değişkenlik gösterebilir.
        </p>
      </div>
    `;

    // Sürdürülebilirlik kartının veya takvimin öncesine ekle
    const sustainabilityBox = reportEl.querySelector('.sustainability-box') || reportEl.querySelector('.timeline-title');
    if (sustainabilityBox) {
      sustainabilityBox.before(box);
    } else {
      reportEl.appendChild(box);
    }
  };
})();
