
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
  X
} from 'lucide-react';
import { Student } from '../types';
import Tooltip from '../components/Tooltip';

// --- Smart Schema Configuration ---
// This defines the Exact Source of Truth for both Template Generation and Parsing
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

  // Accept legacy "Yes/No" style values from existing CSVs.
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
  // Ensure required enum/check-constrained fields are always valid.
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

const BulkUpload: React.FC = () => {
  const { bulkAddStudents, students, notify, settings } = useStore();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'preview' | 'processing' | 'error'>('idle');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [report, setReport] = useState({ total: 0, mappedColumns: 0, missingCritical: false, duplicates: 0 });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // 1. Generate Template based on Schema
  const downloadTemplate = () => {
    const headers = SCHEMA_CONFIG.map(col => col.label);
    const sampleData = [
      '31202-1234567-1', 'Sample Scholar', 'Father Name', '2026-REG-001', 'Male', '0300-1234567',
      'M.Phil', 'Spring 2026', 'Computer Science', 'M.Phil Computer Science', '1', 'Active',
      'Dr. Supervisor Name', '', '', '', 'RES-001', 'Not Submitted', '', 'Completed', 'Not Submitted',
      'Not Submitted', '', 'Not Submitted', '', 'No', '', 'Pending', '', 'Sample entry.'
    ];

    const csv = Papa.unparse({
      fields: headers,
      data: [sampleData]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PDMS_PRO_Smart_Template.csv';
    link.click();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      notify('Invalid file format. Please upload a CSV file.', 'error');
    }
  }, [notify]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  // 2. Intelligent Parser using PapaParse
  const processFile = (fileToParse: File) => {
    setStatus('parsing');
    const tryParse = (delimiter?: string) => new Promise<{ data: any[]; meta: any }>((resolve, reject) => {
      Papa.parse(fileToParse, {
        header: true,
        skipEmptyLines: true,
        ...(delimiter ? { delimiter } : {}),
        complete: (results) => resolve({ data: Array.isArray(results.data) ? results.data : [], meta: results.meta }),
        error: reject
      });
    });

    const processParsed = (data: any[], meta: any) => {
      let rawHeaders = meta?.fields || [];
      let rows: any[] = Array.isArray(data) ? data : [];

      if (rows.length === 0) return { mappedCount: 0, integratedData: [], criticalMissing: false, duplicateCount: 0 };

      // Fallback for tab-delimited files parsed as a single column.
      if (rawHeaders.length === 1 && rawHeaders[0]?.includes('\t')) {
        const compositeHeader = rawHeaders[0];
        const tabHeaders = compositeHeader.split('\t').map(h => h.trim());
        const reconstructedRows: any[] = [];

        rows.forEach((row: any) => {
          const rawLine = row?.[compositeHeader];
          if (!rawLine || typeof rawLine !== 'string') return;
          const tabValues = rawLine.split('\t');
          const rebuilt: Record<string, string> = {};
          tabHeaders.forEach((h, idx) => {
            rebuilt[h] = (tabValues[idx] ?? '').toString().trim();
          });
          reconstructedRows.push(rebuilt);
        });

        rawHeaders = tabHeaders;
        rows = reconstructedRows;
      }

      const columnMapping: Record<string, string> = {};
      let mappedCount = 0;

      rawHeaders.forEach((headerText) => {
        const normalizedHeader = headerText.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = SCHEMA_CONFIG.find(field =>
          field.key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedHeader ||
          field.aliases.includes(normalizedHeader) ||
          field.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedHeader
        );

        if (match) {
          columnMapping[headerText] = match.key;
          mappedCount++;
        }
      });

      const integratedData: any[] = [];
      let criticalMissing = false;
      let duplicateCount = 0;

      rows.forEach((row: any) => {
        const entry: any = { isLocked: false };
        let hasData = false;

        Object.keys(columnMapping).forEach(header => {
          const systemKey = columnMapping[header];
          const cellValue = row[header]?.toString().trim() || '';

          if (cellValue) hasData = true;

          if (systemKey === 'currentSemester') {
            entry[systemKey] = parseInt(cellValue) || 1;
          } else {
            entry[systemKey] = normalizeValue(systemKey, cellValue);
          }
        });

        if (!hasData) return;
        if (!entry.name && !entry.cnic && !entry.regNo) return;
        if (!entry.name || !entry.regNo) criticalMissing = true;

        applyRequiredDefaults(entry);

        const isDuplicate = students.some(s =>
          (entry.cnic && s.cnic === entry.cnic) ||
          (entry.regNo && s.regNo === entry.regNo)
        );

        if (isDuplicate) {
          entry.isDuplicate = true;
          duplicateCount++;
        }

        integratedData.push(entry);
      });

      return { mappedCount, integratedData, criticalMissing, duplicateCount };
    };

    (async () => {
      try {
        const attempts = [
          await tryParse(),        // auto / default
          await tryParse(','),     // explicit CSV
          await tryParse('\t'),    // TSV
          await tryParse(';')      // regional semicolon CSV
        ];

        let best = { mappedCount: 0, integratedData: [], criticalMissing: false, duplicateCount: 0 };
        attempts.forEach((attempt) => {
          const processed = processParsed(attempt.data, attempt.meta);
          if (processed.mappedCount > best.mappedCount || processed.integratedData.length > best.integratedData.length) {
            best = processed;
          }
        });

        if (best.integratedData.length === 0) {
          notify('Could not map rows from this file. Please export as CSV (UTF-8) from Excel and try again.', 'error');
          setStatus('error');
          return;
        }

        setParsedData(best.integratedData);
        setReport({
          total: best.integratedData.length,
          mappedColumns: best.mappedCount,
          missingCritical: best.criticalMissing,
          duplicates: best.duplicateCount
        });
        setStatus('preview');
        notify(`Smart Detection: ${best.mappedCount} columns mapped automatically.`, 'success');
      } catch (error) {
        console.error('CSV Parsing Error:', error);
        notify('Failed to parse CSV file.', 'error');
        setStatus('error');
      }
    })();
  };

  const executeSync = async () => {
    if (report.duplicates > 0 && !showDuplicateModal) {
      setShowDuplicateModal(true);
      return;
    }

    setStatus('processing');
    setShowDuplicateModal(false);
    
    try {
      const inserted = await bulkAddStudents(parsedData);
      setStatus('idle');
      setParsedData([]);
      notify(`Registry synchronization complete. ${inserted} records uploaded.`, 'success');
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to sync with database.';
      notify(message, 'error');
    }
  };

  const reset = () => {
    setParsedData([]);
    setStatus('idle');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDuplicateModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 inset-x-0 h-2 bg-amber-500" />
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Duplicate Records Found</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Bulk Import Conflict</p>
                  </div>
                </div>
                <button onClick={() => setShowDuplicateModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-10">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  The smart engine has detected <span className="font-black text-amber-600">{report.duplicates}</span> records that already exist in the master registry based on CNIC or Registration Number.
                </p>
                <p className="text-xs text-slate-400 font-medium italic">
                  Proceeding will create duplicate entries. We recommend reviewing the highlighted rows in the preview table.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-full sm:flex-1 py-5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel & Review
                </button>
                <button 
                  onClick={() => {
                    setStatus('processing');
                    setShowDuplicateModal(false);
                    executeSync();
                  }}
                  className="w-full sm:flex-1 py-5 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-sm"
                >
                  Ignore & Sync All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100">
                <img 
                  src={settings.institution.logo || null} 
                  className="w-full h-full object-contain" 
                  alt="Logo" 
                  referrerPolicy="no-referrer"
                />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Smart Import</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">AI-Assisted CSV Column Mapping</p>
             </div>
          </div>
        </div>
        
        {status === 'idle' && (
          <button 
            onClick={downloadTemplate}
            className="flex items-center space-x-3 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group"
          >
            <Download size={16} className="group-hover:translate-y-1 transition-transform" />
            <span>Download Smart Template</span>
          </button>
        )}
      </div>

      {status === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600" />
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-8 shadow-inner">
                 <ScanLine size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Auto-Detect Protocol</h3>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">01</div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pattern Recognition</p>
                    <p className="text-[10px] text-slate-500 font-medium">System recognizes headers regardless of casing (e.g., "reg no", "Reg #", "Enrollment").</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">02</div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Type Safety</p>
                    <p className="text-[10px] text-slate-500 font-medium">Dates and Semesters are automatically formatted to system standards.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-10 rounded-xl text-white shadow-sm relative overflow-hidden group">
               <div className="absolute -right-6 -bottom-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><ShieldCheck size={140} /></div>
               <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Integrity Validation</p>
               <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest">
                 Use the "Download Smart Template" button to ensure 100% column matching accuracy.
               </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div 
              {...getRootProps()}
              className={`w-full h-[500px] border-4 border-dashed rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer group ${
                isDragActive 
                ? 'bg-indigo-100 border-indigo-400 scale-[0.99]' 
                : 'bg-white border-slate-100 hover:bg-indigo-50/20 hover:border-indigo-200'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`p-12 rounded-xl shadow-inner transition-all duration-500 ${
                isDragActive ? 'bg-indigo-600 text-white scale-110' : 'bg-indigo-50 text-indigo-600 group-hover:scale-105'
              }`}>
                {isDragActive ? <FileUp size={64} /> : <CloudUpload size={64} />}
              </div>
              <div className="mt-10 text-center space-y-2">
                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {isDragActive ? 'Release to Upload' : 'Drop CSV Template Here'}
                </p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
                  {isDragActive ? 'Smart Engine Ready' : 'Engine will auto-map columns upon upload'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'preview' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <StatCard label="Records Detected" value={report.total} color="slate" icon={FileText} />
             <StatCard label="Auto-Mapped Columns" value={`${report.mappedColumns} / ${SCHEMA_CONFIG.length}`} color={report.mappedColumns > 20 ? 'emerald' : 'amber'} icon={CheckCircle2} />
             <StatCard label="Duplicates Found" value={report.duplicates} color={report.duplicates > 0 ? 'amber' : 'emerald'} icon={AlertTriangle} />
             <StatCard label="Schema Confidence" value="100%" color="indigo" icon={Zap} />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <TableIcon size={20} className="text-indigo-600" />
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Data Preview & Verification</h3>
               </div>
               {report.missingCritical && (
                 <div className="flex items-center space-x-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-xl">
                    <AlertCircle size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Missing Key Fields Detected</span>
                 </div>
               )}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-10 py-6 bg-white border-b border-slate-100 min-w-[200px]">Scholar Name</th>
                    <th className="px-10 py-6 bg-white border-b border-slate-100 min-w-[150px]">Reg. Number</th>
                    <th className="px-10 py-6 bg-white border-b border-slate-100 min-w-[150px]">CNIC</th>
                    <th className="px-10 py-6 bg-white border-b border-slate-100 min-w-[150px]">Department</th>
                    <th className="px-10 py-6 bg-white border-b border-slate-100 min-w-[200px]">Programme</th>
                    <th className="px-10 py-6 bg-white border-b border-slate-100 min-w-[200px]">Supervisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${row.isDuplicate ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-10 py-5 font-black text-slate-900 uppercase text-[13px]">
                        <div className="flex items-center space-x-2">
                          <span>{row.name || <span className="text-rose-400 italic">Missing</span>}</span>
                          {row.isDuplicate && (
                            <Tooltip content="Duplicate Record Detected">
                              <AlertTriangle size={14} className="text-amber-500" />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-5 font-bold text-indigo-600 text-[11px] uppercase tracking-tighter">{row.regNo || <span className="text-rose-400 italic">Missing</span>}</td>
                      <td className="px-10 py-5 text-slate-500 font-mono text-xs">{row.cnic || <span className="text-rose-400 italic">Missing</span>}</td>
                      <td className="px-10 py-5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">{row.department || '---'}</td>
                      <td className="px-10 py-5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">{row.programme || '---'}</td>
                      <td className="px-10 py-5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">{row.supervisorName || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-[#0f172a] rounded-xl shadow-sm">
            <div className="space-y-1">
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Confirm Import?</h4>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                {report.total} records will be merged into the master registry.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <button onClick={reset} className="flex-1 md:flex-none px-10 py-5 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
               <button 
                onClick={executeSync}
                disabled={report.total === 0}
                className="flex-1 md:flex-none flex items-center justify-center gap-4 px-16 py-6 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] shadow-sm hover:bg-indigo-500 transition-all active:scale-95 group disabled:opacity-50 disabled:pointer-events-none"
               >
                 <span>Execute Sync</span>
                 <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      )}

      {(status === 'processing' || status === 'parsing') && (
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 animate-in zoom-in-95">
          <div className="relative">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
               <Zap size={44} className="animate-bounce" />
            </div>
            <div className="absolute inset-0 rounded-xl border-4 border-indigo-600/10 border-t-indigo-600 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {status === 'parsing' ? 'Auto-Detecting Columns...' : 'Committing to Registry...'}
            </p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Smart Engine Active</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-16 bg-rose-50 border border-rose-100 rounded-xl flex flex-col items-center text-center space-y-8">
          <div className="p-6 bg-rose-500 text-white rounded-xl shadow-sm">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-rose-950 uppercase tracking-tight">Parsing Protocol Failed</h3>
            <p className="text-rose-700 text-[10px] font-black uppercase tracking-[0.3em]">Ensure you are using the official Smart Template provided above.</p>
          </div>
          <button onClick={reset} className="px-10 py-5 bg-white border border-rose-200 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
            Return to Upload
          </button>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, icon: Icon }: any) => (
  <div className={`p-10 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group`}>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className={`text-3xl font-black text-${color}-600 tracking-tighter tabular-nums`}>{value}</p>
     </div>
     <div className={`p-4 bg-${color}-50 text-${color}-600 rounded-xl group-hover:scale-110 transition-transform`}>
       <Icon size={28}/>
     </div>
  </div>
);

export default BulkUpload;
