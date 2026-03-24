
import React from 'react';
import { Student, StudentStatus } from '../types';
import { CheckCircle2, GraduationCap, BookOpen, FileText, ShieldCheck, Award, ChevronDown } from 'lucide-react';
import { useStore } from '../store';

interface StudentTimelineProps {
  student: Student;
  onUpdate?: (updates: Partial<Student>) => void;
  isEditable?: boolean;
}

const StudentTimeline: React.FC<StudentTimelineProps> = ({ student, onUpdate, isEditable = true }) => {
  const { settings } = useStore();
  
  const allMilestones = [
    {
      id: 'registration',
      label: 'Registration',
      status: 'Completed',
      icon: ShieldCheck,
      date: student.regNo ? 'Initial' : null,
      options: ['Completed'],
      enabled: true
    },
    {
      id: 'gs2',
      label: 'GS-2 Coursework',
      status: student.gs2CourseWork === 'Completed' ? 'Completed' : 'Pending',
      icon: BookOpen,
      date: null,
      options: ['Pending', 'Completed'],
      enabled: settings.milestones.gs2.enabled
    },
    {
      id: 'synopsis',
      label: 'Synopsis',
      status: student.synopsis === 'Approved' ? 'Completed' : (student.synopsis === 'Submitted' ? 'In Progress' : 'Pending'),
      icon: FileText,
      date: student.synopsisSubmissionDate,
      options: ['Pending', 'In Progress', 'Completed'],
      enabled: settings.milestones.synopsis.enabled
    },
    {
      id: 'gs4',
      label: 'GS-4 Form',
      status: student.gs4Form === 'Approved' ? 'Completed' : (student.gs4Form === 'Submitted' ? 'In Progress' : 'Pending'),
      icon: FileText,
      date: null,
      options: ['Pending', 'In Progress', 'Completed'],
      enabled: settings.milestones.gs4.enabled
    },
    {
      id: 'semiFinal',
      label: 'Semi-Final',
      status: student.semiFinalThesisStatus === 'Approved' ? 'Completed' : (student.semiFinalThesisStatus === 'Submitted' ? 'In Progress' : 'Pending'),
      icon: Award,
      date: student.semiFinalThesisSubmissionDate,
      options: ['Pending', 'In Progress', 'Completed'],
      enabled: settings.milestones.semiFinal.enabled
    },
    {
      id: 'final',
      label: 'Final Thesis',
      status: student.finalThesisStatus === 'Approved' ? 'Completed' : (student.finalThesisStatus === 'Submitted' ? 'In Progress' : 'Pending'),
      icon: Award,
      date: student.finalThesisSubmissionDate,
      options: ['Pending', 'In Progress', 'Completed'],
      enabled: settings.milestones.final.enabled
    },
    {
      id: 'coe',
      label: 'COE Dispatch',
      status: student.thesisSentToCOE === 'Yes' ? 'Completed' : 'Pending',
      icon: CheckCircle2,
      date: student.coeSubmissionDate,
      options: ['Pending', 'Completed'],
      enabled: settings.milestones.coe.enabled
    },
    {
      id: 'graduation',
      label: 'Graduation',
      status: student.status === StudentStatus.COMPLETED ? 'Completed' : 'Pending',
      icon: GraduationCap,
      date: null,
      options: ['Pending', 'Completed'],
      enabled: true
    },
  ];

  const milestones = allMilestones.filter(m => m.enabled);

  const handleStatusChange = (milestoneId: string, newStatus: string) => {
    if (!onUpdate) return;
    
    const today = new Date().toISOString().split('T')[0];
    let updates: Partial<Student> = {};

    switch (milestoneId) {
      case 'gs2':
        updates.gs2CourseWork = newStatus === 'Completed' ? 'Completed' : 'Not Completed';
        break;
      case 'synopsis':
        updates.synopsis = newStatus === 'Completed' ? 'Approved' : (newStatus === 'In Progress' ? 'Submitted' : 'Not Submitted');
        if (newStatus === 'Completed' || newStatus === 'In Progress') {
          updates.synopsisSubmissionDate = today;
        }
        break;
      case 'gs4':
        updates.gs4Form = newStatus === 'Completed' ? 'Approved' : (newStatus === 'In Progress' ? 'Submitted' : 'Not Submitted');
        break;
      case 'semiFinal':
        updates.semiFinalThesisStatus = newStatus === 'Completed' ? 'Approved' : (newStatus === 'In Progress' ? 'Submitted' : 'Not Submitted');
        if (newStatus === 'Completed' || newStatus === 'In Progress') {
          updates.semiFinalThesisSubmissionDate = today;
        }
        break;
      case 'final':
        updates.finalThesisStatus = newStatus === 'Completed' ? 'Approved' : (newStatus === 'In Progress' ? 'Submitted' : 'Not Submitted');
        if (newStatus === 'Completed' || newStatus === 'In Progress') {
          updates.finalThesisSubmissionDate = today;
        }
        break;
      case 'coe':
        updates.thesisSentToCOE = newStatus === 'Completed' ? 'Yes' : 'No';
        if (newStatus === 'Completed') {
          updates.coeSubmissionDate = today;
        }
        break;
      case 'graduation':
        updates.status = newStatus === 'Completed' ? StudentStatus.COMPLETED : StudentStatus.ACTIVE;
        break;
    }
    onUpdate(updates);
  };

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const progressPercent = Math.round(((completedCount) / (milestones.length)) * 100);

  // Determine overall color based on progress
  const getProgressColor = () => {
    if (progressPercent < 30) return 'bg-rose-500';
    if (progressPercent < 70) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const getProgressShadow = () => {
    if (progressPercent < 30) return 'shadow-[0_0_15px_rgba(244,63,94,0.4)]';
    if (progressPercent < 70) return 'shadow-[0_0_15px_rgba(249,115,22,0.4)]';
    return 'shadow-[0_0_15px_rgba(16,185,129,0.4)]';
  };

  return (
    <div className="w-full py-6 md:py-12 px-2 md:px-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Journey Completion</span>
          <div className="flex items-center space-x-3 mt-1">
            <span className={`text-3xl font-black tracking-tighter ${
              progressPercent < 30 ? 'text-rose-600' : progressPercent < 70 ? 'text-orange-600' : 'text-emerald-600'
            }`}>
              {progressPercent}%
            </span>
            <div className="h-2 w-32 md:w-48 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 self-start md:self-center">
          <div className={`w-2 h-2 rounded-full ${getProgressColor()} animate-pulse`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Progress Node</span>
        </div>
      </div>

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-12 md:gap-0">
        {/* Background Line (Horizontal - Desktop) */}
        <div className="absolute left-0 top-1/2 w-full h-1.5 bg-slate-100 -translate-y-1/2 z-0 rounded-full hidden md:block" />
        
        {/* Progress Line (Horizontal - Desktop) */}
        <div 
          className={`absolute left-0 top-1/2 h-1.5 -translate-y-1/2 z-0 transition-all duration-1000 rounded-full ${getProgressColor()} ${getProgressShadow()} hidden md:block`}
          style={{ 
            width: `${Math.max(0, ((completedCount - 1) / (milestones.length - 1)) * 100)}%` 
          }}
        />

        {/* Vertical Line (Mobile) */}
        <div className="absolute left-7 top-0 w-1.5 h-full bg-slate-100 z-0 rounded-full md:hidden" />
        <div 
          className={`absolute left-7 top-0 w-1.5 z-0 transition-all duration-1000 rounded-full ${getProgressColor()} ${getProgressShadow()} md:hidden`}
          style={{ 
            height: `${Math.max(0, ((completedCount - 1) / (milestones.length - 1)) * 100)}%` 
          }}
        />

        {milestones.map((m) => {
          const Icon = m.icon;
          const isCompleted = m.status === 'Completed';
          const isInProgress = m.status === 'In Progress';
          
          return (
            <div key={m.id} className="relative z-10 flex flex-row md:flex-col items-center md:items-center group w-full md:w-auto">
              {/* Icon Node */}
              <div className={`
                w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all duration-500 border-4 shrink-0
                ${isCompleted ? 'bg-emerald-600 border-emerald-100 text-white shadow-xl shadow-emerald-200 scale-110' : 
                  isInProgress ? 'bg-orange-500 border-orange-100 text-white shadow-xl shadow-orange-200 animate-pulse' : 
                  'bg-white border-rose-50 text-rose-300 hover:border-rose-200'}
              `}>
                <Icon size={isCompleted ? 28 : 24} className={isCompleted ? 'stroke-[2.5]' : 'stroke-[2]'} />
              </div>
              
              {/* Content Area */}
              <div className="ml-6 md:ml-0 md:absolute md:top-full md:mt-6 text-left md:text-center min-w-[120px] flex-1">
                <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {m.label}
                </p>
                {m.date && m.date !== 'Initial' && (
                  <p className={`text-[9px] font-bold mt-1 uppercase tracking-tighter px-2 py-0.5 rounded-full inline-block ${
                    isCompleted ? 'text-emerald-500 bg-emerald-50' : 'text-orange-500 bg-orange-50'
                  }`}>
                    {m.date}
                  </p>
                )}
                <div className="mt-2 relative">
                  {isEditable && m.id !== 'registration' ? (
                    <div className="relative inline-block group/select">
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusChange(m.id, e.target.value)}
                        className={`appearance-none text-[8px] font-black uppercase tracking-widest px-6 py-1.5 rounded-full border cursor-pointer transition-all outline-none pr-8 ${
                          isCompleted ? 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' : 
                          isInProgress ? 'text-orange-600 bg-orange-50 border-orange-100 hover:bg-orange-100' : 
                          'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100'
                        }`}
                      >
                        {m.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  ) : (
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      isCompleted ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                      isInProgress ? 'text-orange-600 bg-orange-50 border-orange-100' : 
                      'text-rose-600 bg-rose-50 border-rose-100'
                    }`}>
                      {m.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTimeline;
