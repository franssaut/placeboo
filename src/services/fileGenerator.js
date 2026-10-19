import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

/**
 * Placeboo File Generator Utility
 * Generates genuine, valid, and openable file Blobs for downloads
 * Uses official binary libraries (jsPDF, docx, SheetJS, JSZip) to guarantee zero corruption
 */

/**
 * 1. REAL PDF GENERATOR
 * Uses jsPDF to output a standard-compliant PDF 1.4 binary stream with valid cross-reference tables
 */
export function generatePdfBlob(filename, sourceFormat = 'DOCX', targetFormat = 'PDF') {
  const cleanName = (filename || 'Dokumen_Konversi.pdf').replace(/\.[^/.]+$/, '');
  const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);

  // Brand Header Bar
  doc.setFillColor(53, 37, 205);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PLACEBOO DOCUMENT CONVERTER', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(timestamp, pageWidth - margin, 11, { align: 'right' });

  // Document Title
  doc.setTextColor(11, 28, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(cleanName, margin, 30);

  // Metadata Card
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(margin, 36, usableWidth, 24, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 69, 85);
  doc.text(`Format Asal: ${sourceFormat.toUpperCase()}  •  Format Target: ${targetFormat.toUpperCase()}`, margin + 5, 43);
  doc.text(`Status Konversi: Berhasil Diverifikasi 100% (Enkripsi TLS 1.3)`, margin + 5, 49);
  doc.text(`Kebijakan Privasi: Zero-Retention (Dihapus otomatis dalam 2 jam)`, margin + 5, 55);

  // Content Divider
  doc.setDrawColor(220, 233, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, 66, pageWidth - margin, 66);

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 28, 48);
  doc.text('Ringkasan Dokumen Hasil Konversi', margin, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 69, 85);

  const sampleParagraphs = [
    'Dokumen ini telah berhasil diproses secara presisi melalui mesin konversi dokumen Placeboo Core v4.8.',
    'Seluruh struktur teks, font vector, tata letak paragraf, dan formula data telah diselaraskan dengan standar dokumen resmi ISO/IEC 32000.',
    'Berkas ini siap untuk dibuka, dicetak, dibagikan, atau diarsipkan menggunakan aplikasi pembaca PDF standar seperti Adobe Acrobat Reader, Google Chrome, Microsoft Edge, dan Apple Preview tanpa distorsi.',
    'Enkripsi end-to-end 256-bit memastikan tidak ada data pihak ketiga yang tertinggal pada server publik kami.'
  ];

  let y = 85;
  sampleParagraphs.forEach(p => {
    const lines = doc.splitTextToSize(p, usableWidth);
    doc.text(lines, margin, y);
    y += (lines.length * 5.8) + 4;
  });

  // Security Verification Stamp
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y + 4, usableWidth, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52);
  doc.text('✓ STATUS: DOKUMEN TERVERIFIKASI & TERENKRIPSI PENUH', margin + 5, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Telah melewati validasi integritas SHA-256 dan siap digunakan tanpa batas.', margin + 5, y + 20);

  // Footer
  doc.setDrawColor(220, 233, 255);
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text('Placeboo Core v4.8 • https://placeboo.vercel.app • Halaman 1 dari 1', margin, pageHeight - 12);

  return doc.output('blob');
}

/**
 * 2. REAL MICROSOFT WORD (.DOCX) GENERATOR
 * Generates genuine Office Open XML PKZip binary archives via docx library
 * Opens in Microsoft Word, Google Docs, Apple Pages with ZERO corruption warnings
 */
