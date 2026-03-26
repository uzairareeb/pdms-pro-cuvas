import React, { useState } from 'react';
import { useStore } from '../store';
import { FileBarChart, FileText, PieChart, Users, Download, ShieldCheck, Filter, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const SystemReports: React.FC = () => {
  const { students, settings } = useStore();
  const [statusFilter, setStatusFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const programs = ['All', ...Array.from(new Set(students.map(s => s.programme)))];
  const statuses = ['All', 'Active', 'Completed', 'Dropped', 'Suspended'];

  const filterStudents = () => {
    return students.filter(s => {
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchProgram = programFilter === 'All' || s.programme === programFilter;
      return matchStatus && matchProgram;
    });
  };

  const getFilteredData = (type: string) => {
    const filtered = filterStudents();
    switch (type) {
      case 'Programme Summary':
        const summary = filtered.reduce((acc: any, s) => {
          const key = `${s.department} - ${s.programme}`;
          if (!acc[key]) acc[key] = { Programme: key, Total: 0, Active: 0, Completed: 0 };
          acc[key].Total++;
          if (s.status === 'Active') acc[key].Active++;
          if (s.status === 'Completed') acc[key].Completed++;
          return acc;
        }, {});
        return Object.values(summary);

      case 'Progress Report':
        return filtered.map(s => ({
          Name: s.name,
          RegNo: s.regNo,
          Degree: s.degree,
          Semester: s.currentSemester || 'N/A',
          Status: s.status,
          Validation: s.validationStatus || 'Pending',
          Synopsis: s.synopsis || 'Not Submitted'
        }));

      case 'Pending Milestone':
        return filtered.filter(s => s.validationStatus !== 'Approved' || s.synopsis === 'Not Submitted').map(s => ({
          Name: s.name,
          RegNo: s.regNo,
          Status: s.status,
          Validation: s.validationStatus || 'Pending',
          Synopsis: s.synopsis || 'Not Submitted'
        }));

      case 'Workload Report':
        const workload = filtered.reduce((acc: any, s) => {
          const sup = s.supervisorName || 'Unassigned';
          if (!acc[sup]) acc[sup] = { Supervisor: sup, Students: 0 };
          acc[sup].Students++;
          return acc;
        }, {});
        return Object.values(workload);

      case 'Master Registry':
        return filtered.map(s => ({
          Name: s.name,
          RegNo: s.regNo,
          Degree: s.degree,
          Department: s.department,
          Status: s.status
        }));
      default:
        return [];
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = ['Sr. No.', ...Object.keys(data[0])];
    const csvContent = [
      headers.join(','),
      ...data.map((row, index) => headers.map((header) => {
        if (header === 'Sr. No.') return index + 1;
        return `"${row[header] || ''}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async (reportName: string, data: any[]) => {
    if (data.length === 0) return;
    setIsGenerating(reportName);
    
    try {
      // 1. Prepare Data & Add Sr. No.
      const headers = ['Sr. No.', ...Object.keys(data[0])];
      const body = data.map((row, index) => {
        const rowData = Object.values(row);
        rowData.unshift(index + 1); // Insert Sr. No at start
        return rowData;
      }) as any[][];

      // 2. Initialize PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Load Logos
      const hecLogo = await getBase64ImageFromUrl('/hec-logo.png');
      const cuvasLogo = await getBase64ImageFromUrl('/logo.jpg');

      const brandGreen: [number, number, number] = [6, 95, 70]; // text-emerald-800
      const brandAccent: [number, number, number] = [20, 184, 166]; // text-teal-500

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
        startY: 65,
        head: [headers],
        body: body,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          font: 'helvetica',
          cellPadding: 4,
        },
        headStyles: { 
          fillColor: brandGreen, 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 } // Sr No. centered
        },
        alternateRowStyles: { 
          fillColor: [240, 253, 244] // tailwind green-50
        },
        margin: { top: 65, bottom: 25 },
        didDrawPage: function (data) {
          addBackgroundWatermark();
          
          // Header Section (Repeated on each page but we can optionally only draw it on page 1)
          // We will draw it on every page to ensure PDF is robust
          
          // Header Background
          doc.setFillColor(248, 250, 252); // slate-50
          doc.rect(0, 0, pageWidth, 55, 'F');

          // Logos
          if (cuvasLogo) doc.addImage(cuvasLogo, 'JPEG', 15, 10, 26, 26);
          if (hecLogo) doc.addImage(hecLogo, 'PNG', pageWidth - 41, 10, 26, 26);

          // Header Text
          doc.setTextColor(brandGreen[0], brandGreen[1], brandGreen[2]);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text("CHOLISTAN UNIVERSITY OF VETERINARY AND ANIMAL SCIENCES", pageWidth / 2, 18, { align: 'center' });
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text("DIRECTORATE OF ADVANCED STUDIES", pageWidth / 2, 25, { align: 'center' });
          
          // Report Title
          doc.setTextColor(15, 23, 42); // slate-900
          doc.setFontSize(16);
          doc.text(reportName.toUpperCase(), pageWidth / 2, 35, { align: 'center' });
          
          // Meta info
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(`Generated Date: ${new Date().toLocaleString()}`, pageWidth / 2, 43, { align: 'center' });
          doc.text("Generated By: Directorate of Advanced Studies, CUVAS", pageWidth / 2, 48, { align: 'center' });

          // Divider
          doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
          doc.setLineWidth(0.5);
          doc.line(15, 55, pageWidth - 15, 55);

          // Footer
          const pageNumber = data.pageNumber;
          // Total pages can be populated if we use putTotalPages
          const str = 'Page ' + pageNumber;
          
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text("This is a system-generated report.", 15, pageHeight - 12);
          doc.text(str, pageWidth - 15, pageHeight - 12, { align: 'right' });
          
          // Bottom brand line
          doc.setDrawColor(brandGreen[0], brandGreen[1], brandGreen[2]);
          doc.setLineWidth(1);
          doc.line(0, pageHeight - 2, pageWidth, pageHeight - 2);
        }
      });

      // Save PDF
      doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(null);
    }
  };

  const reportOptions = [
    { 
      title: 'Programme Summary', 
      desc: 'Aggregated totals per department and programme.', 
      icon: PieChart, 
      data: getFilteredData('Programme Summary'),
      filename: 'programme_summary'
    },
    { 
      title: 'Progress Report', 
      desc: 'Overview of MPhil and PhD advancement status.', 
      icon: FileBarChart, 
      data: getFilteredData('Progress Report'),
      filename: 'degree_progress'
    },
    { 
      title: 'Pending Milestone', 
      desc: 'Registrants with overdue forms or milestones.', 
      icon: FileText, 
      data: getFilteredData('Pending Milestone'),
      filename: 'pending_requirements'
    },
    { 
      title: 'Workload Report', 
      desc: 'Analysis of active supervisory assignments.', 
      icon: Users, 
      data: getFilteredData('Workload Report'),
      filename: 'supervisor_workload'
    },
  ];

  const totalFiltered = filterStudents().length;

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="no-print space-y-8 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-white dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
              <img 
                src={settings.institution.logo || '/logo.jpg'} 
                className="w-full h-full object-contain" 
                alt="Logo" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight uppercase">System Reports</h1>
              <p className="text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] mt-1">Export structured analytics & official summaries</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center pl-3">
              <Filter size={16} className="text-slate-400 mr-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-3">Filters</span>
            </div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300 min-w-32"
            >
              {programs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300 min-w-32"
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic Summary Section */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 p-6 flex items-center justify-between">
            <p className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
              <span className="font-extrabold text-lg mr-2">{totalFiltered}</span>
              Records match your current filters. Reports will be generated strictly based on this subset.
            </p>
        </div>

        {/* Grid optimized for Tablets (2x2 on md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {reportOptions.map((opt, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 md:p-10 group relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <opt.icon size={120} className="text-emerald-900 dark:text-emerald-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6 md:mb-8">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    <opt.icon size={28} className="md:w-7 md:h-7" />
                  </div>
                </div>
                <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{opt.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-2 leading-relaxed">{opt.desc}</p>
                
                <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-slate-400">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">Rows: {opt.data.length}</span>
                </div>
              </div>
              
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 relative z-10">
                <button 
                  onClick={() => downloadCSV(opt.data, `${opt.filename}.csv`)}
                  disabled={opt.data.length === 0}
                  className="py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={() => downloadPDF(opt.title, opt.data)}
                  disabled={isGenerating === opt.title || opt.data.length === 0}
                  className="py-3.5 md:py-4 bg-emerald-600 dark:bg-emerald-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {isGenerating === opt.title ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : (
                     <FileText size={16} />
                  )}
                  <span>{isGenerating === opt.title ? 'Generating...' : 'Professional PDF'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Master Registry Card */}
        <div className="bg-emerald-950 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-2xl text-white shadow-lg relative overflow-hidden border border-emerald-900/50">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
          <div className="flex items-center space-x-4 mb-6 md:mb-8 relative z-10">
             <div className="p-3 bg-white/10 rounded-xl border border-white/5">
               <ShieldCheck size={28} className="text-emerald-400" />
             </div>
             <div>
               <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase text-emerald-50">Master Registry Data Purge</h3>
               <p className="text-emerald-400/80 text-[10px] md:text-[11px] font-black uppercase tracking-widest mt-1">Comprehensive Official Extract ({totalFiltered} records)</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative z-10 mt-6">
             <button 
               onClick={() => downloadCSV(getFilteredData('Master Registry'), 'master_registry_full.csv')}
               disabled={totalFiltered === 0}
               className="flex-1 py-4 md:py-5 bg-white/5 text-emerald-100 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 hover:bg-white/10 active:scale-95 shadow-sm border border-emerald-800/30 disabled:opacity-50"
             >
                <Download size={18} />
                <span>Raw CSV Outline</span>
             </button>
             <button 
               onClick={() => downloadPDF('Institutional Scholar Master Registry', getFilteredData('Master Registry'))}
               disabled={isGenerating === 'Institutional Scholar Master Registry' || totalFiltered === 0}
               className="flex-1 py-4 md:py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 active:scale-95 shadow-lg border border-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isGenerating === 'Institutional Scholar Master Registry' ? (
                   <Loader2 size={18} className="animate-spin" />
                ) : (
                   <FileText size={18} />
                )}
                <span>{isGenerating === 'Institutional Scholar Master Registry' ? 'Processing PDF...' : 'Generate Official PDF'}</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 

export default SystemReports;
