
import React, { useState } from 'react';
import { useStore } from '../store';
import { Calendar, Plus, Save, Clock } from 'lucide-react';
import { SessionConfig } from '../types';
import Tooltip from '../components/Tooltip';

const SessionSettings: React.FC = () => {
  const { sessions, addSession, settings } = useStore();
  const [newSession, setNewSession] = useState<Partial<SessionConfig>>({
    name: 'Fall 2026',
    startDate: '2026-09-01'
  });

  const handleAdd = () => {
    if (!newSession.name || !newSession.startDate) return;
    
    // Generate semesters based on settings duration
    const semesters = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(newSession.startDate!);
      start.setMonth(start.getMonth() + (i * 6)); // Rough estimate
      const end = new Date(start);
      // Fixed: Use standard setDate logic to add duration in weeks.
      // This avoids non-standard prototype methods and handles rollovers correctly.
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
  };

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-700 pb-20 px-4">
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
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Academic Sessions</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Configure Institutional Timeframes and Semesters</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center space-x-4 mb-10">
           <div className="p-3 bg-slate-50 dark:bg-slate-800 text-indigo-600 rounded-xl">
              <Plus size={24} />
           </div>
           <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Define New Session</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-2 block">Session Label</label>
              <Tooltip content="The name of the academic session (e.g., Fall 2026, Spring 2027)." />
            </div>
            <input 
              type="text" 
              placeholder="e.g. Fall 2026"
              className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all" 
              value={newSession.name}
              onChange={e => setNewSession({...newSession, name: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-2 block">Commencement Date</label>
              <Tooltip content="The official start date for the first semester of this session." />
            </div>
            <input 
              type="date" 
              className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
              value={newSession.startDate}
              onChange={e => setNewSession({...newSession, startDate: e.target.value})}
            />
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-slate-50 dark:border-slate-800">
          <button 
            onClick={handleAdd}
            className="w-full md:w-auto flex items-center justify-center space-x-3 px-12 py-5 bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
          >
            <Save size={18} />
            <span>Generate Session & Semesters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {sessions.map(session => (
          <div key={session.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden group">
            <div className="p-8 md:p-10 bg-[#0a0c10] dark:bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Calendar size={28} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">{session.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Active Academic Session</p>
                </div>
              </div>
              <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commenced: {session.startDate}</span>
              </div>
            </div>
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {session.semesters.map(sem => (
                  <div key={sem.number} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:border-indigo-100 dark:group-hover:border-indigo-900 transition-all duration-500">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center">
                        <Clock size={14} className="mr-2 text-indigo-500" />
                        Sem {sem.number}
                      </h4>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          <span>Start</span>
                          <span className="text-slate-600 dark:text-slate-300">{sem.start}</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          <span>End</span>
                          <span className="text-slate-600 dark:text-slate-300">{sem.end}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionSettings;
