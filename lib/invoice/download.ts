/**
 * Renders an invoice node to a downloadable A4 PDF.
 *
 * Extracted from InvoiceView because two places now offer the same download — the standalone
 * invoice page and the invoice popup in My Orders — and a second copy of this would be a second
 * thing to keep in step. jspdf and html-to-image stay dynamic imports so neither screen pays for
 * ~500kB of libraries until someone actually clicks Download.
 *
 * Throws on failure; the caller decides what to fall back to (the standalone page can offer the
 * browser's own print dialog, the popup cannot because it would print the page behind it).
 */
export async function downloadInvoicePdf(element: HTMLElement, invoiceNumber: string): Promise<void> {
  const { toPng } = await import('html-to-image');
  const { jsPDF } = await import('jspdf');

  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const margin = 10; // 10mm margin
  const imgWidth = pdfWidth - margin * 2;
  const imgHeight = (img.height * imgWidth) / img.width;

  if (imgHeight <= pdfHeight - margin * 2) {
    pdf.addImage(dataUrl, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // Taller than one page: re-draw the same full-height image on each page, shifted up, so the
    // next slice of it lands inside the printable area.
    const pageContentHeight = pdfHeight - margin * 2;
    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageContentHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageContentHeight;
    }
  }

  const clean = (invoiceNumber || 'INVOICE').replace(/[^a-zA-Z0-9-_]/g, '_');
  pdf.save(`Invoice_${clean}.pdf`);
}
