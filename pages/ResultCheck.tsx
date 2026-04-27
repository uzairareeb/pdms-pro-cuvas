
import React, { useState, useEffect } from 'react';
import { 
  Search, GraduationCap, Download, CheckCircle2, 
  AlertCircle, User, Calendar, BookOpen, 
  BarChart3, ShieldCheck, Printer, ArrowLeft,
  Trophy, Star, Award, Fingerprint
} from 'lucide-react';
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

  useEffect(() => {
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('result-card');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
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
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 py-5 px-6 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-all duration-500">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">Scholar Portal</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Official Performance Registry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                Registry Verification
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-xl space-y-12 no-print"
            >
              <div className="text-center space-y-6">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2.5 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-2"
                >
                  <ShieldCheck size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Secured Identity Access</span>
                </motion.div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none uppercase">
                   Access Your <br />
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Results</span>
                </h2>
                <p className="text-slate-400 text-sm font-medium max-w-md mx-auto leading-relaxed uppercase tracking-wide">
                  Official Postgraduate examination records for the session 2026. 
                  Please enter your valid 13-digit CNIC to proceed.
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-[2.2rem] overflow-hidden">
                    <div className="pl-8 text-slate-500">
                      <Fingerprint size={24} />
                    </div>
                    <input
                      type="text"
                      placeholder="XXXXX-XXXXXXX-X"
                      value={cnic}
                      onChange={handleCnicChange}
                      className="w-full pl-6 pr-8 py-7 bg-transparent border-none focus:ring-0 outline-none text-xl font-black text-white placeholder:text-slate-700 tracking-widest"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="mr-2 px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/20"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Search size={16} />
                          <span>Search</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl flex items-center gap-4 backdrop-blur-md"
                  >
                    <AlertCircle className="shrink-0" size={20} />
                    <p className="text-xs font-black uppercase tracking-widest leading-none">{error}</p>
                  </motion.div>
                )}
              </form>

              <div className="pt-8 grid grid-cols-3 gap-8">
                {[
                  { icon: ShieldCheck, title: 'Encrypted', color: 'indigo' },
                  { icon: BookOpen, title: 'Verified', color: 'emerald' },
                  { icon: Printer, title: 'Printable', color: 'amber' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 group">
                    <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center border border-${item.color}-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                      <item.icon size={18} className={`text-${item.color}-400`} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-300 transition-colors">{item.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-4xl space-y-8 no-print pb-20"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-3.5 bg-slate-800 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5 flex items-center gap-2 group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  New Search
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => window.print()}
                    className="px-8 py-3.5 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Print Card
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={loading}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                    {loading ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>

              {/* High-Fidelity Result Card */}
              <div id="result-card" className="relative bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-white">
                {template && (
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
                    <img src={template.file_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Card Header Strip */}
                <div className="h-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500" />

                <div className="p-10 sm:p-16 space-y-12">
                   {/* Top Header Section */}
                   <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                      <div className="space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                               <Trophy className="text-white" size={28} />
                            </div>
                            <div>
                               <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-1">Official Result Certificate</h3>
                               <p className="text-xs font-bold text-slate-400">Postgraduate Management System · 2026</p>
                            </div>
                         </div>
                         <div>
                            <h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase mb-3">{result.studentName}</h4>
                            <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{result.programme}</p>
                         </div>
                      </div>

                      <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <Star size={100} className="text-white" />
                         </div>
                         <div className="relative z-10 space-y-4">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Identity Verification</p>
                            <p className="text-2xl font-black tracking-[0.2em]">{result.studentCnic}</p>
                            <div className="pt-2 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Authenticated Securely</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Main Stats Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Detailed Info */}
                      <div className="md:col-span-4 space-y-8">
                         <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Guardian / Father Name</p>
                            <p className="text-xl font-black text-slate-900 uppercase">{result.fatherName || '---'}</p>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Academic Status</p>
                            <div className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest ${
                              result.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {result.status === 'Pass' ? <Award size={14} /> : <AlertCircle size={14} />}
                              {result.status} Status
                            </div>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Registry Validity</p>
                            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                               <Calendar size={16} className="text-indigo-600" />
                               {result.validTill}
                            </div>
                         </div>
                      </div>

                      {/* Performance Visualizer */}
                      <div className="md:col-span-8 bg-slate-50 rounded-[2.5rem] p-10 relative overflow-hidden border border-slate-100">
                         <div className="relative z-10 grid grid-cols-3 gap-8 h-full">
                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                                  <BarChart3 size={24} className="text-indigo-600" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Marks</p>
                                  <p className="text-3xl font-black text-slate-900">{result.totalMarks}</p>
                               </div>
                            </div>

                            <div className="flex flex-col items-center justify-center text-center space-y-4 border-x border-slate-200 px-8">
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                                  <Star size={24} className="text-amber-500" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Obtained</p>
                                  <p className="text-3xl font-black text-slate-900">{result.obtainedMarks}</p>
                               </div>
                            </div>

                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
                                 result.status === 'Pass' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'
                               }`}>
                                  <span className="text-xl font-black text-white">{result.percentage}%</span>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                                  <p className="text-3xl font-black text-slate-900">{result.percentage}%</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Security Footer */}
                   <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-900 rounded-2xl">
                            <ShieldCheck size={24} className="text-emerald-400" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Verified Secure Document</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1">Unique Identifier: {btoa(result.studentCnic).slice(0, 12).toUpperCase()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-3 justify-end mb-2">
                            <div className="h-px w-12 bg-slate-200" />
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Controller Seal</span>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Academic Registry Board</p>
                      </div>
                   </div>
                </div>

                {/* Card Footer Decor */}
                <div className="h-3 bg-gradient-to-r from-emerald-500 via-indigo-500 to-indigo-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-t border-white/5 py-10 px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                   <ShieldCheck size={16} className="text-indigo-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Official Portal 2026</span>
             </div>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
               Cholistan University of Veterinary and Animal Sciences · PostGrad Hub
             </p>
          </div>
          <div className="flex items-center gap-8">
             <a href="#" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Privacy Policy</a>
             <a href="#" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Digital Verification</a>
             <a href="#" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">System Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResultCheck;
