
import React, { useState, useCallback } from 'react';
import { useStore } from '../store';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  CloudUpload, 
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Table as TableIcon,
  FileText,
  ScanLine,
  FileUp,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Settings2,
  CheckCircle,
  Clock,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { Student } from '../types';
import Tooltip from '../components/Tooltip';
import BrandedLoader from '../components/BrandedLoader';
import { motion, AnimatePresence } from 'framer-motion';

// --- Smart Schema Configuration ---
const SCHEMA_CONFIG = [
  { key: 'cnic', label: 'CNIC Number', aliases: ['cnic', 'cnicno', 'nic', 'identity'] },
  { key: 'name', label: 'Scholar Name', aliases: ['name', 'studentname', 'fullname', 'scholar'] },
  { key: 'fatherName', label: 'Father Name', aliases: ['fathername', 'father', 'parent'] },
  { key: 'regNo', label: 'Registration Number', aliases: ['regno', 'registration', 'enrollment', 'rollno', 'reg#'] },
  { key: 'gender', label: 'Gender', aliases: ['gender', 'sex'] },
  { key: 'contactNumber', label: 'Contact Number', aliases: ['contact', 'mobile', 'phone', 'cell'] },
  { key: 'degree', label: 'Degree Program', aliases: ['degree', 'class', 'level'] },
  { key: 'session', label: 'Academic Session', aliases: ['session', 'batch', 'intake'] },
  { key: 'department', label: 'Department', aliases: ['department', 'dept', 'specialization'] },
  { key: 'programme', label: 'Study Programme', aliases: ['programme', 'program', 'discipline'] },
  { key: 'currentSemester', label: 'Current Semester', aliases: ['semester', 'sem', 'currentsemester'] },
  { key: 'status', label: 'Status', aliases: ['status', 'currentstatus'] },
  { key: 'supervisorName', label: 'Lead Supervisor', aliases: ['supervisor', 'supervisorname', 'guide'] },
  { key: 'coSupervisor', label: 'Co-Supervisor', aliases: ['cosupervisor', 'co-supervisor'] },
  { key: 'member1', label: 'Committee Member 1', aliases: ['member1', 'committee1'] },
  { key: 'member2', label: 'Committee Member 2', aliases: ['member2', 'committee2'] },
  { key: 'thesisId', label: 'Thesis ID', aliases: ['thesisid', 'researchid'] },
  { key: 'synopsis', label: 'Synopsis Status', aliases: ['synopsis', 'synopsisstatus'] },
  { key: 'synopsisSubmissionDate', label: 'Synopsis Date', aliases: ['synopsisdate', 'synopsissubmission'] },
  { key: 'gs2CourseWork', label: 'GS-2 Coursework', aliases: ['gs2', 'coursework'] },
  { key: 'gs4Form', label: 'GS-4 Form', aliases: ['gs4', 'gs4status'] },
  { key: 'semiFinalThesisStatus', label: 'Semi-Final Status', aliases: ['semifinal', 'semifinalstatus'] },
  { key: 'semiFinalThesisSubmissionDate', label: 'Semi-Final Date', aliases: ['semifinaldate'] },
  { key: 'finalThesisStatus', label: 'Final Thesis Status', aliases: ['finalthesis', 'finalstatus'] },
  { key: 'finalThesisSubmissionDate', label: 'Final Thesis Date', aliases: ['finaldate', 'thesisdate'] },
  { key: 'thesisSentToCOE', label: 'Sent to COE', aliases: ['coe', 'senttocoe', 'coedispatch'] },
  { key: 'coeSubmissionDate', label: 'COE Date', aliases: ['coedate'] },
  { key: 'validationStatus', label: 'Audit Status', aliases: ['validation', 'audit'] },
  { key: 'validationDate', label: 'Validation Date', aliases: ['validationdate'] },
  { key: 'comments', label: 'Remarks', aliases: ['comments', 'remarks', 'notes'] }
];

const normalizeValue = (key: string, rawValue: string): string => {
  const value = (rawValue || '').trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  if (key === 'gs2CourseWork') {
    if (['yes', 'y', 'completed', 'done', 'true', '1'].includes(lower)) return 'Completed';
    if (['no', 'n', 'not completed', 'pending', 'false', '0'].includes(lower)) return 'Not Completed';
    return value;
  }
  if (['synopsis', 'gs4Form', 'semiFinalThesisStatus', 'finalThesisStatus'].includes(key)) {
    if (['yes', 'y', 'submitted', 'true', '1'].includes(lower)) return 'Submitted';
    if (['no', 'n', 'not submitted', 'pending', 'false', '0'].includes(lower)) return 'Not Submitted';
    if (lower === 'approved') return 'Approved';
    return value;
  }
  if (key === 'thesisSentToCOE') {
    if (['yes', 'y', 'true', '1'].includes(lower)) return 'Yes';
    if (['no', 'n', 'false', '0'].includes(lower)) return 'No';
    return value;
  }
  if (key === 'validationStatus') {
    if (lower === 'approved') return 'Approved';
    if (['returned', 'rejected'].includes(lower)) return 'Returned';
    if (['pending', 'not submitted', 'submitted', 'in progress'].includes(lower)) return 'Pending';
    return value;
  }
  if (key === 'gender') {
    if (['f', 'female'].includes(lower)) return 'Female';
    if (['m', 'male'].includes(lower)) return 'Male';
    return value;
  }
  return value;
};

