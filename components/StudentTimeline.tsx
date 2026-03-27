
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
  
  const stages = [
    {
      id: 'admission',
      label: 'Admission',
      status: 'Completed',
      date: 'Initial'
    },
    {
      id: 'coursework',
      label: 'Coursework',
      status: student.gs2CourseWork === 'Completed' ? 'Completed' : (student.currentSemester >= 2 ? 'In Progress' : 'Not Started'),
    },
    {
      id: 'synopsis',
      label: 'Synopsis',
      status: student.synopsis === 'Approved' ? 'Completed' : (student.synopsis === 'Submitted' ? 'In Progress' : 'Not Started'),
      date: student.synopsisSubmissionDate
    },
    {
      id: 'research',
      label: 'Research',
      status: student.finalThesisStatus !== 'Not Submitted' ? 'Completed' : (student.synopsis === 'Approved' ? 'In Progress' : 'Not Started'),
    },
    {
      id: 'thesis',
      label: 'Thesis',
      status: student.finalThesisStatus === 'Approved' ? 'Completed' : (student.finalThesisStatus === 'Submitted' ? 'In Progress' : 'Not Started'),
      date: student.finalThesisSubmissionDate
    },
    {
      id: 'viva',
      label: 'Viva',
      status: student.status === StudentStatus.COMPLETED ? 'Completed' : (student.finalThesisStatus === 'Approved' ? 'In Progress' : 'Not Started'),
    },
    {
      id: 'completed',
      label: 'Completed',
      status: student.status === StudentStatus.COMPLETED ? 'Completed' : 'Not Started',
    }
  ];

  const milestones = stages;

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
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'In Progress': return 'bg-indigo-600';
      default: return 'bg-slate-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-600';
      case 'In Progress': return 'text-indigo-600';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between mb-10 px-2 lg:px-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Progress</span>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{progressPercent}%</span>
            <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Scholar Roadmap</span>
        </div>
      </div>

      {/* Timeline Stepper */}
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0 lg:px-12">
         {/* Background connecting line (Desktop) */}
         <div className="absolute left-12 right-12 top-[22px] h-[3px] bg-slate-100 z-0 hidden lg:block rounded-full" />
         
         {/* Vertical line (Mobile) */}
         <div className="absolute left-1/2 top-4 bottom-4 w-[3px] bg-slate-100 lg:hidden rounded-full -translate-x-1/2" />

         {milestones.map((m, idx) => {
           const isCompleted = m.status === 'Completed';
           const isInProgress = m.status === 'In Progress';
           
           return (
             <div key={m.id} className="relative z-10 flex flex-col items-center group flex-1">
                {/* Step Marker */}
                <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 shadow-sm relative
                    ${isCompleted ? 'bg-emerald-500 border-emerald-50 text-white' : 
                      isInProgress ? 'bg-indigo-600 border-indigo-50 text-white animate-pulse' : 
                      'bg-white border-slate-50 text-slate-300'}
                `}>
                  {isCompleted ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <span className="text-xs font-black">{idx + 1}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="mt-4 text-center">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${getStatusTextColor(m.status)}`}>
                     {m.label}
                   </p>
                   {m.date && (
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{m.date}</p>
                   )}
                   <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] border ${
                     isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                     isInProgress ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                     'bg-slate-50 border-slate-100 text-slate-400'
                   }`}>
                     {m.status === 'Not Started' ? 'Grey' : m.status}
                   </span>
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
};

export default StudentTimeline;
