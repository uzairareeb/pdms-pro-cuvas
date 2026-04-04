import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle2, AlertCircle, LogOut,
  Loader2, GraduationCap, Shield, X, BookOpen, Phone,
  IdCard, BookMarked, FileCheck2, CloudUpload, FileBadge,
  ArrowRight, User, LayoutDashboard, ClipboardList,
  Download, Mail, Building2, Target, ChevronRight,
  Calendar, Award, Layers, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudentProfilePDF } from '../utils/pdfExport';

const MAX_SIZE_MB = 20;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
type UploadStep = 'select' | 'staged' | 'completed';
type PortalTab = 'overview' | 'profile' | 'thesis';

// ─── Confirm Dialog ────────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{ onConfirm: () => void; onCancel: () => void; fileName: string }> = ({ onConfirm, onCancel, fileName }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCancel} />
    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="h-1.5 bg-amber-500" />
      <div className="p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-amber-600" />
          </div>
          <div className="space-y-1.5 pt-1">
            <h3 className="text-lg font-black text-slate-900 leading-tight">Final Submission Confirmation</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Are you sure? <span className="text-rose-600 font-bold">This action cannot be undone.</span>
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
          <button onClick={onCancel}
            className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all active:scale-95">
            Yes, Submit Thesis
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Section Header (matches admin dashboard style) ────────────────────────
const SectionHeader: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="p-2 bg-slate-100 rounded-xl mt-0.5">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">{subtitle}</p>
    </div>
  </div>
);

// ─── Info Block ────────────────────────────────────────────────────────────
const InfoBlock: React.FC<{ label: string; value: any; full?: boolean }> = ({ label, value, full }) => (
  <div className={`space-y-1.5 group ${full ? 'col-span-2' : ''}`}>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] group-hover:text-indigo-400 transition-colors">{label}</p>
    <p className="text-sm font-bold text-slate-900 tracking-tight">{value || '—'}</p>
  </div>
);