const applyRequiredDefaults = (entry: any) => {
  if (!entry.gender) entry.gender = 'Male';
  if (!entry.status) entry.status = 'Active';
  if (!entry.synopsis) entry.synopsis = 'Not Submitted';
  if (!entry.gs2CourseWork) entry.gs2CourseWork = 'Not Completed';
  if (!entry.gs4Form) entry.gs4Form = 'Not Submitted';
  if (!entry.semiFinalThesisStatus) entry.semiFinalThesisStatus = 'Not Submitted';
  if (!entry.finalThesisStatus) entry.finalThesisStatus = 'Not Submitted';
  if (!entry.thesisSentToCOE) entry.thesisSentToCOE = 'No';
  if (!entry.validationStatus) entry.validationStatus = 'Pending';
  if (!entry.currentSemester || Number.isNaN(Number(entry.currentSemester))) entry.currentSemester = 1;
};

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

const BulkUpload: React.FC = () => {
  const { bulkAddStudents, students, notify, settings } = useStore();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'preview' | 'processing' | 'error'>('idle');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [report, setReport] = useState({ total: 0, mappedColumns: 0, missingCritical: false, duplicates: 0 });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const downloadTemplate = () => {
    const headers = SCHEMA_CONFIG.map(col => col.label);
    const sampleData = [
      '31202-1234567-1', 'Sample Scholar', 'Father Name', '2026-REG-001', 'Male', '0300-1234567',
      'M.Phil', 'Spring 2026', 'Computer Science', 'M.Phil Computer Science', '1', 'Active',
      'Dr. Supervisor Name', '', '', '', 'RES-001', 'Not Submitted', '', 'Completed', 'Not Submitted',
      'Not Submitted', '', 'Not Submitted', '', 'No', '', 'Pending', '', 'Sample entry.'
    ];
    const csv = Papa.unparse({ fields: headers, data: [sampleData] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'PDMS_PRO_Smart_Template.csv';
    link.click();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      processFile(file);
    } else {
      notify('Unsupported format. Please upload a CSV file.', 'error');
    }
  }, [notify]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false
  });

  const processFile = (fileToParse: File) => {
    setStatus('parsing');
    const tryParse = (delimiter?: string) => new Promise<{ data: any[]; meta: any }>((resolve, reject) => {
      Papa.parse(fileToParse, {
        header: true, skipEmptyLines: true, ...(delimiter ? { delimiter } : {}),
        complete: (results) => resolve({ data: Array.isArray(results.data) ? results.data : [], meta: results.meta }),
        error: reject
      });
    });

    const processParsed = (data: any[], meta: any) => {
      let rawHeaders = meta?.fields || [];
      let rows: any[] = Array.isArray(data) ? data : [];
      if (rows.length === 0) return { mappedCount: 0, integratedData: [], criticalMissing: false, duplicateCount: 0 };
      if (rawHeaders.length === 1 && rawHeaders[0]?.includes('\t')) {
        const tabHeaders = rawHeaders[0].split('\t').map(h => h.trim());
        const reconstructed: any[] = [];
        rows.forEach(row => {
          const rawLine = row?.[rawHeaders[0]];
          if (!rawLine || typeof rawLine !== 'string') return;
          const tabValues = rawLine.split('\t');
          const rebuilt: any = {};
          tabHeaders.forEach((h, idx) => rebuilt[h] = (tabValues[idx] ?? '').toString().trim());
          reconstructed.push(rebuilt);
        });
        rawHeaders = tabHeaders; rows = reconstructed;
      }
      const mapping: Record<string, string> = {};
      let mappedCount = 0;
      rawHeaders.forEach(header => {
        const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = SCHEMA_CONFIG.find(f => f.key.toLowerCase().replace(/[^a-z0-9]/g, '') === norm || f.aliases.includes(norm) || f.label.toLowerCase().replace(/[^a-z0-9]/g, '') === norm);
        if (match) { mapping[header] = match.key; mappedCount++; }
      });
      const integratedData: any[] = [];
      let criticalMissing = false;
      let duplicateCount = 0;
      rows.forEach(row => {
        const entry: any = { isLocked: false };
        let hasData = false;
        Object.keys(mapping).forEach(header => {
          const key = mapping[header];
          const val = row[header]?.toString().trim() || '';
          if (val) hasData = true;
          entry[key] = (key === 'currentSemester' ? parseInt(val) || 1 : normalizeValue(key, val));
        });
        if (!hasData || (!entry.name && !entry.cnic && !entry.regNo)) return;
        if (!entry.name || !entry.regNo) criticalMissing = true;
        applyRequiredDefaults(entry);
        const isDuplicate = students.some(s => (entry.cnic && s.cnic === entry.cnic) || (entry.regNo && s.regNo === entry.regNo));
        if (isDuplicate) { entry.isDuplicate = true; duplicateCount++; }
        integratedData.push(entry);
      });
      return { mappedCount, integratedData, criticalMissing, duplicateCount };
    };

    (async () => {
      try {
        const attempts = [await tryParse(), await tryParse(','), await tryParse('\t'), await tryParse(';')];
        let best = { mappedCount: 0, integratedData: [], criticalMissing: false, duplicateCount: 0 };
        attempts.forEach(a => {
          const p = processParsed(a.data, a.meta);
          if (p.mappedCount > best.mappedCount || p.integratedData.length > best.integratedData.length) best = p;
        });
        if (best.integratedData.length === 0) {
          notify('Could not map rows. Use the official template.', 'error');
          setStatus('error'); return;
        }
        setParsedData(best.integratedData);
        setReport({ total: best.integratedData.length, mappedColumns: best.mappedCount, missingCritical: best.criticalMissing, duplicates: best.duplicateCount });
        setStatus('preview');
        notify(`Detection Complete: ${best.mappedCount} columns auto-mapped.`, 'success');
      } catch (e) { setStatus('error'); notify('Failed to parse CSV.', 'error'); }
    })();
  };

  const executeSync = async () => {
    if (report.duplicates > 0 && !showDuplicateModal) { setShowDuplicateModal(true); return; }
    setStatus('processing'); setShowDuplicateModal(false);
    try {
      const inserted = await bulkAddStudents(parsedData);
      setStatus('idle'); setParsedData([]);
      notify(`Sync success: ${inserted} records uploaded.`, 'success');
    } catch (e) { setStatus('error'); notify('Sync failed.', 'error'); }
  };

  const reset = () => { setParsedData([]); setStatus('idle'); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8 pb-20 px-4 max-w-7xl mx-auto">
      {/* --- Duplicate Warning Modal --- */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDuplicateModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
               <div className="bg-amber-600 px-8 py-6 flex items-center gap-4 text-white">
                 <AlertTriangle size={32} />
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Records Conflict Found</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Duplicate CNIC or Registration Numbers Detected</p>
                 </div>
               </div>
               <div className="p-8 space-y-6">
                 <p className="text-sm text-slate-600 font-medium leading-relaxed">
                   Smart Engine found <span className="font-black text-amber-600 underline underline-offset-4">{report.duplicates}</span> students already present in your master registry. Duplicate records will not be skipped but cloned — we recommend reviewing highlighting. 
                 </p>
                 <div className="flex gap-4">
                   <button onClick={() => setShowDuplicateModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel & Review</button>
                   <button onClick={() => { executeSync(); }} className="flex-1 py-4 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-md">Ignore & Sync All</button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Page Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Smart Bulk Upload</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Intelligent Registry synchronization Engine · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={downloadTemplate} className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <Download size={16} /> <span>Get Template</span>
           </button>
        </div>
      </div>

      {status === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
          {/* Instructions Cards */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <ScanLine size={24} />
               </div>
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Auto-Map Protocol</h3>
               <p className="text-[11px] text-slate-500 font-bold leading-relaxed mt-4 uppercase tracking-wider">
                 Our system uses Smart Alias detection. Headers like "Reg No", "Registration #", or "Roll ID" are automatically paired with our master registry.
               </p>
               <div className="mt-8 space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Type-Safe Transformation</span>
                  </div>
                  <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Duplicate Leak Prevention</span>
                  </div>
               </div>
            </div>

            <div className="bg-[#0f172a] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
               <div className="absolute right-[-10%] bottom-[-10%] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                 <ShieldCheck size={160} />
               </div>
               <p className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4">Quality Guard</p>
               <h4 className="text-sm font-black uppercase tracking-tight leading-relaxed">
                 Always verify "CNIC" and "Reg No" are present for 100% record precision.
               </h4>
               <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 System ignores empty rows automatically.
               </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="lg:col-span-8">
             <div 
               {...getRootProps()}
               className={`w-full min-h-[450px] border-4 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center cursor-pointer group p-10 ${
                 isDragActive 
                   ? 'bg-indigo-50 border-indigo-400 scale-[0.98] shadow-inner' 
                   : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
               }`}
             >
               <input {...getInputProps()} />
               <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-xl ${
                 isDragActive ? 'bg-indigo-600 text-white rotate-12' : 'bg-slate-900 text-white group-hover:rotate-6'
               }`}>
                  {isDragActive ? <FileUp size={48} /> : <CloudUpload size={48} />}
               </div>
               <div className="mt-10 text-center space-y-3">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                    {isDragActive ? 'Drop to Start Parser' : 'Upload Data Sheet'}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
                    Supported Formats: <span className="text-indigo-600">CSV (UTF-8)</span> only
                  </p>
                  <div className="pt-8 flex items-center gap-3 justify-center">
                     <span className="w-12 h-[1px] bg-slate-200" />
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Or Browse Files</span>
                     <span className="w-12 h-[1px] bg-slate-200" />
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {status === 'preview' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <KpiCard label="Detected Entries" value={report.total} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={FileSpreadsheet} />
              <KpiCard label="Auto-Mapped" value={`${report.mappedColumns}/${SCHEMA_CONFIG.length}`} gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)" icon={Zap} />
              <KpiCard label="Registry Conflicts" value={report.duplicates} gradient={report.duplicates > 0 ? "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" : "linear-gradient(135deg,#10b981 0%,#059669 100%)"} icon={AlertTriangle} />
              <KpiCard label="Critical Issues" value={report.missingCritical ? 'YES' : 'NONE'} gradient={report.missingCritical ? "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)" : "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)"} icon={ShieldCheck} />
           </div>

           {/* Preview Table */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
                 <div className="flex items-center gap-3">
                    <TableIcon size={18} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Integrity Preview Window</h3>
                 </div>
                 {report.missingCritical && (
                   <div className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg flex items-center gap-2 border border-rose-100 italic animate-pulse">
                      <AlertCircle size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Missing Key Metadata Detected!</span>
                   </div>
                 )}
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="bg-white sticky top-0 z-10">
                       <tr className="bg-slate-50/50">
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 min-w-[200px]">Scholar Name</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-44">Reg. Number</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-48">CNIC</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Study Programme</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Status Node</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {parsedData.map((row, idx) => (
                         <tr key={idx} className={`group hover:bg-slate-50/40 transition-colors ${row.isDuplicate ? 'bg-amber-50/40' : ''}`}>
                            <td className="px-8 py-4">
                               <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${row.isDuplicate ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white'}`}>
                                     {row.name ? row.name[0] : '?'}
                                  </div>
                                  <div className="min-w-0">
                                     <p className="font-black text-slate-900 leading-none truncate">{row.name || <span className="text-rose-500 italic">Name Missing</span>}</p>
                                     <p className="text-[9px] font-black text-indigo-500 mt-1 uppercase tracking-widest">Scholar Record</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-4 text-[11px] font-black text-slate-600 tabular-nums uppercase">{row.regNo || <span className="text-rose-400 opacity-50">Empty</span>}</td>
                            <td className="px-8 py-4 text-[10px] font-bold text-slate-500 tabular-nums tracking-widest">{row.cnic || <span className="text-rose-400 opacity-50">---</span>}</td>
                            <td className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[250px]">{row.programme || '---'}</td>
                            <td className="px-8 py-4">
                               {row.isDuplicate ? (
                                 <span className="px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                                    <AlertTriangle size={10} /> Duplicate
                                 </span>
                               ) : (
                                 <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] font-black uppercase tracking-widest w-fit">Valid Node</span>
                               )}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Final Sync Action */}
           <div className="p-8 bg-slate-900 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner border border-white/5">
                    <Database size={28} className="text-indigo-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Execute Registry Sync?</h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{report.total} records queued for database commitment.</p>
                 </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                 <button onClick={reset} className="flex-1 md:flex-none px-10 py-4 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                    <X size={16} /> Discard Data
                 </button>
                 <button 
                   onClick={executeSync}
                   className="flex-1 md:flex-none px-16 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                 >
                    <span>Commit to Master</span>
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- Loader Overlays --- */}
      {(status === 'processing' || status === 'parsing') && (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm">
          <BrandedLoader variant="overlay" message={status === 'parsing' ? 'Booting Metadata Parser' : 'Writing to Master Registry'} subLabel="AI-Powered Sync Optimization" logoSize={140} />
        </div>
      )}

      {/* --- Error State --- */}
      {status === 'error' && (
        <div className="p-20 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col items-center text-center space-y-8 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-600/25">
            <AlertCircle size={48} />
          </div>
          <div className="max-w-md space-y-4">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sync Protocol Failure</h3>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
              We encountered a malformed data structure. Please ensure you're using the <span className="text-rose-600">Smart Template</span> provided above and your file is saved as <span className="text-rose-600">CSV (Comma Separated)</span>.
            </p>
          </div>
          <button onClick={reset} className="px-12 py-5 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">
             Return to Dashboard
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default BulkUpload;
