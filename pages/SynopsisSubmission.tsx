
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Search, 
  Save, 
  User, 
  ChevronDown,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Printer,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import { Student, StudentStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Tooltip from '../components/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

type ViewFilter = 'Pending' | 'Submitted' | 'All';

// ─── FilterSelect Component ───────────────────────────────────────────────────
const FilterSelect = ({ label, value, icon: Icon, options, displayOptions, onChange }: any) => {
  const active = Boolean(value && value !== 'All');
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
          {label === 'Milestone' ? null : <option value="">All</option>}
          {options.map((opt: string, idx: number) => (
            <option key={opt} value={opt}>{displayOptions ? displayOptions[idx] : opt}</option>
          ))}
        </select>
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${active ? 'text-indigo-500' : 'text-slate-300'}`}>
          <ChevronDown size={13} />
        </div>
      </div>
    </div>
  );
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

// ─── Filter Chip Component ────────────────────────────────────────────────────
const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[8px] font-black uppercase tracking-wide">
    {label}
    <button onClick={onRemove} className="hover:text-rose-600 transition-colors focus:outline-none">
      <X size={10} />
    </button>
  </span>
);

const SynopsisSubmission: React.FC = () => {
  const { students, updateStudent, logAction, notify, settings, degrees, departments, currentRole } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('Pending');
  const [pendingChanges, setPendingChanges] = useState<Record<string, { status: string, date: string }>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // ── Data Logic ──────────────────────────────────────────────────────────────
  const eligibleStudents = useMemo(() => {
    return students.filter(s => 
      Number(s.currentSemester) === 3 && 
      s.status !== StudentStatus.COMPLETED && 
      s.status !== StudentStatus.CLOSED && 
      s.status !== StudentStatus.DROPPED
    );
  }, [students]);

  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  const filtered = useMemo(() => {
    return eligibleStudents.filter(s => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        (s.name?.toLowerCase().includes(searchStr)) || 
        (s.regNo?.toLowerCase().includes(searchStr)) ||
        (s.programme?.toLowerCase().includes(searchStr)) ||
        (s.supervisorName?.toLowerCase().includes(searchStr));
      
      if (!matchesSearch) return false;

      const matchesDegree = filterDegree === '' || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
      if (!matchesDegree) return false;

      const matchesDept = filterDept === '' || s.department === filterDept;
      if (!matchesDept) return false;

      const rawStatus = pendingChanges[s.id]?.status || s.synopsis;
      const currentStatus = rawStatus ? rawStatus.toString().trim().toLowerCase() : 'not submitted';
      
      const isSubmitted = currentStatus === 'submitted' || currentStatus === 'approved';
      const isPending = !isSubmitted;

      if (viewFilter === 'Pending') return isPending;
      if (viewFilter === 'Submitted') return isSubmitted;
      return true;
    });
  }, [eligibleStudents, searchTerm, viewFilter, filterDegree, filterDept, pendingChanges]);

  const stats = useMemo(() => {
    const counts = { total: eligibleStudents.length, submitted: 0, pending: 0 };
    eligibleStudents.forEach(s => {
      const rawStatus = pendingChanges[s.id]?.status || s.synopsis;
      const status = rawStatus ? rawStatus.toString().trim().toLowerCase() : 'not submitted';
      const isSubmitted = status === 'submitted' || status === 'approved';
      if (!isSubmitted) counts.pending++;
      if (isSubmitted) counts.submitted++;
    });
    return counts;
  }, [eligibleStudents, pendingChanges]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDegree, filterDept, viewFilter]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleStatusChange = (studentId: string, newStatus: string) => {
    const today = new Date().toISOString().split('T')[0];
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        status: newStatus,
        date: (newStatus === 'Submitted' || newStatus === 'Approved') ? today : ''
      }
    }));
  };

  const handleDateChange = (studentId: string, newDate: string) => {
    setPendingChanges(prev => ({ ...prev, [studentId]: { ...prev[studentId], date: newDate } }));
  };

  const commitSubmission = (student: Student) => {
    const change = pendingChanges[student.id];
    if (!change) return;
    const updatedStudent: Student = { ...student, synopsis: change.status as any, synopsisSubmissionDate: change.date };
    updateStudent(updatedStudent);
    logAction('Milestone Update', `Synopsis status committed for ${student.name}`, 'SynopsisSubmission');
    notify(`Synopsis status updated for ${student.name}.`, 'success');
    const newPending = { ...pendingChanges };
    delete newPending[student.id];
    setPendingChanges(newPending);
  };

  const resetFilters = () => {
    setSearchTerm(''); setFilterDegree(''); setFilterDept(''); setViewFilter('Pending'); setCurrentPage(1);
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Scholar Name', 'Registration #', 'Degree', 'Department', 'Semester', 'Synopsis Status', 'Date Submitted', 'Lead Supervisor'];
    const rows = filtered.map(s => [
      s.name, s.regNo, s.degree, s.department, s.currentSemester, 
      pendingChanges[s.id]?.status || s.synopsis, 
      pendingChanges[s.id]?.date || s.synopsisSubmissionDate || 'N/A', 
      s.supervisorName
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Synopsis_Tracking_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    logAction('Data Export', 'Exported Synopsis Registry as CSV.');
  };

  const exportPDF = async () => {
    if (!filtered.length) return;
    const body = filtered.map(s => [
      s.name, s.regNo || '---', s.degree, s.department, '3', 
      pendingChanges[s.id]?.status || s.synopsis || 'Not Submitted', 
      pendingChanges[s.id]?.date || s.synopsisSubmissionDate || 'N/A', 
      s.supervisorName || '---'
    ]);
    const { generateOfficialPDF } = await import('../utils/pdfExport');
    await generateOfficialPDF({
      reportName: 'Synopsis Submission Tracking',
      headers: ['Scholar Name', 'Reg #', 'Degree', 'Department', 'Sem', 'Status', 'Date', 'Supervisor'],
      data: body, landscape: true
    });
  };

  const hasActiveFilters = searchTerm || filterDegree || filterDept || viewFilter !== 'Pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-20 max-w-full"
    >
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Synopsis Tracking</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Semester 3 Research Milestones · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportCSV} disabled={!filtered.length}
            className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-40">
            <FileSpreadsheet size={15} /><span className="hidden lg:block">Export CSV</span>
          </button>
          <button onClick={exportPDF} disabled={!filtered.length}
            className="flex items-center gap-2.5 px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-40">
            <FileText size={15} /><span className="hidden lg:block">Export PDF</span>
          </button>
          <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard label="Eligible Candidates" value={stats.total} gradient="linear-gradient(135deg,#475569 0%,#64748b 100%)" icon={TrendingUp} />
        <KpiCard label="Synopsis Submitted" value={stats.submitted} gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)" icon={CheckCircle2} />
        <KpiCard label="Pending Submission" value={stats.pending} gradient="linear-gradient(135deg,#f43f5e 0%,#e11d48 100%)" icon={Clock} />
      </div>

      {/* ── Filters Section ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 space-y-6 no-print">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by Scholar Name, ID, Supervisor or Program..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all placeholder:text-slate-300"
            />
          </div>
          <button onClick={resetFilters} disabled={!hasActiveFilters}
            className={`flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
              hasActiveFilters 
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white shadow-sm active:scale-95' 
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}>
            <RotateCcw size={15}/>
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FilterSelect label="Degree Type" icon={GraduationCap} value={filterDegree} options={['M.Phil', 'PhD']} displayOptions={['M.Phil', 'PhD']} onChange={setFilterDegree} />
          <FilterSelect label="Department" icon={MapPin} value={filterDept} options={departments} onChange={setFilterDept} />
          <FilterSelect label="Milestone" icon={CheckCircle2} value={viewFilter} options={['Pending', 'Submitted', 'All']} onChange={setViewFilter} />
          
          <div className="hidden lg:flex items-center px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-xl gap-4">
             <div className="p-2 bg-indigo-600 text-white rounded-lg">
                <CheckCircle2 size={16} />
             </div>
             <p className="text-[9px] font-bold text-indigo-900 uppercase tracking-wider leading-relaxed">
               Showing Semester 3 scholars whose research plans are currently being processed.
             </p>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Constraints:</span>
            {searchTerm && <Chip label={`"${searchTerm}"`} onRemove={() => setSearchTerm('')} />}
            {filterDegree && <Chip label={`Degree: ${filterDegree}`} onRemove={() => setFilterDegree('')} />}
            {filterDept && <Chip label={`Dept: ${filterDept}`} onRemove={() => setFilterDept('')} />}
            {viewFilter !== 'All' && <Chip label={`Status: ${viewFilter}`} onRemove={() => setViewFilter('All')} />}
          </div>
        )}
      </div>

      {/* ── Table & Cards Content ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1100px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-12 text-center border-b border-slate-100">#</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Scholar Details</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Placement</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Lead Supervisor</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span>Milestone State</span>
                    <Tooltip content="Research synopsis submission status for Semester 3." />
                  </div>
                </th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Submission Date</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Commit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.map((student, idx) => (
                <SynopsisDesktopRow key={student.id} index={(currentPage-1)*itemsPerPage + idx + 1} student={student} pendingChanges={pendingChanges} onStatusChange={handleStatusChange} onDateChange={handleDateChange} onCommit={commitSubmission} currentRole={currentRole} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Filter View */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {paginatedStudents.map(student => (
            <SynopsisMobileCard key={student.id} student={student} pendingChanges={pendingChanges} onStatusChange={handleStatusChange} onDateChange={handleDateChange} onCommit={commitSubmission} currentRole={currentRole} />
          ))}
        </div>

        {/* Empty Registry State */}
        {filtered.length === 0 && (
          <div className="py-32 text-center bg-white flex flex-col items-center gap-6">
             <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
                <ClipboardList size={40} className="text-slate-300" />
             </div>
             <div>
                <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Empty Registry Segment</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">No active scholars satisfy the current filters.</p>
             </div>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-indigo-600">{filtered.length}</span> Scholars
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className={`p-2.5 rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => {
                  const n = i + 1;
                  if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                    return (
                      <button key={n} onClick={() => setCurrentPage(n)}
                        className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                          currentPage === n
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  } else if (n === currentPage - 2 || n === currentPage + 2) {
                    return <span key={n} className="text-slate-300 px-1 font-bold">...</span>;
                  }
                  return null;
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className={`p-2.5 rounded-xl border transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Desktop Table Row Component ──────────────────────────────────────────────
const SynopsisDesktopRow = ({ index, student, pendingChanges, onStatusChange, onDateChange, onCommit, currentRole }: any) => {
  const localData = pendingChanges[student.id] || { status: student.synopsis, date: student.synopsisSubmissionDate };
  const isDirty = pendingChanges[student.id] !== undefined;
  const isComplete = localData.status === 'Submitted' || localData.status === 'Approved';

  return (
    <tr className="hover:bg-slate-50/50 transition-all group">
      <td className="px-8 py-6 text-center">
        <span className="text-[11px] font-black text-slate-300 tabular-nums">{index}</span>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
           <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0 transition-all ${isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
             {student.name[0]}
           </div>
           <div className="min-w-0">
              <p className="font-black text-slate-900 text-[15px] tracking-tight truncate leading-tight">{student.name}</p>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1.5 tabular-nums">{student.regNo || '---'}</p>
           </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[8px] font-black uppercase tracking-tight w-fit">{student.degree}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px]">{student.department}</span>
         </div>
      </td>
      <td className="px-8 py-6">
         <div className="flex items-center gap-2 text-slate-600">
            <User size={13} className="text-slate-300" />
            <span className="text-xs font-bold truncate max-w-[180px]">{student.supervisorName || '---'}</span>
         </div>
      </td>
      <td className="px-8 py-6">
         <div className="relative w-44">
            <select 
              disabled={!currentRole?.canEdit}
              className={`w-full pl-5 pr-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none border transition-all cursor-pointer ${
                isComplete 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : (localData.status === 'Not Submitted' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200')
              } ${!currentRole?.canEdit ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
              value={localData.status}
              onChange={(e) => onStatusChange(student.id, e.target.value)}
            >
              <option value="Not Submitted">Not Submitted</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
            </select>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isComplete ? 'text-emerald-500' : 'text-slate-400'}`}>
              <ChevronDown size={14} />
            </div>
         </div>
      </td>
      <td className="px-8 py-6">
         <div className="relative">
           <input 
              type="date"
              disabled={localData.status === 'Not Submitted' || !currentRole?.canEdit}
              className="w-full pl-5 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 transition-all"
              value={localData.date || ''}
              onChange={(e) => onDateChange(student.id, e.target.value)}
           />
         </div>
      </td>
      <td className="px-8 py-6 text-right">
         <button 
           onClick={() => onCommit(student)}
           disabled={!isDirty || !currentRole?.canEdit}
           className={`p-3.5 rounded-xl transition-all shadow-sm ${
             isDirty && currentRole?.canEdit 
               ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/20' 
               : 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100'
           }`}
           title="Commit update to database"
         >
           <Save size={18} />
         </button>
      </td>
    </tr>
  );
};

// ─── Mobile Card Component ────────────────────────────────────────────────────
const SynopsisMobileCard = ({ student, pendingChanges, onStatusChange, onDateChange, onCommit, currentRole }: any) => {
  const localData = pendingChanges[student.id] || { status: student.synopsis, date: student.synopsisSubmissionDate };
  const isDirty = pendingChanges[student.id] !== undefined;
  const isComplete = localData.status === 'Submitted' || localData.status === 'Approved';

  return (
    <div className="p-8 flex flex-col gap-6 relative overflow-hidden group">
      <div className={`absolute -top-4 -right-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.1] pointer-events-none ${isComplete ? 'text-emerald-600' : 'text-indigo-600'}`}>
        <ClipboardList size={120} />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {student.name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">{student.name}</h3>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2">{student.regNo || '---'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
           <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[7px] font-black uppercase">{student.degree}</span>
           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{student.department}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Milestone Status</label>
          <div className="relative">
            <select 
              disabled={!currentRole?.canEdit}
              className={`w-full px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all appearance-none outline-none ${
                isComplete 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : (localData.status === 'Not Submitted' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200')
              } ${!currentRole?.canEdit ? 'opacity-50 cursor-not-allowed' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
              value={localData.status || ''}
              onChange={(e) => onStatusChange(student.id, e.target.value)}
            >
              <option value="Not Submitted">Not Submitted</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Submission Date</label>
          <input 
            type="date"
            disabled={localData.status === 'Not Submitted' || !currentRole?.canEdit}
            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 transition-all"
            value={localData.date || ''}
            onChange={(e) => onDateChange(student.id, e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          onClick={() => onCommit(student)}
          disabled={!isDirty || !currentRole?.canEdit}
          className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
            isDirty && currentRole?.canEdit 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 active:scale-95' 
              : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
          }`}
        >
          <Save size={16} />
          <span>Commit Update</span>
        </button>
        <Link to={`/students/${student.id}`} className="p-4 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
           <Eye size={18} />
        </Link>
      </div>
    </div>
  );
};

export default SynopsisSubmission;
