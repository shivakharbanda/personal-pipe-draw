import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PipelineComponent, DesignError } from '../types';

export const generateAnalysisReport = async (
  originalImage: string,
  updatedImage: string,
  components: PipelineComponent[],
  errors: DesignError[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page 1: Title and Images Side-by-Side
  pdf.setFontSize(20);
  pdf.setTextColor(31, 41, 55); // neutral-800
  pdf.text('IsoGuard AI - Analysis Report', 105, 20, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(115, 115, 115); // neutral-500
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  pdf.text(`Generated: ${date}`, 105, 28, { align: 'center' });

  // Add images side by side
  const imgWidth = 80;
  const imgHeight = 60;

  // Original image (left)
  pdf.setFontSize(12);
  pdf.setTextColor(75, 85, 99);
  pdf.text('Original Drawing', 25, 40);
  pdf.addImage(originalImage, 'PNG', 15, 45, imgWidth, imgHeight);

  // Corrected image (right)
  pdf.text('Corrected Drawing', 120, 40);
  pdf.addImage(updatedImage, 'PNG', 110, 45, imgWidth, imgHeight);

  // Page 2: Components Table
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Recognized Components', 15, 20);

  autoTable(pdf, {
    startY: 30,
    head: [['Type', 'Name', 'Description']],
    body: components.map(c => [c.type, c.name, c.description]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [8, 145, 178], textColor: 255 }, // cyan-600
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' }
    }
  });

  // Page 3: Design Issues
  if (errors.length > 0) {
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Design Issues & Recommendations', 15, 20);

    autoTable(pdf, {
      startY: 30,
      head: [['Category', 'Issue', 'Recommendation', 'Confidence']],
      body: errors.map(e => [
        e.category,
        e.description,
        e.recommendation,
        `${(e.confidence * 100).toFixed(0)}%`
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [185, 28, 28], textColor: 255 }, // red-700
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 }
      }
    });
  } else {
    // Add compliant message if no errors
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Design Issues & Recommendations', 15, 20);

    pdf.setFontSize(12);
    pdf.setTextColor(13, 148, 136); // teal-600
    pdf.text('No design issues detected - Drawing is compliant!', 15, 40);
  }

  // Footer on all pages
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      `IsoGuard AI v2.1 | Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  // Save PDF
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  pdf.save(`isoguard-analysis-report-${timestamp}.pdf`);
};
