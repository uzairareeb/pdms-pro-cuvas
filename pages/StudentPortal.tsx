import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, LogOut, Loader2, GraduationCap, User, FileCheck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentPortal: React.FC = () => {
    const { settings, notify } = useStore();
    const navigate = useNavigate();
    
    const [student, setStudent] = useState<any>(null);
    const [isUploaded, setIsUploaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkUploadStatus = useCallback(async (cnic: string) => {
        try {
            const res = await fetch(`/api/check-thesis-status/${cnic}`);
            const data = await res.json();
            if (data.success) {
                setIsUploaded(data.exists);
            }
        } catch (e) {
            console.error("Error checking status", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('cas_student_user');
        if (!saved) {
            navigate('/student-login');
            return;
        }
        const parsed = JSON.parse(saved);
        setStudent(parsed);
        checkUploadStatus(parsed.cnic);
    }, [navigate, checkUploadStatus]);

    const handleLogout = () => {
        localStorage.removeItem('cas_student_user');
        navigate('/student-login');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            notify('Invalid file type. Please upload a PDF only.', 'error');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result as string;
                const res = await fetch('/api/upload-thesis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: student.id,
                        cnic: student.cnic,
                        fileData: base64Data
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setIsUploaded(true);
                    notify('Thesis successfully submitted & archived.', 'success');
                } else {
                    notify(`Upload Error: ${data.message}`, 'error');
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Upload error", error);
            notify('Failed to connect to upload server.', 'error');
            setUploading(false);
        }
    };

    if (loading || !student) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-1.5 shadow-sm">
                            <img src={settings.institution.logo} className="w-full h-full object-contain" alt="Univ Logo" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Scholar Portal</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Research & Thesis Submission Hive</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 hover:text-rose-600 transition-all shadow-sm active:scale-95 group"
                    >
                        <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        <span>Secure Logout</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Profile */}
                    <div className="lg:col-span-12">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-600 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20"
                        >
                            {/* Abstract Elements */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/10 rounded-full border border-white/10">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Authentication Verified</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black tracking-tight leading-tight uppercase">{student.name}</h2>
                                        <p className="text-indigo-200 text-lg font-medium opacity-80">{student.programme}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-white/10">
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Registration Number</p>
                                            <p className="text-lg font-black tracking-tight">{student.regNo || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">CNIC Identity</p>
                                            <p className="text-lg font-black tracking-tight">{student.cnic}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Submission Stage</p>
                                            <p className="text-lg font-black tracking-tight uppercase">{student.gs4Form || 'Final Thesis'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden lg:block">
                                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm">
                                        <GraduationCap size={64} className="text-white/20" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Panel: Upload Section */}
                    <div className="lg:col-span-7">
                        <motion.div 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.1 }}
                             className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-12 shadow-sm h-full flex flex-col"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isUploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {isUploaded ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Thesis Submission</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Official Repository Upload</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                                {isUploaded ? (
                                    <div className="space-y-6">
                                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                                            <FileCheck size={40} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Your thesis has already been submitted.</h4>
                                            <p className="text-slate-500 text-sm font-medium max-w-sm">The digital record has been archived and finalized. No further changes can be made at this stage.</p>
                                        </div>
                                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                                            Status: Securely Archived
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full space-y-8">
                                        <div className="relative group">
                                            <input 
                                                type="file" 
                                                accept=".pdf"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                                            />
                                            <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 lg:p-20 flex flex-col items-center justify-center gap-6 group-hover:border-indigo-400 group-hover:bg-indigo-50/10 transition-all">
                                                {uploading ? (
                                                    <div className="space-y-6 flex flex-col items-center">
                                                        <Loader2 size={48} className="text-indigo-600 animate-spin" />
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">Encrypting & Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                                            <FileText size={32} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-lg font-black text-slate-900 leading-tight">Select your thesis PDF</p>
                                                            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Max Size: 20MB · PDF ONLY</p>
                                                        </div>
                                                        <button className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 group-hover:bg-indigo-600 transition-all active:scale-95">
                                                            Choose Document
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-left">
                                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide leading-none">Security Warning</p>
                                                <p className="text-[9px] text-amber-700 font-medium mt-1">This is a one-time final submission. Once uploaded, you cannot modify or re-upload your document.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Extra Card: System Status / Steps */}
                    <div className="lg:col-span-5 space-y-8">
                         <motion.div 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.2 }}
                             className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col"
                         >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Submission Guidelines</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Integrity Protocols</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 flex-1">
                                {[
                                    { label: '01', title: 'File Format', desc: 'Only high-quality digital PDF files are accepted. Scan quality must be legible.' },
                                    { label: '02', title: 'Naming Convention', desc: 'The system will automatically rename your file to [CNIC].pdf for identity matching.' },
                                    { label: '03', title: 'Finalization', desc: 'Upon successful upload, your status in the central registry will update to "Uploaded".' },
                                    { label: '04', title: 'Verification', desc: 'The Directorate of Advanced Studies will verify the document signature.' }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                        <span className="text-xs font-black text-indigo-600 tabular-nums shrink-0">{step.label}</span>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{step.title}</p>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </motion.div>

                         <motion.div 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.3 }}
                             className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden"
                         >
                            <div className="relative z-10 flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <GraduationCap size={24} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">PostGrad Support</h4>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Contact Directorate</p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col gap-2">
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">For technical assistance or record corrections, please contact:</p>
                                <p className="text-xs font-black tracking-tight">{settings.institution.email}</p>
                            </div>
                         </motion.div>
                    </div>
                </div>

                <footer className="pt-8 border-t border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Digital Terminal · CUVAS - Directorate of Advanced Studies
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default StudentPortal;
