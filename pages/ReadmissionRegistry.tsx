
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Search, 
  User, 
  ChevronDown,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  GraduationCap,
  MapPin,
  UserX,
  RefreshCw,
  AlertTriangle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Student, StudentStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Tooltip from '../components/Tooltip';
import { Link } from 'react-router-dom';

const ReadmissionRegistry: React.FC = () => {
  const { students, updateStudent, logAction, notify, settings, departments, currentRole } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [readmitId, setReadmitId] = useState<string | null>(null);

  // Filter ONLY Dropped students
  const droppedStudents = useMemo(() => {
    return students.filter(s => s.status === StudentStatus.DROPPED);
  }, [students]);

  // Helper for dot-agnostic degree comparison
  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  // Master Filter Engine
  const filtered = useMemo(() => {
    return droppedStudents.filter(s => {
      // 1. Degree Filter
      const matchesDegree = !filterDegree || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
      if (!matchesDegree) return false;

      // 2. Department Filter
      const matchesDept = !filterDept || s.department === filterDept;
      if (!matchesDept) return false;

      // 3. Robust Search Logic
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        (s.name?.toLowerCase().includes(searchStr)) || 
        (s.regNo?.toLowerCase().includes(searchStr)) ||
        (s.programme?.toLowerCase().includes(searchStr)) ||
        (s.supervisorName?.toLowerCase().includes(searchStr));
      
      return matchesSearch;
    });
  }, [droppedStudents, searchTerm, filterDegree, filterDept]);

  const stats = useMemo(() => {
    return {
      total: droppedStudents.length,
      filtered: filtered.length,
      mPhil: droppedStudents.filter(s => normalizeDegree(s.degree) === 'MPHIL').length,
      phd: droppedStudents.filter(s => normalizeDegree(s.degree) === 'PHD').length
    };
  }, [droppedStudents, filtered]);

  const handleReadmit = (student: Student) => {
    const nextSemester = (student.currentSemester || 1) + 1;
    const updatedStudent: Student = {
      ...student,
      status: StudentStatus.ACTIVE,
      currentSemester: nextSemester,
      comments: `${student.comments || ''}\n[${new Date().toLocaleDateString()}] Readmitted to Semester ${nextSemester}.`
    };
    updateStudent(updatedStudent);
    setReadmitId(null);
    notify(`${student.name} has been restored to Active status in Semester ${nextSemester}.`, 'success');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDegree('');
    setFilterDept('');
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Scholar Name', 'Registration #', 'Degree', 'Department', 'Session', 'Last Semester', 'Supervisor'];
    const rows = filtered.map(s => [
      s.name, s.regNo, s.degree, s.department, s.session, s.currentSemester, s.supervisorName
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Readmission_Candidates_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    logAction('Data Export', 'Exported Readmission Registry as CSV.');
  };

  const exportPDF = async () => {
    if (filtered.length === 0) return;
    const body = filtered.map(s => [
      s.name, s.regNo || '---', s.degree, s.department, s.session, s.currentSemester, s.supervisorName || '---'
    ]);
    const { generateOfficialPDF } = await import('../utils/pdfExport');
    await generateOfficialPDF({
      reportName: 'Readmission Candidates Registry',
      headers: ['Scholar Name', 'Reg #', 'Degree', 'Department', 'Session', 'Last Sem', 'Supervisor'],
      data: body,
      landscape: true
    });
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
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase">Readmission Registry</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Monitoring Dropped Scholars & Readmission Candidates</p>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full xl:w-auto">
           <MetricsCard label="Total Dropped" value={stats.total} color="rose" icon={AlertTriangle} />
           <MetricsCard label="M.Phil Candidates" value={stats.mPhil} color="indigo" icon={GraduationCap} />
           <div className="hidden md:block">
             <MetricsCard label="PhD Candidates" value={stats.phd} color="emerald" icon={RefreshCw} />
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
              placeholder="Search by Name, Reg #, or Supervisor..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FilterNode 
            label="Degree" 
            value={filterDegree} 
            icon={GraduationCap} 
            options={['M.Phil', 'PhD']} 
            displayOptions={['MPhil', 'PHD']}
            onChange={setFilterDegree} 
          />
          <FilterNode label="Department" value={filterDept} icon={MapPin} options={departments} onChange={setFilterDept} />
          <div className="hidden lg:flex items-center px-6 bg-rose-50/50 rounded-xl border border-rose-100/50">
            <AlertTriangle className="text-rose-500 mr-4" size={20} />
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider leading-relaxed">
              Scholars listed here have been dropped from the registry and require formal readmission procedures.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-0">
        <div className="hidden lg:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-0 min-w-[1200px]">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
                <tr>
                  <th className="px-10 py-10 border-b border-slate-100">Scholar Details</th>
                  <th className="px-10 py-10 border-b border-slate-100">Placement</th>
                  <th className="px-10 py-10 border-b border-slate-100">Supervisor</th>
                  <th className="px-10 py-10 border-b border-slate-100 text-center">Last Active Sem</th>
                  <th className="px-10 py-10 border-b border-slate-100">Session</th>
                  <th className="px-10 py-10 border-b border-slate-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-10">
                      <div className="flex items-center space-x-5">
                         <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black transition-all group-hover:bg-rose-600 group-hover:text-white">
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
                       <span className="px-4 py-2 bg-rose-50 rounded-lg text-[10px] font-black uppercase border border-rose-100 text-rose-600">Semester {student.currentSemester}</span>
                    </td>
                    <td className="px-10 py-10">
                       <div className="flex items-center space-x-3 text-slate-500 font-bold text-xs">
                          <Calendar size={14} className="text-slate-300" />
                          <span>{student.session}</span>
                       </div>
                    </td>
                    <td className="px-10 py-10 text-right">
                       <div className="flex items-center justify-end space-x-3">
                          <Link 
                            to={`/students/${student.id}`}
                            className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                            title="View Profile"
                          >
                            <User size={18} />
                          </Link>
                          <button 
                            onClick={() => setReadmitId(student.id)}
                            disabled={!currentRole?.canEdit}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-20"
                          >
                            <RefreshCw size={14} />
                            <span>Readmit</span>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(student => (
            <div key={student.id} className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-rose-600">
                <UserX size={80} />
              </div>
              
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-2xl">
                  {student.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">{student.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{student.regNo || '---'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Degree</p>
                   <p className="text-xs font-bold text-slate-900">{student.degree}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Sem</p>
                   <p className="text-xs font-bold text-slate-900">{student.currentSemester}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setReadmitId(student.id)}
                  disabled={!currentRole?.canEdit}
                  className="w-full py-5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-emerald-700 shadow-sm disabled:opacity-20"
                >
                  <RefreshCw size={16} />
                  <span>Execute Readmission</span>
                </button>
                <Link 
                  to={`/students/${student.id}`}
                  className="w-full py-5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-slate-200"
                >
                  <span>Review Scholar Node</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-32 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
             <div className="p-10 bg-slate-50 rounded-xl w-fit mx-auto text-slate-200 mb-6"><UserX size={60}/></div>
             <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">Zero Dropped Records</p>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">No dropped scholars satisfy the current filters.</p>
          </div>
        )}
      </div>

      {/* Readmission Confirmation Modal */}
      {readmitId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0c10]/70 backdrop-blur-xl no-print">
           <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="p-10 md:p-12 text-center space-y-6">
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
                   <RefreshCw size={32} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Confirm Readmission?</h3>
                    <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                      This will restore the scholar's status to <strong>Active</strong> and reintegrate them into the primary monitoring registries.
                    </p>
                 </div>
              </div>
              <div className="p-10 md:p-12 bg-slate-50 flex flex-col md:flex-row gap-4 md:gap-6">
                 <button onClick={() => setReadmitId(null)} className="flex-1 py-4 md:py-5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                 <button 
                  onClick={() => {
                    const student = students.find(s => s.id === readmitId);
                    if (student) handleReadmit(student);
                    else setReadmitId(null);
                  }} 
                  className="flex-1 py-4 md:py-5 bg-emerald-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                 >
                   Confirm Readmission
                 </button>
              </div>
           </div>
        </div>
      )}
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
          <option value="">All Categories</option>
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

export default ReadmissionRegistry;
