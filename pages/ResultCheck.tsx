
import React, { useState } from 'react';
import { Search, GraduationCap, Download, CheckCircle2, AlertCircle, User, Calendar, BookOpen, BarChart3, ShieldCheck, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StudentResult } from '../types';

const ResultCheck: React.FC = () => {
  const [cnic, setCnic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchDefaultTemplate = async () => {
      try {
        const res = await fetch('/api/admin/templates');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const def = data.data.find((t: any) => t.is_default) || data.data[0];
          setTemplate(def);
        }
      } catch (err) {}
    };
    fetchDefaultTemplate();
  }, []);

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    
    // Format: XXXXX-XXXXXXX-X
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    }
    
    setCnic(formatted);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cnic.replace(/-/g, '').length !== 13) {
      setError('Please enter a valid 13-digit CNIC number.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/results/${cnic}`);
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'No result found for this CNIC.');
      }
    } catch (err) {
      setError('An error occurred while fetching the result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('result-card');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${result?.studentCnic}_Result_Card.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-50 no-print shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Scholar Result Portal</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Postgraduate Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Portal Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 py-12 no-print"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">Check Your Result</h2>
                <p className="text-slate-500 text-base font-medium max-w-lg mx-auto leading-relaxed">
                  Enter your CNIC number below to retrieve your academic performance record. 
                  Please ensure your CNIC is correct and matches your university registration.
                </p>
              </div>

              <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">CNIC Number</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="XXXXX-XXXXXXX-X"
                      value={cnic}
                      onChange={handleCnicChange}
                      className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5 outline-none transition-all text-base font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-start gap-3 shadow-sm"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p className="text-sm font-bold">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={18} className="text-indigo-200" />
                      <span>Check Result</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-60">
                {[
                  { icon: ShieldCheck, title: 'Secure Access', desc: 'Encrypted CNIC lookup' },
                  { icon: BookOpen, title: 'Official Data', desc: 'Direct from university records' },
                  { icon: Calendar, title: 'Instant Report', desc: 'Real-time result retrieval' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-slate-200/50 rounded-2xl">
                      <item.icon size={20} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{item.title}</p>
                      <p className="text-[9px] font-bold text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 py-4"
            >
              <div className="flex items-center justify-between no-print mb-4">
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-2.5 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 bg-white border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <Search size={14} />
                  New Search
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    <Printer size={14} />
                    Print
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />}
                    {loading ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>

              {/* Result Card (Printable) */}
              <div id="result-card" className="relative bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden print:border-0 print:shadow-none print:rounded-none">
                {template && (
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                    <img src={template.file_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Result Card Header */}
                <div className="bg-slate-900 p-8 sm:p-12 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-indigo-600/30 rounded-full border border-white/10 backdrop-blur-md">
                        <CheckCircle2 size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Official Result Record</span>
                      </div>
                      <div>
                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight uppercase">{result.studentName}</h3>
                        <p className="text-indigo-300 text-sm font-bold mt-2 uppercase tracking-widest">{result.programme}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 md:text-right">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">CNIC Number</p>
                        <p className="text-xl font-black tracking-widest">{result.studentCnic}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result Details */}
                <div className="p-8 sm:p-12 space-y-12">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Father Name</p>
                      <p className="text-lg font-bold text-slate-900 uppercase">{result.fatherName || '---'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Degree / Program</p>
                      <p className="text-lg font-bold text-slate-900 uppercase">{result.programme || '---'}</p>
                    </div>
                  </div>

                  {/* Marks Dashboard */}
                  <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-8 sm:p-10 grid grid-cols-2 sm:grid-cols-4 gap-10">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <BarChart3 size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-black text-slate-900">{result.totalMarks}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Passing</p>
                        <p className="text-2xl font-black text-slate-900">{result.passingMarks}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <CheckCircle2 size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Obtained</p>
                        <p className="text-2xl font-black text-slate-900">{result.obtainedMarks}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${
                        result.status === 'Pass' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                      }`}>
                        <span className={`text-lg font-black ${
                          result.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>{result.percentage}%</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-2xl font-black text-slate-900">{result.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-10 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-6">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Result Status</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${
                          result.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {result.status === 'Pass' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {result.status}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Till</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Calendar size={14} className="text-slate-400" />
                          {result.validTill}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Authenticated By</p>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <ShieldCheck size={16} className="text-indigo-600" />
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Controller of Examinations</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block border-t border-slate-100 p-8 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                    This is a computer-generated document. Verification available at pdms.cuvas.edu.pk
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            © 2026 Postgraduate Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support Desk</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResultCheck;
