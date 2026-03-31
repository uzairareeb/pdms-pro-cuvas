
import React, { useMemo } from 'react';
import { useStore } from '../store';
import {
  Search, Plus, Download, FileBarChart, History,
  Target, BarChart3, CheckCircle, LogOut, PauseCircle,
  AlertCircle, Layers, Zap, Users, ChevronRight,
  ShieldAlert, GraduationCap, BookOpen, FileCheck,
  UserX, TrendingUp, Building2, ClipboardList, Clock, User
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchAutocomplete from '../components/SearchAutocomplete';
import BrandedLoader from '../components/BrandedLoader';
import {
  computeMetrics,
  isCompleted,
  normalizeDegree,
} from '../utils/dashboardMetrics';

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number;
  gradient: string;      // CSS gradient string
  icon: any;
  badge?: string;        // small top-right label
  sub?: string;          // optional subtitle below value
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, gradient, icon: Icon, badge, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ y: -3, scale: 1.02 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="relative overflow-hidden rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow cursor-default"
    style={{ background: gradient }}
  >
    {/* Watermark icon */}
    <div className="absolute -bottom-3 -right-3 opacity-[0.12] pointer-events-none">
      <Icon size={90} className="text-white" />
    </div>

    {/* Top row: icon + badge */}
    <div className="flex items-start justify-between mb-5 relative z-10">
      <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
        <Icon size={20} className="text-white" />
      </div>
      {badge && (
        <span className="text-[8px] font-black uppercase tracking-[0.15em] bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
          {badge}
        </span>
      )}
    </div>

    {/* Value + Label */}
    <div className="relative z-10">
      <h4 className="text-[2.6rem] font-black text-white tracking-tighter tabular-nums leading-none mb-1.5">
        {value.toLocaleString()}
      </h4>
      <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.22em] leading-tight">{label}</p>
      {sub && <p className="text-[9px] text-white/55 mt-1 font-bold">{sub}</p>}
    </div>

    {/* Bottom shine line */}
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 rounded-full" />
  </motion.div>
);


// ─── Section Header ───────────────────────────────────────────────────────────
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

