import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '../types';

// ─── REUSABLE UTILITIES ──────────────────────────────────────────────────────

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

const BRAND_PRIMARY: [number, number, number] = [15, 23, 42]; // slate-900 
const BRAND_ACCENT: [number, number, number] = [79, 70, 229];  // indigo-600

/**
 * Standard Header for all Official CUVAS Reports
 */
const drawOfficialHeader = (doc: jsPDF, reportName: string, cuvasLogo: string, hecLogo: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Clean header area
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 58, 'F');

  // 1. Logos (Symmetric Placement)
  const logoSize = 18;
  const logoY = 12;
  if (cuvasLogo) doc.addImage(cuvasLogo, 'PNG', 15, logoY, logoSize * 1.5, logoSize);
  if (hecLogo) doc.addImage(hecLogo, 'PNG', pageWidth - 15 - (logoSize * 1.2), logoY, logoSize * 1.2, logoSize);

  // 2. University Title
  doc.setTextColor(BRAND_PRIMARY[0], BRAND_PRIMARY[1], BRAND_PRIMARY[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const uniTitle = "CHOLISTAN UNIVERSITY OF VETERINARY AND ANIMAL SCIENCES, BAHAWALPUR";
  const splitTitle = doc.splitTextToSize(uniTitle, pageWidth - 80);
  doc.text(splitTitle, pageWidth / 2, 18, { align: 'center' });

  // 3. Directorate Subtitle
  let yPos = 18 + (splitTitle.length * 5);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("DIRECTORATE OF ADVANCED STUDIES", pageWidth / 2, yPos, { align: 'center' });

  // 4. Report Title (Prominent)
  yPos += 10;
  doc.setTextColor(BRAND_ACCENT[0], BRAND_ACCENT[1], BRAND_ACCENT[2]);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(reportName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });

  // 5. Metadata Path
  yPos += 6;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  const genDate = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  doc.text(`Registry Export | Generated: ${genDate} | Authority: DAS CUVAS`, pageWidth / 2, yPos, { align: 'center' });

  // 6. Divider Line
  yPos += 5;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
};

const drawOfficialFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.text("© 2026 CUVAS PostGrad Hub - Official Advanced Studies Record", 15, pageHeight - 12);
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 15, pageHeight - 12, { align: 'right' });

  // Accent Bottom Line
  doc.setDrawColor(BRAND_ACCENT[0], BRAND_ACCENT[1], BRAND_ACCENT[2]);
  doc.setLineWidth(1.2);
  doc.line(0, pageHeight - 2, pageWidth, pageHeight - 2);
};

const drawWatermark = (doc: jsPDF, cuvasLogo: string) => {
  if (!cuvasLogo) return;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.saveGraphicsState();
  const GState = (doc as any).GState;
  doc.setGState(new GState({ opacity: 0.04 }));
  const size = 100;
  doc.addImage(cuvasLogo, 'PNG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size * 0.7);
  doc.restoreGraphicsState();
};

// ─── EXPORT FUNCTIONS ────────────────────────────────────────────────────────

interface PDFExportOptions {
  reportName: string;
  headers: string[];
  data: any[][];
  landscape?: boolean;
}

export const generateOfficialPDF = async ({ reportName, headers, data, landscape = false }: PDFExportOptions) => {
  if (data.length === 0) return;
  
  try {
    const cuvasLogo = await getBase64ImageFromUrl('/cuvaslogo.png');
    const hecLogo = await getBase64ImageFromUrl('/hec-logo.png');

    const orientation = landscape ? 'l' : 'p';
    const doc = new jsPDF(orientation, 'mm', 'a4');
    
    // Add Serial Numbers
    const body = data.map((row, index) => [index + 1, ...row]);
    const finalHeaders = ['Sr. No.', ...headers];

    autoTable(doc, {
      startY: 65,
      head: [finalHeaders],
      body: body,
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
      headStyles: { fillColor: BRAND_PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 65, bottom: 25, left: 15, right: 15 },
      didDrawPage: (data) => {
        drawWatermark(doc, cuvasLogo);
        drawOfficialHeader(doc, reportName, cuvasLogo, hecLogo);
        drawOfficialFooter(doc, data.pageNumber, (doc as any).internal.getNumberOfPages());
      }
    });

    doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    return true;
  } catch (err) {
    console.error("Official PDF Export Failure", err);
    return false;
  }
};

export const generateStudentProfilePDF = async (student: Student) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const cuvasLogo = await getBase64ImageFromUrl('/cuvaslogo.png');
    const hecLogo = await getBase64ImageFromUrl('/hec-logo.png');

    const sections = [
      { title: "Personal Identification", data: [["Full Name", student.name, "CNIC Number", student.cnic], ["Father's Name", student.fatherName, "Gender", student.gender], ["Contact No.", student.contactNumber, "Admission Session", student.session]] },
      { title: "Academic Program", data: [["Degree Level", student.degree, "Department", student.department], ["Major / Specialization", student.programme, "Registration #", student.regNo], ["Current Semester", student.currentSemester.toString(), "Academic Status", student.status]] },
      { title: "Supervision Details", data: [["Major Supervisor", student.supervisorName, "Co-Supervisor", student.coSupervisor || "---"], ["Member 1", student.member1 || "---", "Member 2", student.member2 || "---"], ["Thesis / Project ID", student.thesisId || "---", "Coursework Status", student.gs2CourseWork]] },
      { title: "Research Progress", data: [["Synopsis Status", student.synopsis, "Synopsis Approved Date", student.synopsisSubmissionDate || "---"], ["GS-4 Progress", student.gs4Form, "Final Thesis Status", student.finalThesisStatus], ["Final Submission Date", student.finalThesisSubmissionDate || "---", "COE Dispatch Status", student.thesisSentToCOE]] },
      { title: "Audit Verification", data: [["Validation Status", student.validationStatus, "Validation Date", student.validationDate || "---"]] }
    ];

    let currentY = 65;

    sections.forEach((section, sIndex) => {
      // Draw Section Heading
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 7, 'F');
      doc.setTextColor(BRAND_ACCENT[0], BRAND_ACCENT[1], BRAND_ACCENT[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title.toUpperCase(), 18, currentY + 5);

      autoTable(doc, {
        startY: currentY + 7,
        body: section.data,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, textColor: BRAND_PRIMARY, lineColor: [226, 232, 240], lineWidth: 0.1 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [250, 251, 254], cellWidth: 35 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', fillColor: [250, 251, 254], cellWidth: 35 },
          3: { cellWidth: 55 }
        },
        margin: { left: 15, right: 15 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    });

    // Remarks Section
    if (student.comments) {
      if (currentY > 240) doc.addPage();
      doc.setTextColor(BRAND_PRIMARY[0], BRAND_PRIMARY[1], BRAND_PRIMARY[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("DIRECTORATE REMARKS:", 15, currentY);
      doc.setFont('helvetica', 'normal');
      const remarksLines = doc.splitTextToSize(student.comments, doc.internal.pageSize.getWidth() - 30);
      doc.text(remarksLines, 15, currentY + 5);
    }

    // Add Branded Elements to All Pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawWatermark(doc, cuvasLogo);
        drawOfficialHeader(doc, "Scholar Profile Record", cuvasLogo, hecLogo);
        drawOfficialFooter(doc, i, totalPages);
    }

    doc.save(`Profile_${student.regNo.replace(/\//g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error("Student Profile Export Failure", err);
    return false;
  }
};
