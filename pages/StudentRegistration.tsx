
import React, { useState } from 'react';
import { useStore } from '../store';
import {
  User, ClipboardList, BookOpen, Save,
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Info, X, AlertTriangle, ShieldAlert, GraduationCap
} from 'lucide-react';
import { Student, StudentStatus, Gender, ValidationStatus } from '../types';
import Autocomplete from '../components/Autocomplete';
import Tooltip from '../components/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

type RegistrationTab = 'identity' | 'supervision' | 'thesis';

// ─── Reusable Input ────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = 'text', required = false, disabled = false, placeholder = '', tooltip }: any) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <input
      type={type}
      disabled={disabled}
      placeholder={placeholder}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
      className={`w-full px-4 py-3 text-sm font-medium rounded-xl border outline-none transition-all
        placeholder:text-slate-300
        ${disabled
          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
          : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
        }`}
    />
  </div>
);

// ─── Reusable Select ───────────────────────────────────────────────────────────
const Select = ({ label, value, options, onChange, tooltip }: any) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <div className="relative">
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-900 outline-none appearance-none cursor-pointer hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
      >
        <option value="">— Select Option —</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

// ─── Tab Section Header ────────────────────────────────────────────────────────
const TabHeader: React.FC<{ icon: any; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <div className="flex items-center gap-4 pb-6 mb-2 border-b border-slate-100">
    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
      <Icon size={22} />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">{description}</p>
    </div>
  </div>
);

