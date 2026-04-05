import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import {
  AlertTriangle, RefreshCcw, Search, User, BookOpen,
  Building2, GraduationCap, FileText, CheckCircle2,
  Copy, ChevronDown, ChevronUp, Layers, Shield,
  Download, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeTitle } from '../utils/pdfTitleExtractor';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TitleRecord {
  studentId: string;
  studentName: string;
  regNo: string;
  department: string;
  supervisorName: string;
  degree: string;
  thesisTitle: string;
  cnic: string;
  submissionDate?: string | null;
  publicUrl?: string | null;
}

interface DuplicateGroup {
  normalizedTitle: string;
  displayTitle: string;
  students: TitleRecord[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="p-2 bg-slate-100 rounded-xl mt-0.5">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">{subtitle}</p>
    </div>
  </div>
);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white border border-rose-200 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
            {group.students.length}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Duplicate Thesis Title Detected</p>
            <p className="text-sm font-black text-slate-900 leading-snug truncate">{group.displayTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[9px] font-black uppercase tracking-widest">
            <AlertTriangle size={11} /> {group.students.length} Matches
          </span>
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-2 bg-white border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Student Rows */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Scholar Name', 'Reg. No', 'Department', 'Supervisor', 'Degree', 'Thesis PDF'].map(h => (
                      <th key={h} className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.students.map((s, i) => (
                    <tr key={s.studentId + i} className="hover:bg-rose-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {s.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{s.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full tabular-nums">{s.regNo || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px] block">{s.department || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px] block">{s.supervisorName || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{s.degree || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {s.publicUrl ? (
                          <a href={s.publicUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all w-fit">
                            <Download size={11} /> View PDF
                          </a>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Not Uploaded</span>
                        )}
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
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-base shrink-0">
                      {s.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{s.studentName}</p>
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
                  {s.publicUrl && (
                    <a href={s.publicUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit hover:bg-emerald-600 hover:text-white transition-all">
                      <Download size={12} /> View Thesis PDF
                    </a>
                  )}
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
  const { students, settings } = useStore();

  const [titleRecords, setTitleRecords] = useState<TitleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch thesis titles from server (stored in thesis_submissions / localStorage fallback)
  const fetchTitleRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/thesis-titles');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.records) {
          // Merge with student data for full details
          const enriched: TitleRecord[] = data.records
            .filter((r: any) => r.thesisTitle)
            .map((r: any) => {
              const student = students.find(
                s => s.cnic?.replace(/[-\s]/g, '').trim() === r.cnic?.replace(/[-\s]/g, '').trim()
              );
              return {
                studentId: student?.id || r.cnic,
                studentName: student?.name || r.studentName || 'Unknown',
                regNo: student?.regNo || r.regNo || '—',
                department: student?.department || r.department || '—',
                supervisorName: student?.supervisorName || r.supervisorName || '—',
                degree: student?.degree || r.degree || '—',
                thesisTitle: r.thesisTitle,
                cnic: r.cnic,
                submissionDate: r.submissionDate || null,
                publicUrl: student?.publicUrl || r.publicUrl || null,
              };
            });
          setTitleRecords(enriched);
          setLastRefreshed(new Date());
          return;
        }
      }
    } catch {/* will fallback */}

    // Fallback: read from localStorage (titles stored by student portal)
    const localTitles: TitleRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('thesis_title_')) {
        try {
          const cnic = key.replace('thesis_title_', '');
          const stored = JSON.parse(localStorage.getItem(key) || '{}');
          const student = students.find(
            s => s.cnic?.replace(/[-\s]/g, '').trim() === cnic
          );
          if (stored.title && student) {
            localTitles.push({
              studentId: student.id,
              studentName: student.name,
              regNo: student.regNo,
              department: student.department,
              supervisorName: student.supervisorName,
              degree: student.degree,
              thesisTitle: stored.title,
              cnic,
              submissionDate: null,
              publicUrl: student.publicUrl || null,
            });
          }
        } catch { /* skip */ }
      }
    }
    setTitleRecords(localTitles);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => {
    if (students.length > 0) fetchTitleRecords();
    else setLoading(false);
  }, [students]);

  // ── Duplicate Detection ──────────────────────────────────────────────────
  const duplicateGroups = useMemo((): DuplicateGroup[] => {
    const groups: Map<string, DuplicateGroup> = new Map();

    for (const record of titleRecords) {
      if (!record.thesisTitle) continue;
      const key = normalizeTitle(record.thesisTitle);
      if (!groups.has(key)) {
        groups.set(key, {
          normalizedTitle: key,
          displayTitle: record.thesisTitle,
          students: [],
        });
      }
      groups.get(key)!.students.push(record);
    }

    return [...groups.values()]
      .filter(g => g.students.length >= 2)
      .sort((a, b) => b.students.length - a.students.length);
  }, [titleRecords]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return duplicateGroups;
    const q = searchTerm.toLowerCase();
    return duplicateGroups.filter(g =>
      g.displayTitle.toLowerCase().includes(q) ||
      g.students.some(s =>
        s.studentName.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      )
    );
  }, [duplicateGroups, searchTerm]);

  const totalStudentsInDuplicates = useMemo(
    () => duplicateGroups.reduce((sum, g) => sum + g.students.length, 0),
    [duplicateGroups]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-20 max-w-full"
    >
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings?.institution?.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Thesis Duplicate Detector</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">
              AI-Powered Plagiarism Guard · {settings?.institution?.name || 'CUVAS'}
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
            onClick={fetchTitleRecords}
            disabled={loading}
            className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Titles Indexed" value={titleRecords.length}
          color="linear-gradient(135deg,#4338ca 0%,#6d28d9 100%)" />
        <StatCard icon={AlertTriangle} label="Duplicate Groups" value={duplicateGroups.length}
          color={duplicateGroups.length > 0 ? "linear-gradient(135deg,#dc2626 0%,#e11d48 100%)" : "linear-gradient(135deg,#059669 0%,#16a34a 100%)"} />
        <StatCard icon={User} label="Affected Students" value={totalStudentsInDuplicates}
          color="linear-gradient(135deg,#b45309 0%,#ea580c 100%)" />
        <StatCard icon={CheckCircle2} label="Unique Titles" value={titleRecords.length - totalStudentsInDuplicates + duplicateGroups.length}
          color="linear-gradient(135deg,#0369a1 0%,#0284c7 100%)" />
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!loading && duplicateGroups.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-800 uppercase tracking-wide">
                {duplicateGroups.length} Duplicate Title Group{duplicateGroups.length !== 1 ? 's' : ''} Detected
              </p>
              <p className="text-[10px] text-rose-600 font-medium mt-1">
                {totalStudentsInDuplicates} student{totalStudentsInDuplicates !== 1 ? 's' : ''} have submitted identical thesis titles. Please review and take action.
              </p>
            </div>
          </motion.div>
        )}
        {!loading && duplicateGroups.length === 0 && titleRecords.length > 0 && (
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

      {/* ── Search + Results ──────────────────────────────────────────────── */}
      {titleRecords.length > 0 && (
        <div className="space-y-4">
          <div className="relative group">
            <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by title, student name, reg. no or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-13 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all placeholder:text-slate-300 shadow-sm"
              style={{ paddingLeft: '3.25rem' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* Duplicate Groups */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning for duplicates...</p>
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="space-y-4">
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
                {searchTerm ? 'Try a different search term.' : 'No duplicate titles in current dataset.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── No Titles State ───────────────────────────────────────────────── */}
      {!loading && titleRecords.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="py-24 flex flex-col items-center gap-6 text-center px-6">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
              <FileText size={40} className="text-slate-300" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 uppercase tracking-tight">No Thesis Titles Indexed</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 max-w-md">
                Thesis titles will appear here once students upload and submit their thesis through the Student Portal. 
                Titles are automatically extracted from uploaded PDFs.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl max-w-sm">
              <Shield size={18} className="text-indigo-600 shrink-0" />
              <p className="text-[10px] font-bold text-indigo-700 text-left">
                When students submit their thesis PDF, the system automatically extracts the title and indexes it here for duplicate detection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── All Indexed Titles Table ───────────────────────────────────────── */}
      {!loading && titleRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <SectionHeader icon={Layers} title="All Indexed Titles" subtitle={`${titleRecords.length} thesis title${titleRecords.length !== 1 ? 's' : ''} on record`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['#', 'Scholar', 'Reg. No', 'Department', 'Degree', 'Extracted Thesis Title', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {titleRecords.map((r, idx) => {
                  const isDup = duplicateGroups.some(g => g.students.some(s => s.studentId === r.studentId && s.thesisTitle === r.thesisTitle));
                  return (
                    <tr key={r.studentId + idx} className={`hover:bg-slate-50/60 transition-colors ${isDup ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-5 py-4 text-[10px] font-black text-slate-300 tabular-nums">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${isDup ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {r.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{r.studentName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{r.regNo || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[130px] block">{r.department || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-black text-slate-600 uppercase">{r.degree || '—'}</span>
                      </td>
                      <td className="px-5 py-4 max-w-[280px]">
                        <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{r.thesisTitle}</p>
                      </td>
                      <td className="px-5 py-4">
                        {isDup ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[8px] font-black uppercase tracking-widest w-fit">
                            <AlertTriangle size={9} /> Duplicate
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[8px] font-black uppercase tracking-widest w-fit">
                            <CheckCircle2 size={9} /> Unique
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ThesisDuplicates;
