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
    const cuvasLogo = await getBase64ImageFromUrl('/cuvaslogo.png');

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

        // Logo
        if (cuvasLogo) doc.addImage(cuvasLogo, 'PNG', 14, 10, 30, 20);

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
    
    // Load Logos
    const cuvasLogo = await getBase64ImageFromUrl('/cuvaslogo.png');

    const addMinimalHeader = () => {
      const headerY = 16;
      if (cuvasLogo) doc.addImage(cuvasLogo, 'PNG', 14, 10, 25, 18);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      
      const uniTitle = "CHOLISTAN UNIVERSITY OF VETERINARY AND ANIMAL SCIENCES, BAHAWALPUR";
      const splitTitle = doc.splitTextToSize(uniTitle, pageWidth - 80);
      doc.text(splitTitle, pageWidth / 2, headerY, { align: 'center' });
      
      const nextY = headerY + (splitTitle.length * 5);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("DIRECTORATE OF ADVANCED STUDIES", pageWidth / 2, nextY, { align: 'center' });
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(14, 34, pageWidth - 14, 34);
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text("SCHOLAR PROFILE RECORD", pageWidth / 2, 42, { align: 'center' });
    };

    addMinimalHeader();

    let finalY = 52;

    const sections = [
      {
        title: "Personal Identification",
        data: [
          ["Full Name", student.name, "CNIC Number", student.cnic],
          ["Father's Name", student.fatherName, "Gender", student.gender],
          ["Contact No.", student.contactNumber, "Admission Session", student.session]
        ]
      },
      {
        title: "Academic Program Information",
        data: [
          ["Degree Level", student.degree, "Department", student.department],
          ["Major / Specialization", student.programme, "Registration #", student.regNo],
          ["Current Semester", student.currentSemester.toString(), "Academic Status", student.status]
        ]
      },
      {
        title: "Supervision & Committee Details",
        data: [
          ["Major Supervisor", student.supervisorName, "Co-Supervisor", student.coSupervisor || "---"],
          ["Member 1", student.member1 || "---", "Member 2", student.member2 || "---"],
          ["Thesis / Project ID", student.thesisId || "---", "Coursework Status", student.gs2CourseWork]
        ]
      },
      {
        title: "Research Progress Milestones",
        data: [
          ["Synopsis Status", student.synopsis, "Synopsis Approved Date", student.synopsisSubmissionDate || "---"],
          ["GS-4 Progress", student.gs4Form, "Final Thesis Status", student.finalThesisStatus],
          ["Final Submission Date", student.finalThesisSubmissionDate || "---", "COE Dispatch Status", student.thesisSentToCOE]
        ]
      },
      {
        title: "Final Validation & Audit",
        data: [
          ["Validation Status", student.validationStatus, "Validation Date", student.validationDate || "---"]
        ]
      }
    ];

    sections.forEach((section) => {
      // Heading
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 2,
        body: section.data,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
          3: { cellWidth: 55 }
        },
        margin: { left: 14, right: 14 }
      });
      
      finalY = (doc as any).lastAutoTable.finalY + 10;
    });

    // Remarks
    if (finalY > pageHeight - 30) doc.addPage();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Directorate Remarks:", 14, finalY);
    doc.setFont('helvetica', 'normal');
    const remarksLines = doc.splitTextToSize(student.comments || "---", pageWidth - 28);
    doc.text(remarksLines, 14, finalY + 5);

    // Footer
    const addFooter = (doc: any) => {
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentDateTime = new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).replace(',', '');
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text(`Report Generated by Directorate of Advanced Studies, CUVAS | ${currentDateTime}`, 14, pageHeight - 12);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
      }
    };

    addFooter(doc);

    // Watermark
    if (cuvasLogo) {
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        doc.setGState(new GState({ opacity: 0.04 }));
        doc.addImage(cuvasLogo, 'JPEG', (pageWidth - 60) / 2, (pageHeight - 60) / 2, 60, 60);
        doc.restoreGraphicsState();
      }
    }

    doc.save(`Student_Profile_${student.regNo.replace(/\//g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error("Minimalist PDF Export Error", err);
    return false;
  }
};
