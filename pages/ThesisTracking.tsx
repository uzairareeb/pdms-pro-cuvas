
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Search, 
  Save, 
  User, 
  ChevronDown,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  GraduationCap,
  BookOpenCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Student, StudentStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Tooltip from '../components/Tooltip';

type ViewFilter = 'Pending' | 'Submitted' | 'All' | '';
type SemesterScope = 'focus' | 'all'; 

const ThesisTracking: React.FC = () => {
  const { students, updateStudent, logAction, notify, settings, degrees, departments } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterDegree, setFilterDegree] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('Pending');
  const [semesterScope, setSemesterScope] = useState<SemesterScope>('all');
  const [pendingChanges, setPendingChanges] = useState<Record<string, { status: string, date: string }>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Core Rule: Show ONLY Semester 4 and above and exclude those who have finished their journey
  const eligibleStudents = useMemo(() => {
    return students.filter(s => 
      Number(s.currentSemester) >= 4 && 
      s.status !== StudentStatus.COMPLETED && 
      s.status !== StudentStatus.CLOSED && 
      s.status !== StudentStatus.DROPPED
    );
  }, [students]);

  // Helper for dot-agnostic degree comparison
  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  // Master Filter Engine
  const filtered = useMemo(() => {
    return eligibleStudents.filter(s => {
      // 1. Degree Filter Fix (Robust Normalization)
      const matchesDegree = !filterDegree || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
      if (!matchesDegree) return false;

      // 2. Department Filter
      const matchesDept = !filterDept || s.department === filterDept;
      if (!matchesDept) return false;

      // 3. Focus Filter (Final Semesters)
      if (semesterScope === 'focus') {
        const isMPhil = normalizeDegree(s.degree) === 'MPHIL';
        const focusSem = isMPhil ? 4 : 6;
        if (Number(s.currentSemester) !== focusSem) return false;
      }

      // 4. Robust Search Logic
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        (s.name?.toLowerCase().includes(searchStr)) || 
        (s.regNo?.toLowerCase().includes(searchStr)) ||
        (s.programme?.toLowerCase().includes(searchStr)) ||
        (s.supervisorName?.toLowerCase().includes(searchStr));
      
      if (!matchesSearch) return false;
      
      // 5. Submission View Logic
      const rawStatus = pendingChanges[s.id]?.status || s.gs4Form || 'Not Submitted';
      const currentStatus = rawStatus.toString().trim().toLowerCase();
      
      const isSubmitted = currentStatus === 'submitted' || currentStatus === 'approved';
      const isPending = !isSubmitted;

      if (viewFilter === 'Pending') {
        return isPending;
      } 
      
      if (viewFilter === 'Submitted') {
        return isSubmitted;
      }
      
      return true;
    });
  }, [eligibleStudents, searchTerm, viewFilter, filterDegree, filterDept, semesterScope, pendingChanges]);

  const stats = useMemo(() => {
    const counts = { total: eligibleStudents.length, pending: 0, completed: 0 };
    eligibleStudents.forEach(s => {
      const rawStatus = pendingChanges[s.id]?.status || s.gs4Form || 'Not Submitted';
      const status = rawStatus.toString().trim().toLowerCase();
      
      const isSubmitted = status === 'submitted' || status === 'approved';
      const isPending = !isSubmitted;

      if (isPending) counts.pending++;
      if (isSubmitted) counts.completed++;
    });
    return counts;
  }, [eligibleStudents, pendingChanges]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    const today = new Date().toISOString().split('T')[0];
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        status: newStatus,
        date: (newStatus === 'Submitted' || newStatus === 'Approved') ? today : ''
      }
    }));
  };

  const handleDateChange = (studentId: string, newDate: string) => {
    setPendingChanges(prev => ({ ...prev, [studentId]: { ...prev[studentId], date: newDate } }));
  };

  const commitSubmission = (student: Student) => {
    const change = pendingChanges[student.id];
    if (!change) return;
    const updatedStudent: Student = {
      ...student,
      gs4Form: change.status as any,
      thesisSentToCOE: (change.status === 'Submitted' || change.status === 'Approved') ? 'Yes' : 'No',
      coeSubmissionDate: change.date
    };
    updateStudent(updatedStudent);
    logAction('Thesis Update', `Thesis milestone verified for ${student.name}`);
    const newPending = { ...pendingChanges };
    delete newPending[student.id];
    setPendingChanges(newPending);
    notify(`Thesis status updated for ${student.name}.`, 'success');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDegree('');
    setFilterDept('');
    setViewFilter('Pending');
    setSemesterScope('all');
    setCurrentPage(1);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filtered, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDegree, filterDept, viewFilter, semesterScope]);

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Scholar Name', 'Registration #', 'Degree', 'Department', 'Semester', 'Thesis Status', 'COE Dispatch Date', 'Lead Supervisor'];
    const rows = filtered.map(s => [
      s.name, s.regNo, s.degree, s.department, s.currentSemester, 
      pendingChanges[s.id]?.status || s.gs4Form, 
      pendingChanges[s.id]?.date || s.coeSubmissionDate || 'N/A', 
      s.supervisorName
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Thesis_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    logAction('Data Export', 'Exported Thesis Tracking Registry as CSV.');
  };

  const exportPDF = () => {
    if (filtered.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); 
    doc.text(settings.institution.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(settings.institution.directorate.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Thesis & COE Dispatch Tracking (Sem 4+) - Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    autoTable(doc, {
      startY: 35,
      head: [['Scholar Name', 'Reg #', 'Degree', 'Department', 'Sem', 'Status', 'Dispatch Date', 'Supervisor']],
      body: filtered.map(s => [
        s.name, s.regNo || '---', s.degree, s.department, s.currentSemester, 
        pendingChanges[s.id]?.status || s.gs4Form, 
        pendingChanges[s.id]?.date || s.coeSubmissionDate || 'N/A', 
        s.supervisorName || '---'
      ]),
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    doc.save(`Thesis_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 lg:space-y-12 animate-in fade-in duration-700 pb-20 px-2 lg:px-4">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 no-print">
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100">
                <img 
                  src={settings.institution.logo || null} 
                  className="w-full h-full object-contain" 
                  alt="Logo" 
                  referrerPolicy="no-referrer"
                />
             </div>
             <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase">Thesis Tracking</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Final Phase Research Governance (Sem 4+)</p>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full xl:w-auto">
           <MetricsCard label="In Final Phase" value={stats.total} color="slate" icon={TrendingUp} />
           <MetricsCard label="Dispatched" value={stats.completed} color="emerald" icon={CheckCircle2} />
           <div className="hidden md:block">
             <MetricsCard label="Awaiting Form" value={stats.pending} color="rose" icon={Clock} />
           </div>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-10 rounded-xl border border-slate-100 shadow-sm space-y-8 no-print">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text"
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-sm"
              placeholder="Search by Name, Reg #, Programme, or Supervisor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={resetFilters} className="px-6 py-5 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-50" title="Reset Filters">
              <RotateCcw size={16}/>
            </button>
            <button onClick={exportCSV} className="flex-1 lg:flex-none px-8 py-5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 shadow-sm">
              <FileSpreadsheet size={16}/>
              <span>Export CSV</span>
            </button>
            <button onClick={exportPDF} className="flex-1 lg:flex-none px-8 py-5 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-3">
              <FileText size={16}/>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterNode 
            label="Degree" 
            value={filterDegree} 
            icon={GraduationCap} 
            options={['M.Phil', 'PhD']} 
            displayOptions={['MPhil', 'PHD']}
            onChange={setFilterDegree} 
          />
          <FilterNode label="Department" value={filterDept} icon={MapPin} options={departments} onChange={setFilterDept} />
          <FilterNode label="Semester Scope" value={semesterScope} icon={Calendar} options={['all', 'focus']} displayOptions={['Full Spectrum (4+)', 'Final Sem Focus']} onChange={setSemesterScope} />
          <FilterNode label="Thesis Status" value={viewFilter} icon={CheckCircle2} options={['Pending', 'Submitted', 'All']} onChange={setViewFilter} />
        </div>
      </div>

      <div className="space-y-6 lg:space-y-0">
        <div className="hidden lg:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-0 min-w-[1300px]">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
                <tr>
                  <th className="px-10 py-10 border-b border-slate-100">Scholar Details</th>
                  <th className="px-10 py-10 border-b border-slate-100">Placement</th>
                  <th className="px-10 py-10 border-b border-slate-100">Supervisor</th>
                  <th className="px-10 py-10 border-b border-slate-100 text-center">Semester</th>
                  <th className="px-10 py-10 border-b border-slate-100">
                    <div className="flex items-center">
                      <span>Thesis Milestone</span>
                      <Tooltip content="Monitor the semi-final and final thesis submission progress." />
                    </div>
                  </th>
                  <th className="px-10 py-10 border-b border-slate-100">COE Dispatch</th>
                  <th className="px-10 py-10 border-b border-slate-100 text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(student => (
                  <ThesisDesktopRow key={student.id} student={student} pendingChanges={pendingChanges} onStatusChange={handleStatusChange} onDateChange={handleDateChange} onCommit={commitSubmission} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedStudents.map(student => (
            <ThesisMobileCard key={student.id} student={student} pendingChanges={pendingChanges} onStatusChange={handleStatusChange} onDateChange={handleDateChange} onCommit={commitSubmission} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-32 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
             <div className="p-10 bg-slate-50 rounded-xl w-fit mx-auto text-slate-200 mb-6"><BookOpenCheck size={60}/></div>
             <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">Zero Active Candidates</p>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">No Semester 4+ active records satisfy the current filters.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {filtered.length > 0 && (
          <div className="mt-8 px-6 md:px-10 py-6 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-slate-900">{filtered.length}</span> Scholars
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-all ${
                  currentPage === 1 
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-[10px] font-black transition-all border ${
                          currentPage === pageNum
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="text-slate-300 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-all ${
                  currentPage === totalPages 
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ThesisDesktopRow = ({ student, pendingChanges, onStatusChange, onDateChange, onCommit }: any) => {
  const localData = pendingChanges[student.id] || { status: student.gs4Form, date: student.coeSubmissionDate };
  const isDirty = pendingChanges[student.id] !== undefined;
  const isComplete = localData.status === 'Submitted' || localData.status === 'Approved';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-10 py-10">
        <div className="flex items-center space-x-5">
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'}`}>
             {student.name[0]}
           </div>
           <div>
              <p className="font-black text-slate-900 text-base leading-none">{student.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{student.regNo || '---'}</p>
           </div>
        </div>
      </td>
      <td className="px-10 py-10">
         <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{student.degree}</span>
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">{student.department}</span>
         </div>
      </td>
      <td className="px-10 py-10">
         <div className="flex items-center space-x-3 text-slate-500 font-bold text-xs">
            <User size={14} className="text-slate-300" />
            <span>{student.supervisorName || '---'}</span>
         </div>
      </td>
      <td className="px-10 py-10 text-center">
         <span className="px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-black uppercase border border-slate-100 text-slate-500">Sem {student.currentSemester}</span>
      </td>
      <td className="px-10 py-10">
         <div className="relative w-44">
            <select 
              className={`w-full px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none border transition-all cursor-pointer ${isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
              value={localData.status}
              onChange={(e) => onStatusChange(student.id, e.target.value)}
            >
              <option value="Not Submitted">Not Submitted</option>
              <option value="Submitted">Submitted (COE)</option>
              <option value="Approved">Approved</option>
            </select>
            <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
         </div>
      </td>
      <td className="px-10 py-10">
         <input 
            type="date"
            disabled={localData.status === 'Not Submitted'}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-600 disabled:opacity-30 transition-all"
            value={localData.date || ''}
            onChange={(e) => onDateChange(student.id, e.target.value)}
         />
      </td>
      <td className="px-10 py-10 text-right">
         <button 
           onClick={() => onCommit(student)}
           disabled={!isDirty}
           className={`p-4 rounded-xl transition-all shadow-sm ${isDirty ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95' : 'bg-slate-50 text-slate-200'}`}
         >
           <Save size={20} />
         </button>
      </td>
    </tr>
  );
};

const ThesisMobileCard = ({ student, pendingChanges, onStatusChange, onDateChange, onCommit }: any) => {
  const localData = pendingChanges[student.id] || { status: student.gs4Form, date: student.coeSubmissionDate };
  const isDirty = pendingChanges[student.id] !== undefined;
  const isComplete = localData.status === 'Submitted' || localData.status === 'Approved';

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col space-y-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-20 ${isComplete ? 'text-emerald-600' : 'text-slate-300'}`}>
        <BookOpenCheck size={80} />
      </div>
      
      <div className="flex items-center space-x-5">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl ${isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
          {student.name[0]}
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-none">{student.name}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{student.regNo || '---'}</p>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="relative">
          <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-2">Thesis Progress</label>
          <select 
            className={`w-full px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
            value={localData.status || ''}
            onChange={(e) => onStatusChange(student.id, e.target.value)}
          >
            <option value="Not Submitted">Not Submitted</option>
            <option value="Submitted">Submitted (COE)</option>
            <option value="Approved">Approved</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-2">Dispatch Date</label>
          <input 
            type="date"
            disabled={localData.status === 'Not Submitted'}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 disabled:opacity-30"
            value={localData.date || ''}
            onChange={(e) => onDateChange(student.id, e.target.value)}
          />
        </div>
      </div>

      <button 
        onClick={() => onCommit(student)}
        disabled={!isDirty}
        className={`w-full py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${isDirty ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-300'}`}
      >
        <Save size={16} />
        <span>Update Registry Node</span>
      </button>
    </div>
  );
};

const FilterNode = ({ label, value, icon: Icon, options, displayOptions, onChange }: any) => {
  const isAll = !value || value.toLowerCase() === 'all';
  
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 block">{label}</label>
      <div className="relative group">
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 z-10 ${!isAll ? 'text-indigo-600' : 'text-slate-300'}`}>
          <Icon size={16} />
        </div>
        <select 
          className={`w-full pl-14 pr-12 py-5 bg-white border rounded-xl text-[11px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer focus:border-indigo-600 ${!isAll ? 'border-indigo-600 text-indigo-600' : 'border-slate-100 text-slate-500'}`}
          value={value || ''} 
          onChange={e => onChange(e.target.value)}
        >
          {label === "Semester Scope" ? null : <option value="">All Categories</option>}
          {options.map((opt: string, idx: number) => (
            <option key={opt} value={opt}>{displayOptions ? displayOptions[idx] : opt}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
      </div>
    </div>
  );
};

const MetricsCard = ({ label, value, color, icon: Icon }: any) => (
  <div className={`p-4 lg:p-6 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-${color}-200 transition-colors`}>
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl lg:text-3xl font-black text-${color}-600 tracking-tighter tabular-nums`}>{value}</p>
     </div>
     <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-xl group-hover:scale-110 transition-transform`}><Icon size={20}/></div>
  </div>
);

export default ThesisTracking;
