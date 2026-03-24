import React from 'react';
import { useStore } from '../store';
import { History, User, Clock, Info, ShieldAlert, Terminal } from 'lucide-react';

const AuditTrail: React.FC = () => {
  const { auditLogs, settings } = useStore();

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

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 bg-[#0f172a] dark:bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <Terminal size={20} className="text-indigo-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Activity Sequence</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{auditLogs.length} Events Logged</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Date & Time</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">User Identity</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Action Performed</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 text-right">Event Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
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
                       <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                         {log.user[0].toUpperCase()}
                       </div>
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{log.details}</p>
                    </div>
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