// ─── Milestone Badge ───────────────────────────────────────────────────────
const MilestoneBadge: React.FC<{ label: string; status: string }> = ({ label, status }) => {
  const isGood = ['Approved', 'Submitted', 'Completed', 'Yes'].includes(status);
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">{label}</span>
      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
        isGood ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
      }`}>{status}</span>
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: any; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 shadow-md text-white`} style={{ background: color }}>
    <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none">
      <Icon size={70} className="text-white" />
    </div>
    <div className="p-2 bg-white/20 rounded-xl w-fit mb-3">
      <Icon size={18} className="text-white" />
    </div>
    <p className="text-[10px] font-black text-white/75 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-white leading-tight">{value}</p>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const StudentPortal: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
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
  const [isDownloading, setIsDownloading] = useState(false);

  const checkUploadStatus = useCallback(async (st: any) => {
    setLoading(true);
    try {
      if (st.isUploaded || st.filePath) { setStep('completed'); return; }
      const cnicBytes = st.cnic.replace(/[-\s]/g, '').trim();
      const res = await fetch(`/api/student/check-upload/${cnicBytes}`);
      const data = await res.json();
      if (data.finalized) {
        setStep('completed');
        setPublicUrl(data.publicUrl || null);
      } else if (data.exists) {
        setUploadedFilePath(`thesis-files/${cnicBytes}.pdf`);
        setPublicUrl(data.publicUrl);
        setStep('staged');
      }
    } catch { /* ignore */ } finally { setLoading(false); }
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

  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') { setError('Only PDF files are allowed.'); return; }
    if (file.size > MAX_BYTES) { setError(`File exceeds ${MAX_SIZE_MB}MB limit.`); return; }
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  const triggerUpload = async () => {
    if (!selectedFile || !student) return;
    setUploading(true); setError(null); setUploadProgress(0);
    const timer = setInterval(() => { setUploadProgress(p => p >= 90 ? p : p + Math.random() * 12 + 4); }, 200);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/student/upload-thesis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cnic: student.cnic, fileData: base64Data })
          });
          clearInterval(timer);
          const data = await res.json();
          if (data.success || data.alreadyUploaded) {
            setUploadProgress(100);
            setUploadedFilePath(data.filePath || `thesis-files/${student.cnic.replace(/[-\s]/g, '')}.pdf`);
            setPublicUrl(data.publicUrl || null);
            setStep('staged'); setError(null);
          } else throw new Error(data.message || 'Upload failed.');
        } catch (err: any) { clearInterval(timer); setError(err.message); }
        finally { setUploading(false); }
      };
      reader.onerror = () => { clearInterval(timer); setError('Failed to read file.'); setUploading(false); };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) { clearInterval(timer); setError('Network error. Please retry.'); setUploading(false); }
  };

  const handleFinalSubmit = async () => {
    setShowConfirm(false); setFinalizing(true); setError(null);
    try {
      const res = await fetch('/api/student/finalize-thesis-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, cnic: student.cnic, filePath: uploadedFilePath })
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...student, isUploaded: true, filePath: uploadedFilePath };
        setStudent(updated);
        localStorage.setItem('cas_student_user', JSON.stringify(updated));
        setStep('completed');
      } else throw new Error(data.message || 'Permission error, contact admin');
    } catch (err: any) { setError(err.message); }
    finally { setFinalizing(false); }
  };

  const handleDownloadPDF = async () => {
    if (!student) return;
    setIsDownloading(true);
    // Build a Student-compatible object from portal data
    const studentObj = {
      id: student.id || '', srNo: student.srNo || '',
      cnic: student.cnic, name: student.name,
      fatherName: student.fatherName || '',
      regNo: student.regNo || '', gender: student.gender || '',
      contactNumber: student.contactNumber || '',
      degree: student.degree || '', session: student.session || '',
      department: student.department || '', programme: student.programme || '',
      currentSemester: student.currentSemester || 1,
      status: student.status || 'Active',
      supervisorName: student.supervisorName || '',
      coSupervisor: student.coSupervisor || '',
      member1: student.member1 || '', member2: student.member2 || '',
      thesisId: student.thesisId || '',
      synopsis: student.synopsis || 'Not Submitted',
      synopsisSubmissionDate: student.synopsisSubmissionDate || '',
      gs2CourseWork: student.gs2CourseWork || 'Not Completed',
      gs4Form: student.gs4Form || 'Not Submitted',
      semiFinalThesisStatus: student.semiFinalThesisStatus || 'Not Submitted',
      semiFinalThesisSubmissionDate: student.semiFinalThesisSubmissionDate || '',
      finalThesisStatus: student.finalThesisStatus || 'Not Submitted',
      finalThesisSubmissionDate: student.finalThesisSubmissionDate || '',
      thesisSentToCOE: student.thesisSentToCOE || 'No',
      coeSubmissionDate: student.coeSubmissionDate || '',
      validationStatus: student.validationStatus || 'Pending',
      validationDate: student.validationDate || '',
      comments: student.comments || '',
      isArchived: false, isLocked: false,
      filePath: student.filePath || '',
    } as any;
    await generateStudentProfilePDF(studentObj);
    setIsDownloading(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || !student) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying credentials...</p>
      </div>
    );
  }

  const tabs: { id: PortalTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'thesis', label: 'Thesis Submission', icon: CloudUpload },
  ];

  const milestoneStatus = [
    { label: 'GS-2 Coursework', status: student.gs2CourseWork || 'Not Completed' },
    { label: 'Synopsis', status: student.synopsis || 'Not Submitted' },
    { label: 'GS-4 Form', status: student.gs4Form || 'Not Submitted' },
    { label: 'Semi-Final Thesis', status: student.semiFinalThesisStatus || 'Not Submitted' },
    { label: 'Final Thesis', status: student.finalThesisStatus || 'Not Submitted' },
    { label: 'Sent to COE', status: student.thesisSentToCOE === 'Yes' ? 'Yes' : 'No' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <AnimatePresence>
        {showConfirm && (
          <ConfirmDialog
            fileName={selectedFile?.name || `${student.cnic?.replace(/[-\s]/g, '')}.pdf`}
            onConfirm={handleFinalSubmit}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="w-full px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
              <img src="/cuvaslogo.png" className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">Scholar Portal</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em]">Postgraduate Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Session Active</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full">
              <User size={12} className="text-indigo-600" />
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest truncate max-w-[120px]">{student.name}</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95 group">
              <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="w-full px-6 lg:px-10 py-8 space-y-7">

        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 lg:p-10 text-white shadow-xl shadow-indigo-600/20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Identity Verified</span>
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-none uppercase">{student.name}</h2>
                <p className="text-indigo-200 text-base font-semibold mt-2 opacity-90">{student.programme}</p>
              </div>
              <div className="flex flex-wrap gap-6 pt-3 border-t border-white/10">
                {[
                  { label: 'Reg. No', value: student.regNo || '—' },
                  { label: 'Department', value: student.department || '—' },
                  { label: 'Session', value: student.session || '—' },
                  { label: 'Semester', value: student.currentSemester ? `Semester ${student.currentSemester}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.25em] mb-1">{label}</p>
                    <p className="text-sm font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex shrink-0 gap-4">
              <button onClick={handleDownloadPDF} disabled={isDownloading}
                className="flex items-center gap-2.5 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50">
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {isDownloading ? 'Generating...' : 'Download Profile PDF'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Navigation ──────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm flex gap-1.5 flex-wrap">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}>
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.id === 'thesis' && step === 'completed' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ═══ OVERVIEW TAB ═══════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6">

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={GraduationCap} label="Degree" value={student.degree || '—'} color="linear-gradient(135deg,#4338ca 0%,#6d28d9 100%)" />
                <StatCard icon={Layers} label="Semester" value={`Sem ${student.currentSemester || 1}`} color="linear-gradient(135deg,#0369a1 0%,#0284c7 100%)" />
                <StatCard icon={Target} label="Status" value={student.status || 'Active'} color="linear-gradient(135deg,#059669 0%,#16a34a 100%)" />
                <StatCard icon={Award} label="Thesis Stage" value={student.gs4Form || 'Pending'} color="linear-gradient(135deg,#dc2626 0%,#e11d48 100%)" />
              </div>

              {/* Two columns */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Quick Info */}
                <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <SectionHeader icon={User} title="Quick Info" subtitle="Academic identity summary" />
                  <div className="space-y-0">
                    {[
                      { icon: IdCard, label: 'CNIC', value: student.cnic },
                      { icon: BookOpen, label: 'Programme', value: student.programme },
                      { icon: Building2, label: 'Department', value: student.department },
                      { icon: User, label: 'Supervisor', value: student.supervisorName || '—' },
                      { icon: Phone, label: 'Contact', value: student.contactNumber || '—' },
                      { icon: Calendar, label: 'Session', value: student.session || '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                          <Icon size={15} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones + Quick Actions */}
                <div className="xl:col-span-7 space-y-6">

                  {/* Milestone Tracker */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <SectionHeader icon={ClipboardList} title="Milestone Tracker" subtitle="Academic progress overview" />
                    <div>
                      {milestoneStatus.map(m => <MilestoneBadge key={m.label} label={m.label} status={m.status} />)}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <SectionHeader icon={Target} title="Quick Actions" subtitle="Jump to key sections" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'View Full Profile', tab: 'profile' as PortalTab, icon: User },
                        { label: 'Submit Thesis', tab: 'thesis' as PortalTab, icon: CloudUpload },
                        { label: 'Download PDF', tab: null, icon: Download, action: handleDownloadPDF },
                      ].map(item => (
                        <button key={item.label}
                          onClick={() => item.action ? item.action() : setActiveTab(item.tab!)}
                          disabled={item.label === 'Download PDF' && isDownloading}
                          className="flex items-center gap-3 p-4 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-sm active:scale-95 group disabled:opacity-50">
                          <item.icon size={15} className="text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                          <ChevronRight size={12} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ PROFILE TAB ════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6">

              {/* Profile Completion */}
              {(() => {
                const fields = [student.name, student.cnic, student.contactNumber, student.regNo, student.programme, student.department, student.session, student.supervisorName];
                const filled = fields.filter(f => f && f !== '—' && f !== '').length;
                const pct = Math.round((filled / fields.length) * 100);
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                          Profile Completion: <span className="text-indigo-600">{pct}%</span>
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {pct === 100 ? 'All fields complete' : `${fields.length - filled} fields pending`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-1 max-w-sm">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
                        </div>
                        <button onClick={handleDownloadPDF} disabled={isDownloading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shrink-0">
                          {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          {isDownloading ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Profile Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Sidebar Card */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600" />
                    <div className="w-28 h-28 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 mt-2 shadow-sm">
                      <User size={48} className="text-slate-200" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">{student.name}</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                      {student.regNo || 'No Reg. No.'}
                    </p>
                    <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest">{student.status || 'Active'}</span>
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Degree</span>
                        <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest">{student.degree || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dark milestone card */}
                  <div className="bg-[#0a0c10] rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-white opacity-5 rotate-12">
                      <CheckCircle2 size={100} />
                    </div>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-5 border-b border-white/5 pb-3">Research Milestones</h3>
                    <div className="space-y-4 relative z-10">
                      {[
                        { label: 'Synopsis', status: student.synopsis || 'Not Submitted' },
                        { label: 'GS-4 Form', status: student.gs4Form || 'Not Submitted' },
                        { label: 'COE Dispatch', status: student.thesisSentToCOE === 'Yes' ? 'Submitted' : 'Pending' },
                      ].map(ms => {
                        const done = ['Approved', 'Submitted', 'Completed'].includes(ms.status);
                        return (
                          <div key={ms.label} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">{ms.label}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${done ? 'text-indigo-400' : 'text-slate-600'}`}>{ms.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Tabbed Detail */}
                <div className="lg:col-span-8 space-y-5">

                  {/* Section: Personal & Academic */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-5 mb-6">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><User size={20} /></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Personal & Academic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                      <InfoBlock label="CNIC Number" value={student.cnic} />
                      <InfoBlock label="Full Name" value={student.name} />
                      <InfoBlock label="Father's Name" value={student.fatherName} />
                      <InfoBlock label="Registration Number" value={student.regNo} />
                      <InfoBlock label="Gender" value={student.gender} />
                      <InfoBlock label="Contact Number" value={student.contactNumber} />
                      <InfoBlock label="Degree Level" value={student.degree} />
                      <InfoBlock label="Academic Session" value={student.session} />
                      <InfoBlock label="Department" value={student.department} />
                      <InfoBlock label="Programme" value={student.programme} />
                      <InfoBlock label="Current Semester" value={student.currentSemester ? `Semester ${student.currentSemester}` : '—'} />
                      <InfoBlock label="Academic Status" value={student.status} />
                    </div>
                  </div>

                  {/* Section: Supervision */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-5 mb-6">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><BookOpen size={20} /></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Supervisory Committee</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                      <InfoBlock label="Lead Supervisor" value={student.supervisorName} />
                      <InfoBlock label="Co-Supervisor" value={student.coSupervisor || 'Not Assigned'} />
                      <InfoBlock label="Committee Member 1" value={student.member1 || '—'} />
                      <InfoBlock label="Committee Member 2" value={student.member2 || '—'} />
                      <InfoBlock label="Thesis / Research ID" value={student.thesisId} />
                      <InfoBlock label="GS-2 Coursework" value={student.gs2CourseWork || '—'} />
                    </div>
                  </div>

                  {/* Section: Thesis & Validation */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-5 mb-6">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><ClipboardList size={20} /></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Dissertation & Validation</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                      <InfoBlock label="Synopsis Status" value={student.synopsis} />
                      <InfoBlock label="Synopsis Date" value={student.synopsisSubmissionDate || 'N/A'} />
                      <InfoBlock label="GS-4 Form" value={student.gs4Form} />
                      <InfoBlock label="Final Thesis Status" value={student.finalThesisStatus} />
                      <InfoBlock label="Final Submission Date" value={student.finalThesisSubmissionDate || 'N/A'} />
                      <InfoBlock label="COE Dispatch" value={student.thesisSentToCOE} />
                      <InfoBlock label="Validation Status" value={student.validationStatus} />
                      <InfoBlock label="Validation Date" value={student.validationDate || 'N/A'} />
                      {student.comments && <InfoBlock label="Directorate Comments" value={student.comments} full />}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ THESIS SUBMISSION TAB ══════════════════════════════════════ */}
          {activeTab === 'thesis' && (
            <motion.div key="thesis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6">

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Left: Info */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <SectionHeader icon={Shield} title="Submission Guide" subtitle="Two-step secure process" />
                    <div className="space-y-4">
                      {[
                        { step: '01', title: 'Upload PDF', desc: 'Select and upload your final thesis PDF (max 20MB) to the cloud staging area.' },
                        { step: '02', title: 'Final Submit', desc: 'Authorize the final submission to lock your thesis record permanently.' },
                      ].map(s => (
                        <div key={s.step} className="flex gap-4">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">{s.step}</div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{s.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <SectionHeader icon={FileBadge} title="Submission Status" subtitle="Current record state" />
                    <div className="space-y-0">
                      {[
                        { label: 'Student', value: student.name },
                        { label: 'Reg. No', value: student.regNo || '—' },
                        { label: 'CNIC', value: student.cnic },
                        { label: 'Thesis Stage', value: step === 'completed' ? 'Finalized ✓' : step === 'staged' ? 'In Staging' : 'Not Submitted' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Upload Card */}
                <div className="xl:col-span-8">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm min-h-[500px] flex flex-col">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {step === 'completed' ? <CheckCircle2 size={24} /> : <CloudUpload size={24} />}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Thesis Submission</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-0.5">Official Cloud Repository · PDMS-PRO</p>
                        </div>
                      </div>
                      {step === 'completed' && (
                        <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} /> Submitted
                        </span>
                      )}
                    </div>

                    {/* Error Banner */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="flex items-start gap-3 p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
                          <AlertCircle size={17} className="shrink-0 mt-0.5" />
                          <p className="text-xs font-bold flex-1">{error}</p>
                          <button onClick={() => setError(null)}><X size={15} className="text-rose-400 hover:text-rose-600" /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col">
                      <AnimatePresence mode="wait">

                        {/* STEP 1: SELECT */}
                        {step === 'select' && !uploading && !finalizing && (
                          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col gap-6">
                            <div
                              className={`relative flex-1 min-h-[260px] border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${
                                isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
                              }`}
                              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}>
                              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="sr-only" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
                                <motion.div animate={{ y: isDragging ? -6 : 0 }}
                                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                                    isDragging || selectedFile ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 shadow-sm'
                                  }`}>
                                  {selectedFile ? <FileText size={28} /> : <Upload size={28} />}
                                </motion.div>
                                <div className="space-y-1.5">
                                  <p className="text-lg font-black text-slate-900">
                                    {selectedFile ? selectedFile.name : (isDragging ? 'Release to Upload' : 'Drag & Drop PDF Here')}
                                  </p>
                                  {!selectedFile && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or click to browse · Max {MAX_SIZE_MB}MB</p>}
                                  {selectedFile && <p className="text-[10px] text-slate-500 font-bold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>}
                                </div>
                                {!selectedFile ? (
                                  <div className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:bg-indigo-600 transition-all pointer-events-none">
                                    Browse Document
                                  </div>
                                ) : (
                                  <div className="flex gap-3">
                                    <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                                      className="px-6 py-3 flex items-center gap-2 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                                      <X size={13} /> Change
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); triggerUpload(); }}
                                      className="px-8 py-3 flex items-center gap-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95">
                                      Upload File <ArrowRight size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* UPLOADING */}
                        {uploading && (
                          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                              <Loader2 size={40} className="text-indigo-600 animate-spin" />
                            </div>
                            <div className="w-full max-w-xs space-y-4 text-center">
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest animate-pulse">Uploading to Cloud...</p>
                              <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  <span>Progress</span><span>{Math.min(Math.round(uploadProgress), 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div className="h-full bg-indigo-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(uploadProgress, 100)}%` }} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* STEP 2: STAGED */}
                        {step === 'staged' && !finalizing && (
                          <motion.div key="staged" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center gap-6 py-6">
                            <div className="w-full p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-3">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500">
                                <CheckCircle2 size={32} />
                              </div>
                              <div>
                                <p className="text-lg font-black text-slate-900">File uploaded successfully</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Your file is in the cloud staging area.</p>
                              </div>
                            </div>
                            <div className="w-full p-6 border border-slate-200 rounded-2xl bg-slate-50 text-center space-y-5 flex flex-col items-center">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2 of 2</p>
                                <p className="text-sm font-bold text-slate-700">Authorize the final submission to lock your thesis permanently.</p>
                              </div>
                              <button onClick={() => setShowConfirm(true)}
                                className="w-full max-w-sm px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95">
                                Final Submit Thesis
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* FINALIZING */}
                        {finalizing && (
                          <motion.div key="finalizing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
                            <Loader2 size={48} className="text-indigo-600 animate-spin" />
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest animate-pulse">Finalizing Record...</p>
                          </motion.div>
                        )}

                        {/* STEP 3: COMPLETED */}
                        {step === 'completed' && (
                          <motion.div key="completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center ring-8 ring-emerald-50/60">
                              <FileCheck2 size={40} />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-2xl font-black text-slate-900 leading-tight">Thesis Submitted!</h4>
                              <p className="text-slate-500 text-sm font-medium">Your thesis has been submitted and the record is permanently locked.</p>
                            </div>
                            <div className="w-full max-w-md p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                              <div className="flex items-start gap-3">
                                <FileBadge size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database Record Path</p>
                                  <p className="text-xs font-bold text-slate-700 font-mono mt-0.5 break-all">
                                    {student.filePath || `thesis-files/${student.cnic?.replace(/[-\s]/g, '')}.pdf`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {publicUrl && (
                              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/25 active:scale-95">
                                <FileText size={14} /> View Thesis PDF
                              </a>
                            )}
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="w-full px-6 lg:px-10 py-6 border-t border-slate-200 mt-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
          © {new Date().getFullYear()} Directorate of Advanced Studies · CUVAS · PDMS-PRO v4.0
        </p>
      </footer>
    </div>
  );
};

export default StudentPortal;
