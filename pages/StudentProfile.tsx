
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  ChevronLeft, 
  User, 
  BookOpen, 
  ClipboardList, 
  Edit2, 
  Save, 
  X, 
  ShieldAlert,
  CheckCircle2,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { Student, StudentStatus, Gender, ValidationStatus } from '../types';
import Autocomplete from '../components/Autocomplete';
import { motion, AnimatePresence } from 'framer-motion';

type ProfileTab = 'identity' | 'supervision' | 'thesis';

import StudentTimeline from '../components/StudentTimeline';

const StudentProfile: React.FC = () => {
  const { id } = useParams();
  const { students, updateStudent, currentRole, degrees, programmes, faculty, settings, departments } = useStore();
  const navigate = useNavigate();

  const student = students.find(s => s.id === id);
  const [activeTab, setActiveTab] = useState<ProfileTab>('identity');
  const [editActiveTab, setEditActiveTab] = useState<ProfileTab>('identity');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Student | null>(null);

  if (!student) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-6 bg-slate-100 rounded-full text-slate-300">
        <User size={64} />
      </div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Student Record Not Found</p>
    </div>
  );

  const openEditModal = () => {
    setFormData({ ...student });
    setEditActiveTab('identity');
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateStudent(formData);
      setIsEditModalOpen(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'identity', label: 'Identity & Academics', icon: User },
    { id: 'supervision', label: 'Supervisory Committee', icon: BookOpen },
    { id: 'thesis', label: 'Dissertation & COE', icon: ClipboardList },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-7xl mx-auto space-y-8 pb-20 px-4"
    >
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <button 
          onClick={() => navigate('/records')}
          className="flex items-center space-x-3 text-slate-400 hover:text-indigo-600 transition-all font-semibold text-sm group"
        >
          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm group-hover:border-indigo-200 transition-all">
            <ChevronLeft size={20} />
          </div>
          <span>Back to Registry</span>
        </button>
        
        {currentRole?.canEdit && (
          <button 
            onClick={openEditModal}
            disabled={student.isLocked && currentRole?.role !== 'Admin'}
            className="flex items-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-30 active:scale-95"
          >
            <Edit2 size={18} />
            <span>Modify Record</span>
          </button>
        )}
      </div>

      {student.isLocked && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-xl flex items-center space-x-6">
           <div className="p-4 bg-amber-500 text-white rounded-xl shadow-sm"><ShieldAlert size={24} /></div>
           <div>
              <p className="text-amber-900 dark:text-amber-400 font-bold uppercase text-xs tracking-widest">Security Lock Active</p>
              <p className="text-amber-700 dark:text-amber-500 text-xs mt-1">This record is immutable. Authorized personnel must unlock via administrative console to apply changes.</p>
           </div>
        </div>
      )}

      {/* Timeline / Progress Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm mb-2">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Scholar Journey</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Academic Milestones & Progress Tracking</p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 self-start md:self-center">
            <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Verified Progress</span>
          </div>
        </div>
        <StudentTimeline 
          student={student} 
          onUpdate={(updates) => updateStudent({ ...student, ...updates })}
          isEditable={currentRole?.canEdit && (!student.isLocked || currentRole?.role === 'Admin')}
        />
      </div>

      {/* Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Sticky Scholar Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
             <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600 transition-all" />
             <div className="w-32 h-32 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden p-2 mb-6 shadow-sm transition-transform group-hover:scale-105 duration-500">
               <User className="text-slate-200 dark:text-slate-700" size={48} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">{student.name}</h2>
             <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 px-5 py-2 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-white/5">
               {student.regNo}
             </p>
             
             <div className="w-full mt-10 pt-8 border-t border-slate-50 dark:border-slate-800 space-y-4">
                <StatusRow label="Lifecycle" value={student.status} color="indigo" />
                <StatusRow label="Tier" value={student.degree} color="slate" />
             </div>
          </div>

          <div className="bg-[#0a0c10] dark:bg-slate-900 p-8 rounded-xl text-white shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 text-white opacity-5 rotate-12"><CheckCircle2 size={120} /></div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8 border-b border-white/5 pb-4">Milestone Tracker</h3>
             <div className="space-y-6 relative z-10">
                {settings.milestones.synopsis.enabled && <MilestoneMini label="Synopsis" status={student.synopsis} />}
                {settings.milestones.gs4.enabled && <MilestoneMini label="GS-4 Form" status={student.gs4Form} />}
                {settings.milestones.coe.enabled && <MilestoneMini label="COE Dispatch" status={student.thesisSentToCOE === 'Yes' ? 'Submitted' : 'Pending'} />}
             </div>
          </div>
        </div>

        {/* Right Area: Dynamic Tab Content */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Custom Tab Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[160px] flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Panes */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm min-h-[500px] overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'identity' && (
                <motion.div 
                  key="identity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  <div className="flex items-center space-x-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><User size={24} /></div>
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">Personal & Academic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
                    <InfoBlock label="CNIC Number" value={student.cnic} />
                    <InfoBlock label="Full Legal Name" value={student.name} />
                    <InfoBlock label="Father's Name" value={student.fatherName} />
                    <InfoBlock label="Registration Number" value={student.regNo} />
                    <InfoBlock label="Gender" value={student.gender} />
                    <InfoBlock label="Contact Protocol" value={student.contactNumber} />
                    <InfoBlock label="Degree Category" value={student.degree} />
                    <InfoBlock label="Academic Session" value={student.session} />
                    <InfoBlock label="Department" value={student.department} />
                    <InfoBlock label="Study Programme" value={student.programme} />
                    <InfoBlock label="Current Semester" value={student.currentSemester} />
                  </div>
                </motion.div>
              )}
  
              {activeTab === 'supervision' && (
                <motion.div 
                  key="supervision"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  <div className="flex items-center space-x-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><BookOpen size={24} /></div>
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">Governance & Committee</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
                    <InfoBlock label="Lead Supervisor" value={student.supervisorName} />
                    <InfoBlock label="Co-Supervisor" value={student.coSupervisor || 'Not Assigned'} />
                    <InfoBlock label="Committee Member 01" value={student.member1 || '---'} />
                    <InfoBlock label="Committee Member 02" value={student.member2 || '---'} />
                    <InfoBlock label="Research ID / Thesis ID" value={student.thesisId} />
                    {settings.milestones.synopsis.enabled && (
                      <>
                        <InfoBlock label="Synopsis Status" value={student.synopsis} />
                        <InfoBlock label="Synopsis Date" value={student.synopsisSubmissionDate || 'N/A'} />
                      </>
                    )}
                    {settings.milestones.gs2.enabled && <InfoBlock label="GS-2 Coursework" value={student.gs2CourseWork} />}
                    {settings.milestones.gs4.enabled && <InfoBlock label="GS-4 Form Progress" value={student.gs4Form} />}
                  </div>
                </motion.div>
              )}
  
              {activeTab === 'thesis' && (
                <motion.div 
                  key="thesis"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  <div className="flex items-center space-x-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><ClipboardList size={24} /></div>
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">Examination & Validation</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
                    {settings.milestones.semiFinal.enabled && (
                      <>
                        <InfoBlock label="Semi-Final Submission" value={student.semiFinalThesisStatus} />
                        <InfoBlock label="Semi-Final Date" value={student.semiFinalThesisSubmissionDate || 'N/A'} />
                      </>
                    )}
                    {settings.milestones.final.enabled && (
                      <>
                        <InfoBlock label="Final Dissertation Status" value={student.finalThesisStatus} />
                        <InfoBlock label="Final Submission Date" value={student.finalThesisSubmissionDate || 'N/A'} />
                      </>
                    )}
                    {settings.milestones.coe.enabled && (
                      <>
                        <InfoBlock label="COE Transmission" value={student.thesisSentToCOE} />
                        <InfoBlock label="COE Dispatch Date" value={student.coeSubmissionDate || 'N/A'} />
                      </>
                    )}
                    <InfoBlock label="Official Validation" value={student.validationStatus} />
                    <InfoBlock label="Validation Date" value={student.validationDate || 'N/A'} />
                    <div className="sm:col-span-2 pt-6">
                      <InfoBlock label="Directorate Comments" value={student.comments} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modern Edit Modal with Tab View */}
      {isEditModalOpen && formData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-6xl shadow-lg overflow-hidden flex flex-col h-full md:max-h-[90vh] border border-slate-100 dark:border-white/5">
            
            {/* Modal Header */}
            <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-indigo-600 text-white rounded-xl shadow-sm">
                   <Edit2 size={32} />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Record Editor</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Authenticated Administrative Access</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-12 h-12 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
              >
                <X size={32} />
              </button>
            </div>
            
            {/* Modal Tab Bar */}
            <div className="px-10 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = editActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditActiveTab(tab.id)}
                    className={`flex-1 min-w-[150px] flex items-center justify-center space-x-3 py-3 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${
                      isActive 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20' 
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-10 md:p-14 space-y-12 custom-scrollbar">
              
              {/* Tab Content: Identity */}
              {editActiveTab === 'identity' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-12">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 flex items-center gap-3">
                      <LayoutGrid size={14} /> Section 1: Academic Profile
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Input label="CNIC" value={formData.cnic} onChange={v => setFormData({...formData, cnic: v})} required />
                        <Input label="Scholar Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
                        <Input label="Father Name" value={formData.fatherName} onChange={v => setFormData({...formData, fatherName: v})} />
                        <Input label="Registration #" value={formData.regNo} onChange={v => setFormData({...formData, regNo: v})} required />
                        <Select label="Gender Identity" value={formData.gender} options={['Male', 'Female']} onChange={v => setFormData({...formData, gender: v as any})} />
                        <Input label="Mobile Contact" value={formData.contactNumber} onChange={v => setFormData({...formData, contactNumber: v})} />
                        <Select label="Degree Tier" value={formData.degree} options={degrees} onChange={v => setFormData({...formData, degree: v})} />
                        <Input label="Admission Session" value={formData.session} onChange={v => setFormData({...formData, session: v})} />
                        <Select label="Department" value={formData.department} options={departments} onChange={v => setFormData({...formData, department: v})} />
                        <Select label="Specialization" value={formData.programme} options={programmes} onChange={v => setFormData({...formData, programme: v})} />
                        <Input label="Active Semester" type="number" value={formData.currentSemester.toString()} onChange={v => setFormData({...formData, currentSemester: parseInt(v)})} />
                        <Select label="Academic Status" value={formData.status} options={Object.values(StudentStatus)} onChange={v => setFormData({...formData, status: v as any})} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Supervision */}
              {editActiveTab === 'supervision' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-12">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 flex items-center gap-3">
                      <BookOpen size={14} /> Section 2: Supervision Node
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Autocomplete label="Lead Supervisor" value={formData.supervisorName || ''} suggestions={faculty} onChange={v => setFormData({...formData, supervisorName: v})} required />
                        <Input label="Co-Supervisor" value={formData.coSupervisor || ''} onChange={v => setFormData({...formData, coSupervisor: v})} placeholder="Enter full name" />
                        <div className="hidden lg:block" />
                        <Autocomplete label="Member 1" value={formData.member1 || ''} suggestions={faculty} onChange={v => setFormData({...formData, member1: v})} />
                        <Autocomplete label="Member 2" value={formData.member2 || ''} suggestions={faculty} onChange={v => setFormData({...formData, member2: v})} />
                        <Input label="Thesis ID" value={formData.thesisId} onChange={v => setFormData({...formData, thesisId: v})} />
                        
                        {settings.milestones.synopsis.enabled && (
                          <>
                            <Select label="Synopsis Status" value={formData.synopsis} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, synopsis: v as any})} />
                            <Input label="Synopsis Date" type="date" value={formData.synopsisSubmissionDate} onChange={v => setFormData({...formData, synopsisSubmissionDate: v})} disabled={formData.synopsis === 'Not Submitted'} />
                          </>
                        )}
                        {settings.milestones.gs2.enabled && <Select label="GS-2 Completion" value={formData.gs2CourseWork} options={['Not Completed', 'Completed']} onChange={v => setFormData({...formData, gs2CourseWork: v as any})} />}
                        {settings.milestones.gs4.enabled && <Select label="GS-4 Status" value={formData.gs4Form} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, gs4Form: v as any})} />}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Thesis */}
              {editActiveTab === 'thesis' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-12">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 flex items-center gap-3">
                      <ClipboardList size={14} /> Section 3: Records & Validation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {settings.milestones.semiFinal.enabled && (
                          <>
                            <Select label="Semi-Final Status" value={formData.semiFinalThesisStatus} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, semiFinalThesisStatus: v as any})} />
                            <Input label="Semi-Final Date" type="date" value={formData.semiFinalThesisSubmissionDate} onChange={v => setFormData({...formData, semiFinalThesisSubmissionDate: v})} disabled={formData.semiFinalThesisStatus === 'Not Submitted'} />
                          </>
                        )}
                        {settings.milestones.final.enabled && (
                          <>
                            <Select label="Final Status" value={formData.finalThesisStatus} options={['Not Submitted', 'Submitted', 'Approved']} onChange={v => setFormData({...formData, finalThesisStatus: v as any})} />
                            <Input label="Final Date" type="date" value={formData.finalThesisSubmissionDate} onChange={v => setFormData({...formData, finalThesisSubmissionDate: v})} disabled={formData.finalThesisStatus === 'Not Submitted'} />
                          </>
                        )}
                        {settings.milestones.coe.enabled && (
                          <>
                            <Select label="COE Transmission" value={formData.thesisSentToCOE} options={['No', 'Yes']} onChange={v => setFormData({...formData, thesisSentToCOE: v as any})} />
                            <Input label="COE Date" type="date" value={formData.coeSubmissionDate} onChange={v => setFormData({...formData, coeSubmissionDate: v})} disabled={formData.thesisSentToCOE === 'No'} />
                          </>
                        )}
                        <Select label="Audit Validation" value={formData.validationStatus} options={Object.values(ValidationStatus)} onChange={v => setFormData({...formData, validationStatus: v as any})} />
                        <Input label="Validation Date" type="date" value={formData.validationDate} onChange={v => setFormData({...formData, validationDate: v})} disabled={formData.validationStatus === ValidationStatus.PENDING} />
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-3 block">Directorate Remarks</label>
                          <textarea 
                              className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all min-h-[120px] dark:text-white"
                              value={formData.comments}
                              onChange={e => setFormData({...formData, comments: e.target.value})}
                              placeholder="Internal office notes regarding scholar progress..."
                          />
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="p-8 md:p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between sticky bottom-0">
              <div className="flex items-center space-x-2">
                 {tabs.map((tab, idx) => (
                   <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditActiveTab(tab.id)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${editActiveTab === tab.id ? 'bg-indigo-600 scale-125' : 'bg-slate-200 dark:bg-slate-700'}`}
                   />
                 ))}
              </div>
              <div className="flex items-center space-x-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-8 py-4 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Abort Changes
                </button>
                <button 
                  onClick={handleUpdate} 
                  className="px-12 py-5 bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all flex items-center space-x-4 group active:scale-95"
                >
                  <Save size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>Commit Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* Internal Sub-components */

