
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  BarChart3, Plus, Search, Filter, Download, 
  MoreVertical, Edit, Trash2, CheckCircle2, 
  AlertCircle, Calendar, Save, X, User,
  FileSpreadsheet, ArrowUpRight, GraduationCap, Upload, 
  Settings as SettingsIcon, Image as ImageIcon, CheckCircle, Info, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentResult, Student } from '../types';
import Autocomplete from '../components/Autocomplete';
import Papa from 'papaparse';

interface ResultTemplate {
  id: string;
  name: string;
  fileUrl: string;
  isDefault: boolean;
  createdAt: string;
}

import { useNavigate, useLocation } from 'react-router-dom';

const ResultManagement: React.FC = () => {
  const { students, notify } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<StudentResult[]>([]);
  const [templates, setTemplates] = useState<ResultTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingResult, setEditingResult] = useState<StudentResult | null>(null);

  // Sync tab with URL
  const activeTab = location.pathname.includes('/templates') ? 'templates' : 'records';
  
  const setActiveTab = (tab: 'records' | 'templates') => {
    navigate(tab === 'templates' ? '/result-admin/templates' : '/result-admin/records');
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<StudentResult>>({
    studentCnic: '',
    totalMarks: 1100,
    obtainedMarks: 0,
    passingMarks: 550,
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

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchResults();
    fetchTemplates();
  }, []);

  const handleCalculatePercentage = (obtained: number, total: number, passing: number) => {
    if (total > 0) {
      const perc = (obtained / total) * 100;
      setFormData(prev => ({ 
        ...prev, 
        obtainedMarks: obtained, 
        totalMarks: total, 
        passingMarks: passing,
        percentage: Number(perc.toFixed(2)),
        status: obtained >= passing ? 'Pass' : 'Fail'
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
        resetForm();
      } else {
        notify(data.message, 'error');
      }
    } catch (err) {
      notify('Failed to save result.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      studentCnic: '',
      totalMarks: 1100,
      obtainedMarks: 0,
      passingMarks: 550,
      percentage: 0,
      status: 'Pass',
      validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    setEditingResult(null);
  };

  const downloadSampleFile = () => {
    const csvContent = "Student Name,Father Name,CNIC,Program / Degree Name,Total Marks,Obtained Marks,Passing Marks,Valid Till\nJohn Doe,Doe Senior,31202-1234567-8,M.Phil Computer Science,1100,850,550,2027-12-31";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_results_sample.csv';
    a.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data.map((row: any) => {
          const total = Number(row['Total Marks']) || 1100;
          const obt = Number(row['Obtained Marks']) || 0;
          const passing = Number(row['Passing Marks']) || 550;
          const perc = total > 0 ? Number(((obt / total) * 100).toFixed(2)) : 0;
          
          return {
            studentCnic: row['CNIC'],
            totalMarks: total,
            obtainedMarks: obt,
            passingMarks: passing,
            percentage: perc,
            status: obt >= passing ? 'Pass' : 'Fail',
            validTill: row['Valid Till'] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
          };
        });

        try {
          const res = await fetch('/api/admin/results/bulk-add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: parsedData })
          });
          const data = await res.json();
          if (data.success) {
            notify(`${data.count} results uploaded successfully.`, 'success');
            fetchResults();
          } else {
            notify(data.message, 'error');
          }
        } catch (err) {
          notify('Bulk upload failed.', 'error');
        }
      }
    });
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            template: { 
              name: file.name, 
              file_url: base64Data, 
              is_default: templates.length === 0 
            } 
          })
        });
        const data = await res.json();
        if (data.success) {
          notify('Template uploaded successfully.', 'success');
          fetchTemplates();
        }
      } catch (err) {
        notify('Template upload failed.', 'error');
      }
    };
    reader.readAsDataURL(file);
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
            onClick={downloadSampleFile}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            <Download size={16} />
            Sample CSV
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
          >
            <Upload size={16} />
            Bulk Upload
          </button>
          <input type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".csv" className="hidden" />
          
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Add New Result
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100 no-print">
        <button 
          onClick={() => setActiveTab('records')}
          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'records' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Student Records
          {activeTab === 'records' && <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-1 bg-indigo-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'templates' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Card Templates
          {activeTab === 'templates' && <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-1 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      {activeTab === 'records' ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Results', value: results.length, icon: BarChart3, color: 'indigo' },
              { label: 'Pass Ratio', value: `${results.length ? Math.round((results.filter(r => r.status === 'Pass').length / results.length) * 100) : 0}%`, icon: CheckCircle2, color: 'emerald' },
              { label: 'Avg Percentage', value: `${results.length ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) : 0}%`, icon: ArrowUpRight, color: 'amber' },
              { label: 'Active Sessions', value: 'Live', icon: ShieldCheck, color: 'indigo' },
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
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks (Obt/Pass/Total)</th>
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
                          <span className="text-emerald-600" title="Passing Marks">{res.passingMarks}</span>
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
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Template Grid */}
              <div className="lg:col-span-8 space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {templates.length === 0 ? (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <ImageIcon size={48} className="text-slate-300 mb-4" />
                        <p className="text-sm font-bold text-slate-400">No result card templates uploaded yet.</p>
                      </div>
                    ) : templates.map(tmpl => (
                      <div key={tmpl.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm group">
                        <div className="aspect-[1.4/1] bg-slate-100 relative group-hover:bg-slate-200 transition-colors flex items-center justify-center overflow-hidden">
                          <img src={tmpl.fileUrl} alt={tmpl.name} className="w-full h-full object-cover" />
                          {tmpl.isDefault && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                              Default Template
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                             <button className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 transition-all"><Search size={18} /></button>
                             <button className="p-3 bg-white text-rose-600 rounded-xl hover:scale-110 transition-all"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <div className="p-5 flex items-center justify-between">
                           <div>
                             <h4 className="text-xs font-black text-slate-900 uppercase truncate max-w-[150px]">{tmpl.name}</h4>
                             <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(tmpl.createdAt).toLocaleDateString()}</p>
                           </div>
                           {!tmpl.isDefault && (
                             <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">Set Default</button>
                           )}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Right: Upload Section */}
              <div className="lg:col-span-4">
                 <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm sticky top-10">
                    <SectionHeader icon={Upload} title="Upload Template" subtitle="Custom result card design" />
                    <div 
                      onClick={() => templateInputRef.current?.click()}
                      className="mt-6 aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                    >
                       <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors mb-4">
                          <Upload size={24} />
                       </div>
                       <p className="text-xs font-black text-slate-900 uppercase mb-2">Click to Upload</p>
                       <p className="text-[10px] font-bold text-slate-400">PDF, PNG or JPG (Max 5MB)</p>
                       <input type="file" ref={templateInputRef} onChange={handleTemplateUpload} accept="image/*,application/pdf" className="hidden" />
                    </div>

                    <div className="mt-8 space-y-4">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Requirements</h5>
                       {[
                         { icon: CheckCircle, text: 'Clean professional background' },
                         { icon: CheckCircle, text: 'Standard A4 proportions' },
                         { icon: CheckCircle, text: 'Space for student credentials' },
                         { icon: Info, text: 'Used for student PDF downloads' },
                       ].map((req, i) => (
                         <div key={i} className="flex items-center gap-3">
                            <req.icon size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-600">{req.text}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obtained</label>
                      <input 
                        type="number" 
                        value={formData.obtainedMarks}
                        onChange={e => handleCalculatePercentage(Number(e.target.value), formData.totalMarks || 1100, formData.passingMarks || 550)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Passing</label>
                      <input 
                        type="number" 
                        value={formData.passingMarks}
                        onChange={e => handleCalculatePercentage(formData.obtainedMarks || 0, formData.totalMarks || 1100, Number(e.target.value))}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total</label>
                      <input 
                        type="number" 
                        value={formData.totalMarks}
                        onChange={e => handleCalculatePercentage(formData.obtainedMarks || 0, Number(e.target.value), formData.passingMarks || 550)}
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

const SectionHeader: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-indigo-50 rounded-xl mt-0.5">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h3>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{subtitle}</p>
    </div>
  </div>
);

export default ResultManagement;
