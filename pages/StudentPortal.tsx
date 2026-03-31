import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle2, AlertCircle, LogOut,
  Loader2, GraduationCap, Shield, RefreshCcw, X,
  BookOpen, Phone, Mail, IdCard, BookMarked, FileCheck2,
  CloudUpload, FileBadge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_SIZE_MB = 20;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

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
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">File Selected</p>
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
  const [isUploaded, setIsUploaded] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── Check upload status from Supabase Storage ───────────────────────────
  const checkUploadStatus = useCallback(async (cnic: string) => {
    setLoading(true);
    try {
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const res = await fetch(`/api/student/check-upload/${normalizedCnic}`);
      const data = await res.json();
      if (data.success) {
        setIsUploaded(data.exists);
        setPublicUrl(data.publicUrl || null);
      }
    } catch {
      // silently fail — treat as not uploaded
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cas_student_user');
    if (!saved) { navigate('/student-login'); return; }
    const parsed = JSON.parse(saved);
    setStudent(parsed);
    checkUploadStatus(parsed.cnic);
  }, [navigate, checkUploadStatus, retryCount]);

  const handleLogout = () => {
    localStorage.removeItem('cas_student_user');
    navigate('/student-login');
  };

  // ── Validate & select file ───────────────────────────────────────────────
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
    setShowConfirm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    // Reset input value so same file can be re-selected after cancel
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  // ── Upload to Supabase Storage via API ───────────────────────────────────
  const executeUpload = async () => {
    if (!selectedFile || !student) return;
    setShowConfirm(false);
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    // Simulate progress during base64 read & upload
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(timer); return prev; }
        return prev + Math.random() * 8 + 2;
      });
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

          if (data.alreadyUploaded) {
            setUploadProgress(100);
            setIsUploaded(true);
            setError(null);
          } else if (data.success) {
            setUploadProgress(100);
            setIsUploaded(true);
            setUploadSuccess(true);
            setPublicUrl(data.publicUrl || null);
          } else {
            throw new Error(data.message || 'Upload failed. Please try again.');
          }
        } catch (err: any) {
          clearInterval(timer);
          setError(err.message || 'Upload failed. Please try again.');
        } finally {
          setUploading(false);
          setSelectedFile(null);
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

  // ── Loading gate ─────────────────────────────────────────────────────────
  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying credentials...</p>
      </div>
    );
  }

  const normalizedCnic = (student.cnic || '').replace(/[-\s]/g, '').trim();

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans">
      <AnimatePresence>
        {showConfirm && selectedFile && (
          <ConfirmDialog
            fileName={selectedFile.name}
            onConfirm={executeUpload}
            onCancel={() => { setShowConfirm(false); setSelectedFile(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
              <img src={settings.institution.logo} className="w-full h-full object-contain" alt="Logo" />
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

          {/* LEFT: Profile + Guidelines ──────────────────────────────── */}
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

            {/* Submission Guidelines */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900 rounded-3xl p-8 text-white shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <Shield size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Submission Rules</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Integrity Protocols</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { n: '01', title: 'Format', desc: 'PDF only. High-resolution, machine-readable text.' },
                  { n: '02', title: 'Size Limit', desc: `Maximum ${MAX_SIZE_MB}MB. Compress if necessary.` },
                  { n: '03', title: 'Auto-Naming', desc: 'File will be saved as [CNIC].pdf automatically.' },
                  { n: '04', title: 'One-Time Only', desc: 'Submission is final. Re-upload is not permitted.' },
                  { n: '05', title: 'Storage', desc: 'Securely stored in Supabase cloud (thesis-files bucket).' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-4">
                    <span className="text-[10px] font-black text-indigo-400 shrink-0 mt-1">{n}</span>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{title}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-white/10">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Need Help?</p>
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-indigo-400 shrink-0" />
                  <p className="text-xs font-bold text-indigo-400 truncate">{settings.institution.email}</p>
                </div>
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
                    isUploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {isUploaded ? <CheckCircle2 size={24} /> : <CloudUpload size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thesis Submission</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-0.5">Official Cloud Repository</p>
                  </div>
                </div>
                {isUploaded && (
                  <span className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={12} /> Submitted
                  </span>
                )}
              </div>

              {/* ── Content Area ─────────────────────────────────────── */}
              <div className="flex-1 flex flex-col">
                <AnimatePresence mode="wait">

                  {/* Already Uploaded State */}
                  {isUploaded && (
                    <motion.div
                      key="submitted"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-12"
                    >
                      <div className="relative">
                        <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center ring-8 ring-emerald-50/60">
                          <FileCheck2 size={56} className="text-emerald-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="space-y-3 max-w-md">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em]">Submission Complete</p>
                        <h4 className="text-2xl font-black text-slate-900 leading-tight">
                          {uploadSuccess ? 'Your thesis has been submitted successfully.' : 'Your thesis has already been submitted.'}
                        </h4>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                          The file has been securely archived in the Supabase cloud storage under your CNIC. The Directorate will be notified for verification.
                        </p>
                      </div>

                      {publicUrl && (
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-8 py-3.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                        >
                          <FileText size={14} />
                          View Submitted Thesis
                        </a>
                      )}

                      <div className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <FileBadge size={16} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Archive Path</p>
                            <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">thesis-files/{normalizedCnic}.pdf</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Uploading State */}
                  {!isUploaded && uploading && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center gap-8 py-12"
                    >
                      <div className="relative">
                        <div className="w-28 h-28 bg-indigo-50 rounded-full flex items-center justify-center">
                          <Loader2 size={48} className="text-indigo-600 animate-spin" />
                        </div>
                      </div>
                      <div className="w-full max-w-sm space-y-4 text-center">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">
                          Uploading to cloud storage...
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Upload Progress</span>
                            <span>{Math.min(Math.round(uploadProgress), 100)}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-indigo-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                              transition={{ ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Please wait — do not close this window.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Upload Form State */}
                  {!isUploaded && !uploading && (
                    <motion.div
                      key="upload-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col gap-6"
                    >
                      {/* Error Banner */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl"
                          >
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold">{error}</p>
                            </div>
                            <button
                              onClick={() => { setError(null); setRetryCount(c => c + 1); }}
                              className="flex items-center gap-1.5 shrink-0 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors"
                            >
                              <RefreshCcw size={12} /> Retry
                            </button>
                            <button onClick={() => setError(null)} className="shrink-0 text-rose-400 hover:text-rose-600">
                              <X size={16} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Dropzone */}
                      <div
                        className={`relative flex-1 border-2 border-dashed rounded-3xl transition-all cursor-pointer group ${
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center">
                          <motion.div
                            animate={{ y: isDragging ? -6 : 0 }}
                            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors ${
                              isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 shadow-sm'
                            }`}
                          >
                            <Upload size={36} />
                          </motion.div>
                          <div className="space-y-2">
                            <p className="text-xl font-black text-slate-900">
                              {isDragging ? 'Release to Upload' : 'Drag & Drop your Thesis PDF'}
                            </p>
                            <p className="text-slate-400 text-sm font-medium">or click anywhere to browse</p>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] mt-3">PDF only · max {MAX_SIZE_MB}MB</p>
                          </div>
                          <button
                            type="button"
                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                          >
                            Choose Document
                          </button>
                        </div>
                      </div>

                      {/* Warning Banner */}
                      <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Final Submission Warning</p>
                          <p className="text-[10px] text-amber-700 font-medium mt-1 leading-relaxed">
                            This is a <span className="font-black">one-time, irreversible submission.</span> Once uploaded, you cannot modify or replace your document. Ensure your thesis is finalized before proceeding.
                          </p>
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
          © {new Date().getFullYear()} Directorate of Advanced Studies · {settings.institution.name} · PDMS-PRO v4.0
        </p>
      </footer>
    </div>
  );
};

export default StudentPortal;
