import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Reusable logo fetching utility
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string));
      reader.addEventListener("error", (err) => reject(err));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to load image", err);
    return '';
  }
};

interface PDFExportOptions {
  reportName: string;
  headers: string[];
  data: any[][];
  landscape?: boolean;
}

export const generateOfficialPDF = async ({ reportName, headers, data, landscape = false }: PDFExportOptions) => {
  if (data.length === 0) return;
  
  try {
    // 1. Prepare Data & Add Sr. No.
    const finalHeaders = ['Sr. No.', ...headers];
    const body = data.map((row, index) => {
      return [index + 1, ...row];
    });

    // 2. Initialize PDF
    const orientation = landscape ? 'l' : 'p';
    const doc = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Load Logos
    const hecLogo = await getBase64ImageFromUrl('/hec-logo.png');
    const cuvasLogo = await getBase64ImageFromUrl('/logo.jpg');

    const brandPrimary: [number, number, number] = [15, 23, 42]; // slate-900 
    const brandAccent: [number, number, number] = [79, 70, 229]; // indigo-600

    // Add Watermark helper
    const addBackgroundWatermark = () => {
      if (cuvasLogo) {
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        doc.setGState(new GState({ opacity: 0.05 }));
        // Center watermark
        const size = 120;
        doc.addImage(cuvasLogo, 'JPEG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size);
        doc.restoreGraphicsState();
      }
    };

    // Configuration for autoTable to draw custom headers and footers
    autoTable(doc, {
      startY: 62,
      head: [finalHeaders],
      body: body,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        font: 'helvetica',
        cellPadding: 3,
      },
      headStyles: { 
        fillColor: brandPrimary, 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 } // Sr No. centered
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] // slate-50
      },
      margin: { top: 62, bottom: 25, left: 14, right: 14 },
      didDrawPage: function (data) {
        addBackgroundWatermark();
        
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 55, 'F');

        // Logos
        if (cuvasLogo) doc.addImage(cuvasLogo, 'JPEG', 14, 10, 24, 24);
        if (hecLogo) doc.addImage(hecLogo, 'PNG', pageWidth - 38, 10, 24, 24);

        // Header Text
        doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
        doc.setFont('helvetica', 'bold');
        
        // Split university name to fit perfectly between logos
        doc.setFontSize(13);
        const uniTitle = "CHOLISTAN UNIVERSITY OF VETERINARY AND ANIMAL SCIENCES, BAHAWALPUR";
        const splitTitle = doc.splitTextToSize(uniTitle, pageWidth - 90);
        
        let yPos = 18;
        doc.text(splitTitle, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += (splitTitle.length * 6) + 1; // Adjust Y based on lines
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text("DIRECTORATE OF ADVANCED STUDIES", pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 8;
        // Report Title
        doc.setTextColor(brandAccent[0], brandAccent[1], brandAccent[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(reportName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 6;
        // Meta info
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Generated: ${new Date().toLocaleString()} | By: Directorate of Advanced Studies, CUVAS`, pageWidth / 2, yPos, { align: 'center' });

        // Divider
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(14, 55, pageWidth - 14, 55);

        // Footer
        const pageNumber = data.pageNumber;
        const str = 'Page ' + pageNumber;
        
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("This is a system-generated report.", 14, pageHeight - 12);
        doc.text(str, pageWidth - 14, pageHeight - 12, { align: 'right' });
        
        // Bottom brand line
        doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
        doc.setLineWidth(1);
        doc.line(0, pageHeight - 2, pageWidth, pageHeight - 2);
      }
    });

    // Save PDF
    doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Failed to generate PDF. Check console for details.");
    return false;
  }
};
