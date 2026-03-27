
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Search, Eye, Edit2, Trash2, Lock, Unlock, 
  X, User, Filter, RotateCcw, ChevronDown, ShieldAlert,
  MapPin, Briefcase, ChevronRight, ChevronLeft, GraduationCap, LayoutGrid, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Student, StudentStatus, ValidationStatus } from '../types';
import Tooltip from '../components/Tooltip';
import { motion } from 'framer-motion';

const StudentRecords: React.FC = () => {
  const { 
    students, deleteStudent, bulkDeleteStudents, deleteAllStudents, 
    toggleLockStudent, currentRole, departments, settings, isDatabaseConnected 
  } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // Filter States
  const [filterDegree, setFilterDegree] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterValidation, setFilterValidation] = useState<string>('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  
  const resetFilters = () => {
    setSearchTerm('');
    setFilterDegree('');
    setFilterDept('');
    setFilterStatus('');
    setFilterValidation('');
    setCurrentPage(1);
  };

  // Helper for dot-agnostic degree comparison
  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  const filtered = students.filter(s => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(searchStr) ||
      s.regNo.toLowerCase().includes(searchStr) ||
      s.cnic.includes(searchStr) ||
      s.programme.toLowerCase().includes(searchStr) ||
      s.supervisorName.toLowerCase().includes(searchStr);
    
    const matchesDegree = filterDegree === '' || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
    const matchesDept = filterDept === '' || s.department === filterDept;
    const matchesStatus = filterStatus === '' || s.status === filterStatus;
    const matchesValidation = filterValidation === '' || s.validationStatus === filterValidation;

    return matchesSearch && matchesDegree && matchesDept && matchesStatus && matchesValidation;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDegree, filterDept, filterStatus, filterValidation]);

  const handleToggleLock = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await toggleLockStudent(id);
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const hasActiveFilters = filterDegree || filterDept || filterStatus || filterValidation || searchTerm;

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 md:space-y-8 relative pb-20 max-w-full"
    >
      {/* Header - Adaptive Scaling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print px-1 md:px-2">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100 dark:border-white/5">
                <img 
                  src={settings.institution.logo || ''} 
                  className="w-full h-full object-contain" 
                  alt="Logo" 
                  referrerPolicy="no-referrer"
                />
             </div>
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Scholar Registry</h1>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Institutional Student Progress Monitoring</p>
        </div>

        {!isDatabaseConnected && (
          <div className="flex items-center space-x-3 px-6 py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
            <ShieldAlert size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest">Database Not Connected</span>
              <span className="text-[9px] font-bold opacity-70">Connect to Supabase in Settings to sync records.</span>
            </div>
            <Link to="/settings" className="ml-4 px-4 py-1.5 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-700 transition-all">
              Connect Now
            </Link>
          </div>
        )}
        
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 border-t md:border-t-0 dark:border-white/5 pt-4 md:pt-0">
           {selectedIds.length > 0 && currentRole.canDelete && (
             <button 
               onClick={() => setIsBulkDeleting(true)}
               className="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center space-x-2"
             >
               <Trash2 size={14} />
               <span>Delete Selected ({selectedIds.length})</span>
             </button>
           )}
           
           {students.length > 0 && currentRole.canDelete && (
             <button 
               onClick={() => setIsDeletingAll(true)}
               className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shadow-sm active:scale-95"
             >
               Delete All Students
             </button>
           )}

           <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Coverage</span>
              <span className="text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{filtered.length} / {students.length}</span>
           </div>
           <div className="h-10 w-px bg-slate-200 dark:bg-white/5 hidden md:block" />
           <button 
             onClick={() => window.print()}
             className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
           >
             Print View
           </button>
        </div>
      </div>

      {/* Responsive Filter System */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm space-y-6 no-print">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="relative group flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input 
              type="text"
              className="w-full pl-14 pr-6 py-4 md:py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-sm placeholder:text-slate-300 dark:text-white"
              placeholder="Search Scholar Name, ID, or Program..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center justify-center space-x-3 px-8 py-4 md:py-4.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              hasActiveFilters 
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-100 dark:border-rose-500/20' 
              : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>

        {/* 1 col on Mobile, 2 on Tablet, 4 on Laptop/PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <FilterSelect 
            label="Degree Type" 
            value={filterDegree} 
            icon={GraduationCap}
            options={['M.Phil', 'PhD']} 
            displayOptions={['MPhil', 'PHD']}
            onChange={setFilterDegree} 
          />
          <FilterSelect 
            label="Specialization" 
            value={filterDept} 
            icon={MapPin}
            options={departments} 
            onChange={setFilterDept} 
          />
          <FilterSelect 
            label="Status" 
            value={filterStatus} 
            icon={Briefcase}
            options={Object.values(StudentStatus)} 
            onChange={setFilterStatus} 
          />
          <FilterSelect 
            label="Validation" 
            value={filterValidation} 
            icon={CheckCircle2}
            options={Object.values(ValidationStatus)} 
            onChange={setFilterValidation} 
          />
        </div>
      </div>

      {/* Main Content Area - Adaptive Display */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        
        {/* Mobile: Card Layout (Hidden on Laptop/Tablet) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
           {paginatedStudents.map(student => (
             <div 
               key={student.id} 
               onClick={() => setPreviewStudent(student)}
               className="p-6 flex flex-col space-y-4 hover:bg-white/50 dark:hover:bg-slate-800/50 active:bg-indigo-50 dark:active:bg-indigo-900/20 transition-colors relative cursor-pointer"
             >
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded-lg border-slate-200 dark:border-slate-700 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer"
                      />
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${student.isLocked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                          {student.isLocked ? <Lock size={18} /> : student.name[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-base leading-none">{student.name}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{student.regNo}</p>
                        </div>
                      </div>
                   </div>
                   <div className="p-2 text-slate-300 dark:text-slate-600">
                     <ChevronRight size={18} />
                   </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                   <div className="flex-1 flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Program</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{student.degree} {student.programme}</span>
                   </div>
                   <div className="shrink-0 flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${
                        student.status === StudentStatus.ACTIVE ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {student.status}
                      </span>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Laptop/Tablet: Table Layout (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-separate border-spacing-0 min-w-full">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.25em]">
              <tr>
                <th className="px-6 md:px-10 py-8 md:py-10 border-b border-slate-100 dark:border-slate-800 w-10">
                  <input 
                    type="checkbox"
                    checked={paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded-lg border-slate-200 dark:border-slate-700 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer"
                  />
                </th>
                <th className="px-6 md:px-10 py-8 md:py-10 border-b border-slate-100 dark:border-slate-800">Scholar Details</th>
                <th className="px-6 md:px-10 py-8 md:py-10 border-b border-slate-100 dark:border-slate-800 hidden lg:table-cell">Placement</th>
                <th className="px-6 md:px-10 py-8 md:py-10 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center">
                    <span>Status Node</span>
                    <Tooltip content="Current academic status and administrative validation state." />
                  </div>
                </th>
                <th className="px-6 md:px-10 py-8 md:py-10 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.map(student => (
                <tr 
                  key={student.id} 
                  onClick={() => setPreviewStudent(student)}
                  className={`cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors group ${student.isLocked ? 'bg-amber-50/15 dark:bg-amber-900/5' : ''} ${previewStudent?.id === student.id ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''}`}
                >
                  <td className="px-6 md:px-10 py-6 md:py-8" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="w-5 h-5 rounded-lg border-slate-200 dark:border-slate-700 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer"
                    />
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8">
                    <div className="flex items-center space-x-4 md:space-x-6">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-black text-lg md:text-xl transition-all shadow-sm ${
                        student.isLocked 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                        : (previewStudent?.id === student.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400')
                      }`}>
                        {student.isLocked ? <Lock size={20} /> : student.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 dark:text-white text-base md:text-lg flex items-center tracking-tight truncate leading-none">
                          {student.name}
                        </div>
                        <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1.5 md:mt-2 truncate">{student.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8 hidden lg:table-cell">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-3 truncate">
                         <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded-lg shrink-0 border border-indigo-100 dark:border-indigo-800/50">{student.degree}</span>
                         <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-tighter truncate">{student.programme}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2 truncate">{student.department}</p>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8">
                    <div className="flex flex-col space-y-2">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border w-fit ${
                          student.status === StudentStatus.ACTIVE ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' :
                          student.status === StudentStatus.COMPLETED ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {student.status}
                        </span>
                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center ${
                          student.validationStatus === ValidationStatus.APPROVED ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${student.validationStatus === ValidationStatus.APPROVED ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {student.validationStatus}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8 text-right">
                    <div className="flex items-center justify-end space-x-2 md:space-x-3">
                      <Link 
                        to={`/students/${student.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </Link>
                      {currentRole.canLockRecords && (
                        <button 
                          onClick={(e) => handleToggleLock(e, student.id)}
                          className={`p-2.5 rounded-xl transition-all ${
                            student.isLocked ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                          }`}
                        >
                          {student.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                      )}
                      {currentRole.canDelete && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(student.id); }}
                          className="p-3 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-24 md:py-32 text-center flex flex-col items-center justify-center space-y-6">
            <div className="p-10 md:p-12 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-xl">
              <Search size={60} className="md:w-20 md:h-20" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Registry Segment</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-2">Try adjusting your filters or search query.</p>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filtered.length > 0 && (
          <div className="px-6 md:px-10 py-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-slate-900 dark:text-white">{filtered.length}</span> Scholars
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-all ${
                  currentPage === 1 
                  ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-600 dark:hover:border-indigo-400 shadow-sm'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Only show first, last, and pages around current
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
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-600 dark:hover:border-indigo-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="text-slate-300 dark:text-slate-700 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-all ${
                  currentPage === totalPages 
                  ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-600 dark:hover:border-indigo-400 shadow-sm'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Sidebar - Balanced for Tablet and Mobile */}
      {previewStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] no-print" onClick={() => setPreviewStudent(null)}>
           <div 
             className={`absolute top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out flex flex-col ${previewStudent ? 'translate-x-0' : 'translate-x-full'}`}
             onClick={e => e.stopPropagation()}
           >
              <div className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Scholar Node</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Identity Snapshot</p>
                </div>
                 <button 
                  onClick={() => setPreviewStudent(null)} 
                  className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 md:p-12 space-y-10 custom-scrollbar">
                <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
                   <div className={`w-28 h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center font-black text-4xl ${previewStudent.isLocked ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' : 'bg-indigo-600 text-white shadow-sm'}`}>
                     {previewStudent.isLocked ? <Lock size={40} /> : previewStudent.name[0]}
                   </div>
                   <div>
                     <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{previewStudent.name}</h2>
                     <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.4em] mt-4 bg-slate-100 dark:bg-slate-800 px-6 py-2 rounded-full inline-block">{previewStudent.regNo}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                   <SummaryBadge icon={Briefcase} label={previewStudent.status} color="indigo" />
                   <SummaryBadge icon={ShieldAlert} label={previewStudent.isLocked ? 'LOCKED' : 'OPEN'} color={previewStudent.isLocked ? 'amber' : 'emerald'} />
                </div>

                <div className="space-y-8 pt-10 border-t border-slate-50 dark:border-slate-800">
                  <MetricRow icon={User} label="Father's Name" value={previewStudent.fatherName} />
                  <MetricRow icon={MapPin} label="Specialization" value={previewStudent.department} />
                  <MetricRow icon={Briefcase} label="Lead Supervisor" value={previewStudent.supervisorName} />
                  <MetricRow icon={GraduationCap} label="Degree Level" value={previewStudent.degree} />
                </div>
              </div>

              <div className="p-10 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                 <Link to={`/students/${previewStudent.id}`} className="w-full bg-indigo-600 text-white rounded-xl flex items-center justify-center space-x-4 py-5 font-bold uppercase text-xs tracking-widest shadow-sm hover:bg-indigo-700 transition-all group active:scale-95">
                   <span>View Full Profile</span>
                   <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </Link>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Responsive */}
      {(deletingId || isBulkDeleting || isDeletingAll) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0c10]/70 backdrop-blur-xl no-print">
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 w-full max-w-md shadow-lg rounded-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 md:p-12 text-center space-y-6">
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto"><Trash2 size={32} /></div>
                 <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      {isDeletingAll ? 'Delete All Students?' : isBulkDeleting ? 'Delete Selected Students?' : 'Delete Student Record?'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
                      {isDeletingAll 
                        ? 'Are you sure you want to permanently remove ALL student records? This action cannot be undone.'
                        : isBulkDeleting
                        ? `Are you sure you want to permanently remove the ${selectedIds.length} selected student records? This action cannot be undone.`
                        : 'Are you sure you want to permanently remove this student record? This action cannot be undone.'}
                    </p>
                 </div>
              </div>
              <div className="p-10 md:p-12 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-4 md:gap-6">
                 <button 
                   onClick={() => {
                     setDeletingId(null);
                     setIsBulkDeleting(false);
                     setIsDeletingAll(false);
                   }} 
                   className="flex-1 py-4 md:py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                 >
                   Cancel
                 </button>
                 <button 
                  onClick={async () => { 
                    try {
                      if (isDeletingAll) {
                        await deleteAllStudents();
                        setIsDeletingAll(false);
                      } else if (isBulkDeleting) {
                        await bulkDeleteStudents(selectedIds);
                        setSelectedIds([]);
                        setIsBulkDeleting(false);
                      } else if (deletingId) {
                        await deleteStudent(deletingId);
                        setDeletingId(null);
                      }
                    } catch (err) {
                      console.error('Deletion failed:', err);
                    }
                  }} 
                  className="flex-1 py-4 md:py-5 bg-rose-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm"
                 >
                   Confirm Deletion
                 </button>
              </div>
           </div>
        </div>
      )}
    </motion.div>
  );
};

// Sub-components for better organization

const SummaryBadge = ({ icon: Icon, label, color }: any) => (
  <div className={`flex items-center space-x-2 md:space-x-3 px-4 py-2.5 rounded-xl border ${
    color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 
    color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : 
    'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
  }`}>
    <Icon size={14} /><span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
  </div>
);

const MetricRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start space-x-4 group">
    <div className="p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-all shrink-0"><Icon size={18} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{value || '---'}</p>
    </div>
  </div>
);

const FilterSelect = ({ label, value, options, displayOptions, onChange, icon: Icon }: any) => (
  <div className="space-y-2.5">
    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2 block">{label}</label>
    <div className="relative group">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-colors ${value !== '' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
        <Icon size={16} />
      </div>
      <select 
        className={`w-full pl-14 pr-12 py-4 md:py-4.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer focus:border-indigo-600 ${value !== '' ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {options.map((opt: string, idx: number) => (
          <option key={opt} value={opt}>{displayOptions ? displayOptions[idx] : opt}</option>
        ))}
      </select>
      <div className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${value !== '' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

export default StudentRecords;
