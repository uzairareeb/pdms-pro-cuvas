
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  BarChart3, Plus, Search, Filter, Download, 
  MoreVertical, Edit, Trash2, CheckCircle2, 
  AlertCircle, Calendar, Save, X, User,
  FileSpreadsheet, ArrowUpRight, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentResult, Student } from '../types';
import Autocomplete from '../components/Autocomplete';

const ResultManagement: React.FC = () => {
  const { students, notify } = useStore();
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingResult, setEditingResult] = useState<StudentResult | null>(null);
  
  const [formData, setFormData] = useState<Partial<StudentResult>>({
    studentCnic: '',
    totalMarks: 1100,
    obtainedMarks: 0,
    percentage: 0,
    status: 'Pass',
    validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/admin/results');
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleCalculatePercentage = (obtained: number, total: number) => {
    if (total > 0) {
      const perc = (obtained / total) * 100;
      setFormData(prev => ({ 
        ...prev, 
        obtainedMarks: obtained, 
        totalMarks: total, 
        percentage: Number(perc.toFixed(2)),
        status: perc >= 50 ? 'Pass' : 'Fail'
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentCnic || formData.obtainedMarks === undefined) {
      notify('Please fill all required fields.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: formData })
      });
      const data = await res.json();
      if (data.success) {
        notify('Result saved successfully.', 'success');
        setIsModalOpen(false);
        fetchResults();
        setFormData({
          studentCnic: '',
          totalMarks: 1100,
          obtainedMarks: 0,
          percentage: 0,
          status: 'Pass',
          validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        });
      } else {
        notify(data.message, 'error');
      }
    } catch (err) {
      notify('Failed to save result.', 'error');
    }
  };

  const filteredResults = results.filter(r => 
    r.studentCnic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Result Management</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Registry of Student Performance Records</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setEditingResult(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Add New Result
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Results', value: results.length, icon: BarChart3, color: 'indigo' },
          { label: 'Pass Ratio', value: `${results.length ? Math.round((results.filter(r => r.status === 'Pass').length / results.length) * 100) : 0}%`, icon: CheckCircle2, color: 'emerald' },
          { label: 'Pending Updates', value: '0', icon: AlertCircle, color: 'amber' },
          { label: 'System Validity', value: 'Live', icon: ShieldCheck, color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by CNIC..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Filter size={20} />
            </button>
            <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <FileSpreadsheet size={20} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scholar CNIC</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks (Obt/Total)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Percentage</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Till</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Retrieving Records...</p>
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-sm font-bold text-slate-400">No result records found matching your criteria.</p>
                  </td>
                </tr>
              ) : filteredResults.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{res.studentCnic}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Identity</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                      <span className="text-indigo-600">{res.obtainedMarks}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-500">{res.totalMarks}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-600">
                      {res.percentage}%
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      res.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {res.status === 'Pass' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {res.status}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar size={14} className="text-slate-400" />
                      {res.validTill}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setFormData(res);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <h3 className="text-2xl font-black tracking-tight uppercase leading-none">Result Editor</h3>
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mt-3">Postgraduate Performance Entry</p>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* CNIC Search/Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student CNIC</label>
                    <Autocomplete 
                      label=""
                      value={formData.studentCnic || ''}
                      suggestions={students.map(s => s.cnic)}
                      onChange={v => setFormData({ ...formData, studentCnic: v })}
                      placeholder="Enter or search student CNIC"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obtained Marks</label>
                      <input 
                        type="number" 
                        value={formData.obtainedMarks}
                        onChange={e => handleCalculatePercentage(Number(e.target.value), formData.totalMarks || 1100)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Marks</label>
                      <input 
                        type="number" 
                        value={formData.totalMarks}
                        onChange={e => handleCalculatePercentage(formData.obtainedMarks || 0, Number(e.target.value))}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none appearance-none transition-all"
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valid Till</label>
                      <input 
                        type="date" 
                        value={formData.validTill}
                        onChange={e => setFormData({ ...formData, validTill: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <ArrowUpRight size={18} />
                      </div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Calculated Percentage</p>
                    </div>
                    <span className="text-xl font-black text-indigo-600">{formData.percentage}%</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Save Result
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultManagement;
