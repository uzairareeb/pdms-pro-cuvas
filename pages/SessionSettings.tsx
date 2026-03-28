
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Calendar, 
  Plus, 
  Save, 
  Clock,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  History,
  Activity,
  Layers,
  ChevronRight,
  Zap,
  Globe,
  Settings,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { SessionConfig } from '../types';
import Tooltip from '../components/Tooltip';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none">
      <Icon size={80} className="text-white" />
    </div>
    <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-2xl font-black text-white tracking-tighter tabular-nums leading-none mb-1 uppercase">{value}</h4>
  </div>
);

const SessionSettings: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, addSession, settings, notify } = useStore();
  const [newSession, setNewSession] = useState<Partial<SessionConfig>>({
    name: 'Fall 2026',
    startDate: '2026-09-01'
  });

  const handleAdd = () => {
    if (!newSession.name || !newSession.startDate) {
      notify("Label and Commencement date are mandatory.", "error");
      return;
    }
    
    const semesters = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(newSession.startDate!);
      start.setMonth(start.getMonth() + (i * 6));
      const end = new Date(start);
      end.setDate(end.getDate() + (settings.defaultSemesterDurationWeeks * 7));
      
      return {
        number: i + 1,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    });

    addSession({
      id: Math.random().toString(36).substr(2, 9),
      name: newSession.name,
      startDate: newSession.startDate,
      semesters: semesters as any
    });
    notify(`Academic Session ${newSession.name} provisioned with 8 semesters.`, "success");
    setNewSession({ name: 'Fall 2026', startDate: '2026-09-01' });
  };

  const sessionStats = useMemo(() => ({
    total: sessions.length,
    active: sessions.length > 0 ? sessions[0].name : 'None',
    horizon: '8 Semesters',
    health: 'Optimal'
  }), [sessions]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/settings')} className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all text-slate-400 hover:text-indigo-600 active:scale-90">
             <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Academic Timeline</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Configure Institutional Intervals and Session Architectures</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm transition-all whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Global Logic Active</span>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Managed Intervals" value={sessionStats.total} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={Layers} />
        <KpiCard label="Primary Horizon" value={sessionStats.active} gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={Calendar} />
        <KpiCard label="Semester Grid" value={sessionStats.horizon} gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" icon={Clock} />
        <KpiCard label="Timeline Integrity" value={sessionStats.health} gradient="linear-gradient(135deg,#64748b 0%,#94a3b8 100%)" icon={Activity} />
      </div>

      {/* ── New Session Provisioning ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-8 lg:p-14 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="flex items-start gap-6 mb-12 relative z-10">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
              <Plus size={24} />
           </div>
           <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Provision Domain Timeline</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Initialize Institutional Session Routine</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1.5 overflow-visible">
               <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Institutional Label</label>
               <Tooltip content="The formal designator for this academic cycle." />
            </div>
            <div className="relative group">
               <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors shadow-sm" size={16} />
               <input 
                 type="text" 
                 placeholder="e.g. Fall 2026"
                 className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all uppercase tracking-tight" 
                 value={newSession.name}
                 onChange={e => setNewSession({...newSession, name: e.target.value})}
               />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1.5 overflow-visible">
               <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Timeline Commencement</label>
               <Tooltip content="The official launch date for this institutional session." />
            </div>
            <div className="relative group">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors shadow-sm" size={16} />
               <input 
                 type="date" 
                 className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-900 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all tabular-nums"
                 value={newSession.startDate}
                 onChange={e => setNewSession({...newSession, startDate: e.target.value})}
               />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-slate-50 relative z-10">
          <button 
            onClick={handleAdd}
            className="w-full md:w-auto px-12 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-4 group"
          >
            <Zap size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Generate Institutional semesters</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── Active Timeline Registry ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-12">
        {sessions.map(session => (
          <div key={session.id} className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden group">
            <div className="p-10 lg:p-14 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 group-hover:bg-indigo-50/20 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Calendar size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{session.name}</h3>
                   <div className="flex items-center gap-3 mt-3">
                      <div className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">Live Horizon</div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Commencement: {session.startDate}</p>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 px-6 py-4 rounded-2xl border border-slate-200 min-w-max">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><TrendingUp size={18} /></div>
                 <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cycle Health</p>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-1">Optimal Sync</p>
                 </div>
              </div>
            </div>
            
            <div className="p-8 lg:p-14 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {session.semesters.map(sem => (
                  <div key={sem.number} className="relative p-7 bg-slate-50 border border-slate-100 rounded-[28px] hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group/card overflow-hidden">
                    {sem.number <= 2 && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl -mr-6 -mt-6" />}
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                       <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-900 group-hover/card:text-indigo-600 transition-colors">
                          <p className="text-xs font-black tracking-tighter">S{sem.number}</p>
                       </div>
                       <MoreVertical size={14} className="text-slate-300 group-hover/card:text-indigo-300" />
                    </div>

                    <div className="space-y-4 relative z-10">
                       <div className="flex justify-between items-center group/field">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/card:text-indigo-400 transition-colors">Launch Pulse</span>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight tabular-nums">{sem.start}</span>
                       </div>
                       <div className="h-px bg-slate-200/50 w-full" />
                       <div className="flex justify-between items-center group/field">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/card:text-indigo-400 transition-colors">Terminal Pulse</span>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight tabular-nums">{sem.end}</span>
                       </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200/50 flex items-center justify-between opacity-40 group-hover/card:opacity-100 transition-opacity">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horizon Node</p>
                       <CheckCircle2 size={12} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="py-32 flex flex-col items-center text-center space-y-8 bg-slate-50 border border-slate-100 rounded-[32px]">
             <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-slate-200 shadow-sm"><History size={48} /></div>
             <div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Empty Academic Registry</h4>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Provision a new institutional session to initialize the timeline.</p>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SessionSettings;
