// TarımYol - Profesyonel PDF Rapor İndirme Modülü (jsPDF + html2canvas)
(function () {
  // Rapor oluşturulduğunda "PDF İndir" butonunu ekle
  window.attachPdfDownloadButton = function () {
    const reportEl = document.getElementById('report');
    if (!reportEl || document.getElementById('btn-download-pdf')) return;

    const btnWrap = document.createElement('div');
    btnWrap.className = 'pdf-export-bar';
    btnWrap.innerHTML = `
      <button type="button" id="btn-download-pdf" class="btn-pdf-download">
        <span class="pdf-icon">📄</span>
        <span>Bu Planı PDF Olarak İndir</span>
      </button>
      <span class="pdf-hint">Çiftçi raporu, takvim ve iklim grafikleriyle birlikte hazırlandı.</span>
    `;

    // Raporun en tepesine ekle
    reportEl.prepend(btnWrap);
  };

  // Butona tıklama olayı
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#btn-download-pdf');
    if (!btn) return;

    const reportEl = document.getElementById('report');
    if (!reportEl) return;

    if (!window.jspdf || !window.html2canvas) {
      alert('PDF kütüphaneleri yükleniyor, lütfen birkaç saniye sonra tekrar deneyin.');
      return;
    }

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ PDF Hazırlanıyor, lütfen bekleyin…</span>';

    try {
      // PDF oluştururken butonun kendisini geçici olarak gizle
      const exportBar = reportEl.querySelector('.pdf-export-bar');
      if (exportBar) exportBar.style.display = 'none';

      // HTML'i yüksek çözünürlüklü canvas'a çevir
      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200
      });

      if (exportBar) exportBar.style.display = '';

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const totalImgHeight = (canvas.height * contentWidth) / canvas.width;

      // Sayfa sayfa bölme
      let remainingHeight = totalImgHeight;
      let sourceY = 0;
      let pageNumber = 1;

      while (remainingHeight > 0) {
        // Her sayfa için üst bilgi başlığı (İlk sayfa hariç sade)
        const usableHeight = pageHeight - 20;
        const sliceHeight = Math.min(remainingHeight, usableHeight);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = (sliceHeight / contentWidth) * canvas.width;

        const ctx = sliceCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0, sourceY, canvas.width, sliceCanvas.height,
          0, 0, sliceCanvas.width, sliceCanvas.height
        );

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(sliceData, 'JPEG', margin, 10, contentWidth, sliceHeight);

        // Sayfa Numarası (Footer)
        pdf.setFontSize(8);
        pdf.setTextColor(140, 150, 140);
        pdf.text(
          `TarımYol Sezon Karar Destek Raporu · Sayfa ${pageNumber}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );

        remainingHeight -= sliceHeight;
        sourceY += sliceCanvas.height;

        if (remainingHeight > 0) {
          pdf.addPage();
          pageNumber++;
        }
      }

      // Dosya Adı (Ürün + Tarih)
      const cropName = document.getElementById('crop')?.selectedOptions[0]?.text || 'Tarla_Plani';
      const nowStr = new Date().toISOString().slice(0, 10);
      pdf.save(`TarimYol_${cropName}_Raporu_${nowStr}.pdf`);

    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      alert('PDF oluşturulurken bir sorun çıktı: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
})();
