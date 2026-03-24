
import React from 'react';
import { useStore } from '../store';
import { FileBarChart, FileText, PieChart, Users, Download, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SystemReports: React.FC = () => {
  const { students, settings } = useStore();

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
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

  const downloadPDF = (reportName: string, data: any[]) => {
    if (data.length === 0) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.institution.name.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.institution.directorate.toUpperCase(), pageWidth / 2, 26, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(reportName, pageWidth / 2, 32, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 37, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 41, pageWidth - 20, 41);

    // Table
    const headers = [Object.keys(data[0])];
    const body = data.map(row => Object.values(row)) as any[][];

    autoTable(doc, {
      startY: 46,
      head: headers,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  const getProgrammeSummaryData = () => {
    const summary = students.reduce((acc: any, s) => {
      const key = `${s.department} - ${s.programme}`;
      if (!acc[key]) acc[key] = { Programme: key, Total: 0, Active: 0, Completed: 0 };
      acc[key].Total++;
      if (s.status === 'Active') acc[key].Active++;
      if (s.status === 'Completed') acc[key].Completed++;
      return acc;
    }, {});
    return Object.values(summary);
  };

  const getProgressReportData = () => {
    return students.map(s => ({
      Name: s.name,
      RegNo: s.regNo,
      Degree: s.degree,
      Semester: s.currentSemester,
      Status: s.status,
      Validation: s.validationStatus,
      Synopsis: s.synopsis
    }));
  };

  const getPendingRequirementsData = () => {
    return students.filter(s => s.validationStatus !== 'Approved' || s.synopsis === 'Not Submitted').map(s => ({
      Name: s.name,
      RegNo: s.regNo,
      Status: s.status,
      Validation: s.validationStatus,
      Synopsis: s.synopsis
    }));
  };

  const getSupervisorReportData = () => {
    const data = students.reduce((acc: any, s) => {
      if (!acc[s.supervisorName]) acc[s.supervisorName] = { Supervisor: s.supervisorName, Students: 0 };
      acc[s.supervisorName].Students++;
      return acc;
    }, {});
    return Object.values(data);
  };

  const reportOptions = [
    { 
      title: 'Programme Summary', 
      desc: 'Aggregated totals per department and programme.', 
      icon: PieChart, 
      data: getProgrammeSummaryData(),
      filename: 'programme_summary'
    },
    { 
      title: 'Progress Report', 
      desc: 'Overview of MPhil and PhD advancement status.', 
      icon: FileBarChart, 
      data: getProgressReportData(),
      filename: 'degree_progress'
    },
    { 
      title: 'Pending Milestone', 
      desc: 'Registrants with overdue forms or milestones.', 
      icon: FileText, 
      data: getPendingRequirementsData(),
      filename: 'pending_requirements'
    },
    { 
      title: 'Workload Report', 
      desc: 'Analysis of active supervisory assignments.', 
      icon: Users, 
      data: getSupervisorReportData(),
      filename: 'supervisor_workload'
    },
  ];

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="no-print space-y-8 md:space-y-10">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100 dark:border-slate-700">
            <img 
              src={settings.institution.logo || null} 
              className="w-full h-full object-contain" 
              alt="Logo" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Institutional Analytics</h1>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 md:mt-1">Authorized extraction of institutional academic metrics.</p>
          </div>
        </div>

        {/* Grid optimized for Tablets (2x2 on md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {reportOptions.map((opt, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm p-8 md:p-10 group relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                <opt.icon size={60} className="md:w-20 md:h-20 text-slate-900 dark:text-white" />
              </div>
              <div>
                <div className="flex items-start justify-between mb-6 md:mb-8">
                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <opt.icon size={24} className="md:w-7 md:h-7" />
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">{opt.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] md:text-xs font-medium mt-2 leading-relaxed">{opt.desc}</p>
              </div>
              
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-50 dark:border-slate-800 grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={() => downloadCSV(opt.data, `${opt.filename}.csv`)}
                  className="py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <Download size={14} />
                  <span>Download CSV</span>
                </button>
                <button 
                  onClick={() => downloadPDF(opt.title, opt.data)}
                  className="py-3.5 md:py-4 bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <FileText size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Master Registry Card - Optimized for Tablet width */}
        <div className="bg-[#0f172a] dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-xl text-white shadow-sm relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
          <div className="flex items-center space-x-4 mb-6 md:mb-8">
             <div className="p-3 bg-white/5 rounded-xl">
               <ShieldCheck size={24} className="text-indigo-400" />
             </div>
             <div>
               <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">Master Registry Extraction</h3>
               <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1">Authorized Official Data Purge</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative z-10">
             <button 
               onClick={() => downloadCSV(getProgressReportData(), 'master_registry_full.csv')}
               className="flex-1 py-5 md:py-6 bg-white/5 text-white rounded-xl font-black text-[11px] md:text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 md:space-x-4 hover:bg-white/20 active:scale-95 shadow-sm"
             >
                <FileText size={20} className="md:w-6 md:h-6" />
                <span>Download Global CSV</span>
             </button>
             <button 
               onClick={() => downloadPDF('Institutional Scholar Master Registry', getProgressReportData())}
               className="flex-1 py-5 md:py-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black text-[11px] md:text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 md:space-x-4 active:scale-95 shadow-sm"
             >
                <FileText size={20} className="md:w-6 md:h-6" />
                <span>Download Global PDF</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 

export default SystemReports;
