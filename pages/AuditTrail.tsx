import React, { useState } from 'react';
import { useStore } from '../store';
import { History, User, Clock, Info, ShieldAlert, Terminal, Search, Filter as FilterIcon, X } from 'lucide-react';

const AuditTrail: React.FC = () => {
  const { auditLogs, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const users = Array.from(new Set(auditLogs.map(log => log.user))) as string[];
  const actions = Array.from(new Set(auditLogs.map(log => log.action))) as string[];
  const modules = Array.from(new Set(auditLogs.map(log => log.module))) as string[];

  const filteredLogs = auditLogs.filter(log => {
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

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center space-x-5">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100 dark:border-slate-700">
          <img 
            src={settings.institution.logo || null} 
            className="w-full h-full object-contain" 
            alt="Logo" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Audit Trail and Change History</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Institutional Compliance & System Forensic Logging</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative z-20">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search activity details..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              className="pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="">User: All</option>
              {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="relative">
            <select 
              className="pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">Action: All</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="relative">
            <select 
              className="pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">Module: All</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <input 
            type="date" 
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-[10px] uppercase tracking-widest"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {(searchTerm || userFilter || actionFilter || moduleFilter || dateFilter) && (
            <button 
              onClick={() => {
                setSearchTerm(''); setUserFilter(''); setActionFilter(''); setModuleFilter(''); setDateFilter('');
              }}
              className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
              title="Clear Filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

        <div className="p-8 bg-[#0f172a] dark:bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <Terminal size={20} className="text-indigo-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Activity Sequence</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{filteredLogs.length} Events Logged</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Date & Time</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">User Identity</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Module</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Action Performed</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">IP Origin</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 text-right">Event Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center space-x-3 text-slate-900 dark:text-slate-100 font-black text-xs">
                      <Clock size={14} className="text-slate-300 dark:text-slate-600" />
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                      <span className="text-slate-400 dark:text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                         {log.user[0]}
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{log.user}</p>
                         <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{log.role}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       {log.module}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{log.details}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-tighter uppercase">{log.ip || 'INTERNAL'}</span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 font-mono uppercase">#{log.id}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
           <ShieldAlert size={16} className="text-amber-500" />
           <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
             This log is maintained for institutional record and audit purposes. Modification of system logs is strictly prohibited.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;