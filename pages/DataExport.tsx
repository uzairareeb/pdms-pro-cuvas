
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  Database, 
  FileText,
  LayoutGrid,
  ChevronRight,
  GraduationCap,
  Filter,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Settings2,
  Lock,
  ArrowRight,
  X,
  Printer
} from 'lucide-react';
import { Student, StudentStatus, Gender } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utility Components ---
const FilterSelect = ({ label, value, icon: Icon, options, onChange }: any) => {
  const active = Boolean(value && value !== 'all');
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
          <Icon size={14} />
        </div>
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={`w-full pl-10 pr-9 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all border
            ${active
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 focus:ring-4 focus:ring-indigo-500/10'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/8'
            }`}
        >
          <option value="all">Global (All)</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none">
      <Icon size={80} className="text-white" />
    </div>
    <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none mb-1">{value}</h4>
  </div>
);

const DataExport: React.FC = () => {
  const { students, backupDatabase, settings, logAction, degrees, departments, notify } = useStore();

  // Filter State
  const [filterDegree, setFilterDegree] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  
  // Export Configuration
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeAcademics, setIncludeAcademics] = useState(true);
  const [includeSupervisor, setIncludeSupervisor] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchDegree = filterDegree === 'all' || s.degree === filterDegree;
      const matchDept = filterDept === 'all' || s.department === filterDept;
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchGender = filterGender === 'all' || s.gender === filterGender;
      return matchDegree && matchDept && matchStatus && matchGender;
    });
  }, [students, filterDegree, filterDept, filterStatus, filterGender]);

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
    if (filteredStudents.length === 0) {
      notify('No data available for the selected filters.', 'error');
      return;
    }
    
    const csvContent = [
      MASTER_HEADERS.join(','),
      ...filteredStudents.map(s => MASTER_HEADERS.map(header => `"${(s as any)[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CUVAS_Extraction_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    logAction('Data Export', `Extracted ${filteredStudents.length} records via filtered CSV.`, 'DataExport');
    notify(`Extraction successful: ${filteredStudents.length} records exported.`, 'success');
  };

  const downloadPDF = async () => {
    if (filteredStudents.length === 0) return;
    const body = filteredStudents.map(s => [
      s.regNo || '---',
      s.name,
      s.degree,
      s.programme,
      s.currentSemester,
      s.status
    ]);
    const { generateOfficialPDF } = await import('../utils/pdfExport');
    await generateOfficialPDF({
      reportName: 'Custom Scholar Registry extraction',
      headers: ['Reg #', 'Scholar Name', 'Degree', 'Specialization', 'Sem', 'Status'],
      data: body,
      landscape: true
    });
    logAction('Data Export', 'Generated official PDF extraction.', 'DataExport');
  };

  const handleBackup = async () => {
    try {
      await backupDatabase();
      notify('Institutional backup executed successfully.', 'success');
    } catch (e) {
      notify('Critical Backup Failure.', 'error');
    }
  };

  const resetFilters = () => {
    setFilterDegree('all'); setFilterDept('all'); setFilterStatus('all'); setFilterGender('all');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* --- Page Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Export Intelligence</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Registry Extraction & Backup Protocols · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard label="Total Indexed Nodes" value={students.length} gradient="linear-gradient(135deg,#475569 0%,#64748b 100%)" icon={Database} />
        <KpiCard label="Target Sample Size" value={filteredStudents.length} gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={TrendingUp} />
        <KpiCard label="Last System State" value="SECURE" gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- Export Controller (LHS) --- */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Filters Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 lg:p-10 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Filter size={18} />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Extraction Parameters</h3>
               </div>
               <button onClick={resetFilters} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors flex items-center gap-2">
                 <RotateCcw size={12} /> Reset Scopes
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FilterSelect label="Degree Scope" icon={GraduationCap} value={filterDegree} options={degrees} onChange={setFilterDegree} />
              <FilterSelect label="Department Scope" icon={MapPin} value={filterDept} options={departments} onChange={setFilterDept} />
              <FilterSelect label="Student Status" icon={CheckCircle2} value={filterStatus} options={Object.values(StudentStatus)} onChange={setFilterStatus} />
              <FilterSelect label="Gender Identity" icon={Users} value={filterGender} options={Object.values(Gender)} onChange={setFilterGender} />
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 lg:p-10 space-y-8">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Settings2 size={18} />
                </div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Extraction Schema</h3>
             </div>

             <div className="flex flex-wrap gap-4">
                <ToggleChip label="Scholar Profile" active={includeProfile} onClick={() => setIncludeProfile(!includeProfile)} />
                <ToggleChip label="Academic Milestones" active={includeAcademics} onClick={() => setIncludeAcademics(!includeAcademics)} />
                <ToggleChip label="Research Committee" active={includeSupervisor} onClick={() => setIncludeSupervisor(!includeSupervisor)} />
             </div>

             <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                   <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Generate Unified CSV</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">UTF-8 Encoded · Comma Separated Architecture</p>
                </div>
                <button 
                  onClick={downloadCSV}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-4 group"
                >
                   <FileSpreadsheet size={18} />
                   <span>Export Target Data</span>
                   <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>

        </div>

        {/* --- Institutional Protocols (RHS) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          <ProtocolCard 
            icon={FileText} 
            title="Formatted PDF Extraction" 
            desc="Official landscape report architecture with institutional branding applied automatically."
            color="rose"
            onClick={downloadPDF}
          />

          <ProtocolCard 
            icon={Database} 
            title="System State Backup" 
            desc="Write entire registry memory to a secure institutional dump file for disaster recovery."
            color="emerald"
            onClick={handleBackup}
          />

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
             <div className="absolute right-[-20%] bottom-[-20%] opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
               <ShieldCheck size={200} />
             </div>
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-400/20 rounded-lg">
                  <Lock size={16} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Security Advisory</span>
             </div>
             <h4 className="text-sm font-black uppercase tracking-tight leading-relaxed">
               All extraction protocols are logged under Audit Trails with originating IP and User ID.
             </h4>
             <p className="mt-8 text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] text-right">Logging State: active</p>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

const ToggleChip = ({ label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${
      active 
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-4 ring-indigo-500/10' 
        : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
    }`}
  >
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-slate-200 group-hover:bg-indigo-400 shadow-inner'}`} />
    {label}
  </button>
);

const ProtocolCard = ({ icon: Icon, title, desc, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full text-left bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6 hover:border-slate-300 hover:shadow-md transition-all group active:scale-[0.98]"
  >
    <div className={`w-12 h-12 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-${color}-600 group-hover:text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-2 uppercase tracking-wider">{desc}</p>
    </div>
    <div className="flex items-center justify-end">
       <div className={`p-2 rounded-full bg-slate-50 text-slate-300 group-hover:bg-${color}-50 group-hover:text-${color}-600 transition-colors`}>
          <ChevronRight size={16} />
       </div>
    </div>
  </button>
);

export default DataExport;