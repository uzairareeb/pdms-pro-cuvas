
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { 
  AlertCircle, 
  Bell, 
  CheckCircle2, 
  Filter, 
  Download, 
  Search,
  RefreshCw,
  ChevronRight,
  Mail,
  EyeOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface CriticalAction {
  id: string;
  studentId: string;
  name: string;
  department: string;
  supervisor: string;
  item: string;
  deadline: string;
  daysOverdue: number;
  urgency: 'overdue' | 'approaching' | 'on-track';
  actionKey: string;
}

const CriticalActionsPanel: React.FC = () => {
  const { students, reviewedCriticalActions, markActionAsReviewed, sendReminder } = useStore();
  const [filterDept, setFilterDept] = useState('');
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh logic (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const criticalActions = useMemo(() => {
    const actions: CriticalAction[] = [];

    students.forEach(s => {
      const isPhD = s.degree.toLowerCase().includes('phd');
      const maxSemesters = isPhD ? 10 : 6;
      const thresholdSem = Math.ceil(maxSemesters * 0.8);

      // 1. Max Semester Check
      if (s.currentSemester >= thresholdSem && s.status !== 'Completed') {
        const actionKey = `${s.id}-max-sem-${s.currentSemester}`;
        if (!reviewedCriticalActions.includes(actionKey)) {
          actions.push({
            id: Math.random().toString(36).substr(2, 9),
            studentId: s.id,
            name: s.name,
            department: s.department,
            supervisor: s.supervisorName,
            item: `Near Max Semesters (${s.currentSemester}/${maxSemesters})`,
            deadline: `End of Sem ${maxSemesters}`,
            daysOverdue: s.currentSemester > maxSemesters ? (s.currentSemester - maxSemesters) * 180 : 0,
            urgency: s.currentSemester >= maxSemesters ? 'overdue' : 'approaching',
            actionKey
          });
        }
      }

      // 2. Synopsis Check
      if (s.synopsis === 'Not Submitted') {
        const actionKey = `${s.id}-synopsis-pending`;
        if (!reviewedCriticalActions.includes(actionKey)) {
          if (s.currentSemester >= 3) {
            actions.push({
              id: Math.random().toString(36).substr(2, 9),
              studentId: s.id,
              name: s.name,
              department: s.department,
              supervisor: s.supervisorName,
              item: 'Synopsis Submission',
              deadline: 'Semester 3 Start',
              daysOverdue: (s.currentSemester - 3) * 180 + 30, // Rough estimate
              urgency: 'overdue',
              actionKey
            });
          } else if (s.currentSemester === 2) {
            actions.push({
              id: Math.random().toString(36).substr(2, 9),
              studentId: s.id,
              name: s.name,
              department: s.department,
              supervisor: s.supervisorName,
              item: 'Synopsis Submission',
              deadline: 'Semester 3 Start',
              daysOverdue: 0,
              urgency: 'approaching',
              actionKey
            });
          }
        }
      }

      // 3. Thesis Check (GS-4)
      if (s.gs4Form === 'Not Submitted') {
        const actionKey = `${s.id}-thesis-pending`;
        const thesisDueSem = isPhD ? 6 : 4;
        if (!reviewedCriticalActions.includes(actionKey)) {
          if (s.currentSemester >= thesisDueSem) {
            actions.push({
              id: Math.random().toString(36).substr(2, 9),
              studentId: s.id,
              name: s.name,
              department: s.department,
              supervisor: s.supervisorName,
              item: 'Thesis (GS-4) Submission',
              deadline: `Semester ${thesisDueSem}`,
              daysOverdue: (s.currentSemester - thesisDueSem) * 180 + 15,
              urgency: 'overdue',
              actionKey
            });
          } else if (s.currentSemester === thesisDueSem - 1) {
            actions.push({
              id: Math.random().toString(36).substr(2, 9),
              studentId: s.id,
              name: s.name,
              department: s.department,
              supervisor: s.supervisorName,
              item: 'Thesis (GS-4) Submission',
              deadline: `Semester ${thesisDueSem}`,
              daysOverdue: 0,
              urgency: 'approaching',
              actionKey
            });
          }
        }
      }
    });

    return actions.sort((a, b) => {
      if (a.urgency === 'overdue' && b.urgency !== 'overdue') return -1;
      if (a.urgency !== 'overdue' && b.urgency === 'overdue') return 1;
      return b.daysOverdue - a.daysOverdue;
    });
  }, [students, reviewedCriticalActions, lastRefresh]);

  const filteredActions = useMemo(() => {
    return criticalActions.filter(a => {
      const matchDept = !filterDept || a.department === filterDept;
      const matchSup = !filterSupervisor || a.supervisor.toLowerCase().includes(filterSupervisor.toLowerCase());
      const matchSearch = !searchTerm || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.item.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSup && matchSearch;
    });
  }, [criticalActions, filterDept, filterSupervisor, searchTerm]);

  const departments = Array.from(new Set(students.map(s => s.department)));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('DAS Critical Actions Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Scholar', 'Department', 'Supervisor', 'Item', 'Urgency', 'Overdue']],
      body: filteredActions.map(a => [
        a.name, 
        a.department, 
        a.supervisor, 
        a.item, 
        a.urgency.toUpperCase(), 
        a.daysOverdue > 0 ? `${a.daysOverdue} Days` : 'Approaching'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`DAS_Critical_Actions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportCSV = () => {
    const data = filteredActions.map(a => ({
      Scholar: a.name,
      Department: a.department,
      Supervisor: a.supervisor,
      Item: a.item,
      Urgency: a.urgency,
      DaysOverdue: a.daysOverdue,
      Deadline: a.deadline
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DAS_Critical_Actions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="glass p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-white/30 no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center">
            <AlertCircle size={24} className="mr-4 text-rose-600 animate-pulse" />
            Critical Actions Panel
          </h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Prioritized research milestones requiring immediate DAS intervention</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={exportCSV}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center"
          >
            <Download size={14} className="mr-2" />
            CSV
          </button>
          <button 
            onClick={exportPDF}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center shadow-lg"
          >
            <Download size={14} className="mr-2" />
            PDF Report
          </button>
          <button 
            onClick={() => setLastRefresh(new Date())}
            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-600 transition-all"
            title="Refresh Intelligence"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search Scholar or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <select 
          value={filterDept || ''}
          onChange={(e) => setFilterDept(e.target.value)}
          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Filter by Supervisor..."
            value={filterSupervisor}
            onChange={(e) => setFilterSupervisor(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <th className="px-6 py-4 text-left">Scholar & Dept</th>
              <th className="px-6 py-4 text-left">Supervisor</th>
              <th className="px-6 py-4 text-left">Pending Item</th>
              <th className="px-6 py-4 text-left">Deadline</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.length > 0 ? filteredActions.map((action) => (
              <tr 
                key={action.id}
                className={`group transition-all hover:translate-x-1 ${
                  action.urgency === 'overdue' ? 'bg-rose-50/30' : 'bg-amber-50/30'
                } border border-slate-100 rounded-2xl`}
              >
                <td className="px-6 py-5 rounded-l-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{action.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{action.department}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{action.supervisor}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${action.urgency === 'overdue' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{action.item}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{action.deadline}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${action.urgency === 'overdue' ? 'text-rose-600' : 'text-amber-600'}`}>
                      {action.urgency === 'overdue' ? '🔴 Overdue' : '🟡 Approaching'}
                    </span>
                    {action.daysOverdue > 0 && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{action.daysOverdue} Days Late</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 text-right rounded-r-2xl">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => sendReminder(action.studentId, action.item)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-600 hover:shadow-md transition-all"
                      title="Send Reminder"
                    >
                      <Mail size={16} />
                    </button>
                    <button 
                      onClick={() => markActionAsReviewed(action.actionKey)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-emerald-600 hover:border-emerald-600 hover:shadow-md transition-all"
                      title="Mark as Reviewed"
                    >
                      <EyeOff size={16} />
                    </button>
                    <button 
                      className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg"
                      title="View Profile"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-20">
                    <CheckCircle2 size={60} className="text-emerald-600 mb-4" />
                    <p className="text-xl font-black uppercase tracking-tighter">All Clear</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1">No critical actions identified at this time.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CriticalActionsPanel;
