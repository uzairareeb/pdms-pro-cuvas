import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '../types';

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

    doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Failed to generate PDF. Check console for details.");
    return false;
  }
};

export const generateStudentProfilePDF = async (student: Student) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Brand Colors
    const brandIndigo: [number, number, number] = [79, 70, 229]; // indigo-600
    const brandSlate: [number, number, number] = [15, 23, 42]; // slate-900 
    const textGray: [number, number, number] = [100, 116, 139]; // slate-500
    const lightIndigo: [number, number, number] = [245, 247, 255]; // very light indigo
    
    // Load Logos
    const cuvasLogo = await getBase64ImageFromUrl('/logo.jpg');
    const hecLogo = await getBase64ImageFromUrl('/hec-logo.png');

    // 1. Institutional Header (Compact)
    const addInstitutionalHeader = () => {
      if (cuvasLogo) doc.addImage(cuvasLogo, 'JPEG', 14, 10, 18, 18);
      if (hecLogo) doc.addImage(hecLogo, 'PNG', pageWidth - 32, 10, 18, 18);
      
      doc.setTextColor(brandSlate[0], brandSlate[1], brandSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("CHOLISTAN UNIVERSITY OF VETERINARY AND ANIMAL SCIENCES, BAHAWALPUR", pageWidth / 2, 16, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("DIRECTORATE OF ADVANCED STUDIES", pageWidth / 2, 21, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, 32, pageWidth - 14, 32);
    };

    addInstitutionalHeader();

    // 2. Student Hero Section (Reference Style)
    doc.setTextColor(brandSlate[0], brandSlate[1], brandSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(student.name.toUpperCase(), 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(brandIndigo[0], brandIndigo[1], brandIndigo[2]);
    doc.text(`Scholar / Post-Graduate Student`, 14, 51);
    
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Contact: ${student.contactNumber || 'N/A'}`, 14, 58);
    doc.text(` | `, 65, 58);
    doc.text(`Status: ${student.status}`, 70, 58);
    doc.text(` | `, 115, 58);
    doc.text(`Reg No: ${student.regNo}`, 120, 58);

    let finalY = 68;

    const sections = [
      {
        id: 'identity',
        title: "Personal Information",
        data: [
          ["Full Name", student.name, "CNIC Number", student.cnic],
          ["Father's Name", student.fatherName, "Gender", student.gender],
          ["Contact Protocol", student.contactNumber, "Admission Session", student.session]
        ]
      },
      {
        id: 'academic',
        title: "Academic Programme",
        data: [
          ["Degree Level", student.degree, "Department", student.department],
          ["Programme", student.programme, "Current Semester", student.currentSemester.toString()],
          ["Official Validation", student.validationStatus, "Validation Date", student.validationDate || '---']
        ]
      },
      {
        id: 'research',
        title: "Governance & Supervision",
        data: [
          ["Lead Supervisor", student.supervisorName, "Co-Supervisor", student.coSupervisor || "---"],
          ["Committee Mem 01", student.member1 || "---", "Committee Mem 02", student.member2 || "---"],
          ["Thesis / Res ID", student.thesisId || "---", "GS-2 Coursework", student.gs2CourseWork]
        ]
      },
      {
        id: 'milestones',
        title: "Research & Dissertation Roadmap",
        data: [
          ["Synopsis Status", student.synopsis, "Synopsis Date", student.synopsisSubmissionDate || "---"],
          ["GS-4 Progress", student.gs4Form, "Dissertation Status", student.finalThesisStatus],
          ["Submission Date", student.finalThesisSubmissionDate || "---", "COE Transmission", student.thesisSentToCOE]
        ]
      }
    ];

    sections.forEach((section) => {
      // Draw Section Header
      doc.setFillColor(lightIndigo[0], lightIndigo[1], lightIndigo[2]);
      doc.rect(14, finalY, pageWidth - 28, 8, 'F');
      
      doc.setTextColor(brandIndigo[0], brandIndigo[1], brandIndigo[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(section.title.toUpperCase(), 18, finalY + 5.5);
      
      autoTable(doc, {
        startY: finalY + 8,
        body: section.data,
        theme: 'plain',
        styles: { 
          fontSize: 8, 
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
          textColor: [15, 23, 42],
        },
        columnStyles: {
          0: { fontStyle: 'normal', textColor: textGray, cellWidth: 35 },
          1: { fontStyle: 'bold', cellWidth: 55 },
          2: { fontStyle: 'normal', textColor: textGray, cellWidth: 35 },
          3: { fontStyle: 'bold', cellWidth: 55 }
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.row.index % 1 === 0) {
             data.cell.styles.lineWidth = { bottom: 0.1 };
             data.cell.styles.lineColor = [241, 245, 249]; // slate-100
          }
        }
      });
      
      finalY = (doc as any).lastAutoTable.finalY + 12;
    });

    // Remarks Section
    if (finalY > pageHeight - 40) doc.addPage();
    
    doc.setTextColor(brandIndigo[0], brandIndigo[1], brandIndigo[2]);
    doc.setFont('helvetica', 'bold');
    doc.text("SYSTEM REMARKS & VALIDATION", 14, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const remarks = student.comments || "No internal comments or administrative directives recorded for this scholar profile.";
    const splitRemarks = doc.splitTextToSize(remarks, pageWidth - 28);
    doc.text(splitRemarks, 14, finalY + 6);

    // Footer
    const addFooter = (doc: any) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated on ${new Date().toLocaleString()} | PDMS Official Academic Record`, 14, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        
        doc.setDrawColor(brandIndigo[0], brandIndigo[1], brandIndigo[2]);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
      }
    };

    addFooter(doc);

    // Subtle Watermark
    if (cuvasLogo) {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        doc.setGState(new GState({ opacity: 0.02 }));
        doc.addImage(cuvasLogo, 'JPEG', (pageWidth - 60) / 2, (pageHeight - 60) / 2, 60, 60);
        doc.restoreGraphicsState();
      }
    }

    doc.save(`Profile_${student.regNo.replace(/\//g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error("Profile PDF Overhaul Error", err);
    return false;
  }
};
