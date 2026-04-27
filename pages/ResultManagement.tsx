
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  BarChart3, Plus, Search, Filter, Download, 
  MoreVertical, Edit, Trash2, CheckCircle2, 
  AlertCircle, Calendar, Save, X, User,
  FileSpreadsheet, ArrowUpRight, GraduationCap, Upload, 
  Settings as SettingsIcon, Image as ImageIcon, CheckCircle, Info, ShieldCheck,
  Zap, TrendingUp, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentResult, Student } from '../types';
import Autocomplete from '../components/Autocomplete';
import Papa from 'papaparse';
import { useNavigate, useLocation } from 'react-router-dom';

interface ResultTemplate {
  id: string;
  name: string;
  fileUrl: string;
  isDefault: boolean;
  createdAt: string;
}

const ResultManagement: React.FC = () => {
  const { students, notify } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<StudentResult[]>([]);
  const [templates, setTemplates] = useState<ResultTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Sync tab with URL
  const activeTab = location.pathname.includes('/templates') 
    ? 'templates' 
    : location.pathname.includes('/upload') 
      ? 'upload' 
      : 'dashboard';

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
      complete: async (resultsData) => {
        const parsedData = resultsData.data.map((row: any) => {
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
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
            {activeTab === 'dashboard' ? 'Portal Dashboard' : activeTab === 'upload' ? 'Bulk Upload Center' : 'Design Studio'}
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
            {activeTab === 'dashboard' ? 'Performance Overview & Stats' : activeTab === 'upload' ? 'Bulk Data Processing' : 'Certificate Template Management'}
          </p>
        </div>
        
        {activeTab === 'upload' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={downloadSampleFile}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <Download size={16} />
              Sample CSV
            </button>
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus size={16} />
              Manual Entry
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Registered Results', value: results.length, icon: Users, color: 'indigo' },
                { label: 'Pass Percentage', value: `${results.length ? Math.round((results.filter(r => r.status === 'Pass').length / results.length) * 100) : 0}%`, icon: TrendingUp, color: 'emerald' },
                { label: 'Average Score', value: `${results.length ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) : 0}%`, icon: Zap, color: 'amber' },
                { label: 'Active Templates', value: templates.length, icon: FileSpreadsheet, color: 'indigo' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
                  <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Insights Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                     <TrendingUp size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Growth Trends</h3>
                  <p className="text-xs font-medium text-slate-400 max-w-xs">Visualization of student performance trends over the current academic session.</p>
               </div>
               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                     <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Success Metrics</h3>
                  <p className="text-xs font-medium text-slate-400 max-w-xs">Detailed breakdown of pass/fail ratios across different departments.</p>
               </div>
            </div>
          </motion.div>
        ) : activeTab === 'upload' ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
             {/* Upload Box */}
             <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center group hover:border-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-xl transition-all mb-6">
                   <Upload size={36} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Drop your CSV here</h3>
                <p className="text-sm font-medium text-slate-400 max-w-sm mb-8">Process multiple student results instantly. Ensure your columns match the sample template.</p>
                <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl group-hover:bg-indigo-600 transition-all">Select File</button>
                <input type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".csv" className="hidden" />
             </div>

             {/* Table */}
             <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search results by CNIC..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"><Filter size={20} /></button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scholar CNIC</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Till</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan={5} className="px-8 py-20 text-center text-xs font-black text-slate-400 uppercase animate-pulse tracking-widest">Processing Registry...</td></tr>
                      ) : filteredResults.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-20 text-center text-sm font-bold text-slate-400">No records found. Start by uploading a CSV.</td></tr>
                      ) : filteredResults.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6 font-black text-slate-900">{res.studentCnic}</td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-indigo-600">{res.obtainedMarks}/{res.totalMarks}</span>
                                <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase">{res.percentage}%</div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              res.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-slate-500">{res.validTill}</td>
                          <td className="px-8 py-6 text-right">
                             <button 
                              onClick={() => { setFormData(res); setIsModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-all"
                             ><Edit size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
             <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {templates.map(tmpl => (
                     <div key={tmpl.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm group">
                        <div className="aspect-[1.4/1] bg-slate-100 relative overflow-hidden">
                           <img src={tmpl.fileUrl} className="w-full h-full object-cover" alt="" />
                           {tmpl.isDefault && <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Active Template</div>}
                        </div>
                        <div className="p-6 flex items-center justify-between">
                           <h4 className="text-xs font-black text-slate-900 uppercase truncate max-w-[150px]">{tmpl.name}</h4>
                           <button className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest">Delete</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="lg:col-span-4">
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm sticky top-10">
                   <SectionHeader icon={Upload} title="New Design" subtitle="Upload custom result card" />
                   <div 
                    onClick={() => templateInputRef.current?.click()}
                    className="mt-6 aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                   >
                      <Upload size={24} className="text-slate-400 mb-3" />
                      <p className="text-[10px] font-black text-slate-900 uppercase">Click to Select</p>
                      <input type="file" ref={templateInputRef} onChange={handleTemplateUpload} accept="image/*,application/pdf" className="hidden" />
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
               <div className="bg-slate-900 p-10 text-white">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Manual Entry</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Update Individual Records</p>
               </div>
               <form onSubmit={handleSave} className="p-10 space-y-6">
                  <Autocomplete label="Scholar CNIC" value={formData.studentCnic || ''} suggestions={students.map(s => s.cnic)} onChange={v => setFormData({ ...formData, studentCnic: v })} placeholder="Enter CNIC" required />
                  <div className="grid grid-cols-3 gap-4">
                     <FormInput label="Obtained" type="number" value={formData.obtainedMarks} onChange={e => handleCalculatePercentage(Number(e.target.value), formData.totalMarks || 1100, formData.passingMarks || 550)} />
                     <FormInput label="Passing" type="number" value={formData.passingMarks} onChange={e => handleCalculatePercentage(formData.obtainedMarks || 0, formData.totalMarks || 1100, Number(e.target.value))} />
                     <FormInput label="Total" type="number" value={formData.totalMarks} onChange={e => handleCalculatePercentage(formData.obtainedMarks || 0, Number(e.target.value), formData.passingMarks || 550)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl text-sm font-black focus:ring-0 outline-none appearance-none border-none">
                           <option value="Pass">Pass</option>
                           <option value="Fail">Fail</option>
                        </select>
                     </div>
                     <FormInput label="Valid Till" type="date" value={formData.validTill} onChange={e => setFormData({ ...formData, validTill: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Save Changes</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormInput: React.FC<{ label: string; type: string; value: any; onChange: (e: any) => void }> = ({ label, type, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value} onChange={onChange} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-600/10 outline-none border-none transition-all" />
  </div>
);

const SectionHeader: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-indigo-50 rounded-2xl">
      <Icon size={20} className="text-indigo-600" />
    </div>
    <div>
      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h3>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{subtitle}</p>
    </div>
  </div>
);

export default ResultManagement;
