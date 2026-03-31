import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle2, AlertCircle, LogOut,
  Loader2, GraduationCap, Shield, RefreshCcw, X,
  BookOpen, Phone, Mail, IdCard, BookMarked, FileCheck2,
  CloudUpload, FileBadge, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_SIZE_MB = 20;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadStep = 'select' | 'staged' | 'completed';

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  fileName: string;
}> = ({ onConfirm, onCancel, fileName }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      onClick={onCancel}
    />
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 10 }}
      className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
    >
      <div className="h-1.5 bg-amber-500" />
      <div className="p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-amber-600" />
          </div>
          <div className="space-y-1.5 pt-1">
            <h3 className="text-lg font-black text-slate-900 leading-tight">Final Submission Confirmation</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Are you sure you want to submit your thesis? <span className="text-rose-600 font-bold">This action cannot be undone.</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">File to Submit</p>
              <p className="text-sm font-bold text-slate-900 truncate">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Yes, Submit Thesis
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Profile Info Row ─────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: any; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0">
    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate">{value || '—'}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentPortal: React.FC = () => {
  const { settings } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<any>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Initialize & Pre-check ───────────────────────────
  const checkUploadStatus = useCallback(async (st: any) => {
    setLoading(true);
    try {
      if (st.isUploaded || st.filePath) {
        setStep('completed');
        return;
      }
      
      const cnicBytes = st.cnic.replace(/[-\s]/g, '').trim();
      const res = await fetch(`/api/student/check-upload/${cnicBytes}`);
      const data = await res.json();
      if (data.finalized) {
        // Final submission recorded in DB
        setStep('completed');
        setPublicUrl(data.publicUrl || null);
      } else if (data.exists) {
        // Uploaded to storage but not yet finalized — show staged state
        setUploadedFilePath(`thesis-files/${cnicBytes}.pdf`);
        setPublicUrl(data.publicUrl);
        setStep('staged');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cas_student_user');
    if (!saved) { navigate('/student-login'); return; }
    const parsed = JSON.parse(saved);
    setStudent(parsed);
    checkUploadStatus(parsed);
  }, [navigate, checkUploadStatus]);

  const handleLogout = () => {
    localStorage.removeItem('cas_student_user');
    navigate('/student-login');
  };

  // ── Phase 1: File Selection ─────────────────────────────
  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed. Please select a valid PDF document.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please compress and try again.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  // ── Phase 2: Upload File (Storage only) ─────────────────────────
  const triggerUpload = async () => {
    if (!selectedFile || !student) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const timer = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 15 + 5));
    }, 200);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/student/upload-thesis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cnic: student.cnic,
              fileData: base64Data,
            })
          });

          clearInterval(timer);
          const data = await res.json();

          if (data.success || data.alreadyUploaded) {
            setUploadProgress(100);
            setUploadedFilePath(data.filePath || `thesis-files/${student.cnic.replace(/[-\s]/g, '')}.pdf`);
            setPublicUrl(data.publicUrl || null);
            setStep('staged'); // UI Step 2
            setError(null);
          } else {
            throw new Error(data.message || 'Upload failed. Please try again.');
          }
        } catch (err: any) {
          clearInterval(timer);
          setError(err.message || 'Upload failed. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        clearInterval(timer);
        setError('Failed to read file. Please try again.');
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      clearInterval(timer);
      setError('Network error. Please check your connection and retry.');
      setUploading(false);
    }
  };

  // ── Phase 3: Final Submit (DB Update) ───────────────────────────
  const handleFinalSubmit = async () => {
    setShowConfirm(false);
    setFinalizing(true);
    setError(null);

    try {
      const res = await fetch('/api/student/finalize-thesis-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          cnic: student.cnic,
          filePath: uploadedFilePath
        })
      });

      const data = await res.json();
      if (data.success) {
        const updatedStudent = { ...student, isUploaded: true, filePath: uploadedFilePath };
        setStudent(updatedStudent);
        localStorage.setItem('cas_student_user', JSON.stringify(updatedStudent));
        setStep('completed');
      } else if (data.needsMigration) {
        // Table doesn't exist yet — show the SQL to the admin
        setError(
          `⚠️ One-time setup required in Supabase SQL Editor:\n\n${data.sql}\n\nRun this SQL once, then try again.`
        );
      } else {
        throw new Error(data.message || 'Permission error, contact admin');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // ── Page Loading ─────────────────────────────────────────────────────────
  if (loading || !student) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <AnimatePresence>
        {showConfirm && (
          <ConfirmDialog
            fileName={selectedFile?.name || `${student.cnic.replace(/[-\s]/g, '')}.pdf`}
            onConfirm={handleFinalSubmit}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
              <img src={settings?.institution?.logo} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">Scholar Portal</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em]">Thesis Submission Gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Session Active</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95 group"
            >
              <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:block">Secure Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 space-y-8">

        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-indigo-600 rounded-3xl p-8 lg:p-12 text-white shadow-xl shadow-indigo-600/20"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Identity Verified</span>
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-none uppercase">{student.name}</h2>
                <p className="text-indigo-200 text-lg font-medium mt-2 opacity-80">{student.programme}</p>
              </div>
              <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                {[
                  { label: 'Registration', value: student.regNo || '—' },
                  { label: 'Department', value: student.department || '—' },
                  { label: 'Thesis Stage', value: student.gs4Form || 'Final Thesis' },
                  { label: 'Session', value: student.session || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.25em] mb-1">{label}</p>
                    <p className="text-base font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex w-36 h-36 bg-white/10 rounded-full items-center justify-center border border-white/10 backdrop-blur-sm shrink-0">
              <GraduationCap size={72} className="text-white/20" />
            </div>
          </div>
        </motion.div>

        {/* ── Two-Column Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* LEFT: Profile ──────────────────────────────── */}
          <div className="xl:col-span-4 space-y-8">

            {/* Student Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Student Profile</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academic Identity</p>
                </div>
              </div>
              <div>
                <InfoRow icon={IdCard}    label="CNIC Number"       value={student.cnic} />
                <InfoRow icon={BookOpen}  label="Degree Program"    value={student.degree || '—'} />
                <InfoRow icon={BookMarked} label="Full Programme"   value={student.programme} />
                <InfoRow icon={FileBadge} label="Semester"          value={`Semester ${student.currentSemester}`} />
                <InfoRow icon={GraduationCap} label="Supervisor"    value={student.supervisorName || '—'} />
                <InfoRow icon={Phone}     label="Contact"           value={student.contactNumber || '—'} />
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Thesis Upload Card ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-8"
          >
            <div className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-sm h-full flex flex-col">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    step === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {step === 'completed' ? <CheckCircle2 size={24} /> : <CloudUpload size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thesis Submission</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-0.5">Official Cloud Repository</p>
                  </div>
                </div>
                {step === 'completed' && (
                  <span className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={12} /> Submitted
                  </span>
                )}
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="shrink-0 text-rose-400 hover:text-rose-600">
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Content Area based on Step ── */}
              <div className="flex-1 flex flex-col">
                <AnimatePresence mode="wait">

                  {/* STEP 1: SELECT FILE */}
                  {step === 'select' && !uploading && !finalizing && (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col gap-6"
                    >
                      {/* Dropzone */}
                      <div
                        className={`relative flex-1 min-h-[250px] border-2 border-dashed rounded-3xl transition-all cursor-pointer group ${
                          isDragging
                            ? 'border-indigo-500 bg-indigo-50/40 scale-[1.01]'
                            : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
                        }`}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
                          <motion.div
                            animate={{ y: isDragging ? -6 : 0 }}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                              isDragging || selectedFile ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 shadow-sm'
                            }`}
                          >
                            {selectedFile ? <FileText size={28} /> : <Upload size={28} />}
                          </motion.div>
                          
                          <div className="space-y-2">
                            <p className="text-lg font-black text-slate-900">
                              {selectedFile ? selectedFile.name : (isDragging ? 'Release to Upload' : 'Select PDF File')}
                            </p>
                            {!selectedFile && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Max {MAX_SIZE_MB}MB Limit</p>}
                          </div>
                          
                          {!selectedFile ? (
                            <div className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/10 group-hover:bg-indigo-600 transition-all pointer-events-none">
                              Browse Document
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); triggerUpload(); }}
                              className="px-8 py-3.5 flex items-center gap-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                              Upload File <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* UPLOADING STATE (Visual Only) */}
                  {uploading && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center gap-8 py-12"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                          <Loader2 size={40} className="text-indigo-600 animate-spin" />
                        </div>
                      </div>
                      <div className="w-full max-w-xs space-y-4 text-center">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest animate-pulse">
                          Uploading to Cloud...
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Progress</span>
                            <span>{Math.min(Math.round(uploadProgress), 100)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-indigo-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: STAGED FOR FINAL SUBMIT */}
                  {step === 'staged' && !finalizing && (
                    <motion.div
                      key="staged"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center gap-6 py-6"
                    >
                       <div className="w-full p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center space-y-4">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500">
                             <CheckCircle2 size={32} />
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900">File uploaded successfully</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Your file is in the cloud staging area.</p>
                          </div>
                       </div>

                       <div className="w-full p-6 border border-slate-200 rounded-3xl bg-slate-50 text-center space-y-5 flex flex-col items-center">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2 of 2</p>
                            <p className="text-sm font-bold text-slate-700">You must authorize the final submission to lock your thesis.</p>
                          </div>

                          <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full max-w-sm px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                          >
                            Final Submit Thesis
                          </button>
                       </div>
                    </motion.div>
                  )}

                  {/* FINALIZING STATE (Visual Only) */}
                  {finalizing && (
                    <motion.div
                      key="finalizing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center gap-8 py-12"
                    >
                      <Loader2 size={48} className="text-indigo-600 animate-spin" />
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest animate-pulse">
                        Finalizing Record...
                      </p>
                    </motion.div>
                  )}

                  {/* STEP 3: COMPLETED */}
                  {step === 'completed' && (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8"
                    >
                      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center ring-8 ring-emerald-50/60">
                        <FileCheck2 size={40} />
                      </div>
                      
                      <div className="space-y-2">
                         <h4 className="text-2xl font-black text-slate-900 leading-tight">Your thesis has already been submitted.</h4>
                         <p className="text-slate-500 text-sm font-medium">Your thesis has been submitted successfully and the record is locked.</p>
                      </div>

                      <div className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left mt-2">
                        <div className="flex items-center gap-3">
                          <FileBadge size={16} className="text-slate-400" />
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database Record</p>
                            <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">{student.filePath || `thesis-files/${student.cnic.replace(/[-\s]/g, '')}.pdf`}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 border-t border-slate-200 mt-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
          © {new Date().getFullYear()} Directorate of Advanced Studies · {settings?.institution?.name} · PDMS-PRO v4.0
        </p>
      </footer>
    </div>
  );
};

export default StudentPortal;
