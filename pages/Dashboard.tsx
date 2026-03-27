
import React, { useMemo } from 'react';
import { useStore } from '../store';
import { 
  Search, Plus, Download, FileBarChart, History,
  Target, BarChart3, CheckCircle, LogOut, PauseCircle,
  AlertCircle, Layers, Zap, Users, ChevronRight,
  ShieldAlert, GraduationCap, UserX
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchAutocomplete from '../components/SearchAutocomplete';
import BrandedLoader from '../components/BrandedLoader';
import {
  computeMetrics,
  isActive,
  isCompleted,
  normalizeDegree,
  normalizeStatus,
} from '../utils/dashboardMetrics';
import { Student } from '../types';

// ─── Sub-components ──────────────────────────────────────────────────────────

const QuickBtn: React.FC<{ icon: any; label: string; path: string; navigate: (p: string) => void }> = ({ icon: Icon, label, path, navigate }) => (
  <button
    onClick={() => navigate(path)}
    className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 w-full"
  >
    <Icon size={16} className="text-indigo-600 shrink-0" />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

interface StudentRowProps { student: Student; navigate: (p: string) => void; }
const ActiveStudentRow: React.FC<StudentRowProps> = ({ student, navigate }) => (
  <tr
    className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
    onClick={() => navigate(`/students/${student.id}`)}
  >
    <td className="py-4 pl-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border border-indigo-100/50">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black text-slate-900 truncate max-w-[140px]">{student.name}</span>
          <span className="text-[9px] font-bold text-slate-400 tracking-tight truncate max-w-[140px]">{student.fatherName}</span>
        </div>
      </div>
    </td>
    <td className="py-4">
      <div className="flex flex-col gap-0.5">
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[8px] font-black uppercase w-fit">{student.degree}</span>
        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[120px]">{student.department}</span>
      </div>
    </td>
    <td className="py-4 text-right pr-2">
      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full tabular-nums">{student.regNo}</span>
    </td>
  </tr>
);

interface CompletedCardProps { student: Student; navigate: (p: string) => void; }
const CompletedStudentCard: React.FC<CompletedCardProps> = ({ student, navigate }) => (
  <div
    onClick={() => navigate(`/students/${student.id}`)}
    className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 hover:border-emerald-400/40 hover:bg-emerald-50/60 transition-all cursor-pointer group/card"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-black text-sm shadow-sm border border-emerald-100 shrink-0">
        {student.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-900 truncate">{student.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[7px] font-black uppercase rounded tracking-tight">{student.degree}</span>
          <span className="text-[8px] font-bold text-slate-400 truncate">{student.regNo}</span>
        </div>
      </div>
    </div>
    <ChevronRight size={14} className="text-emerald-200 shrink-0 group-hover/card:text-emerald-500 transition-transform group-hover/card:translate-x-0.5" />
  </div>
);

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps { label: string; value: number; color: string; icon: any; subtitle?: string; }
const KpiCard: React.FC<KpiCardProps> = ({ label, value, color, icon: Icon, subtitle }) => (
  <div
    style={{ backgroundColor: color }}
    className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-white/10 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-2xl" />
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="p-2 bg-white/20 rounded-lg text-white">
        <Icon size={18} />
      </div>
      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Live</span>
    </div>
    <div className="relative z-10">
      <p className="text-[9px] font-black text-white/75 uppercase tracking-[0.25em] mb-1">{label}</p>
      <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{value}</h4>
      {subtitle && <p className="text-[8px] text-white/50 mt-1 font-bold uppercase tracking-wider">{subtitle}</p>}
    </div>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { students, isLoading, error, currentRole } = useStore();
  const navigate = useNavigate();

  // ── All metrics computed from live store data via the central utility ──────
  const m = useMemo(() => computeMetrics(students), [students]);

  // ── Lifecycle chart data ──────────────────────────────────────────────────
  const lifecycleData = useMemo(() => [
    { name: 'Registration', count: students.filter(s => !!s.regNo).length },
    { name: 'Coursework', count: students.filter(s => s.gs2CourseWork === 'Completed').length },
    { name: 'Synopsis', count: students.filter(s => s.synopsis === 'Approved').length },
    { name: 'Thesis', count: students.filter(s => s.finalThesisStatus === 'Approved').length },
    { name: 'Defense', count: students.filter(s => s.thesisSentToCOE === 'Yes').length },
    { name: 'Graduation', count: m.completedCount },
  ], [students, m.completedCount]);

  // ── Bar chart data ────────────────────────────────────────────────────────
  const barChartData = useMemo(() => [
    { stage: 'GS-2',    PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.gs2CourseWork === 'Completed').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.gs2CourseWork === 'Completed').length },
    { stage: 'Synopsis',PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.synopsis === 'Approved').length,      MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.synopsis === 'Approved').length },
    { stage: 'GS-4',   PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.gs4Form === 'Approved').length,       MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.gs4Form === 'Approved').length },
    { stage: 'Thesis',  PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.finalThesisStatus === 'Approved').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.finalThesisStatus === 'Approved').length },
    { stage: 'COE',     PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.thesisSentToCOE === 'Yes').length,    MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.thesisSentToCOE === 'Yes').length },
    { stage: 'Done',    PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && isCompleted(s)).length,                 MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && isCompleted(s)).length },
  ], [students]);

  // ── Active & Completed student lists (derived from same predicates) ────────
  const activeStudents  = useMemo(() => students.filter(isActive).slice().reverse(),    [students]);
  const completedStudents = useMemo(() => students.filter(isCompleted).slice().reverse(), [students]);

  // ── KPI Grid definition ───────────────────────────────────────────────────
  const kpiGrid = useMemo(() => [
    { label: 'Total Scholars',  value: m.totalCount,      color: '#4338CA', icon: Layers,       subtitle: `${m.maleCount}M / ${m.femaleCount}F` },
    { label: 'Male Scholars',   value: m.maleCount,       color: '#0284C7', icon: Users },
    { label: 'Female Scholars', value: m.femaleCount,     color: '#DB2777', icon: Users },
    { label: 'Active Registry', value: m.activeCount,     color: '#16A34A', icon: Zap },
    { label: 'Completed',       value: m.completedCount,  color: '#059669', icon: GraduationCap },
    { label: 'Left / Dropped',  value: m.droppedCount + m.closedCount, color: '#EA580C', icon: UserX },
    { label: 'Frozen / Leave',  value: m.suspendedCount + m.onLeaveCount, color: '#7C3AED', icon: PauseCircle },
    { label: 'Pending Audit',   value: m.pendingAuditCount, color: '#DC2626', icon: AlertCircle },
  ], [m]);

  // ─── Guard States ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <BrandedLoader
        variant="fullscreen"
        message="Loading PostGrad Hub"
        subLabel="Synchronizing registry data"
        logoSize={168}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <AlertCircle className="text-rose-500" size={48} />
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Connection Error</h2>
        <p className="text-slate-500 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">

      {/* Data Integrity Alert */}
      {(!m.isStatusSumValid || m.anomalyCount > 0) && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <ShieldAlert size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-800 uppercase tracking-wide">Data Integrity Warning</p>
            <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
              {m.anomalyCount > 0 && `${m.anomalyCount} student(s) have an unrecognized status value. `}
              {!m.isStatusSumValid && `Status category totals (${m.activeCount + m.completedCount + m.droppedCount + m.suspendedCount + m.onLeaveCount + m.closedCount + m.anomalyCount}) do not match total scholars (${m.totalCount}).`}
              {' '}Please review student records.
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative group no-print">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <SearchAutocomplete
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-indigo-600 transition-all text-sm font-medium placeholder:text-slate-400"
          placeholder="Search Scholar Registry..."
        />
      </div>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
        {kpiGrid.map((item, idx) => (
          <KpiCard key={idx} {...item} />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left Area ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">

          {/* Scholar Lifecycle Trends (Bar Chart) */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center">
                  <BarChart3 size={20} className="mr-3 text-indigo-600" />
                  Scholar Lifecycle Trends
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Milestone completion velocity · Live Database</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PhD</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MPhil</span></div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="PhD" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="MPhil" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Completed Students Card ────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
              <GraduationCap size={128} className="text-emerald-900" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center">
                  <GraduationCap size={20} className="mr-3 text-emerald-500" />
                  Completed Students
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
                  Status = <span className="text-emerald-600">Completed</span> · {m.completedCount} record{m.completedCount !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600 block tabular-nums leading-none">{m.completedCount}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Graduates</span>
              </div>
            </div>

            {completedStudents.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 relative z-10">
                <GraduationCap size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No graduates found in database</p>
                <p className="text-[9px] text-slate-300 mt-1">Set a student's Academic Status to "Completed" to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {completedStudents.map(student => (
                  <CompletedStudentCard key={student.id} student={student} navigate={navigate} />
                ))}
              </div>
            )}
          </div>

          {/* ── Active Students Card ───────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
              <Zap size={128} className="text-indigo-900" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center">
                  <Zap size={20} className="mr-3 text-indigo-600" />
                  Active Students
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
                  Status = <span className="text-indigo-600">Active</span> · {m.activeCount} record{m.activeCount !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="text-3xl font-black text-indigo-600 block tabular-nums leading-none">{m.activeCount}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                </div>
                <button
                  onClick={() => navigate('/records')}
                  className="px-5 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100/50 shadow-sm whitespace-nowrap"
                >
                  Full Registry
                </button>
              </div>
            </div>

            <div className="relative z-10 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm">
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 pl-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Scholar</th>
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Info</th>
                    <th className="pb-4 pr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Reg #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeStudents.map(student => (
                    <ActiveStudentRow key={student.id} student={student} navigate={navigate} />
                  ))}
                  {activeStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-20 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No active scholars in database</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-8">

          {/* Quick Protocols */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-6 flex items-center">
              <Zap size={20} className="mr-3 text-indigo-600" />
              Quick Protocols
            </h3>
            <div className="flex flex-col gap-3">
              {currentRole?.canAdd    && <QuickBtn icon={Plus}         label="Enroll Scholar"   path="/registration"  navigate={navigate} />}
              {currentRole?.canExport && <QuickBtn icon={Download}     label="Data Extraction"  path="/export"        navigate={navigate} />}
              <QuickBtn icon={FileBarChart} label="Report Suite"   path="/reports"       navigate={navigate} />
              {currentRole?.canViewAudit && <QuickBtn icon={History} label="Audit Logs"     path="/audit"         navigate={navigate} />}
            </div>
          </div>

          {/* Scholar Cycle / Milestones */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-8 flex items-center">
              <Target size={20} className="mr-3 text-indigo-600" />
              Scholar Cycle
            </h3>
            <div className="space-y-5">
              {lifecycleData.map((milestone, idx) => {
                const pct = m.totalCount > 0 ? (milestone.count / m.totalCount) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{milestone.name}</span>
                      <span className="text-xs font-black text-slate-900 tabular-nums">{milestone.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.06 }}
                        className="h-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution Summary */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-6 flex items-center">
              <Layers size={20} className="mr-3 text-indigo-600" />
              Status Distribution
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Active',       value: m.activeCount,                              color: 'bg-green-500'  },
                { label: 'Completed',    value: m.completedCount,                           color: 'bg-emerald-500'},
                { label: 'Dropped',      value: m.droppedCount,                             color: 'bg-orange-500' },
                { label: 'Closed',       value: m.closedCount,                              color: 'bg-amber-500'  },
                { label: 'Suspended',    value: m.suspendedCount,                           color: 'bg-violet-500' },
                { label: 'On Leave',     value: m.onLeaveCount,                             color: 'bg-purple-500' },
                { label: 'Unknown',      value: m.anomalyCount,                             color: 'bg-rose-500'   },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${row.color}`} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{row.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 tabular-nums">{row.value}</span>
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-indigo-600 tabular-nums">{m.totalCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-10 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Designed &amp; Developed by <span className="text-slate-600">Directorate of Advanced Studies</span>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