// ─── Quick Action Button ──────────────────────────────────────────────────────
const QuickBtn: React.FC<{ icon: any; label: string; path: string; navigate: (p: string) => void; color?: string; newTab?: boolean }> = ({
  icon: Icon, label, path, navigate, color = 'text-indigo-600', newTab = false
}) => (
  <button
    onClick={() => newTab ? window.open(`#${path}`, '_blank', 'noopener,noreferrer') : navigate(path)}
    className="flex items-center gap-3 p-4 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-sm active:scale-95 w-full group"
  >
    <Icon size={15} className={`${color} shrink-0 group-hover:scale-110 transition-transform`} />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    <ChevronRight size={12} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
  </button>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { students, settings, isLoading, error, currentRole } = useStore();
  const navigate = useNavigate();

  // ── All metrics from central utility ────────────────────────────────────
  const m = useMemo(() => computeMetrics(students), [students]);

  // ── Degree split ─────────────────────────────────────────────────────────
  const degreeSplit = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach(s => {
      const key = s.degree || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [students]);

  // ── Department breakdown (top 6) ──────────────────────────────────────────
  const deptBreakdown = useMemo(() => {
    const map: Record<string, { total: number; active: number; completed: number }> = {};
    students.forEach(s => {
      const dept = s.department || 'Unknown';
      if (!map[dept]) map[dept] = { total: 0, active: 0, completed: 0 };
      map[dept].total++;
      const st = String(s.status || '').trim().toLowerCase();
      if (st === 'active') map[dept].active++;
      if (st === 'completed') map[dept].completed++;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([dept, data]) => ({ dept, ...data }));
  }, [students]);

  // ── Milestone funnel data ─────────────────────────────────────────────────
  const milestoneData = useMemo(() => [
    { stage: 'GS-2',     PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.gs2CourseWork === 'Completed').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.gs2CourseWork === 'Completed').length },
    { stage: 'Synopsis', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.synopsis === 'Approved').length,       MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.synopsis === 'Approved').length },
    { stage: 'GS-4',    PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.gs4Form === 'Approved').length,        MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.gs4Form === 'Approved').length },
    { stage: 'Thesis',   PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.finalThesisStatus === 'Approved').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.finalThesisStatus === 'Approved').length },
    { stage: 'COE',      PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'   && s.thesisSentToCOE === 'Yes').length,     MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.thesisSentToCOE === 'Yes').length },
    { stage: 'Graduated', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD'  && isCompleted(s)).length,                 MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && isCompleted(s)).length },
  ], [students]);

  // ── Validation status ─────────────────────────────────────────────────────
  const validationData = useMemo(() => {
    const pending  = students.filter(s => s.validationStatus === 'Pending').length;
    const approved = students.filter(s => s.validationStatus === 'Approved').length;
    const returned = students.filter(s => s.validationStatus === 'Returned').length;
    return [
      { name: 'Approved', value: approved, color: '#10b981' },
      { name: 'Pending',  value: pending,  color: '#f59e0b' },
      { name: 'Returned', value: returned, color: '#ef4444' },
    ];
  }, [students]);

  // ── Recent Registrations (last 5) ─────────────────────────────────────────
  const recentStudents = useMemo(() =>
    students.slice(-5).reverse()
  , [students]);

  // ── Status distribution for sidebar ──────────────────────────────────────
  const statusRows = useMemo(() => [
    { label: 'Active',     value: m.activeCount,                             color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Completed',  value: m.completedCount,                          color: '#059669', bg: '#ecfdf5' },
    { label: 'Dropped',    value: m.droppedCount,                            color: '#ea580c', bg: '#fff7ed' },
    { label: 'Closed',     value: m.closedCount,                             color: '#d97706', bg: '#fffbeb' },
    { label: 'Suspended',  value: m.suspendedCount,                          color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'On Leave',   value: m.onLeaveCount,                            color: '#6d28d9', bg: '#ede9fe' },
    { label: 'Unknown',    value: m.anomalyCount,                            color: '#dc2626', bg: '#fef2f2' },
  ], [m]);

  // ── Pie chart colors ──────────────────────────────────────────────────────
  const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // ─── Guard States ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <BrandedLoader variant="fullscreen" message="Loading PostGrad Hub" subLabel="Synchronizing registry data" logoSize={320} />
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
    <div className="space-y-8 pb-12">

      {/* Data Integrity Alert */}
      {(!m.isStatusSumValid || m.anomalyCount > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm">
          <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-800 uppercase tracking-wide">Data Integrity Warning</p>
            <p className="text-[10px] text-amber-700 mt-1">
              {m.anomalyCount > 0 && `${m.anomalyCount} student(s) have an unrecognised status. `}
              {!m.isStatusSumValid && `Category totals don't match total scholars (${m.totalCount}). `}
              Please review records.
            </p>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative group no-print">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
        <SearchAutocomplete
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-indigo-500 transition-all text-sm font-medium placeholder:text-slate-400"
          placeholder="Search Scholar Registry..."
        />
      </div>

      {/* ── KPI Row 1: Primary Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="All Records"
          value={m.totalCount}
          gradient="linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)"
          icon={Layers}
          badge="Total"
          sub={`${m.maleCount} M · ${m.femaleCount} F`}
        />
        <KpiCard
          label="Active Students"
          value={m.activeCount}
          gradient="linear-gradient(135deg, #059669 0%, #16a34a 100%)"
          icon={Zap}
          badge="In Programme"
          sub={`${m.totalCount > 0 ? Math.round((m.activeCount / m.totalCount) * 100) : 0}% of total`}
        />
        <KpiCard
          label="Graduates"
          value={m.completedCount}
          gradient="linear-gradient(135deg, #0d9488 0%, #0891b2 100%)"
          icon={GraduationCap}
          badge="Completed"
          sub={`${m.totalCount > 0 ? Math.round((m.completedCount / m.totalCount) * 100) : 0}% of total`}
        />
        <KpiCard
          label="Pending Audit"
          value={m.pendingAuditCount}
          gradient="linear-gradient(135deg, #dc2626 0%, #e11d48 100%)"
          icon={AlertCircle}
          badge="Need Review"
          sub="Validation queue"
        />
      </div>

      {/* ── KPI Row 2: Demographics & Status ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Male Scholars"
          value={m.maleCount}
          gradient="linear-gradient(135deg, #0369a1 0%, #0284c7 100%)"
          icon={Users}
          badge="Male"
          sub={`${m.totalCount > 0 ? Math.round((m.maleCount / m.totalCount) * 100) : 0}% of scholars`}
        />
        <KpiCard
          label="Female Scholars"
          value={m.femaleCount}
          gradient="linear-gradient(135deg, #be185d 0%, #db2777 100%)"
          icon={Users}
          badge="Female"
          sub={`${m.totalCount > 0 ? Math.round((m.femaleCount / m.totalCount) * 100) : 0}% of scholars`}
        />
        <KpiCard
          label="Dropped / Closed"
          value={m.droppedCount + m.closedCount}
          gradient="linear-gradient(135deg, #b45309 0%, #ea580c 100%)"
          icon={UserX}
          badge="Withdrawn"
          sub={`${m.droppedCount} dropped · ${m.closedCount} closed`}
        />
        <KpiCard
          label="On Leave / Suspended"
          value={m.onLeaveCount + m.suspendedCount}
          gradient="linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)"
          icon={PauseCircle}
          badge="Frozen"
          sub={`${m.onLeaveCount} leave · ${m.suspendedCount} susp.`}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN – 8 cols */}
        <div className="xl:col-span-8 space-y-6">

          {/* Milestone Funnel Chart */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <SectionHeader icon={BarChart3} title="Scholar Milestone Funnel" subtitle="Completion velocity by degree · Live Data" />
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={milestoneData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} width={24} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Bar dataKey="PhD"   name="PhD"   fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="MPhil" name="MPhil" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <SectionHeader icon={Building2} title="Department Breakdown" subtitle="Student distribution across departments" />
            <div className="space-y-3">
              {deptBreakdown.length === 0 ? (
                <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest py-10 font-black">No department data available</p>
              ) : deptBreakdown.map((row, idx) => {
                const pct = m.totalCount > 0 ? (row.total / m.totalCount) * 100 : 0;
                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide truncate max-w-[55%]">{row.dept}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{row.active}A</span>
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{row.completed}C</span>
                        <span className="text-xs font-black text-slate-900 tabular-nums w-7 text-right">{row.total}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.05 }}
                        className="h-full rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {deptBreakdown.length > 0 && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Legend:</span>
                <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">A = Active</span>
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">C = Completed</span>
              </div>
            )}
          </div>

          {/* 2-col row: Degree Split + Validation Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Degree Distribution Pie */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <SectionHeader icon={BookOpen} title="Degree Distribution" subtitle="PhD · MPhil · Others" />
              {degreeSplit.length === 0 ? (
                <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest py-10 font-black">No degree data</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={degreeSplit}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {degreeSplit.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: 'none', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontSize: 11, fontWeight: 700 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {degreeSplit.map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${m.totalCount > 0 ? (d.value / m.totalCount) * 100 : 0}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          </div>
                          <span className="text-xs font-black text-slate-900 tabular-nums w-7 text-right">{d.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Validation Status */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <SectionHeader icon={FileCheck} title="Validation Status" subtitle="Record approval pipeline" />
              <div className="h-[180px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={validationData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {validationData.filter(d => d.value > 0).map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: 'none', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontSize: 11, fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {validationData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.totalCount > 0 ? (d.value / m.totalCount) * 100 : 0}%`, backgroundColor: d.color }} />
                      </div>
                      <span className="text-xs font-black text-slate-900 tabular-nums w-6 text-right">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <SectionHeader icon={Clock} title="Recent Registrations" subtitle="Last 5 enrolled scholars" />
              <button
                onClick={() => navigate('/records')}
                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all whitespace-nowrap mt-0.5"
              >
                Full Registry →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Scholar', 'Reg #', 'Degree', 'Department', 'Status'].map(h => (
                      <th key={h} className="pb-3 text-[8px] font-black text-slate-400 uppercase tracking-wide pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentStudents.map(student => {
                    const st = String(student.status || '').trim().toLowerCase();
                    const statusColor = st === 'active' ? 'bg-green-100 text-green-700' :
                      st === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      st === 'dropped' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500';
                    return (
                      <tr
                        key={student.id}
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-indigo-100 transition-colors">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full tabular-nums">{student.regNo}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{student.degree}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[9px] font-bold text-slate-500 truncate max-w-[100px] block">{student.department}</span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[8px] font-black uppercase tracking-tight px-2 py-1 rounded-full ${statusColor}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {recentStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No students enrolled yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR – 4 cols */}
        <div className="xl:col-span-4 space-y-6">

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <SectionHeader icon={Zap} title="Quick Actions" subtitle="Jump to key modules" />
            <div className="flex flex-col gap-2.5">
              {currentRole?.canAdd    && <QuickBtn icon={Plus}         label="Enroll New Scholar" path="/registration" navigate={navigate} />}
              {currentRole?.canExport && <QuickBtn icon={Download}     label="Export Data"        path="/export"       navigate={navigate} />}
              <QuickBtn icon={FileBarChart} label="Generate Reports"  path="/reports"       navigate={navigate} />
              {currentRole?.canViewAudit && <QuickBtn icon={History}   label="Audit Trail"       path="/audit"        navigate={navigate} />}
              <QuickBtn icon={BookOpen}      label="Synopsis"          path="/synopsis-submission" navigate={navigate} />
              <QuickBtn icon={ClipboardList} label="Thesis Tracking"  path="/thesis-tracking" navigate={navigate} />
              <QuickBtn icon={User}          label="Open Student Portal" path="/student-login" navigate={navigate} newTab={true} />
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <SectionHeader icon={Layers} title="Status Distribution" subtitle="All scholars by academic status" />
            <div className="space-y-2">
              {statusRows.map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: row.bg }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: row.color }}>{row.label}</span>
                  </div>
                  <span className="text-sm font-black tabular-nums" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-100 mt-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-slate-900 tabular-nums">{m.totalCount}</span>
              </div>
            </div>
          </div>

          {/* Scholar Cycle Milestones */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <SectionHeader icon={Target} title="Scholar Cycle" subtitle="Milestone completion rates" />
            <div className="space-y-4">
              {[
                { name: 'Registered',  count: students.filter(s => !!s.regNo).length,                       color: '#4f46e5' },
                { name: 'Coursework',  count: students.filter(s => s.gs2CourseWork === 'Completed').length,  color: '#0284c7' },
                { name: 'Synopsis',    count: students.filter(s => s.synopsis === 'Approved').length,        color: '#7c3aed' },
                { name: 'Thesis',      count: students.filter(s => s.finalThesisStatus === 'Approved').length, color: '#db2777' },
                { name: 'COE',         count: students.filter(s => s.thesisSentToCOE === 'Yes').length,      color: '#ea580c' },
                { name: 'Graduated',   count: m.completedCount,                                              color: '#059669' },
              ].map((ms, idx) => {
                const pct = m.totalCount > 0 ? (ms.count / m.totalCount) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{ms.name}</span>
                      <span className="text-xs font-black text-slate-900 tabular-nums">{ms.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.07 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: ms.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thesis Progress Summary */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <SectionHeader icon={TrendingUp} title="Thesis Progress" subtitle="Submission pipeline overview" />
            <div className="space-y-3">
              {[
                { name: 'Synopsis Submitted', count: students.filter(s => s.synopsis !== 'Not Submitted').length, icon: CheckCircle, color: '#10b981' },
                { name: 'Synopsis Approved',  count: students.filter(s => s.synopsis === 'Approved').length,       icon: CheckCircle, color: '#059669' },
                { name: 'Final Thesis Sub.',  count: students.filter(s => s.finalThesisStatus !== 'Not Submitted').length, icon: FileBarChart, color: '#4f46e5' },
                { name: 'Thesis Approved',    count: students.filter(s => s.finalThesisStatus === 'Approved').length, icon: GraduationCap, color: '#7c3aed' },
                { name: 'Sent to COE',        count: students.filter(s => s.thesisSentToCOE === 'Yes').length,     icon: LogOut, color: '#ea580c' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} style={{ color: item.color }} />
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wide">{item.name}</span>
                    </div>
                    <span className="text-sm font-black tabular-nums" style={{ color: item.color }}>{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-100 text-center">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Designed &amp; Developed by <span className="text-slate-600">Directorate of Advanced Studies, CUVAS</span>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
