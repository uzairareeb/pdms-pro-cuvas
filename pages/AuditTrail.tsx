
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  History, 
  User, 
  Clock, 
  Info, 
  ShieldAlert, 
  Terminal, 
  Search, 
  Filter as FilterIcon, 
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  Cpu,
  Globe,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ─── FilterSelect Component ───────────────────────────────────────────────────
const FilterSelect = ({ label, value, icon: Icon, options, onChange }: any) => {
  const active = Boolean(value && value !== '');
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
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
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${active ? 'text-indigo-500' : 'text-slate-300'}`}>
           <FilterIcon size={10} />
        </div>
      </div>
    </div>
  );
};

const AuditTrail: React.FC = () => {
  const { auditLogs, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const users = useMemo(() => Array.from(new Set(auditLogs.map(log => log.user))) as string[], [auditLogs]);
  const actions = useMemo(() => Array.from(new Set(auditLogs.map(log => log.action))) as string[], [auditLogs]);
  const modules = useMemo(() => Array.from(new Set(auditLogs.map(log => log.module))) as string[], [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = userFilter === '' || log.user === userFilter;
      const matchesAction = actionFilter === '' || log.action === actionFilter;
      const matchesModule = moduleFilter === '' || log.module === moduleFilter;
      const matchesDate = dateFilter === '' || new Date(log.timestamp).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();

      return matchesSearch && matchesUser && matchesAction && matchesModule && matchesDate;
    });
  }, [auditLogs, searchTerm, userFilter, actionFilter, moduleFilter, dateFilter]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return {
      total: filteredLogs.length,
      users: new Set(filteredLogs.map(l => l.user)).size,
      today: filteredLogs.filter(l => new Date(l.timestamp).toLocaleDateString() === today).length,
      modules: new Set(filteredLogs.map(l => l.module)).size
    };
  }, [filteredLogs]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLogs, currentPage]);

  const resetFilters = () => {
    setSearchTerm(''); setUserFilter(''); setActionFilter(''); setModuleFilter(''); setDateFilter(''); setCurrentPage(1);
  };

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, userFilter, actionFilter, moduleFilter, dateFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8 pb-20 px-4 max-w-7xl mx-auto">
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
            <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Security Audit Trail</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional Compliance & Forensic Activity Logging · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard label="Total Events Logged" value={stats.total} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={Database} />
        <KpiCard label="Unique Operators" value={stats.users} gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={UserCheck} />
        <KpiCard label="Active Modules" value={stats.modules} gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)" icon={Cpu} />
        <KpiCard label="Incidents Today" value={stats.today} gradient="linear-gradient(135deg,#f43f5e 0%,#e11d48 100%)" icon={Activity} />
      </div>

      {/* ── Filter Engine ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 flex flex-col gap-8 no-print">
        <div className="flex flex-col lg:flex-row gap-5 items-end">
          <div className="relative group flex-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Universal Hunt</label>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
               <input 
                type="text" 
                placeholder="Search across Identities, Actions, or Details..." 
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button onClick={resetFilters} className="px-8 py-4 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 mb-[1px]">
             <Zap size={14} /> Clear Protocols
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border-t border-slate-50 pt-8">
          <FilterSelect label="Operator Entity" icon={User} value={userFilter} options={users} onChange={setUserFilter} />
          <FilterSelect label="Action Routine" icon={Activity} value={actionFilter} options={actions} onChange={setActionFilter} />
          <FilterSelect label="Target Module" icon={Cpu} value={moduleFilter} options={modules} onChange={setModuleFilter} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp Scope</label>
            <input 
              type="date" 
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/8 transition-all font-bold text-[10px] uppercase tracking-widest"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Table & Pagination ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="px-10 py-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Terminal size={20} className="text-indigo-400" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Live Forensic Stream</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sequencing Node {filteredLogs.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[180px]">Date & Time</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[200px]">Operator Identity</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[140px]">Target</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[300px]">Action Detail</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Clock size={16} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-900 tabular-nums">{new Date(log.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                          {log.user[0]}
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.user}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Fingerprint size={10} className="text-indigo-400" />
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{log.role}</span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">{log.module}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="max-w-md">
                      <p className="text-[13px] font-black text-slate-900 tracking-tight leading-tight mb-1.5 uppercase">{log.action}</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{log.details}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[10px] font-black text-indigo-200 tabular-nums">#{log.id.slice(0, 8)}</span>
                       <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase">
                          <Globe size={10} />
                          {log.ip || 'Local Host'}
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Empty State ── */}
        {filteredLogs.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                <Search size={40} />
             </div>
             <div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Events Matches Search</h4>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Adjust your scopes or clear your Universal Hunt query.</p>
             </div>
          </div>
        )}

        {/* ── Pagination Logic ── */}
        {filteredLogs.length > 0 && (
          <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400">
                  <Activity size={18} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Activity Coverage</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight mt-1.5 tabular-nums">
                    Showing <span className="text-indigo-600">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="text-indigo-600">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of {filteredLogs.length} Events
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className={`p-3 rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 px-3">
                {[...Array(totalPages)].map((_, i) => {
                  const n = i + 1;
                  if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                    return (
                      <button key={n} onClick={() => setCurrentPage(n)}
                        className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                          currentPage === n
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-110'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
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
                className={`p-3 rounded-xl border transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-10 py-6 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
           <ShieldAlert size={16} className="text-amber-500" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
             This sequence is a cryptographically indexed institutional record. Direct modification of forensic logs is strictly prohibited under Protocol 41.B.
           </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AuditTrail;