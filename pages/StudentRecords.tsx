
import React, { useState } from 'react';
import { useStore } from '../store';
import {
  Search, Eye, Trash2, Lock, Unlock,
  X, User, RotateCcw, ChevronDown, ShieldAlert,
  MapPin, Briefcase, ChevronRight, ChevronLeft,
  GraduationCap, CheckCircle2, Users, Filter,
  AlertCircle, Printer, Archive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Student, StudentStatus, ValidationStatus } from '../types';
import Tooltip from '../components/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeStatus } from '../utils/dashboardMetrics';

// ─── Status badge config ──────────────────────────────────────────────────────
const getStatusStyle = (status: string) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'active')    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'completed') return 'bg-teal-50    text-teal-700    border-teal-200';
  if (s === 'dropped')   return 'bg-orange-50  text-orange-700  border-orange-200';
  if (s === 'suspended') return 'bg-violet-50  text-violet-700  border-violet-200';
  if (s === 'on leave')  return 'bg-purple-50  text-purple-700  border-purple-200';
  if (s === 'closed')    return 'bg-amber-50   text-amber-700   border-amber-200';
  return                        'bg-slate-100  text-slate-600   border-slate-200';
};

const getValidationStyle = (v: string) => {
  if (v === ValidationStatus.APPROVED) return { dot: 'bg-emerald-500', text: 'text-emerald-600' };
  if (v === ValidationStatus.RETURNED) return { dot: 'bg-rose-500',    text: 'text-rose-600'    };
  return                                       { dot: 'bg-amber-400',  text: 'text-amber-600'   };
};