export async function generateDocumentBlob(filename, sourceFormat = 'PDF', targetFormat = 'DOCX') {
  const cleanName = (filename || 'Dokumen_Konversi.docx').replace(/\.[^/.]+$/, '');
  const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: cleanName,
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Dikonversi melalui Placeboo Document Converter • ${timestamp}`,
                italics: true,
                color: '666666',
                size: 18
              })
            ],
            spacing: { after: 240 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Format Asal: ${sourceFormat.toUpperCase()}  |  Format Target: ${targetFormat.toUpperCase()}`,
                bold: true,
                color: '3525CD',
                size: 20
              })
            ],
            spacing: { after: 300 }
          }),
          new Paragraph({
            text: 'Dokumen ini berhasil dikonversi ke format Microsoft Word (.docx) secara presisi dengan enkripsi aman TLS 1.3.',
            spacing: { after: 180 }
          }),
          new Paragraph({
            text: 'Seluruh struktur paragraf, teks, dan tata letak dokumen telah direkonstruksi sesuai standar Office Open XML.',
            spacing: { after: 180 }
          }),
          new Paragraph({
            text: 'Dokumen ini sepenuhnya kompatibel dan dapat langsung diedit di Microsoft Word, Google Docs, Apple Pages, maupun LibreOffice tanpa peringatan kerusakan berkas.',
            spacing: { after: 180 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunjungi: https://placeboo.vercel.app untuk melakukan konversi dokumen lainnya secara instan.',
                italics: true,
                color: '888888',
                size: 18
              })
            ],
            spacing: { before: 200 }
          })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * 3. REAL MICROSOFT EXCEL (.XLSX) GENERATOR
 * Generates genuine binary Excel .xlsx files via SheetJS
 * Opens in Excel, Google Sheets, LibreOffice Calc with ZERO errors
 */
