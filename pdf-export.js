// TarımYol - PDF Report Export (jsPDF + html2canvas)
(function () {
  // Add a PDF download button after the report is generated.
  window.attachPdfDownloadButton = function () {
    const reportEl = document.getElementById('report');
    if (!reportEl || document.getElementById('btn-download-pdf')) return;

    const btnWrap = document.createElement('div');
    btnWrap.className = 'pdf-export-bar';
    btnWrap.innerHTML = `
      <button type="button" id="btn-download-pdf" class="btn-pdf-download">
        <span class="pdf-icon">📄</span>
        <span>Download This Plan as PDF</span>
      </button>
      <span class="pdf-hint">The farm report is ready with its calendar and climate charts.</span>
    `;

    // Raporun en tepesine ekle
    reportEl.prepend(btnWrap);
  };

  // Handle button clicks.
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#btn-download-pdf');
    if (!btn) return;

    const reportEl = document.getElementById('report');
    if (!reportEl) return;

    if (!window.jspdf || !window.html2canvas) {
      alert('PDF libraries are loading. Please try again in a few seconds.');
      return;
    }

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Preparing PDF, please wait…</span>';

    try {
      // Temporarily hide the button while generating the PDF.
      const exportBar = reportEl.querySelector('.pdf-export-bar');
      if (exportBar) exportBar.style.display = 'none';

      // Convert the HTML to a high-resolution canvas.
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

      // Split the output into pages.
      let remainingHeight = totalImgHeight;
      let sourceY = 0;
      let pageNumber = 1;

      while (remainingHeight > 0) {
        // Add a header to each page (use a simpler header on the first page).
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

        // Add the page number in the footer.
        pdf.setFontSize(8);
        pdf.setTextColor(140, 150, 140);
        pdf.text(
          `TarımYol Seasonal Decision Support Report · Page ${pageNumber}`,
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

      // Build the filename from the crop and date.
      const cropName = document.getElementById('crop')?.selectedOptions[0]?.text || 'Tarla_Plani';
      const nowStr = new Date().toISOString().slice(0, 10);
      pdf.save(`TarimYol_${cropName}_Raporu_${nowStr}.pdf`);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('There was a problem generating the PDF: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
})();
