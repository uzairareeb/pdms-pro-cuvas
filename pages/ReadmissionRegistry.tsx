
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  Search, ChevronDown, FileText, FileSpreadsheet,
  RotateCcw, GraduationCap, MapPin, UserX,
  RefreshCw, AlertTriangle, Calendar, ArrowRight,
  Eye, X, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Clock
} from 'lucide-react';
import { Student, StudentStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Readmission status badge config ─────────────────────────────────────────
const getReadmissionBadge = (status?: string) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'approved') return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Approved' };
  if (s === 'rejected') return { cls: 'bg-rose-50    text-rose-700    border-rose-200',    icon: XCircle,     label: 'Rejected' };
  return                        { cls: 'bg-amber-50   text-amber-700   border-amber-200',   icon: Clock,       label: 'Pending'  };
};

// ─── FilterSelect ─────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, icon: Icon, options, displayOptions, onChange }: any) => {
  const active = Boolean(value);
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
          <option value="">All</option>
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

// ─── KPI mini-card ────────────────────────────────────────────────────────────
const KpiMini = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-5 shadow-sm" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none">
      <Icon size={64} className="text-white" />
    </div>
    <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <h4 className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">{value}</h4>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ReadmissionRegistry: React.FC = () => {
  const { students, updateStudent, logAction, notify, settings, departments, currentRole } = useStore();

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterDegree, setFilterDegree] = useState('');
  const [filterDept,   setFilterDept]   = useState('');
  const [readmitId,    setReadmitId]    = useState<string | null>(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 12;

  // ── Data ──────────────────────────────────────────────────────────────────
  const normalizeDegree = (v: string) => v.replace(/\./g, '').trim().toUpperCase();

  const readmissionCandidates = useMemo(() =>
    students.filter(s =>
      !s.isArchived &&
      (s.status === StudentStatus.DROPPED ||
      (s.readmissionStatus && s.readmissionStatus !== 'Approved'))
    ), [students]);

  const filtered = useMemo(() => {
    return readmissionCandidates.filter(s => {
      if (filterDegree && normalizeDegree(s.degree) !== normalizeDegree(filterDegree)) return false;
      if (filterDept   && s.department !== filterDept) return false;
      const q = searchTerm.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.regNo?.toLowerCase().includes(q) ||
        s.programme?.toLowerCase().includes(q)
      );
    });
  }, [readmissionCandidates, searchTerm, filterDegree, filterDept]);

  const stats = useMemo(() => ({
    total:    readmissionCandidates.length,
    pending:  readmissionCandidates.filter(s => s.readmissionStatus === 'Pending').length,
    rejected: readmissionCandidates.filter(s => s.readmissionStatus === 'Rejected').length,
  }), [readmissionCandidates]);

  const totalPages        = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasActiveFilters  = !!(filterDegree || filterDept || searchTerm);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDegree, filterDept]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleReadmit = (student: Student) => {
    const nextSemester = (student.currentSemester || 1) + 1;
    updateStudent({ ...student, status: StudentStatus.ACTIVE, currentSemester: nextSemester,
      comments: `${student.comments || ''}\n[${new Date().toLocaleDateString()}] Readmitted to Semester ${nextSemester}.`
    });
    setReadmitId(null);
    notify(`${student.name} has been restored to Active status in Semester ${nextSemester}.`, 'success');
  };

  const resetFilters = () => { setSearchTerm(''); setFilterDegree(''); setFilterDept(''); setCurrentPage(1); };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Scholar Name','Registration #','Degree','Department','Session','Last Semester','Readmission Status'];
    const rows = filtered.map(s => [s.name, s.regNo, s.degree, s.department, s.session, s.currentSemester, s.readmissionStatus || 'Pending']);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Readmission_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    logAction('Data Export', 'Exported Readmission Registry as CSV.');
  };

  const exportPDF = async () => {
    if (!filtered.length) return;
    const body = filtered.map(s => [s.name, s.regNo || '---', s.degree, s.department, s.session, s.currentSemester, s.readmissionStatus || 'Pending']);
    const { generateOfficialPDF } = await import('../utils/pdfExport');
    await generateOfficialPDF({
      reportName: 'Readmission Candidates Registry',
      headers: ['Scholar Name','Reg #','Degree','Department','Session','Last Sem','Status'],
      data: body, landscape: true
    });
  };

  const Pagination = () => (
    totalPages > 1 ? (
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>–
          <span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{' '}
          <span className="text-indigo-600">{filtered.length}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
            className={`p-2 rounded-xl border transition-all ${currentPage === 1
              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
            <ChevronLeft size={14} />
          </button>
          {[...Array(totalPages)].map((_, i) => {
            const n = i + 1;
            if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
              return (
                <button key={n} onClick={() => setCurrentPage(n)}
                  className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${
                    currentPage === n
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                  }`}>{n}</button>
              );
            } else if (n === currentPage - 2 || n === currentPage + 2) {
              return <span key={n} className="text-slate-300 px-1 text-xs">…</span>;
            }
            return null;
          })}
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
            className={`p-2 rounded-xl border transition-all ${currentPage === totalPages
              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    ) : null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5 pb-20"
    >

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Readmission Registry</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Dropped Scholars &amp; Reinstatement Requests · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2.5 no-print">
          <button onClick={exportCSV} disabled={!filtered.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-40 shadow-sm">
            <FileSpreadsheet size={14} /><span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={exportPDF} disabled={!filtered.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-40 shadow-sm">
            <FileText size={14} /><span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <KpiMini label="Total Candidates"   value={stats.total}    gradient="linear-gradient(135deg,#dc2626 0%,#e11d48 100%)" icon={AlertTriangle} />
        <KpiMini label="Pending Review"     value={stats.pending}  gradient="linear-gradient(135deg,#b45309 0%,#d97706 100%)" icon={RefreshCw}     />
        <KpiMini label="Previously Rejected" value={stats.rejected} gradient="linear-gradient(135deg,#475569 0%,#64748b 100%)" icon={UserX}          />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 no-print">
        {/* Search + Reset + Notice */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, reg number, or programme..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all placeholder:text-slate-300"
            />
          </div>
          <button onClick={resetFilters} disabled={!hasActiveFilters}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
              hasActiveFilters
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95'
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}>
            <RotateCcw size={13} />
            <span className="hidden sm:block">Reset</span>
          </button>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <FilterSelect label="Degree" value={filterDegree} icon={GraduationCap}
            options={['M.Phil','PhD']} displayOptions={['M.Phil','PhD']} onChange={setFilterDegree} />
          <FilterSelect label="Department" value={filterDept} icon={MapPin}
            options={departments} onChange={setFilterDept} />
          {/* Info notice */}
          <div className="hidden md:flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle size={14} className="text-rose-500 shrink-0" />
            <p className="text-[9px] font-bold text-rose-600 leading-relaxed">
              Students listed here have been dropped and require formal readmission procedures.
            </p>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-50">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active:</span>
            {searchTerm   && <Chip label={`"${searchTerm}"`}      onRemove={() => setSearchTerm('')} />}
            {filterDegree && <Chip label={`Degree: ${filterDegree}`} onRemove={() => setFilterDegree('')} />}
            {filterDept   && <Chip label={`Dept: ${filterDept}`}    onRemove={() => setFilterDept('')} />}
          </div>
        )}
      </div>

      {/* ── Table + Cards ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* ─ Mobile Card Layout ─ */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedStudents.map(student => {
            const badge = getReadmissionBadge(student.readmissionStatus);
            const BadgeIcon = badge.icon;
            return (
              <div key={student.id} className="p-5 flex flex-col gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm shrink-0">
                    {student.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{student.name}</p>
                    <p className="text-[9px] font-black text-indigo-500 mt-0.5">{student.regNo || '—'}</p>
                  </div>
                  <span className={`ml-auto px-2.5 py-1 rounded-full text-[8px] font-black uppercase border shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Degree</p>
                    <p className="text-[10px] font-black text-slate-700">{student.degree}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Semester</p>
                    <p className="text-[10px] font-black text-slate-700">{student.currentSemester}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Session</p>
                    <p className="text-[10px] font-black text-slate-700 truncate">{student.session || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {currentRole?.ReadmissionRegistry?.edit && (
                    <>
                      <button onClick={() => setReadmitId(student.id)}
                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-1.5">
                        <RefreshCw size={13} /><span>Reinstate</span>
                      </button>
                      <button onClick={() => { updateStudent({ ...student, readmissionStatus: 'Rejected', readmissionDate: new Date().toLocaleDateString() }); logAction('Readmission', `Rejected readmission for ${student.name}`, 'ReadmissionRegistry'); notify(`${student.name} Readmission Rejected`, 'error'); }}
                        className="py-2.5 px-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all">
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <Link to={`/students/${student.id}`}
                    className="py-2.5 px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─ Desktop Table ─ */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                {['#', 'Student', 'Programme', 'Last Semester', 'Request Date', 'Readmission Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest ${h === '#' ? 'w-10 text-center' : ''} ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.map((student, idx) => {
                const badge = getReadmissionBadge(student.readmissionStatus);
                const BadgeIcon = badge.icon;
                return (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* # */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-[10px] font-black text-slate-300 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </span>
                    </td>

                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {student.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate leading-none">{student.name}</p>
                          <p className="text-[9px] font-black text-indigo-500 mt-1 tabular-nums">{student.regNo || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Programme */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[7px] font-black uppercase">{student.degree}</span>
                        <span className="text-[10px] font-black text-slate-700 uppercase truncate">{student.programme}</span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.department}</p>
                    </td>

                    {/* Last Semester */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black tabular-nums">{student.currentSemester}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student.session}</span>
                      </div>
                    </td>

                    {/* Request Date */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={12} className="opacity-40 shrink-0" />
                        <span className="text-[10px] font-bold">{student.readmissionDate || '—'}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wide border w-fit ${badge.cls}`}>
                        <BadgeIcon size={11} />
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/students/${student.id}`}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="View Profile">
                          <Eye size={15} />
                        </Link>
                        {currentRole?.ReadmissionRegistry?.edit && (
                          <>
                            <button
                              onClick={() => { updateStudent({ ...student, readmissionStatus: 'Approved', status: StudentStatus.ACTIVE, readmissionDate: new Date().toLocaleDateString() }); logAction('Readmission', `Approved readmission for ${student.name}`, 'ReadmissionRegistry'); notify(`${student.name} Readmission Approved`, 'success'); }}
                              className="p-2 rounded-xl text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all" title="Approve Readmission">
                              <RefreshCw size={15} />
                            </button>
                            <button
                              onClick={() => { updateStudent({ ...student, readmissionStatus: 'Rejected', readmissionDate: new Date().toLocaleDateString() }); logAction('Readmission', `Rejected readmission for ${student.name}`, 'ReadmissionRegistry'); notify(`${student.name} Readmission Rejected`, 'error'); }}
                              className="p-2 rounded-xl text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all" title="Reject Readmission">
                              <X size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─ Empty State ─ */}
        {filtered.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
              <UserX size={36} className="text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No Dropped Students Found</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'All students are currently active — no readmission candidates.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-500 transition-all">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ─ Pagination ─ */}
        <Pagination />
      </div>

      {/* ── Readmission Confirm Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {readmitId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setReadmitId(null)} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 bg-emerald-500" />
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <RefreshCw size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Confirm Readmission?</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">
                    This will restore the student's status to <strong className="text-slate-900">Active</strong> and advance their semester in the primary registry.
                  </p>
                </div>
              </div>
              <div className="px-8 pb-8 flex gap-3">
                <button onClick={() => setReadmitId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={() => { const s = students.find(s => s.id === readmitId); if (s) handleReadmit(s); else setReadmitId(null); }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm">
                  Confirm Readmission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[8px] font-black uppercase tracking-wide">
    {label}
    <button onClick={onRemove} className="hover:text-rose-600 transition-colors"><X size={10} /></button>
  </span>
);

export default ReadmissionRegistry;