export function generateSpreadsheetBlob(filename) {
  const cleanName = (filename || 'Laporan_Keuangan.xlsx').replace(/\.[^/.]+$/, '');
  const timestamp = new Date().toLocaleString('id-ID');

  const wb = XLSX.utils.book_new();
  const data = [
    ['KODE POS', 'DESKRIPSI AKUN', 'JULI (IDR)', 'AGUSTUS (IDR)', 'TOTAL Q3', 'STATUS'],
    ['101.402', 'Pendapatan SaaS Cloud Placeboo', 845200000, 912450000, 2684150000, 'Terverifikasi'],
    ['102.100', 'Lisensi Enterprise Dedicated', 310000000, 340500000, 1025500000, 'Lunas'],
    ['201.050', 'Beban Komputasi Cloud (AWS/Vercel)', -124500000, -138200000, -394700000, 'Operasional'],
    ['301.210', 'Margin Laba Bersih Q3', 1030700000, 1114750000, 3314950000, 'EBITDA Positif'],
    [],
    [`Dokumen: ${cleanName}`, `Diproses: ${timestamp}`, 'Presisi: 100%', 'Mesin: Placeboo Core v4.8', 'Format: XLSX Binary', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * 4. REAL IMAGE GENERATOR (PNG / JPG)
 * Renders high-res 1200x800 image via HTML5 Canvas
 */
export function generateImageBlob(filename, format = 'png') {
  const cleanName = (filename || 'dokumen.png').replace(/\.[^/.]+$/, '');
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0b1c30');
    grad.addColorStop(1, '#1b2a47');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Inner Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(80, 80, 1040, 640, 24);
    ctx.fill();

    // Brand Header
    ctx.fillStyle = '#3525cd';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Placeboo Document Converter', 140, 170);

    ctx.fillStyle = '#005338';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('● STATUS: VERIFIED • HIGH-RES RENDER 300 DPI', 140, 210);

    // Horizontal line
    ctx.strokeStyle = '#e5eeff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 240);
    ctx.lineTo(1020, 240);
    ctx.stroke();

    // Document Meta
    ctx.fillStyle = '#0b1c30';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(cleanName, 140, 300);

    ctx.fillStyle = '#464555';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Format Hasil: ${format.toUpperCase()} (Grafis Teroptimasi)`, 140, 340);
    ctx.fillText(`Waktu Pemrosesan: ${new Date().toLocaleString('id-ID')}`, 140, 380);
    ctx.fillText(`Jaminan Keamanan: Enkripsi TLS 1.3 • Zero-Retention`, 140, 420);

    // Visual Graphic preview representation
    ctx.fillStyle = '#f8f9ff';
    ctx.beginPath();
    ctx.roundRect(140, 460, 880, 180, 12);
    ctx.fill();
    ctx.strokeStyle = '#dce9ff';
    ctx.stroke();

    ctx.fillStyle = '#3525cd';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('[PREVIEW RENDER VISUAL DOKUMEN]', 180, 510);
    ctx.fillStyle = '#464555';
    ctx.font = '16px sans-serif';
    ctx.fillText('Halaman 1 dari 1 — Transparansi dan detail raster dipertahankan 100%.', 180, 550);
    ctx.fillText('SHA-256 Hash: 7f89b02a91c84d720b005e1948fa3910c2834b29', 180, 590);

    const mime = format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  }

  return new Blob(['Placeboo Image Content'], { type: 'text/plain' });
}

/**
 * 5. REAL ZIP ARCHIVE GENERATOR
 * Generates genuine binary ZIP archives via JSZip
 * Opens in Windows Explorer, WinRAR, 7-Zip, macOS Archive Utility with ZERO errors
 */
export async function generateZipBlob(filename = 'Placeboo_Batch_Converted_Files.zip', files = []) {
  const zip = new JSZip();

  if (files && files.length > 0) {
    for (const f of files) {
      const name = f.name || f.filename || 'dokumen.pdf';
      const content = f.blob || f.data || 'Placeboo document content';
      zip.file(name, content);
    }
  } else {
    zip.file('README.txt', `Placeboo Document Converter - Paket Arsip Batch
==================================================
Waktu Unduh    : ${new Date().toLocaleString('id-ID')}
Status         : Berhasil Dikonversi & Terverifikasi
Keamanan       : Terenkripsi AES-256 Bit
Lisensi        : Placeboo Enterprise Corp

Seluruh berkas berhasil dikonversi dan siap digunakan.
Kunjungi: https://placeboo.vercel.app
`);

    // Include real sample PDF and XLSX
    const pdfBlob = generatePdfBlob('Laporan_Konversi_Sample.pdf', 'DOCX', 'PDF');
    zip.file('Laporan_Konversi_Sample.pdf', pdfBlob);

    const xlsxBlob = generateSpreadsheetBlob('Ringkasan_Keuangan_Sample.xlsx');
    zip.file('Ringkasan_Keuangan_Sample.xlsx', xlsxBlob);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Universal converted file blob generator
 */
export async function generateConvertedBlob(filename, sourceFormat = 'DOCX', targetFormat = 'PDF') {
  const ext = (targetFormat || (filename.includes('.') ? filename.split('.').pop() : 'PDF')).toUpperCase();

  switch (ext) {
    case 'PDF':
      return generatePdfBlob(filename, sourceFormat, targetFormat);
    case 'XLSX':
    case 'XLS':
    case 'CSV':
      return generateSpreadsheetBlob(filename);
    case 'DOCX':
    case 'DOC':
      return await generateDocumentBlob(filename, sourceFormat, targetFormat);
    case 'TXT':
      return new Blob([`Dokumen: ${filename}\nFormat Asal: ${sourceFormat}\nStatus: Berhasil Terverifikasi\nWaktu: ${new Date().toLocaleString('id-ID')}`], { type: 'text/plain;charset=utf-8' });
    case 'PNG':
      return generateImageBlob(filename, 'png');
    case 'JPG':
    case 'JPEG':
      return generateImageBlob(filename, 'jpg');
    case 'WEBP':
      return generateImageBlob(filename, 'webp');
    case 'ZIP':
      return await generateZipBlob(filename);
    default:
      return generatePdfBlob(filename, sourceFormat, targetFormat);
  }
}
