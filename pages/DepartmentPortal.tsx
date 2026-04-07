import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, FileText, History, LogOut, LayoutDashboard, 
  Search, Eye, Edit2, Download, ShieldCheck, ChevronRight, X, User, ClipboardList, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DepartmentPortal: React.FC = () => {
  const { currentDeptUser, deptLogout, students, departments, settings, updateStudent, logDeptAction, departmentAuditLogs } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'reports' | 'audit'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    if (!currentDeptUser) {
      navigate('/dept-login');
    }
  }, [currentDeptUser, navigate]);

  if (!currentDeptUser) return null;

  const deptStudents = useMemo(() => {
    return students.filter(s => s.department === currentDeptUser.department);
  }, [students, currentDeptUser.department]);

  // Dashboard Stats
  const stats = useMemo(() => {
    return {
      total: deptStudents.length,
      active: deptStudents.filter(s => s.status === 'Active').length,
      completedThesis: deptStudents.filter(s => ['Submitted', 'Approved'].includes(s.finalThesisStatus || '')).length,
      pending: deptStudents.filter(s => s.status === 'Active' && !['Submitted', 'Approved'].includes(s.finalThesisStatus || '')).length,
    };
  }, [deptStudents]);

  const handleLogout = () => {
    deptLogout();
    navigate('/dept-login');
  };

  return (
    <div className="flex h-screen bg-[#f4f7fe] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#0f172a] text-white flex flex-col shrink-0">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1 border border-white/10">
              <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Dept Portal</h1>
            </div>
          </div>
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl mb-6">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Coordinator</p>
            <p className="text-sm font-bold truncate">{currentDeptUser.name}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5 truncate">{currentDeptUser.department}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'students', label: 'Student List', icon: Users },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'audit', label: 'Audit Logs', icon: History }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedStudent(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}>
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {activeTab === 'dashboard' && 'Department Dashboard'}
              {activeTab === 'students' && (selectedStudent ? 'Student Profile' : 'Student Registry')}
              {activeTab === 'reports' && 'Data Reports'}
              {activeTab === 'audit' && 'Audit Trail'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
              {currentDeptUser.department} Department
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Portal Active</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && !selectedStudent && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <h3 className="text-2xl font-black tracking-tight mb-2">Welcome, {currentDeptUser.name}</h3>
                  <p className="text-indigo-200">You are viewing real-time data for the {currentDeptUser.department} department.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Students', value: stats.total, color: 'bg-slate-900', icon: Users },
                    { label: 'Active Students', value: stats.active, color: 'bg-indigo-600', icon: ShieldCheck },
                    { label: 'Completed Thesis', value: stats.completedThesis, color: 'bg-emerald-500', icon: CheckCircle2 },
                    { label: 'Pending Students', value: stats.pending, color: 'bg-amber-500', icon: ClipboardList },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.color} rounded-2xl p-6 text-white shadow-md relative overflow-hidden`}>
                      <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none"><stat.icon size={80} /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">{stat.label}</p>
                      <p className="text-4xl font-black">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STUDENT LIST */}
            {activeTab === 'students' && !selectedStudent && (
              <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">CNIC / Name</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reg No</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Degree</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deptStudents.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{student.name}</p>
                              <p className="text-xs text-slate-500">{student.cnic}</p>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600">{student.regNo || '—'}</td>
                            <td className="px-6 py-4 font-medium text-slate-600">{student.degree}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                student.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}>{student.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setSelectedStudent(student)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors inline-block">
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {deptStudents.length === 0 && (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No students found in this department.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STUDENT PROFILE (LIMITED EDIT) */}
            {selectedStudent && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-sm font-bold text-indigo-600 mb-4 hover:underline">
                  <X size={16} /> Back to List
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Read Only Info */}
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Info (Read-Only)</h3>
                    <div className="space-y-4">
                      {[['Name', selectedStudent.name], ['CNIC', selectedStudent.cnic], ['Reg No', selectedStudent.regNo], ['Degree', selectedStudent.degree], ['Status', selectedStudent.status], ['Thesis Level', selectedStudent.finalThesisStatus]].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                          <p className="font-bold text-slate-900">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Editable Info */}
                  <StudentProfileEditor student={selectedStudent} onUpdate={(updated) => {
                    updateStudent(updated);
                    setSelectedStudent(updated);
                    logDeptAction('Updated Student Profile', `Updated committee details for ${updated.name} (${updated.cnic})`);
                  }} />
                </div>
              </motion.div>
            )}

            {/* REPORTS */}
            {activeTab === 'reports' && !selectedStudent && (
              <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Active Students', filter: (s: any) => s.status === 'Active' },
                    { title: 'Completed Thesis', filter: (s: any) => ['Submitted', 'Approved'].includes(s.finalThesisStatus) },
                    { title: 'Pending Students', filter: (s: any) => s.status === 'Active' && !['Submitted', 'Approved'].includes(s.finalThesisStatus) },
                    { title: 'Thesis Enrolled (GS-4 Complete)', filter: (s: any) => ['Approved', 'Submitted'].includes(s.gs4Form) },
                    { title: 'Synopsis Enrolled', filter: (s: any) => ['Approved', 'Submitted'].includes(s.synopsis) },
                  ].map(report => (
                    <div key={report.title} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">{report.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{deptStudents.filter(report.filter).length} Records</p>
                      </div>
                      <button onClick={() => {
                        const data = deptStudents.filter(report.filter);
                        const csvContent = "data:text/csv;charset=utf-8," + 
                          ["CNIC,Name,RegNo,Degree,Status"].join(",") + "\n" +
                          data.map(e => `${e.cnic},${e.name},${e.regNo || ''},${e.degree},${e.status}`).join("\n");
                        const link = document.createElement("a");
                        link.setAttribute("href", encodeURI(csvContent));
                        link.setAttribute("download", `${report.title.replace(/ /g, '_')}_${currentDeptUser.department}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        logDeptAction('Downloaded Report', `Downloaded ${report.title} report`);
                      }} className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <Download size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AUDIT LOGS */}
            {activeTab === 'audit' && !selectedStudent && (
              <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {departmentAuditLogs.filter(log => log.department === currentDeptUser.department).map(log => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{log.action}</td>
                            <td className="px-6 py-4 text-slate-600">{log.details}</td>
                          </tr>
                        ))}
                        {departmentAuditLogs.filter(log => log.department === currentDeptUser.department).length === 0 && (
                          <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">No actions logged yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const StudentProfileEditor: React.FC<{ student: any, onUpdate: (s: any) => void }> = ({ student, onUpdate }) => {
  const [formData, setFormData] = useState({
    supervisorName: student.supervisorName || '',
    coSupervisor: student.coSupervisor || '',
    member1: student.member1 || '',
    member2: student.member2 || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...student, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
        <Edit2 size={16} className="text-indigo-600" /> Supervisory Committee (Editable)
      </h3>
      <div className="space-y-5 flex-1">
        {Object.keys(formData).map((key) => (
          <div key={key}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="text"
              value={(formData as any)[key]}
              onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-900 focus:bg-white transition-all shadow-sm"
              placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').trim()}`}
            />
          </div>
        ))}
      </div>
      <button type="submit" className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
        Save Changes
      </button>
    </form>
  );
};

export default DepartmentPortal;