// ─── Alert Banner ──────────────────────────────────────────────────────────────
const AlertBanner: React.FC<{ type: 'success' | 'error' | 'warn'; title: string; body: string }> = ({ type, title, body }) => {
  const styles = {
    success: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={22} className="text-white" />, iconBg: 'bg-emerald-500', titleColor: 'text-emerald-900', bodyColor: 'text-emerald-700' },
    error:   { bar: 'bg-rose-500',    bg: 'bg-rose-50 border-rose-100',       icon: <AlertCircle  size={22} className="text-white" />, iconBg: 'bg-rose-500',    titleColor: 'text-rose-900',    bodyColor: 'text-rose-700'    },
    warn:    { bar: 'bg-amber-500',   bg: 'bg-amber-50 border-amber-100',     icon: <AlertTriangle size={22} className="text-white" />, iconBg: 'bg-amber-500',  titleColor: 'text-amber-900',   bodyColor: 'text-amber-700'   },
  }[type];
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm ${styles.bg}`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${styles.iconBg}`}>{styles.icon}</div>
      <div>
        <p className={`text-xs font-black uppercase tracking-wide ${styles.titleColor}`}>{title}</p>
        <p className={`text-[10px] font-bold mt-0.5 ${styles.bodyColor}`}>{body}</p>
      </div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const StudentRegistration: React.FC = () => {
  const { addStudent, students, degrees, programmes, faculty, settings, departments, currentRole } = useStore();
  const canRegister = currentRole?.StudentRegistration?.create;
  const [activeTab, setActiveTab] = useState<RegistrationTab>('identity');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<{ show: boolean; matches: Student[] }>({ show: false, matches: [] });

  const initialFormState: Partial<Student> = {
    cnic: '', name: '', fatherName: '', regNo: '', gender: Gender.MALE, contactNumber: '',
    degree: 'M.Phil', session: settings.institution.admissionSession, programme: '',
    currentSemester: 1, status: StudentStatus.ACTIVE, supervisorName: '', coSupervisor: '',
    member1: '', member2: '',
    thesisId: '', synopsis: 'Not Submitted', synopsisSubmissionDate: '',
    gs2CourseWork: 'Not Completed', gs4Form: 'Not Submitted',
    semiFinalThesisStatus: 'Not Submitted', semiFinalThesisSubmissionDate: '',
    finalThesisStatus: 'Not Submitted', finalThesisSubmissionDate: '', thesisSentToCOE: 'No',
    coeSubmissionDate: '', validationStatus: ValidationStatus.PENDING, validationDate: '', comments: ''
  };

  const [formData, setFormData] = useState<Partial<Student>>(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cnic || !formData.regNo) {
      setError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const matches = students.filter(s => s.cnic === formData.cnic || s.regNo === formData.regNo);
    if (matches.length > 0) {
      setDuplicateCheck({ show: true, matches });
      return;
    }
    proceedWithRegistration();
  };

  const proceedWithRegistration = async () => {
    try {
      await addStudent(formData as any);
      setSuccess(true);
      setError(false);
      setFormData(initialFormState);
      setActiveTab('identity');
      setDuplicateCheck({ show: false, matches: [] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs: { id: RegistrationTab; label: string; icon: any; description: string }[] = [
    { id: 'identity',   label: 'Identity & Academics',   icon: User,          description: 'Personal & programme details' },
    { id: 'supervision',label: 'Supervisory Committee',   icon: BookOpen,      description: 'Supervisor & milestone info' },
    { id: 'thesis',     label: 'Dissertation & COE',      icon: ClipboardList, description: 'Thesis progress & office records' },
  ];

  const tabIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-4">

      {/* ── Duplicate Warning Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {duplicateCheck.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setDuplicateCheck({ show: false, matches: [] })}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 bg-amber-500" />
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={24} /></div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Duplicate Detected</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Registry Integrity Conflict</p>
                    </div>
                  </div>
                  <button onClick={() => setDuplicateCheck({ show: false, matches: [] })} className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </div>

                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
                  An existing record with the same <strong className="text-slate-900">CNIC</strong> or <strong className="text-slate-900">Registration Number</strong> was found. Please verify before proceeding.
                </p>

                <div className="rounded-2xl border border-slate-100 overflow-hidden mb-6">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Matching Record</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  </div>
                  {duplicateCheck.matches.map(match => (
                    <div key={match.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-black text-slate-900">{match.name}</p>
                        <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{match.regNo} · {match.cnic}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${match.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {match.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setDuplicateCheck({ show: false, matches: [] })}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Cancel & Review
                  </button>
                  <button onClick={proceedWithRegistration}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-sm">
                    Register Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 pt-2">
        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
          {settings.institution.logo
            ? <img src={settings.institution.logo} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
            : <GraduationCap className="text-indigo-400" size={28} />}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">New Student Registration</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Postgraduate Scholar Enrolment · {settings.institution.name || 'CUVAS'}</p>
        </div>
      </div>

      {/* ── Alerts ────────────────────────────────────────────────────────── */}
      {!canRegister && <AlertBanner type="error"   title="Unauthorized Access"     body="Your current security role does not permit registration of new student records." />}
      {success       && <AlertBanner type="success" title="Registration Successful"  body="The student record has been saved to the postgraduate registry." />}
      {error         && <AlertBanner type="error"   title="Incomplete Information"   body="Required fields are missing: CNIC, Student Name, and Registration Number." />}

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Progress Guide */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Info size={16} />
                </div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Entry Guide</h2>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {tabs.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                const isPast = idx < tabIndex;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl transition-all text-left group ${
                      isActive ? 'bg-indigo-600 shadow-md shadow-indigo-600/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 transition-all ${
                      isActive ? 'bg-white/20 text-white' :
                      isPast  ? 'bg-emerald-50 text-emerald-600' :
                                'bg-slate-100 text-slate-400'
                    }`}>
                      {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>{tab.label}</p>
                      <p className={`text-[8px] font-bold truncate mt-0.5 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Card */}
          <div className="bg-slate-900 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-[0.07] pointer-events-none">
              <Save size={100} className="text-white" />
            </div>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Action Protocol</p>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-5 relative z-10">
              Complete all three sections then click below to save the record.
            </p>
            <button
              onClick={handleSubmit}
              disabled={!canRegister}
              className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all relative z-10 flex items-center justify-center gap-2.5 active:scale-95 ${
                canRegister
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save size={15} />
              Register Student
            </button>
          </div>
        </div>

        {/* ── RIGHT CONTENT AREA ─────────────────────────────────────────── */}
        <div className="lg:col-span-9 flex flex-col gap-5">

          {/* Tab Navigation Bar */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Pane */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 min-h-[540px]">
            <form onSubmit={handleSubmit}>

              {/* ── Tab 1: Identity & Academics ─────────────────────────── */}
              <AnimatePresence mode="wait">
                {activeTab === 'identity' && (
                  <motion.div
                    key="identity"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <TabHeader icon={User} title="Personal Information" description="Core identity and programme details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input label="CNIC Number" value={formData.cnic} onChange={(v: string) => setFormData({...formData, cnic: v})} required placeholder="e.g. 00000-0000000-0" tooltip="Enter the 13-digit National Identity Card number." />
                      <Input label="Student Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required placeholder="Enter Full Name" />
                      <Input label="Father's Name" value={formData.fatherName} onChange={(v: string) => setFormData({...formData, fatherName: v})} placeholder="Enter Father's Name" />
                      <Input label="Registration Number" value={formData.regNo} onChange={(v: string) => setFormData({...formData, regNo: v})} required placeholder="Enter University Reg #" />
                      <Select label="Gender" value={formData.gender} options={['Male', 'Female']} onChange={(v: string) => setFormData({...formData, gender: v as any})} />
                      <Input label="Contact Number" value={formData.contactNumber} onChange={(v: string) => setFormData({...formData, contactNumber: v})} placeholder="Mobile / Phone Number" />
                      <Select label="Degree Type" value={formData.degree} options={degrees} onChange={(v: string) => setFormData({...formData, degree: v})} />
                      <Input label="Session" value={formData.session} onChange={(v: string) => setFormData({...formData, session: v})} placeholder="e.g. Spring 2026" />
                      <Select label="Department" value={formData.department} options={departments} onChange={(v: string) => setFormData({...formData, department: v})} />
                      <Select label="Study Program" value={formData.programme} options={programmes} onChange={(v: string) => setFormData({...formData, programme: v})} />
                      <Input label="Current Semester" type="number" value={formData.currentSemester?.toString()} onChange={(v: string) => setFormData({...formData, currentSemester: parseInt(v)})} />
                      <Select label="Academic Status" value={formData.status} options={Object.values(StudentStatus)} onChange={(v: string) => setFormData({...formData, status: v as any})} />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="button" onClick={() => setActiveTab('supervision')}
                        className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-sm">
                        Next: Supervision <ChevronRight size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab 2: Supervisory Committee ──────────────────────── */}
                {activeTab === 'supervision' && (
                  <motion.div
                    key="supervision"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <TabHeader icon={BookOpen} title="Supervision & Committee" description="Supervisor assignments and milestone tracking" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Autocomplete label="Main Supervisor" value={formData.supervisorName || ''} suggestions={faculty} onChange={(v: string) => setFormData({...formData, supervisorName: v})} required placeholder="Search faculty name..." />
                      <Input label="Co-Supervisor" value={formData.coSupervisor || ''} onChange={(v: string) => setFormData({...formData, coSupervisor: v})} placeholder="Enter Co-Supervisor Name" />
                      <Autocomplete label="Committee Member 1" value={formData.member1 || ''} suggestions={faculty} onChange={(v: string) => setFormData({...formData, member1: v})} placeholder="Search faculty name..." />
                      <Autocomplete label="Committee Member 2" value={formData.member2 || ''} suggestions={faculty} onChange={(v: string) => setFormData({...formData, member2: v})} placeholder="Search faculty name..." />
                      <Input label="Thesis ID / Research ID" value={formData.thesisId} onChange={(v: string) => setFormData({...formData, thesisId: v})} placeholder="Unique Research Identifier" />
                      <div className="hidden sm:block" />
                      <Select label="Synopsis Status" value={formData.synopsis}
                        options={['Not Submitted', 'Submitted', 'Approved']}
                        onChange={(v: string) => setFormData({...formData, synopsis: v as any, synopsisSubmissionDate: v === 'Not Submitted' ? '' : formData.synopsisSubmissionDate})} />
                      <Input label="Synopsis Date" type="date" value={formData.synopsisSubmissionDate} onChange={(v: string) => setFormData({...formData, synopsisSubmissionDate: v})} disabled={formData.synopsis === 'Not Submitted'} />
                      <Select label="Coursework Status (GS-2)" value={formData.gs2CourseWork}
                        options={['Not Completed', 'Completed']}
                        onChange={(v: string) => setFormData({...formData, gs2CourseWork: v as any})}
                        tooltip="Graduate Studies Form 2: Coursework completion certificate." />
                      <Select label="Form Progress (GS-4)" value={formData.gs4Form}
                        options={['Not Submitted', 'Submitted', 'Approved']}
                        onChange={(v: string) => setFormData({...formData, gs4Form: v as any})}
                        tooltip="Graduate Studies Form 4: Thesis submission and approval form." />
                    </div>
                    <div className="flex justify-between pt-2">
                      <button type="button" onClick={() => setActiveTab('identity')}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                        <ChevronLeft size={14} /> Back
                      </button>
                      <button type="button" onClick={() => setActiveTab('thesis')}
                        className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-sm">
                        Next: Thesis <ChevronRight size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab 3: Dissertation & COE ──────────────────────────── */}
                {activeTab === 'thesis' && (
                  <motion.div
                    key="thesis"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <TabHeader icon={ClipboardList} title="Thesis & Office Records" description="Dissertation tracking and validation pipeline" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Select label="Semi-Final Thesis Status" value={formData.semiFinalThesisStatus}
                        options={['Not Submitted', 'Submitted', 'Approved']}
                        onChange={(v: string) => setFormData({...formData, semiFinalThesisStatus: v as any})} />
                      <Input label="Semi-Final Submission Date" type="date" value={formData.semiFinalThesisSubmissionDate}
                        onChange={(v: string) => setFormData({...formData, semiFinalThesisSubmissionDate: v})}
                        disabled={formData.semiFinalThesisStatus === 'Not Submitted'} />
                      <Select label="Final Thesis Status" value={formData.finalThesisStatus}
                        options={['Not Submitted', 'Submitted', 'Approved']}
                        onChange={(v: string) => setFormData({...formData, finalThesisStatus: v as any})} />
                      <Input label="Final Submission Date" type="date" value={formData.finalThesisSubmissionDate}
                        onChange={(v: string) => setFormData({...formData, finalThesisSubmissionDate: v})}
                        disabled={formData.finalThesisStatus === 'Not Submitted'} />
                      <Select label="Sent to COE Office" value={formData.thesisSentToCOE}
                        options={['No', 'Yes']}
                        onChange={(v: string) => setFormData({...formData, thesisSentToCOE: v as any})} />
                      <Input label="COE Dispatch Date" type="date" value={formData.coeSubmissionDate}
                        onChange={(v: string) => setFormData({...formData, coeSubmissionDate: v})}
                        disabled={formData.thesisSentToCOE === 'No'} />
                      <Select label="Audit Validation Status" value={formData.validationStatus}
                        options={['Pending', 'Approved']}
                        onChange={(v: string) => setFormData({...formData, validationStatus: v as any})} />
                      <Input label="Validation Date" type="date" value={formData.validationDate}
                        onChange={(v: string) => setFormData({...formData, validationDate: v})}
                        disabled={formData.validationStatus === 'Pending'} />
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1.5">Office Comments / Remarks</label>
                        <textarea
                          className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-900 outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px] resize-y placeholder:text-slate-300"
                          value={formData.comments}
                          onChange={e => setFormData({...formData, comments: e.target.value})}
                          placeholder="Enter any additional office notes or scholar progress remarks..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-2">
                      <button type="button" onClick={() => setActiveTab('supervision')}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                        <ChevronLeft size={14} /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={!canRegister}
                        className={`flex items-center gap-2.5 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 group ${
                          canRegister
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Save size={15} className="group-hover:rotate-12 transition-transform" />
                        Register Student
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
