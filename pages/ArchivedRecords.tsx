import React, { useState } from 'react';
import { useStore } from '../store';
import {
  Search, Eye, RotateCcw, ChevronDown, MapPin, 
  GraduationCap, Printer, Archive, FileText, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Student, StudentStatus } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

// ─── FilterSelect ─────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, options, displayOptions, onChange, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">{label}</label>
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${value ? 'text-indigo-600' : 'text-slate-300'}`}>
        <Icon size={14} />
      </div>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full pl-10 pr-9 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all border
          ${value
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 focus:ring-4 focus:ring-indigo-500/10'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/8'
          }`}
      >
        <option value="">All</option>
        {options.map((opt: string, idx: number) => (
          <option key={opt} value={opt}>{displayOptions ? displayOptions[idx] : opt}</option>
        ))}
      </select>
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${value ? 'text-indigo-500' : 'text-slate-300'}`}>
        <ChevronDown size={13} />
      </div>
    </div>
  </div>
);

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[8px] font-black uppercase tracking-wide">
    {label}
    <button onClick={onRemove} className="hover:text-rose-600 transition-colors"><X size={10} /></button>
  </span>
);
const X = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);


const ArchivedRecords: React.FC = () => {
  const { students, departments, settings } = useStore();
  const navigate = useNavigate();

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterDegree, setFilterDegree] = useState('');
  const [filterDept,   setFilterDept]   = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 15;

  const resetFilters = () => {
    setSearchTerm(''); setFilterDegree(''); setFilterDept(''); setFilterSemester(''); setCurrentPage(1);
  };

  const normalizeDegree = (val: string) => val.replace(/\./g, '').trim().toUpperCase();

  const archivedStudents = students.filter(s => s.status === StudentStatus.COMPLETED);

  const filtered = archivedStudents.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q) ||
      s.cnic.includes(q) || s.programme.toLowerCase().includes(q);
    const matchesDegree = filterDegree === '' || normalizeDegree(s.degree) === normalizeDegree(filterDegree);
    const matchesDept   = filterDept === '' || s.department === filterDept;
    const matchesSemester = filterSemester === '' || s.currentSemester?.toString() === filterSemester;
    
    return matchesSearch && matchesDegree && matchesDept && matchesSemester;
  });

  const totalPages        = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasActiveFilters  = !!(filterDegree || filterDept || filterSemester || searchTerm);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDegree, filterDept, filterSemester]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add Logo (Optional if available as base64, else skip)
    // We will just add header text
    doc.setFontSize(18);
    doc.text(settings.institution.name || 'Institution Name', 14, 22);
    
    doc.setFontSize(14);
    doc.text('Archived Students Report (Completed Degrees)', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);
    doc.text(`Total Records: ${filtered.length}`, 14, 44);

    const tableColumn = ["#", "Registration No", "Name", "Department", "Program", "Completion Date"];
    const tableRows = filtered.map((s, i) => [
      i + 1,
      s.regNo,
      s.name,
      s.department,
      s.programme,
      s.finalThesisSubmissionDate || 'N/A'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      styles: { fontSize: 8 },
    });

    doc.save('Archived_Students_Report.pdf');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5 pb-20 max-w-full"
    >
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Archived Records</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Completed Degrees & Alumni</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Count */}
          <div className="flex flex-col items-end border-l border-slate-200 pl-4 pr-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Showing</span>
            <span className="text-lg font-black text-indigo-600 tabular-nums leading-none">{filtered.length}<span className="text-slate-300 font-bold">/{archivedStudents.length}</span></span>
          </div>

          <button onClick={generatePDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-sm">
            <FileText size={14} />
            <span>Export to PDF</span>
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 no-print">
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all placeholder:text-slate-300"
              placeholder="Search by name, reg number, or program..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
              hasActiveFilters
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95'
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={13} />
            <span className="hidden sm:block">Clear Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FilterSelect label="Degree" value={filterDegree} icon={GraduationCap}
            options={['M.Phil', 'PhD']} displayOptions={['M.Phil', 'PhD']} onChange={setFilterDegree} />
          <FilterSelect label="Department" value={filterDept} icon={MapPin}
            options={departments} onChange={setFilterDept} />
          <FilterSelect label="Semester" value={filterSemester} icon={Clock}
            options={['1', '2', '3', '4', '5', '6', '7', '8']} onChange={setFilterSemester} />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-50">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active:</span>
            {searchTerm    && <Chip label={`Search: "${searchTerm}"`}    onRemove={() => setSearchTerm('')} />}
            {filterDegree  && <Chip label={`Degree: ${filterDegree}`}    onRemove={() => setFilterDegree('')} />}
            {filterDept    && <Chip label={`Dept: ${filterDept}`}        onRemove={() => setFilterDept('')} />}
            {filterSemester && <Chip label={`Semester: ${filterSemester}`} onRemove={() => setFilterSemester('')} />}
          </div>
        )}
      </div>

      {/* ── Main Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest w-10">#</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Program / Department</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Completion Date</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.map((student, idx) => (
                <tr key={student.id} onClick={() => navigate(`/students/${student.id}`)}
                  className="cursor-pointer transition-colors group hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-300 tabular-nums">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 bg-teal-50 text-teal-600">
                        {student.profilePictureUrl ? (
                          <img src={student.profilePictureUrl} alt={student.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          student.name[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate leading-none">{student.name}</p>
                        <p className="text-[9px] font-black text-indigo-500 mt-1 tabular-nums">{student.regNo}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[7px] font-black uppercase tracking-tight">{student.degree}</span>
                      <span className="text-[10px] font-black text-slate-700 uppercase truncate">{student.programme}</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.department}</p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-xs font-bold text-slate-600">{student.finalThesisSubmissionDate || 'N/A'}</span>
                  </td>

                  <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <Link to={`/students/${student.id}`}
                      className="inline-flex p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="View Profile">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─ Empty State ─ */}
        {filtered.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Archive size={36} className="text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No archived records found</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Try adjusting your search or filter criteria.</p>
            </div>
          </div>
        )}

        {/* ─ Pagination ─ */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-indigo-600">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
                <ChevronLeft size={15} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const n = i + 1;
                if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                  return (
                    <button key={n} onClick={() => setCurrentPage(n)}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${
                        currentPage === n
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                      }`}>{n}</button>
                  );
                } else if (n === currentPage - 2 || n === currentPage + 2) {
                  return <span key={n} className="text-slate-300 px-1 text-xs">…</span>;
                }
                return null;
              })}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ArchivedRecords;
