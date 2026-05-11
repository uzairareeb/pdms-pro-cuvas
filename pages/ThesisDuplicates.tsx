import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import {
  AlertTriangle, RefreshCcw, Search, User, BookOpen,
  Building2, GraduationCap, FileText, CheckCircle2,
  ChevronDown, ChevronUp, Layers, Shield, RotateCcw, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRecord {
  studentId: string;
  studentName: string;
  regNo: string;
  department: string;
  supervisorName: string;
  degree: string;
  thesisTitle: string;
  cnic: string;
  submissionDate?: string | null;
}

interface DuplicateGroup {
  normalizedTitle: string;
  displayTitle: string;
  count: number;
  students: StudentRecord[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: any; label: string; value: string | number; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 shadow-md text-white" style={{ background: color }}>
    <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none">
      <Icon size={70} className="text-white" />
    </div>
    <div className="p-2 bg-white/20 rounded-xl w-fit mb-3">
      <Icon size={18} className="text-white" />
    </div>
    <p className="text-[10px] font-black text-white/75 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-white leading-tight tabular-nums">{value}</p>
  </div>
);

// ─── DuplicateCard ────────────────────────────────────────────────────────────
const DuplicateCard: React.FC<{ group: DuplicateGroup; index: number }> = ({ group, index }) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyTitle = () => {
    navigator.clipboard.writeText(group.displayTitle).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white border border-rose-200 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-rose-50 to-rose-100/60 border-b border-rose-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Count badge */}
            <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              {group.students.length}
            </div>
            <div className="min-w-0">
              {/* DUPLICATE FOUND badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-2 shadow-sm">
                <AlertTriangle size={10} /> DUPLICATE FOUND
              </span>
              {/* Thesis title */}
              <p className="text-sm font-black text-slate-900 leading-snug break-words">{group.displayTitle}</p>
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-1">
                {group.students.length} students share this thesis title
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyTitle}
              title="Copy title"
              className="p-2 bg-white border border-rose-200 text-rose-400 rounded-xl hover:bg-rose-100 transition-all"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <button
              onClick={() => setExpanded(p => !p)}
              className="p-2 bg-white border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Student Details ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['#', 'Student Name', 'Reg. No', 'Department', 'Supervisor', 'Thesis Title'].map(h => (
                      <th key={h} className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.students.map((s, i) => (
                    <tr key={s.studentId + i} className="hover:bg-rose-50/30 transition-colors group">
                      <td className="px-5 py-4 text-[10px] font-black text-slate-300 tabular-nums">{i + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            {(s.studentName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{s.studentName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full tabular-nums">{s.regNo || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={11} className="text-slate-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[160px]">{s.department || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={11} className="text-slate-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{s.supervisorName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[260px]">
                        <p className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg leading-snug line-clamp-2">{s.thesisTitle}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {group.students.map((s, i) => (
                <div key={s.studentId + i} className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-black text-base shrink-0">
                      {(s.studentName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{s.studentName || '—'}</p>
                      <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">{s.regNo || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{s.department || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Supervisor</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{s.supervisorName || '—'}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Thesis Title</p>
                    <p className="text-xs font-bold text-rose-700 leading-snug">{s.thesisTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ThesisDuplicates: React.FC = () => {
  const { settings } = useStore();

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [totalIndexed, setTotalIndexed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch duplicates from the dedicated endpoint
      const [dupRes, allRes] = await Promise.all([
        fetch('/api/admin/thesis-duplicates'),
        fetch('/api/admin/thesis-titles'),
      ]);

      const dupData = dupRes.ok ? await dupRes.json() : { success: false, duplicateGroups: [] };
      const allData = allRes.ok ? await allRes.json() : { success: false, records: [] };

      if (dupData.success) {
        setDuplicateGroups(dupData.duplicateGroups || []);
      }
      if (allData.success) {
        setTotalIndexed((allData.records || []).length);
      }
      setLastRefreshed(new Date());
    } catch (e: any) {
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDuplicates(); }, []);

  const totalAffected = useMemo(
    () => duplicateGroups.reduce((sum, g) => sum + g.students.length, 0),
    [duplicateGroups]
  );

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return duplicateGroups;
    const q = searchTerm.toLowerCase();
    return duplicateGroups.filter(g =>
      g.displayTitle.toLowerCase().includes(q) ||
      g.students.some(s =>
        s.studentName.toLowerCase().includes(q) ||
        (s.regNo || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.supervisorName || '').toLowerCase().includes(q)
      )
    );
  }, [duplicateGroups, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-20 max-w-full"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings?.institution?.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Duplicate Thesis Detection
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">
              Admin Intelligence · {settings?.institution?.name || 'CUVAS'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Scanned</p>
            <p className="text-[10px] font-bold text-slate-600 mt-0.5">
              {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={fetchDuplicates}
            disabled={loading}
            className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Titles Indexed" value={totalIndexed}
          color="linear-gradient(135deg,#4338ca 0%,#6d28d9 100%)" />
        <StatCard icon={AlertTriangle} label="Duplicate Groups" value={duplicateGroups.length}
          color={duplicateGroups.length > 0
            ? "linear-gradient(135deg,#dc2626 0%,#e11d48 100%)"
            : "linear-gradient(135deg,#059669 0%,#16a34a 100%)"} />
        <StatCard icon={User} label="Affected Students" value={totalAffected}
          color="linear-gradient(135deg,#b45309 0%,#ea580c 100%)" />
        <StatCard icon={CheckCircle2} label="Unique Titles" value={Math.max(0, totalIndexed - totalAffected + duplicateGroups.length)}
          color="linear-gradient(135deg,#0369a1 0%,#0284c7 100%)" />
      </div>

      {/* ── Alert / All-Clear Banner ── */}
      <AnimatePresence>
        {!loading && error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">{error}</p>
          </motion.div>
        )}
        {!loading && !error && duplicateGroups.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-800 uppercase tracking-wide">
                {duplicateGroups.length} Duplicate Thesis Title Group{duplicateGroups.length !== 1 ? 's' : ''} Detected
              </p>
              <p className="text-[10px] text-rose-600 font-medium mt-1">
                {totalAffected} student{totalAffected !== 1 ? 's' : ''} share identical thesis titles. Please review and take action.
              </p>
            </div>
          </motion.div>
        )}
        {!loading && !error && duplicateGroups.length === 0 && totalIndexed > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <p className="text-sm font-black text-emerald-800 uppercase tracking-wide">
              All Clear — No Duplicate Thesis Titles Found
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading State ── */}
      {loading && (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning for duplicate thesis titles...</p>
        </div>
      )}

      {/* ── Search + Duplicate Cards ── */}
      {!loading && totalIndexed > 0 && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative group">
            <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by thesis title, student name, reg. no, department or supervisor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-13 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all placeholder:text-slate-300 shadow-sm"
              style={{ paddingLeft: '3.25rem' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* Results */}
          {filteredGroups.length > 0 ? (
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center gap-3 px-1">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <Layers size={15} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Duplicate Groups</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} · {totalAffected} affected students
                  </p>
                </div>
              </div>
              {filteredGroups.map((group, idx) => (
                <DuplicateCard key={group.normalizedTitle} group={group} index={idx} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No Matches Found</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                {searchTerm ? 'Try a different search term.' : 'No duplicate thesis titles detected in current dataset.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && totalIndexed === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="py-24 flex flex-col items-center gap-6 text-center px-6">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
              <FileText size={40} className="text-slate-300" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 uppercase tracking-tight">No Thesis Titles Indexed</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 max-w-md">
                Thesis titles will appear here once students add or update their thesis title through the Student Portal.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl max-w-sm">
              <Shield size={18} className="text-indigo-600 shrink-0" />
              <p className="text-[10px] font-bold text-indigo-700 text-left">
                The system automatically detects duplicates when 2 or more students share an identical thesis title. No student access is restricted.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ThesisDuplicates;