// ─── FilterSelect ─────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, options, displayOptions, onChange, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">{label}</label>
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${value ? 'text-indigo-600' : 'text-slate-300'}`}>
        <Icon size={14} />
      </div>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full pl-10 pr-9 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all border
          ${value
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 focus:ring-4 focus:ring-indigo-500/10'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/8'
          }`}
      >
        <option value="">All</option>
        {options.map((opt: string, idx: number) => (
          <option key={opt} value={opt}>{displayOptions ? displayOptions[idx] : opt}</option>
        ))}
      </select>
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${value ? 'text-indigo-500' : 'text-slate-300'}`}>
        <ChevronDown size={13} />
      </div>
    </div>
  </div>
);

// ─── Sidebar MetricRow ────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between items-start gap-4 py-3 border-b border-slate-50 last:border-0">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">{label}</span>
    <span className="text-[11px] font-bold text-slate-900 text-right leading-tight">{value || '—'}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentRecords: React.FC = () => {
  const {
    students, deleteStudent, bulkDeleteStudents, deleteAllStudents,
    toggleLockStudent, currentRole, departments, settings, isDatabaseConnected
  } = useStore();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [selectedIds,      setSelectedIds]      = useState<string[]>([]);
  const [isBulkDeleting,   setIsBulkDeleting]   = useState(false);
  const [isDeletingAll,    setIsDeletingAll]     = useState(false);
  const [filterDegree,     setFilterDegree]     = useState('');
  const [filterDept,       setFilterDept]       = useState('');
  const [filterStatus,     setFilterStatus]     = useState('');
  const [filterValidation, setFilterValidation] = useState('');
  const [currentPage,      setCurrentPage]      = useState(1);
  const [deletingId,       setDeletingId]       = useState<string | null>(null);
  const [previewStudent,   setPreviewStudent]   = useState<Student | null>(null);

  const itemsPerPage = 15;

  const resetFilters = () => {
    setSearchTerm(''); setFilterDegree(''); setFilterDept('');
    setFilterStatus(''); setFilterValidation(''); setCurrentPage(1);
  };

  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  const filtered = students.filter(s => {
    if (s.isArchived) return false;
    const q = searchTerm.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q) ||
      s.cnic.includes(q) || s.programme.toLowerCase().includes(q) || s.supervisorName.toLowerCase().includes(q);
    const matchesDegree     = filterDegree     === '' || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
    const matchesDept       = filterDept       === '' || s.department === filterDept;
    const matchesStatus     = filterStatus     === '' || normalizeStatus(s.status) === normalizeStatus(filterStatus);
    const matchesValidation = filterValidation === '' || s.validationStatus === filterValidation;
    return matchesSearch && matchesDegree && matchesDept && matchesStatus && matchesValidation;
  });

  const totalPages        = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasActiveFilters  = !!(filterDegree || filterDept || filterStatus || filterValidation || searchTerm);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDegree, filterDept, filterStatus, filterValidation]);

  const handleToggleLock = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try { await toggleLockStudent(id); } catch (err) { console.error(err); }
  };

  const handleSelectAll = () =>
    setSelectedIds(selectedIds.length === paginatedStudents.length ? [] : paginatedStudents.map(s => s.id));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleDelete = async () => {
    try {
      if (isDeletingAll)       { await deleteAllStudents();           setIsDeletingAll(false); }
      else if (isBulkDeleting) { await bulkDeleteStudents(selectedIds); setSelectedIds([]); setIsBulkDeleting(false); }
      else if (deletingId)     { await deleteStudent(deletingId);       setDeletingId(null); }
    } catch (err) { console.error('Deletion failed:', err); }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5 pb-20 max-w-full"
    >

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Student List</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Postgraduate Scholar Registry · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* DB Warning */}
          {!isDatabaseConnected && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[9px] font-black uppercase tracking-wide">
              <ShieldAlert size={14} />
              <span>Database offline</span>
              <Link to="/settings" className="underline hover:no-underline">Connect</Link>
            </div>
          )}

          {/* Bulk delete */}
          {selectedIds.length > 0 && currentRole?.StudentRecords?.delete && (
            <button onClick={() => setIsBulkDeleting(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95">
              <Trash2 size={13} /><span>Delete {selectedIds.length} selected</span>
            </button>
          )}

          {/* Delete all */}
          {students.length > 0 && currentRole?.StudentRecords?.delete && (
            <button onClick={() => setIsDeletingAll(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all">
              Delete All
            </button>
          )}

          {/* Count */}
          <div className="flex flex-col items-end border-l border-slate-200 pl-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Showing</span>
            <span className="text-lg font-black text-indigo-600 tabular-nums leading-none">{filtered.length}<span className="text-slate-300 font-bold">/{students.length}</span></span>
          </div>

          {/* Print */}
          <button onClick={() => window.print()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all">
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 no-print">
        {/* Search + Reset row */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all placeholder:text-slate-300"
              placeholder="Search by name, reg number, CNIC, or supervisor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
              hasActiveFilters
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95'
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={13} />
            <span className="hidden sm:block">Clear Filters</span>
          </button>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterSelect label="Degree" value={filterDegree} icon={GraduationCap}
            options={['M.Phil', 'PhD']} displayOptions={['M.Phil', 'PhD']} onChange={setFilterDegree} />
          <FilterSelect label="Department" value={filterDept} icon={MapPin}
            options={departments} onChange={setFilterDept} />
          <FilterSelect label="Status" value={filterStatus} icon={Briefcase}
            options={Object.values(StudentStatus)} onChange={setFilterStatus} />
          <FilterSelect label="Audit Status" value={filterValidation} icon={CheckCircle2}
            options={Object.values(ValidationStatus)} onChange={setFilterValidation} />
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-50">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active:</span>
            {searchTerm    && <Chip label={`Search: "${searchTerm}"`}    onRemove={() => setSearchTerm('')} />}
            {filterDegree  && <Chip label={`Degree: ${filterDegree}`}    onRemove={() => setFilterDegree('')} />}
            {filterDept    && <Chip label={`Dept: ${filterDept}`}        onRemove={() => setFilterDept('')} />}
            {filterStatus  && <Chip label={`Status: ${filterStatus}`}    onRemove={() => setFilterStatus('')} />}
            {filterValidation && <Chip label={`Audit: ${filterValidation}`} onRemove={() => setFilterValidation('')} />}
          </div>
        )}
      </div>

      {/* ── Main Table & Cards ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* ─ Mobile Card Layout ─ */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedStudents.map(student => (
            <div key={student.id} onClick={() => setPreviewStudent(student)}
              className="p-5 flex flex-col gap-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedIds.includes(student.id)}
                    onChange={() => toggleSelect(student.id)} onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                    student.isLocked ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {student.isLocked ? <Lock size={16} /> : student.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-none">{student.name}</p>
                    <p className="text-[9px] font-black text-indigo-600 mt-0.5">{student.regNo}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold text-slate-500 truncate">{student.degree} · {student.programme}</span>
                <div className="flex items-center gap-1.5">

                  <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wide border ${getStatusStyle(student.status)}`}>
                    {student.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─ Desktop Table ─ */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-4 w-10">
                  <input type="checkbox"
                    checked={paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                </th>
                <th className="px-3 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest w-10">#</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Program / Session</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">Supervisor</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    Status
                    <Tooltip content="Academic status and validation state for each student." />
                  </div>
                </th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.map((student, idx) => {
                const validStyle = getValidationStyle(student.validationStatus);
                const isSelected = selectedIds.includes(student.id);
                const isPreviewed = previewStudent?.id === student.id;
                return (
                  <tr key={student.id} onClick={() => setPreviewStudent(student)}
                    className={`cursor-pointer transition-colors group ${isPreviewed ? 'bg-indigo-50/60' : 'hover:bg-slate-50/60'} ${student.isLocked ? 'bg-amber-50/30' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                    </td>

                    {/* Serial */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-[10px] font-black text-slate-300 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </span>
                    </td>

                    {/* Student Name + Reg */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 transition-all ${
                          student.isLocked ? 'bg-amber-100 text-amber-600' :
                          isPreviewed      ? 'bg-indigo-600 text-white' :
                          'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}>
                          {student.isLocked ? <Lock size={15} /> : student.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate leading-none">{student.name}</p>
                          <p className="text-[9px] font-black text-indigo-500 mt-1 tabular-nums">{student.regNo}</p>
                        </div>
                      </div>
                    </td>

                    {/* Program */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[7px] font-black uppercase tracking-tight">{student.degree}</span>
                        <span className="text-[10px] font-black text-slate-700 uppercase truncate">{student.programme}</span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.session} · {student.department}</p>
                    </td>

                    {/* Supervisor */}
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <div className="flex items-center gap-2 text-slate-500">
                        <User size={12} className="opacity-40 shrink-0" />
                        <span className="text-xs font-bold truncate max-w-[150px]">{student.supervisorName || '—'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wide border w-fit ${getStatusStyle(student.status)}`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/students/${student.id}`}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="View Profile">
                          <Eye size={16} />
                        </Link>

                        {currentRole?.StudentRecords?.edit && (
                          <button onClick={e => handleToggleLock(e, student.id)}
                            className={`p-2 rounded-xl transition-all ${student.isLocked ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                            title={student.isLocked ? 'Unlock Record' : 'Lock Record'}>
                            {student.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                        )}
                        {currentRole?.StudentRecords?.delete && (
                          <button onClick={e => { e.stopPropagation(); setDeletingId(student.id); }}
                            className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all" title="Delete Record">
                            <Trash2 size={16} />
                          </button>
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
              <Search size={36} className="text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No records found</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Try adjusting your search or filter criteria.</p>
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-500 transition-all">
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* ─ Pagination ─ */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-indigo-600">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
                <ChevronLeft size={15} />
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
                className={`p-2 rounded-xl border transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Preview Sidebar ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewStudent && (
          <div className="fixed inset-0 z-[60] no-print" onClick={() => setPreviewStudent(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-10">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Student Details</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">Quick Preview</p>
                </div>
                <button onClick={() => setPreviewStudent(null)}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Body */}
              <div className="flex-1 overflow-y-auto">
                {/* Avatar */}
                <div className="p-8 flex flex-col items-center text-center gap-4 border-b border-slate-50">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center font-black text-3xl shadow-md ${
                    previewStudent.isLocked ? 'bg-amber-100 text-amber-600' : 'bg-indigo-600 text-white'
                  }`}>
                    {previewStudent.isLocked ? <Lock size={36} /> : previewStudent.name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{previewStudent.name}</h2>
                    <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">{previewStudent.regNo}</span>
                  </div>
                  {/* Status badges */}
                  <div className="flex gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase border ${getStatusStyle(previewStudent.status)}`}>
                      {previewStudent.status}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase border ${
                      previewStudent.isLocked ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {previewStudent.isLocked ? '🔒 Locked' : '🔓 Open'}
                    </span>
                  </div>
                </div>

                {/* Detail rows */}
                <div className="p-6">
                  <InfoRow label="Father's Name"  value={previewStudent.fatherName} />
                  <InfoRow label="Department"     value={previewStudent.department} />
                  <InfoRow label="Degree"         value={previewStudent.degree} />
                  <InfoRow label="Program"        value={previewStudent.programme} />
                  <InfoRow label="Session"        value={previewStudent.session} />
                  <InfoRow label="Semester"       value={previewStudent.currentSemester?.toString()} />
                  <InfoRow label="Supervisor"     value={previewStudent.supervisorName} />
                  <InfoRow label="Audit Status"   value={previewStudent.validationStatus} />
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <Link to={`/students/${previewStudent.id}`}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-sm active:scale-95 group">
                  <span>Open Full Profile</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {(deletingId || isBulkDeleting || isDeletingAll) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 bg-rose-500" />
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    {isDeletingAll ? 'Delete All Students?' : isBulkDeleting ? `Delete ${selectedIds.length} Students?` : 'Delete Student Record?'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">
                    {isDeletingAll
                      ? 'This will permanently remove ALL student records. This action cannot be undone.'
                      : isBulkDeleting
                      ? `This will permanently remove the ${selectedIds.length} selected records. This action cannot be undone.`
                      : 'This will permanently remove this student record. This action cannot be undone.'}
                  </p>
                </div>
              </div>
              <div className="px-8 pb-8 flex gap-3">
                <button onClick={() => { setDeletingId(null); setIsBulkDeleting(false); setIsDeletingAll(false); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-sm">
                  Confirm Delete
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

export default StudentRecords;
