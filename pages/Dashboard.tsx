
import React from 'react';
import { useStore } from '../store';
import { 
  Search,
  Plus,
  Download,
  FileBarChart,
  History,
  Target,
  BarChart3,
  LineChart as LineIcon,
  Image as ImageIcon,
  CheckCircle,
  LogOut,
  PauseCircle,
  AlertCircle,
  Layers,
  Zap,
  Users,
  ChevronRight
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Line, LineChart, Legend, BarChart, Bar
} from 'recharts';
import { StudentStatus, Gender, ValidationStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchAutocomplete from '../components/SearchAutocomplete';
import BrandedLoader from '../components/BrandedLoader';

const Dashboard: React.FC = () => {
  const { students, settings, isLoading, error, setupDatabase, currentUser, currentRole } = useStore();
  const navigate = useNavigate();

  const QuickProtocol: React.FC<{ icon: any, label: string, path: string }> = ({ icon: Icon, label, path }) => (
    <button 
      onClick={() => navigate(path)}
      className="flex-1 flex items-center justify-center gap-3 p-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95"
    >
      <Icon size={18} className="text-indigo-600" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  if (isLoading) {
    return (
      <BrandedLoader
        variant="fullscreen"
        message="Loading PostGrad Hub"
        subLabel="Synchronizing registry data"
        logoSize={168}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <AlertCircle className="text-rose-500" size={48} />
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Connection Error</h2>
        <p className="text-slate-500 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm">Retry</button>
      </div>
    );
  }

  const totalCount = students.length;
  // Robust filtering (case-insensitive and trimmed)
  const getStatus = (s: any) => String(s.status || '').trim().toLowerCase();
  const normalizeDegree = (val: string) => String(val || '').replace(/\./g, '').trim().toUpperCase();
  
  const maleCount = students.filter(s => String(s.gender || '').trim().toLowerCase() === 'male').length;
  const femaleCount = students.filter(s => String(s.gender || '').trim().toLowerCase() === 'female').length;
  
  const isCompleted = (s: any) => {
    return String(s.status || '').trim().toLowerCase() === 'completed';
  };
  
  const isActiveStatus = (s: any) => {
    return String(s.status || '').trim().toLowerCase() === 'active';
  };
  
  const activeCount = students.filter(s => isActiveStatus(s)).length;
  const completeCount = students.filter(s => isCompleted(s)).length;
  const leftCount = students.filter(s => getStatus(s).includes('dropped') || getStatus(s).includes('left')).length;
  const freezeCount = students.filter(s => getStatus(s).includes('suspended') || getStatus(s).includes('on leave')).length;
  
  const needStatusCount = students.filter(s => 
    s.validationStatus === ValidationStatus.PENDING || 
    s.validationStatus === ValidationStatus.RETURNED
  ).length;

  const kpiGrid = [
    { label: 'Total Scholars', value: totalCount, color: '#007BFF', icon: Layers },
    { label: 'Male Scholars', value: maleCount, color: '#17A2B8', icon: Users },
    { label: 'Female Scholars', value: femaleCount, color: '#E83E8C', icon: Users },
    { label: 'Active Registry', value: activeCount, color: '#28A745', icon: Zap },
    { label: 'Completed', value: completeCount, color: '#20C997', icon: CheckCircle },
    { label: 'Left / Dropped', value: leftCount, color: '#FD7E14', icon: LogOut },
    { label: 'Frozen / Leave', value: freezeCount, color: '#6F42C1', icon: PauseCircle },
    { label: 'Pending Audit', value: needStatusCount, color: '#DC3545', icon: AlertCircle },
  ];

  const lifecycleData = [
    { name: 'Registration', count: students.filter(s => s.regNo).length },
    { name: 'Coursework', count: students.filter(s => s.gs2CourseWork === 'Completed').length },
    { name: 'Synopsis', count: students.filter(s => s.synopsis === 'Approved').length },
    { name: 'Thesis', count: students.filter(s => s.finalThesisStatus === 'Approved').length },
    { name: 'Defense', count: students.filter(s => s.thesisSentToCOE === 'Yes').length },
    { name: 'Graduation', count: completeCount },
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Search Bar */}
      <div className="relative group no-print">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <SearchAutocomplete 
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-indigo-600 transition-all text-sm font-medium placeholder:text-slate-400"
          placeholder="Search Scholar Registry..."
        />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        {kpiGrid.map((item, idx) => (
          <div 
            key={idx}
            style={{ backgroundColor: item.color }}
            className="p-6 rounded-2xl shadow-sm transition-all hover:shadow-md border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <item.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Live</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">{item.label}</p>
              <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {item.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Analytics Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center">
                  <BarChart3 size={20} className="mr-3 text-indigo-600" />
                  Scholar Lifecycle Trends
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Performance Velocity by Semester</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PhD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MPhil</span>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { stage: 'GS-2', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD' && s.gs2CourseWork === 'Completed').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.gs2CourseWork === 'Completed').length },
                  { stage: 'Synopsis', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD' && s.synopsis === 'Approved').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.synopsis === 'Approved').length },
                  { stage: 'GS-4', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD' && s.gs4Form === 'Approved').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.gs4Form === 'Approved').length },
                  { stage: 'Thesis', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD' && s.finalThesisStatus === 'Approved').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.finalThesisStatus === 'Approved').length },
                  { stage: 'COE', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD' && s.thesisSentToCOE === 'Yes').length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && s.thesisSentToCOE === 'Yes').length },
                  { stage: 'Done', PhD: students.filter(s => normalizeDegree(s.degree) === 'PHD' && isCompleted(s)).length, MPhil: students.filter(s => normalizeDegree(s.degree) === 'MPHIL' && isCompleted(s)).length },
                ]}>
                  < CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="PhD" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="MPhil" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <CheckCircle size={120} className="text-emerald-900" />
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex flex-col">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center">
                    <CheckCircle size={20} className="mr-3 text-emerald-500" />
                    Completed Students
                  </h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Historical Graduation registry</p>
               </div>
               <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-black text-emerald-600 block tabular-nums">{completeCount}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Graduates found</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {students
                .filter(s => isCompleted(s))
                .reverse()
                .map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="flex items-center justify-between p-5 bg-emerald-50/20 rounded-2xl border border-emerald-100/50 hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all cursor-pointer group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-black text-sm shadow-sm border border-emerald-100">
                        {student.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{student.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-emerald-100/50 text-emerald-700 text-[6px] font-black uppercase rounded tracking-tighter">{student.degree}</span>
                          <span className="text-[8px] font-bold text-slate-400 truncate">{student.regNo}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-emerald-300 group-hover/item:text-emerald-500 transition-transform group-hover/item:translate-x-1" />
                  </div>
              ))}
              {completeCount === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database check: No graduates indexed yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Students Register */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center">
                  <Zap size={20} className="mr-3 text-indigo-600" />
                  Active Students Card
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Currently Active in Database</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden xl:flex flex-col items-end mr-6">
                    <span className="text-xl font-black text-indigo-600 block tabular-nums">{activeCount}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Active Count</span>
                 </div>
                 <button 
                  onClick={() => navigate('/records')}
                  className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-slate-200"
                >
                  Scholar Register
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Serial</th>
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Scholar Name</th>
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Program</th>
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students
                    .filter(s => isActiveStatus(s))
                    .slice(-5)
                    .reverse()
                    .map((student, idx) => (
                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/students/${student.id}`)}>
                      <td className="py-4 text-xs font-bold text-slate-400">#0{idx + 1}</td>

                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">
                            {student.name[0]}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">{student.degree}</span>
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-500">{student.department}</td>
                      <td className="py-4 text-right">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${student.gender === Gender.MALE ? 'text-blue-500' : 'text-pink-500'}`}>{student.gender}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Sections */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Protocols */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-6 flex items-center">
              <Zap size={20} className="mr-3 text-indigo-600" />
              Quick Protocols
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {currentRole?.canAdd && <QuickProtocol icon={Plus} label="Enroll Scholar" path="/registration" />}
              {currentRole?.canExport && <QuickProtocol icon={Download} label="Data Extraction" path="/export" />}
              <QuickProtocol icon={FileBarChart} label="Report Suite" path="/reports" />
              {currentRole?.canViewAudit && <QuickProtocol icon={History} label="Audit Logs" path="/audit" />}
            </div>
          </div>



          {/* Scholar Cycle / Milestones */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-8 flex items-center">
              <Target size={20} className="mr-3 text-indigo-600" />
              Scholar Cycle
            </h3>
            <div className="space-y-6">
              {lifecycleData.map((milestone, idx) => {
                const percentage = totalCount > 0 ? (milestone.count / totalCount) * 100 : 0;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{milestone.name}</span>
                      <span className="text-xs font-black text-slate-900 tracking-tighter">{milestone.count} Scholars</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-10 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Designed & Developed by <span className="text-slate-600">Directorate of Advanced Studies</span>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
