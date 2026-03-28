
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  FileBarChart, 
  FileText, 
  PieChart, 
  Users, 
  Download, 
  ShieldCheck, 
  Filter, 
  Loader2,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  RotateCcw,
  Library,
  BookOpen,
  ClipboardList,
  Activity,
  UserCheck
} from 'lucide-react';
import { normalizeStatus } from '../utils/dashboardMetrics';
import { motion, AnimatePresence } from 'framer-motion';

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none">
      <Icon size={80} className="text-white" />
    </div>
    <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none mb-1">{value}</h4>
  </div>
);

// ─── FilterSelect Component ───────────────────────────────────────────────────
const FilterSelect = ({ label, value, icon: Icon, options, onChange }: any) => {
  const active = Boolean(value && value !== 'All');
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
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
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt === 'All' ? `All ${label}s` : opt}</option>
          ))}
        </select>
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${active ? 'text-indigo-500' : 'text-slate-300'}`}>
           <Filter size={12} />
        </div>
      </div>
    </div>
  );
};

const SystemReports: React.FC = () => {
  const { students, settings, logAction } = useStore();
  const [statusFilter, setStatusFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const programs = useMemo(() => ['All', ...Array.from(new Set(students.map(s => s.programme)))], [students]);
  const statuses = ['All', 'Active', 'Completed', 'Dropped', 'Suspended'];

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchStatus = statusFilter === 'All' || normalizeStatus(s.status) === normalizeStatus(statusFilter);
      const matchProgram = programFilter === 'All' || s.programme === programFilter;
      return matchStatus && matchProgram;
    });
  }, [students, statusFilter, programFilter]);

  const stats = useMemo(() => {
    const counts = { total: filteredStudents.length, active: 0, completionRate: 0, pendingAudit: 0 };
    filteredStudents.forEach(s => {
      const st = normalizeStatus(s.status);
      if (st === 'active') counts.active++;
      if (st === 'completed') counts.completionRate++;
      if (s.validationStatus !== 'Approved') counts.pendingAudit++;
    });
    counts.completionRate = filteredStudents.length > 0 ? Math.round((counts.completionRate / filteredStudents.length) * 100) : 0;
    return counts;
  }, [filteredStudents]);

  const getReportData = (type: string) => {
    switch (type) {
      case 'Programme Summary':
        const summary = filteredStudents.reduce((acc: any, s) => {
          const key = `${s.department} - ${s.programme}`;
          if (!acc[key]) acc[key] = { Programme: key, Total: 0, Active: 0, Completed: 0 };
          acc[key].Total++;
          const st = normalizeStatus(s.status);
          if (st === 'active') acc[key].Active++;
          if (st === 'completed') acc[key].Completed++;
          return acc;
        }, {});
        return Object.values(summary);

      case 'Progress Report':
        return filteredStudents.map(s => ({
          Name: s.name,
          RegNo: s.regNo,
          Degree: s.degree,
          Semester: s.currentSemester || 'N/A',
          Status: s.status,
          Validation: s.validationStatus || 'Pending',
          Synopsis: s.synopsis || 'Not Submitted'
        }));

      case 'Pending Milestone':
        return filteredStudents.filter(s => s.validationStatus !== 'Approved' || s.synopsis === 'Not Submitted').map(s => ({
          Name: s.name,
          RegNo: s.regNo,
          Status: s.status,
          Validation: s.validationStatus || 'Pending',
          Synopsis: s.synopsis || 'Not Submitted'
        }));

      case 'Workload Report':
        const workload = filteredStudents.reduce((acc: any, s) => {
          const sup = s.supervisorName || 'Unassigned';
          if (!acc[sup]) acc[sup] = { Supervisor: sup, Students: 0 };
          acc[sup].Students++;
          return acc;
        }, {});
        return Object.values(workload);

      case 'Master Registry':
        return filteredStudents.map(s => ({
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
    const csvContent = [headers.join(','), ...data.map((row, index) => headers.map((header) => {
      if (header === 'Sr. No.') return index + 1;
      return `"${row[header] || ''}"`;
    }).join(','))].join('\n');
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = filename; link.click();
    logAction('Data Export', `Generated CSV report: ${filename}`, 'SystemReports');
  };

  const downloadPDF = async (reportName: string, data: any[]) => {
    if (data.length === 0) return;
    setIsGenerating(reportName);
    try {
      const { generateOfficialPDF } = await import('../utils/pdfExport');
      const headers = Object.keys(data[0]);
      const body = data.map(row => Object.values(row));
      await generateOfficialPDF({ reportName, headers, data: body, landscape: false });
      logAction('Data Export', `Generated PDF report: ${reportName}`, 'SystemReports');
    } catch (err) { alert("Failed to generate PDF."); }
    finally { setIsGenerating(null); }
  };

  const reportOptions = [
    { title: 'Programme Summary', desc: 'Detailed aggregation by department and scholar specialization.', icon: PieChart, type: 'Programme Summary', filename: 'programme_summary.csv', color: 'indigo' },
    { title: 'Progress Report', desc: 'Advanced tracking of M.Phil and PhD advancement metrics.', icon: Activity, type: 'Progress Report', filename: 'degree_progress.csv', color: 'rose' },
    { title: 'Pending Milestone', desc: 'Critical identification of overdue audit forms and GS-2 benchmarks.', icon: ClipboardList, type: 'Pending Milestone', filename: 'pending_requirements.csv', color: 'amber' },
    { title: 'Workload Report', desc: 'Institutional analysis of active supervisory and committee loads.', icon: UserCheck, type: 'Workload Report', filename: 'supervisor_workload.csv', color: 'emerald' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8 pb-20 px-4 max-w-7xl mx-auto">
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Intelligence Reports</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional Analytics & Official Documentation · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard label="Nodes in Scope" value={stats.total} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={Library} />
        <KpiCard label="Active Portfolio" value={stats.active} gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={Activity} />
        <KpiCard label="Audit Lag" value={stats.pendingAudit} gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" icon={Clock} />
        <KpiCard label="Overall Efficiency" value={`${stats.completionRate}%`} gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)" icon={TrendingUp} />
      </div>

      {/* ── Filters Section ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 flex flex-col md:flex-row items-end gap-6 no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
        <FilterSelect label="Study Program Scope" icon={BookOpen} value={programFilter} options={programs} onChange={setProgramFilter} />
        <FilterSelect label="Registry Status" icon={CheckCircle2} value={statusFilter} options={statuses} onChange={setStatusFilter} />
        <button onClick={() => { setProgramFilter('All'); setStatusFilter('All'); }} className="px-6 py-3.5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 mb-[1px]">
          <RotateCcw size={14} /> Reset Scopes
        </button>
      </div>

      {/* ── Reports Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reportOptions.map((opt, idx) => {
          const reportData = getReportData(opt.type);
          return (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 group relative overflow-hidden flex flex-col justify-between hover:border-indigo-400/50 transition-all cursor-default"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                   <div className={`p-4 bg-${opt.color}-50 text-${opt.color}-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm`}>
                      <opt.icon size={26} />
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol Type</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-1">{opt.type}</span>
                   </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">{opt.title}</h3>
                <p className="text-slate-500 text-[11px] font-medium mt-3 leading-relaxed max-w-[90%]">{opt.desc}</p>
                
                <div className="mt-6 flex items-center gap-1.5">
                   <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums tabular-nums">
                      {reportData.length} records in trace
                   </div>
                </div>
              </div>
              
              <div className="mt-12 flex items-center gap-4 relative z-10">
                <button 
                  onClick={() => downloadCSV(reportData, opt.filename)}
                  disabled={reportData.length === 0}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40"
                >
                  <FileSpreadsheet size={16} /> <span>Extract CSV</span>
                </button>
                <button 
                  onClick={() => downloadPDF(opt.title, reportData)}
                  disabled={isGenerating === opt.title || reportData.length === 0}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                >
                  {isGenerating === opt.title ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : (
                     <FileText size={16} />
                  )}
                  <span>{isGenerating === opt.title ? 'Synthesizing...' : 'Official PDF'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Institutional Master Extract ───────────────────────────────────────── */}
      <div className="bg-[#0f172a] rounded-3xl p-10 md:p-14 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group-hover:bg-indigo-500/20" />
         <div className="absolute -bottom-10 -left-10 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-all duration-1000 pointer-events-none">
            <ShieldCheck size={280} />
         </div>

         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-6 flex-1">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shrink-0">
                    <ShieldCheck size={32} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Master Registry Data Purge</h3>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Comprehensive Institutional Extraction Pipeline</p>
                  </div>
               </div>
               <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl uppercase tracking-wider">
                  Generate a complete audit-ready extraction of the scholar database. This protocol merges all 30 academic benchmarks into a single high-fidelity documentation set.
               </p>
               <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active nodes in scope</span>
                     <span className="text-2xl font-black text-white tabular-nums mt-1">{filteredStudents.length}</span>
                  </div>
                  <div className="w-[1px] h-10 bg-slate-800" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metadata Confidence</span>
                     <span className="text-2xl font-black text-emerald-500 tabular-nums mt-1">100%</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-80">
               <button 
                 onClick={() => downloadCSV(getReportData('Master Registry'), 'master_registry_full.csv')}
                 className="w-full py-5 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/10 border border-slate-800 transition-all active:scale-95"
               >
                  <Download size={18} /> Raw CSV Dump
               </button>
               <button 
                 onClick={() => downloadPDF('Institutional Scholar Master Registry', getReportData('Master Registry'))}
                 className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
               >
                  <FileText size={18} /> Official Branded PDF
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

export default SystemReports;
