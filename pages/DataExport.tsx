import React from 'react';
import { useStore } from '../store';
import { 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  Database, 
  FileText,
  LayoutGrid,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DataExport: React.FC = () => {
  const { students, backupDatabase, settings } = useStore();

  const MASTER_HEADERS = [
    'cnic', 'name', 'fatherName', 'regNo', 'gender', 'contactNumber', 
    'degree', 'session', 'department', 'programme', 'currentSemester', 'status',
    'supervisorName', 'coSupervisor', 'member1', 'member2', 'thesisId', 
    'synopsis', 'synopsisSubmissionDate', 'gs2CourseWork', 'gs4Form',
    'semiFinalThesisStatus', 'semiFinalThesisSubmissionDate', 
    'finalThesisStatus', 'finalThesisSubmissionDate', 
    'thesisSentToCOE', 'coeSubmissionDate', 
    'validationStatus', 'validationDate', 'comments'
  ];

  const downloadCSV = () => {
    if (students.length === 0) return;
    
    const csvContent = [
      MASTER_HEADERS.join(','),
      ...students.map(s => MASTER_HEADERS.map(header => `"${(s as any)[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CUVAS_Master_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadPDF = async () => {
    if (students.length === 0) return;
    const body = students.map(s => [
      s.regNo || '---',
      s.name,
      s.degree,
      s.programme,
      s.supervisorName || 'Unassigned',
      s.status,
      s.validationStatus
    ]);
    const { generateOfficialPDF } = await import('../utils/pdfExport');
    await generateOfficialPDF({
      reportName: 'Master Scholar Registry Extraction',
      headers: ['Reg #', 'Scholar Name', 'Degree', 'Specialization', 'Supervisor', 'Status', 'Audit'],
      data: body,
      landscape: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100">
            <img 
              src={settings.institution.logo || null} 
              className="w-full h-full object-contain" 
              alt="Logo" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Export Intelligence</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] ml-1">Official Registry Extraction Protocols</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Records</span>
              <span className="text-xl font-black text-indigo-600 tabular-nums">{students.length} Nodes</span>
           </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        
        <ExportCard 
          icon={FileSpreadsheet} 
          title="Global CSV" 
          desc="Full extraction of all 30 scholar data points for deep spreadsheet analysis."
          color="indigo"
          onClick={downloadCSV}
          actionLabel="Extract All Data"
        />

        <ExportCard 
          icon={FileText} 
          title="Master Registry PDF" 
          desc="Professional formatted landscape report optimized for official printing."
          color="rose"
          onClick={downloadPDF}
          actionLabel="Generate Report"
        />

        <ExportCard 
          icon={Database} 
          title="Institutional Backup" 
          desc="Complete system state dump for data redundancy and disaster recovery."
          color="emerald"
          onClick={backupDatabase}
          actionLabel="Execute Backup"
        />

      </div>

      {/* Security Advisory */}
      <div className="bg-[#0f172a] p-12 rounded-xl text-white shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <ShieldCheck size={160} />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 shrink-0">
             <ShieldCheck size={48} className="text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight uppercase">Registry Security Protocol</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
              All data extractions are logged with timestamp and user identity. Ensure all exported files are handled in compliance with institutional data protection policies.
            </p>
          </div>
          <div className="flex-1 flex justify-end">
             <div className="px-6 py-3 bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-400/30 rounded-full">
               System Logging Active
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportCard = ({ icon: Icon, title, desc, color, onClick, actionLabel }: any) => (
  <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500">
    <div className="space-y-8">
      <div className={`p-5 bg-${color}-50 text-${color}-600 rounded-xl w-fit shadow-inner group-hover:bg-${color}-600 group-hover:text-white transition-all duration-500`}>
        <Icon size={32} />
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{title}</h3>
        <p className="text-slate-500 text-xs font-medium mt-4 leading-relaxed">{desc}</p>
      </div>
    </div>
    
    <button 
      onClick={onClick}
      className={`w-full mt-10 py-5 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-${color}-600 transition-all shadow-sm flex items-center justify-center space-x-3 group/btn`}
    >
      <span>{actionLabel}</span>
      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
    </button>
  </div>
);

export default DataExport;