import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  Search, Eye, RefreshCw, Archive, MapPin, 
  GraduationCap, Calendar, ChevronRight, ChevronLeft,
  X, Filter, FileSpreadsheet, RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Student } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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
    </div>
  </div>
);

// ─── KPI mini-card ────────────────────────────────────────────────────────────
const KpiMini = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-5 shadow-sm" style={{ background: gradient }}>
    <div className="absolute -bottom-3 -right-3 opacity-10 pointer-events-none">
      <Icon size={70} className="text-white" />
    </div>
    <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <h4 className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">{value}</h4>
  </div>
);

const StudentArchive: React.FC = () => {
  const { students, restoreStudent, currentRole, departments, settings } = useStore();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [filterDegree,     setFilterDegree]     = useState('');
  const [filterDept,       setFilterDept]       = useState('');
  const [filterYear,       setFilterYear]       = useState('');
  const [currentPage,      setCurrentPage]      = useState(1);
  const [restoringId,      setRestoringId]      = useState<string | null>(null);

  const itemsPerPage = 15;

  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  // ── Data Generation ───────────────────────────────────────────────────────
  const archivedStudents = useMemo(() => students.filter(s => s.isArchived), [students]);

  // Extract unique graduation years from the actual archived data for the filter dropdown
  const graduationYears = useMemo(() => {
    const years = new Set(archivedStudents.map(s => s.graduationYear).filter(Boolean) as string[]);
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [archivedStudents]);

  const filtered = useMemo(() => {
    return archivedStudents.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q);
      const matchesDegree = filterDegree === '' || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
      const matchesDept   = filterDept   === '' || s.department === filterDept;
      const matchesYear   = filterYear   === '' || s.graduationYear === filterYear;
      return matchesSearch && matchesDegree && matchesDept && matchesYear;
    });
  }, [archivedStudents, searchTerm, filterDegree, filterDept, filterYear]);

  const totalPages        = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasActiveFilters  = !!(filterDegree || filterDept || filterYear || searchTerm);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDegree, filterDept, filterYear]);

  const resetFilters = () => {
    setSearchTerm(''); setFilterDegree(''); setFilterDept(''); setFilterYear(''); setCurrentPage(1);
  };

  const handleRestore = async () => {
    if (restoringId) {
      await restoreStudent(restoringId);
      setRestoringId(null);
    }
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Scholar Name', 'Registration #', 'Degree', 'Program', 'Department', 'Completion Year', 'Status'];
    const rows = filtered.map(s => [s.name, s.regNo, s.degree, s.programme, s.department, s.graduationYear || '—', s.status]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Scholar_Archive_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Scholar Archive</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Historical Graduation Records · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end border-r border-slate-200 pr-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Archived</span>
            <span className="text-lg font-black text-teal-600 tabular-nums leading-none">{filtered.length}</span>
          </div>
          <button onClick={exportCSV} disabled={!filtered.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-40 shadow-sm">
            <FileSpreadsheet size={14} /><span className="hidden sm:inline">Export History</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiMini label="Total Alumni" value={archivedStudents.length} gradient="linear-gradient(135deg,#0f766e 0%,#14b8a6 100%)" icon={Archive} />
        <KpiMini label="PhD Awarded" value={archivedStudents.filter(s => normalizeDegree(s.degree) === 'PHD').length} gradient="linear-gradient(135deg,#4338ca 0%,#6366f1 100%)" icon={GraduationCap} />
        <KpiMini label="M.Phil Awarded" value={archivedStudents.filter(s => normalizeDegree(s.degree) === 'MPHIL').length} gradient="linear-gradient(135deg,#5b21b6 0%,#8b5cf6 100%)" icon={GraduationCap} />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 no-print">
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={16} />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/8 transition-all placeholder:text-slate-300"
              placeholder="Search alumni by name or reg number..."
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
            <span className="hidden sm:block">Clear</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FilterSelect label="Degree" value={filterDegree} icon={GraduationCap}
            options={['M.Phil', 'PhD']} displayOptions={['M.Phil', 'PhD']} onChange={setFilterDegree} />
          <FilterSelect label="Department" value={filterDept} icon={MapPin}
            options={departments} onChange={setFilterDept} />
          <FilterSelect label="Graduation Year" value={filterYear} icon={Calendar}
            options={graduationYears} onChange={setFilterYear} />
        </div>
      </div>

      {/* ── Main Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedStudents.map(student => (
            <div key={student.id} className="p-5 flex flex-col gap-3.5 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base bg-teal-50 text-teal-600">
                  {student.name[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 leading-none">{student.name}</p>
                  <p className="text-[9px] font-black text-teal-600 mt-0.5">{student.regNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-slate-50 rounded-lg p-2 flex flex-col">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Class Of</span>
                  <span className="text-[10px] font-bold text-slate-700">{student.graduationYear || '—'}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 flex flex-col">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Status</span>
                  <span className="text-[10px] font-bold text-slate-700">{student.status}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 flex flex-col">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Programme</span>
                  <span className="text-[10px] font-bold text-slate-700">{student.degree} · {student.programme}</span>
              </div>
              <div className="flex gap-2">
                <Link to={`/students/${student.id}`}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center">
                  <Eye size={14} />
                </Link>
                {currentRole?.StudentArchive?.edit && (
                  <button onClick={() => setRestoringId(student.id)}
                    className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1.5">
                    <RefreshCw size={13} /><span>Restore</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Scholar Details</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Study Programme</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-5 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Graduation Year</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-300 tabular-nums">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                        {student.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate leading-none">{student.name}</p>
                        <p className="text-[9px] font-black text-teal-600 mt-1 tabular-nums">{student.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[7px] font-black uppercase tracking-tight">{student.degree}</span>
                      <span className="text-[10px] font-black text-slate-700 uppercase truncate">{student.programme}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{student.department}</p>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="w-auto inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-black tabular-nums border border-slate-200">
                      {student.graduationYear || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/students/${student.id}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="View Profile">
                        <Eye size={16} />
                      </Link>
                      {currentRole?.StudentArchive?.edit && (
                        <button onClick={() => setRestoringId(student.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Restore to Active Registry">
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Archive size={36} className="text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No Archived Scholars Found</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Start by archiving completed students from the records page.</p>
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-500 transition-all">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination etc */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-teal-600">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600 shadow-sm'}`}>
                <ChevronLeft size={15} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const n = i + 1;
                if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                  return (
                    <button key={n} onClick={() => setCurrentPage(n)}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${
                        currentPage === n
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                      }`}>{n}</button>
                  );
                } else if (n === currentPage - 2 || n === currentPage + 2) {
                  return <span key={n} className="text-slate-300 px-1 text-xs">…</span>;
                }
                return null;
              })}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600 shadow-sm'}`}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Restore Confirmation Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {restoringId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRestoringId(null)} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 bg-indigo-500" />
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                  <RefreshCw size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Restore Scholar?</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">
                    This will move the scholar record back into the active student registry layer.
                  </p>
                </div>
              </div>
              <div className="px-8 pb-8 flex gap-3">
                <button onClick={() => setRestoringId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleRestore}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-sm">
                  Confirm Restore
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default StudentArchive;