const InfoBlock = ({ label, value }: { label: string, value: any }) => (
  <div className="space-y-2 group">
    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] leading-none group-hover:text-indigo-400 transition-colors">{label}</p>
    <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight whitespace-pre-wrap">{value || '---'}</p>
  </div>
);

const StatusRow = ({ label, value, color }: any) => (
  <div className="flex items-center justify-between px-3">
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-${color}-100 dark:border-${color}-500/20 bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 shadow-sm`}>
      {value}
    </span>
  </div>
);

const MilestoneMini = ({ label, status }: { label: string, status: string }) => {
  const isDone = status === 'Approved' || status === 'Submitted' || status === 'Completed';
  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center space-x-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">{label}</span>
       </div>
       <span className={`text-[9px] font-black uppercase tracking-widest ${isDone ? 'text-indigo-400' : 'text-slate-600'}`}>{status}</span>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", disabled = false, required = false, placeholder = "" }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 block">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input 
      type={type}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-7 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all dark:text-white ${disabled ? 'opacity-30 cursor-not-allowed grayscale bg-slate-100 dark:bg-slate-800' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
    />
  </div>
);

const Select = ({ label, value, options, onChange }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 block">{label}</label>
    <div className="relative">
      <select 
        className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 dark:text-white"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">-- Choice Protocol --</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

export default StudentProfile;
