import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  ChevronLeft, User, BookOpen, FileText, CheckCircle2,
  Inbox, Send, CheckCircle, Save, Download, FileSpreadsheet
} from 'lucide-react';
import { Student } from '../types';
import { generateStudentProfilePDF } from '../utils/pdfExport';

const TABS = [
  { id: 1, label: 'Student Profile', icon: User },
  { id: 2, label: 'Supervisory Committee', icon: BookOpen },
  { id: 3, label: 'Forms Submissions', icon: FileText },
  { id: 4, label: 'Synopsis Submission', icon: FileText },
  { id: 5, label: 'Thesis Submission', icon: FileText },
  { id: 6, label: 'Submitted in DAS', icon: Inbox },
  { id: 7, label: 'Sent to Controller', icon: Send },
  { id: 8, label: 'Controller Notification', icon: Inbox },
  { id: 9, label: 'Completed', icon: CheckCircle },
];

const StudentProfile: React.FC = () => {
  const { id } = useParams();
  const { students, updateStudent, notify } = useStore();
  const navigate = useNavigate();

  const student = students.find(s => s.id === id);
  const [activeTab, setActiveTab] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  // Form states for quick updates
  const [formData, setFormData] = useState<Partial<Student>>({});

  React.useEffect(() => {
    if (student) {
      setFormData(student);
    }
  }, [student]);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Student Record Not Found</p>
        <button onClick={() => navigate('/records')} className="text-indigo-600 underline">Go Back</button>
      </div>
    );
  }

  const handleUpdate = async () => {
    if (!student.id) return;
    try {
      await updateStudent(formData as Student);
      notify('Student record updated successfully', 'success');
      
      // Workflow logic auto-shift (client side simulation, but state persists)
      if (formData.status === 'Completed' && activeTab !== 9) {
        setActiveTab(9);
      }
    } catch (error) {
      notify('Failed to update record', 'error');
    }
  };

  const handleChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b border-slate-100">{title}</h3>
  );

  const InputField = ({ label, value, field, type = "text", disabled = false }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{label}</label>
      <input 
        type={type}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all ${disabled ? 'opacity-50' : ''}`}
        value={value || ''}
        onChange={(e) => handleChange(field, e.target.value)}
      />
    </div>
  );

  const SelectField = ({ label, value, field, options }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{label}</label>
      <select 
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
        value={value || ''}
        onChange={(e) => handleChange(field, e.target.value)}
      >
        <option value="">-- Select --</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/records')} className="p-2 bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-xl transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">{student.name}</h1>
            <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mt-1">{student.regNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              setIsDownloading(true);
              await generateStudentProfilePDF(student);
              setIsDownloading(false);
            }}
            disabled={isDownloading}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Download size={16} /> PDF
          </button>
          <button 
            onClick={handleUpdate}
            className="px-6 py-2 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Tabs */}
        <div className="w-full lg:w-64 flex flex-col gap-1 shrink-0">
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">{idx + 1}. {tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          {activeTab === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Student Profile" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Full Name" value={formData.name} field="name" />
                <InputField label="Registration No" value={formData.regNo} field="regNo" />
                <InputField label="CNIC" value={formData.cnic} field="cnic" />
                <InputField label="Contact" value={formData.contactNumber} field="contactNumber" />
                <SelectField label="Degree" value={formData.degree} field="degree" options={['M.Phil', 'PhD', 'MSc', 'BSc']} />
                <InputField label="Program" value={formData.programme} field="programme" />
                <InputField label="Department" value={formData.department} field="department" />
                <InputField label="Current Semester" type="number" value={formData.currentSemester} field="currentSemester" />
                <SelectField label="Overall Status" value={formData.status} field="status" options={['Active', 'On Leave', 'Dropped', 'Completed']} />
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Supervisory Committee" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Supervisor Name" value={formData.supervisorName} field="supervisorName" />
                <InputField label="Co-Supervisor" value={formData.coSupervisor} field="coSupervisor" />
                <InputField label="Member 1" value={formData.member1} field="member1" />
                <InputField label="Member 2" value={formData.member2} field="member2" />
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Forms Submissions" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="GS-01 Status" value={formData.gs1Form} field="gs1Form" options={['Not Submitted', 'Submitted', 'Approved']} />
                <SelectField label="GS-02 Coursework" value={formData.gs2CourseWork} field="gs2CourseWork" options={['Not Completed', 'Completed']} />
                <SelectField label="GS-03 Progress" value={formData.gs3Form} field="gs3Form" options={['Not Submitted', 'Submitted', 'Approved']} />
                <SelectField label="GS-04 Status" value={formData.gs4Form} field="gs4Form" options={['Not Submitted', 'Submitted', 'Approved']} />
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Synopsis Submission" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Synopsis Status" value={formData.synopsis} field="synopsis" options={['Not Submitted', 'Submitted', 'Approved']} />
                <InputField label="Submission Date" type="date" value={formData.synopsisSubmissionDate} field="synopsisSubmissionDate" />
              </div>
            </div>
          )}

          {activeTab === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Thesis/Dissertation Submission" />
              <div className="grid grid-cols-1 gap-6">
                <InputField label="Thesis Title" value={formData.thesisTitle} field="thesisTitle" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectField label="Semi-Final Thesis Status" value={formData.semiFinalThesisStatus} field="semiFinalThesisStatus" options={['Not Submitted', 'Submitted', 'Approved']} />
                  <InputField label="Semi-Final Date" type="date" value={formData.semiFinalThesisSubmissionDate} field="semiFinalThesisSubmissionDate" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Thesis Submitted in DAS" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="DAS Submission Status" value={formData.finalThesisStatus} field="finalThesisStatus" options={['Not Submitted', 'Submitted', 'Approved']} />
                <InputField label="DAS Received Date" type="date" value={formData.finalThesisSubmissionDate} field="finalThesisSubmissionDate" />
              </div>
            </div>
          )}

          {activeTab === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Thesis Sent to Controller" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Sent to COE?" value={formData.thesisSentToCOE} field="thesisSentToCOE" options={['No', 'Yes']} />
                <InputField label="Sent Date" type="date" value={formData.coeSubmissionDate} field="coeSubmissionDate" />
              </div>
            </div>
          )}

          {activeTab === 8 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Controller Notification / Returned" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Validation Status" value={formData.validationStatus} field="validationStatus" options={['Pending', 'Approved', 'Returned']} />
                <InputField label="Notification Date" type="date" value={formData.validationDate} field="validationDate" />
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Remarks / Notes</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 min-h-[100px]"
                    value={formData.comments || ''}
                    onChange={(e) => handleChange('comments', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 9 && (
            <div className="space-y-6 animate-in fade-in">
              <SectionTitle title="Completion Archive" />
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-900 uppercase tracking-widest">Degree Completed</h3>
                  <p className="text-emerald-700 text-sm font-medium mt-1">This student has successfully completed all degree requirements.</p>
                </div>
                {formData.status !== 'Completed' && (
                  <button 
                    onClick={() => {
                      handleChange('status', 'Completed');
                      handleUpdate();
                    }}
                    className="px-6 py-3 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    Mark Student as Completed
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default StudentProfile;
