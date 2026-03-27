
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  User, 
  ClipboardList, 
  BookOpen, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Info,
  X,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { Student, StudentStatus, Gender, ValidationStatus } from '../types';
import Autocomplete from '../components/Autocomplete';
import Tooltip from '../components/Tooltip';

type RegistrationTab = 'identity' | 'supervision' | 'thesis';

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

    // Duplicate Detection Logic
    const matches = students.filter(s => 
      s.cnic === formData.cnic || 
      s.regNo === formData.regNo
    );

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

  const tabs: { id: RegistrationTab; label: string; icon: any }[] = [
    { id: 'identity', label: 'Identity & Academics', icon: User },
    { id: 'supervision', label: 'Supervisory Committee', icon: BookOpen },
    { id: 'thesis', label: 'Dissertation & COE', icon: ClipboardList },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      {/* Duplicate Warning Modal */}
      {duplicateCheck.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDuplicateCheck({ show: false, matches: [] })} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-white/5">
            <div className="absolute top-0 inset-x-0 h-2 bg-amber-500" />
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Duplicate Records Detected</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Integrity Conflict in Registry</p>
                  </div>
                </div>
                <button onClick={() => setDuplicateCheck({ show: false, matches: [] })} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-10">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  The system has identified existing records with the same <span className="font-black text-slate-900 dark:text-white">CNIC</span> or <span className="font-black text-slate-900 dark:text-white">Registration Number</span>. Please verify if this is a duplicate entry.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
                  <div className="p-4 bg-slate-100/50 dark:bg-slate-800 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matching Identity</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {duplicateCheck.matches.map(match => (
                      <div key={match.id} className="p-5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{match.name}</p>
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mt-0.5">{match.regNo} • {match.cnic}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${match.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                          {match.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => setDuplicateCheck({ show: false, matches: [] })}
                  className="w-full sm:flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel & Review
                </button>
                <button 
                  onClick={proceedWithRegistration}
                  className="w-full sm:flex-1 py-4 bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-sm"
                >
                  Ignore & Register Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-5 mb-12">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100 dark:border-white/5">
          {settings.institution.logo ? (
            <img 
              src={settings.institution.logo} 
              className="w-full h-full object-contain" 
              alt="Logo" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <ClipboardList className="text-slate-200 dark:text-slate-700" size={32} />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">New Student Registration</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">Add a new student to the postgraduate database</p>
        </div>
      </div>

      {!canRegister && (
        <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center space-x-5 shadow-sm">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-sm">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest">Unauthorized Access</p>
            <p className="text-xs font-bold text-rose-700 dark:text-rose-500 uppercase tracking-tighter mt-0.5">Your current security tier does not allow provisioning new student records.</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center space-x-5 shadow-sm animate-in slide-in-from-top-4">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-sm">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Registration Successful</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-tighter mt-0.5">The student record has been saved to the registry.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center space-x-5 shadow-sm animate-in slide-in-from-top-4">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-sm">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest">Incomplete Information</p>
            <p className="text-xs font-bold text-rose-700 dark:text-rose-500 uppercase tracking-tighter mt-0.5">Please provide the required fields: CNIC, Student Name, and Reg #.</p>
          </div>
        </div>
      )}

      {/* Main Registration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Guide Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-xl shadow-sm flex flex-col relative overflow-hidden group">
             <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-8">
               <Info size={32} />
             </div>
             <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight">Data Entry Guide</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-4 leading-relaxed">
               Please fill in all information carefully. Fields marked with <span className="text-rose-500 font-bold">*</span> are required. Use the tabs on the right to navigate through different sections of the registration form.
             </p>
             
             <div className="w-full mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                {tabs.map((tab, idx) => (
                  <div key={tab.id} className={`flex items-center space-x-4 transition-all ${activeTab === tab.id ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{tab.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-xl text-white shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 text-white opacity-5 rotate-12"><Save size={120} /></div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Action Protocol</h3>
             <p className="text-slate-400 text-xs font-medium leading-relaxed mb-10 relative z-10">
               Click the button below once all tabs are completed to finalize the registration.
             </p>
             <button 
               onClick={handleSubmit}
               disabled={!canRegister}
               className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-4 group relative z-10 active:scale-95 ${
                 canRegister 
                 ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
                 : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
               }`}
             >
               <Save size={18} />
               <span>Register Student</span>
             </button>
          </div>
        </div>

        {/* Right Area: Tabs & Form Content */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Tab Selection Bar */}
          <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[160px] flex items-center justify-center space-x-3 py-3.5 px-6 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all duration-300 ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Pane */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 md:p-12 rounded-xl shadow-sm min-h-[600px]">
            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* Tab 1: Personal & Academic */}
              {activeTab === 'identity' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center space-x-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><User size={24} /></div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.4em]">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input 
                      label="CNIC Number" 
                      value={formData.cnic} 
                      onChange={v => setFormData({...formData, cnic: v})} 
                      required 
                      placeholder="Enter CNIC (e.g. 00000-0000000-0)" 
                      tooltip="Enter the 13-digit National Identity Card number (e.g., 12345-1234567-1)."
                    />
                    <Input label="Student Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required placeholder="Enter Full Name" />
                    <Input label="Father's Name" value={formData.fatherName} onChange={v => setFormData({...formData, fatherName: v})} placeholder="Enter Father's Name" />
                    <Input label="Registration Number" value={formData.regNo} onChange={v => setFormData({...formData, regNo: v})} required placeholder="Enter University Reg #" />
                    <Select label="Gender" value={formData.gender} options={['Male', 'Female']} onChange={v => setFormData({...formData, gender: v as any})} />
                    <Input label="Contact Number" value={formData.contactNumber} onChange={v => setFormData({...formData, contactNumber: v})} placeholder="Mobile/Phone Number" />
                    <Select label="Degree Type" value={formData.degree} options={degrees} onChange={v => setFormData({...formData, degree: v})} />
                    <Input label="Session" value={formData.session} onChange={v => setFormData({...formData, session: v})} placeholder="e.g. Spring 2026" />
                    <Select label="Department" value={formData.department} options={departments} onChange={v => setFormData({...formData, department: v})} />
                    <Select label="Study Program" value={formData.programme} options={programmes} onChange={v => setFormData({...formData, programme: v})} />
                    <Input label="Current Semester" type="number" value={formData.currentSemester?.toString()} onChange={v => setFormData({...formData, currentSemester: parseInt(v)})} />
                    <Select label="Current Status" value={formData.status} options={['Active', 'On Leave', 'Closed']} onChange={v => setFormData({...formData, status: v as any})} />
                  </div>
                  <div className="flex justify-end pt-8">
                    <button type="button" onClick={() => setActiveTab('supervision')} className="flex items-center space-x-3 px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95">
                      <span>Next: Supervision</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Supervision & Committee */}
              {activeTab === 'supervision' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center space-x-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><BookOpen size={24} /></div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.4em]">Supervision & Committee</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Autocomplete label="Main Supervisor" value={formData.supervisorName || ''} suggestions={faculty} onChange={v => setFormData({...formData, supervisorName: v})} required placeholder="Search faculty name..." />
                    <Input label="Co-Supervisor" value={formData.coSupervisor || ''} onChange={v => setFormData({...formData, coSupervisor: v})} placeholder="Enter Co-Supervisor Name" />
                    <Autocomplete label="Committee Member 1" value={formData.member1 || ''} suggestions={faculty} onChange={v => setFormData({...formData, member1: v})} placeholder="Search faculty name..." />
                    <Autocomplete label="Committee Member 2" value={formData.member2 || ''} suggestions={faculty} onChange={v => setFormData({...formData, member2: v})} placeholder="Search faculty name..." />
                    <Input label="Thesis ID / Research ID" value={formData.thesisId} onChange={v => setFormData({...formData, thesisId: v})} placeholder="Unique Research Identifier" />
                    <div className="hidden md:block" />
                    <Select label="Synopsis Status" value={formData.synopsis} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, synopsis: v as any, synopsisSubmissionDate: v === 'Not Submitted' ? '' : formData.synopsisSubmissionDate})} />
                    <Input label="Synopsis Date" type="date" value={formData.synopsisSubmissionDate} onChange={v => setFormData({...formData, synopsisSubmissionDate: v})} disabled={formData.synopsis === 'Not Submitted'} />
                    <Select 
                      label="Coursework Status (GS-2)" 
                      value={formData.gs2CourseWork} 
                      options={['Not Completed', 'Completed']} 
                      onChange={v => setFormData({...formData, gs2CourseWork: v as any})} 
                      tooltip="Graduate Studies Form 2: Coursework completion certificate for postgraduate scholars."
                    />
                    <Select 
                      label="Form Progress (GS-4)" 
                      value={formData.gs4Form} 
                      options={['Not Submitted', 'Submitted', 'Approved']} 
                      onChange={v => setFormData({...formData, gs4Form: v as any})} 
                      tooltip="Graduate Studies Form 4: Thesis submission and approval form for research evaluation."
                    />
                  </div>
                  <div className="flex justify-between pt-8">
                    <button type="button" onClick={() => setActiveTab('identity')} className="flex items-center space-x-3 px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95">
                      <span>Back: Personal Info</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab('thesis')} className="flex items-center space-x-3 px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95">
                      <span>Next: Thesis Details</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Thesis & Results */}
              {activeTab === 'thesis' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center space-x-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><ClipboardList size={24} /></div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.4em]">Thesis & Office Records</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Select label="Semi-Final Thesis Status" value={formData.semiFinalThesisStatus} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, semiFinalThesisStatus: v as any})} />
                    <Input label="Semi-Final Submission Date" type="date" value={formData.semiFinalThesisSubmissionDate} onChange={v => setFormData({...formData, semiFinalThesisSubmissionDate: v})} disabled={formData.semiFinalThesisStatus === 'Not Submitted'} />
                    <Select label="Final Thesis Status" value={formData.finalThesisStatus} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, finalThesisStatus: v as any})} />
                    <Input label="Final Submission Date" type="date" value={formData.finalThesisSubmissionDate} onChange={v => setFormData({...formData, finalThesisSubmissionDate: v})} disabled={formData.finalThesisStatus === 'Not Submitted'} />
                    <Select label="Sent to COE Office" value={formData.thesisSentToCOE} options={['No', 'Yes']} onChange={v => setFormData({...formData, thesisSentToCOE: v as any})} />
                    <Input label="COE Dispatch Date" type="date" value={formData.coeSubmissionDate} onChange={v => setFormData({...formData, coeSubmissionDate: v})} disabled={formData.thesisSentToCOE === 'No'} />
                    <Select label="Audit Validation Status" value={formData.validationStatus} options={['Pending', 'Approved']} onChange={v => setFormData({...formData, validationStatus: v as any})} />
                    <Input label="Validation Date" type="date" value={formData.validationDate} onChange={v => setFormData({...formData, validationDate: v})} disabled={formData.validationStatus === 'Pending'} />
                    <div className="md:col-span-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-3 block">Office Comments / Remarks</label>
                       <textarea 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all min-h-[150px] dark:text-white"
                          value={formData.comments}
                          onChange={e => setFormData({...formData, comments: e.target.value})}
                          placeholder="Enter any additional office notes or scholar progress remarks..."
                       />
                    </div>
                  </div>
                  <div className="flex justify-between pt-8">
                    <button type="button" onClick={() => setActiveTab('supervision')} className="flex items-center space-x-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                      <span>Back: Supervision</span>
                    </button>
                    <button 
                      type="submit" 
                      disabled={!canRegister}
                      className={`flex items-center space-x-4 px-12 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.3em] transition-all active:scale-95 group ${
                        canRegister 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Save size={20} className="group-hover:rotate-12 transition-transform" />
                      <span>Register Student</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", required = false, disabled = false, placeholder = "", tooltip }: any) => (
  <div className="space-y-3">
    <div className="flex items-center">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <input 
      type={type}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 dark:text-white ${disabled ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'hover:border-slate-300 dark:hover:border-white/10'}`}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
    />
  </div>
);

const Select = ({ label, value, options, onChange, tooltip }: any) => (
  <div className="space-y-3">
    <div className="flex items-center">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2 block">{label}</label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <div className="relative">
      <select 
        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-white/10 dark:text-white"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">-- Choose Option --</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

export default StudentRegistration;
