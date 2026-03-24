
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  UserPlus, 
  ShieldAlert, 
  Edit2, 
  Trash2, 
  Key, 
  X, 
  Save, 
  Search,
  User,
  CheckCircle2,
  Mail,
  AlertTriangle,
  UserX,
  ShieldCheck,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { StaffUser } from '../types';

const UserManagement: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff, currentUser, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Deletion specific states for the high-security modal
  const [deletingUser, setDeletingUser] = useState<{id: string, name: string} | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'DAS Officer' as StaffUser['role'],
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const stats = {
    total: staff.length,
    admins: staff.filter(s => s.role === 'System Administrator').length,
    coordinators: staff.filter(s => s.role === 'DAS Coordinator').length,
    officers: staff.filter(s => s.role === 'DAS Officer').length,
    operators: staff.filter(s => s.role === 'Data Entry Operator').length,
  };

  const filteredStaff = staff.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: StaffUser) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: ''
    });
    setIsModalOpen(true);
  };

  const initiateDelete = (user: StaffUser) => {
    // SECURITY CHECK: Prevent self-deletion or primary admin deletion via alert
    if (user.username === currentUser?.username || user.username === 'admin' || user.id === 'u1') {
      alert("Institutional Security Protocol: You cannot delete the primary administrator account or your own active session profile. These records are protected.");
      return;
    }
    setDeletingUser({ id: user.id, name: user.name });
  };

  const confirmPurge = () => {
    if (deletingUser) {
      deleteStaff(deletingUser.id);
      showNotification(`Account for ${deletingUser.name} has been permanently purged.`);
      setDeletingUser(null);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for unique username on creation
    if (!editingId && staff.some(s => s.username === formData.username)) {
      alert("Security Conflict: This username is already assigned to another access node.");
      return;
    }

    if (editingId) {
      const staffData = { 
        ...formData, 
        id: editingId
      };
      updateStaff(staffData as StaffUser);
      showNotification(`Staff record for ${formData.name} updated.`);
    } else {
      addStaff(formData as Omit<StaffUser, 'id'>);
      showNotification(`New access node provisioned for ${formData.name}.`);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setShowPassword(false);
    setFormData({ username: '', name: '', role: 'DAS Officer', password: '' });
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-sm border border-slate-100 dark:border-slate-700">
            {settings.institution.logo ? (
              <img 
                src={settings.institution.logo} 
                className="w-full h-full object-contain" 
                alt="Logo" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="text-slate-200 dark:text-slate-700" size={32} />
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Staff Directory</h1>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Identity & Permission Management Control</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ username: '', name: '', role: 'DAS Officer', password: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center space-x-3 px-8 md:px-10 py-4 md:py-5 bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95 w-full md:w-auto"
        >
          <UserPlus size={18} />
          <span>Provision Account</span>
        </button>
      </div>
      
      {/* System Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 no-print">
        <StatCard label="Total Personnel" value={stats.total} icon={User} color="indigo" />
        <StatCard label="Administrators" value={stats.admins} icon={ShieldCheck} color="emerald" />
        <StatCard label="Coordinators" value={stats.coordinators} icon={ShieldAlert} color="indigo" />
        <StatCard label="DAS Officers" value={stats.officers} icon={ShieldAlert} color="amber" />
        <StatCard label="Operators" value={stats.operators} icon={Edit2} color="slate" />
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-900/30 p-6 rounded-xl flex items-center space-x-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
          <div className="p-2 bg-emerald-500 text-white rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <span className="text-emerald-800 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">{successMessage}</span>
        </div>
      )}

      <div className="relative group max-w-xl no-print">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Filter staff by name, role or username..."
          className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm outline-none focus:border-indigo-600 font-bold text-sm placeholder:text-slate-300 dark:placeholder:text-slate-700 dark:text-white"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Identity Details</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Auth Privilege</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">Last Telemetry</th>
                <th className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 text-right">Registry Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map(user => {
                const isProtected = user.username === 'admin';
                return (
                  <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-5">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-sm ${
                           user.username === currentUser?.username 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                         }`}>
                           {user.name[0]}
                         </div>
                         <div>
                           <p className="font-black text-slate-900 dark:text-white text-base flex items-center">
                             {user.name}
                             {user.username === currentUser?.username && (
                               <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-tighter">You</span>
                             )}
                           </p>
                           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: {user.username}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        user.role === 'System Administrator' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50' :
                        user.role === 'DAS Coordinator' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/50' :
                        user.role === 'DAS Officer' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' :
                        user.role === 'Data Entry Operator' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase">
                        <ShieldAlert size={14} className={user.lastLogin ? 'text-amber-500' : 'text-slate-200 dark:text-slate-700'} />
                        <span>{user.lastLogin || 'Registry Pending'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end space-x-3">
                         <button 
                          onClick={() => handleEdit(user)}
                          className="p-3.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-slate-100/50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                          title="Modify Profile"
                         >
                           <Edit2 size={18} />
                         </button>
                         <button 
                          onClick={() => initiateDelete(user)}
                          disabled={isProtected}
                          className={`p-3.5 transition-all shadow-sm border border-slate-100/50 dark:border-slate-800 rounded-xl ${
                            isProtected 
                            ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-50' 
                            : 'text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                          title={isProtected ? 'Protected System Record' : 'Purge Account'}
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredStaff.map(user => {
           const isProtected = user.username === 'admin';
           return (
             <div key={user.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm p-6 flex flex-col space-y-5">
                <div className="flex items-start justify-between">
                   <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-inner ${
                         user.username === currentUser?.username ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                       }`}>
                         {user.name[0]}
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{user.name}</h3>
                         <div className="flex items-center space-x-2 mt-2">
                           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                             {user.username}
                           </p>
                           {user.username === currentUser?.username && (
                              <span className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">You</span>
                           )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role Tier</span>
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                        user.role === 'System Administrator' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50' :
                        user.role === 'DAS Coordinator' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/50' :
                        user.role === 'DAS Officer' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' :
                        user.role === 'Data Entry Operator' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {user.role}
                      </span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last Access</span>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{user.lastLogin || 'Never'}</span>
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                   <button 
                     onClick={() => handleEdit(user)}
                     className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                   >
                     <Edit2 size={14} /> Edit
                   </button>
                   <button 
                     onClick={() => initiateDelete(user)}
                     disabled={isProtected}
                     className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${
                       isProtected 
                       ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                       : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white'
                     }`}
                   >
                     <Trash2 size={14} /> Purge
                   </button>
                </div>
             </div>
           );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="px-10 py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-8 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-xl">
              <UserX size={48} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Matching Staff Members</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1">Refine your query or check identity spelling.</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Provisioning/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#0a0c10]/80 dark:bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-400 h-full max-h-[90vh] md:h-auto">
              <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
                 <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{editingId ? 'Modify Access' : 'New Identity'}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-2">Security Protocol</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                    <X size={24} />
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2 block">Full Legal Name</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                      <input 
                        required
                        autoFocus
                        className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-600 font-bold text-sm dark:text-white"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Staff Name"
                      />
                    </div>
                 </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2 block">Institutional Email (Google)</label>
                        <div className="relative">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                          <input 
                            required
                            type="email"
                            className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-600 font-bold text-sm dark:text-white"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            placeholder="user@cuvas.edu.pk"
                          />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2 block">Access Privilege</label>
                        <div className="relative">
                           <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                           <select 
                             className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-600 font-bold text-sm appearance-none cursor-pointer dark:text-white"
                             value={formData.role || ''}
                             onChange={e => setFormData({...formData, role: e.target.value as any})}
                           >
                             <option value="System Administrator">System Administrator</option>
                             <option value="DAS Coordinator">DAS Coordinator</option>
                             <option value="DAS Officer">DAS Officer</option>
                             <option value="Data Entry Operator">Data Entry Operator</option>
                             <option value="Auditor">Auditor / Read-Only</option>
                           </select>
                           <MoreVertical className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={16} />
                        </div>
                        <div className="mt-3 px-6 py-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                           <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold leading-relaxed">
                              <span className="uppercase tracking-widest mr-2 opacity-60">Privilege Scope:</span>
                              {formData.role === 'System Administrator' && 'Full system access including user management, settings, and database backups.'}
                              {formData.role === 'DAS Coordinator' && 'Manage all student records, sessions, and view audit logs. Cannot delete staff.'}
                              {formData.role === 'DAS Officer' && 'Add and edit student records. Access to basic reporting and exports.'}
                              {formData.role === 'Data Entry Operator' && 'Primary focus on data input and record updates. Limited system access.'}
                              {formData.role === 'Auditor' && 'Read-only access to all records and audit logs for monitoring purposes.'}
                           </p>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2 block">System Password</label>
                    <div className="relative group">
                       <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-600 transition-colors" size={18} />
                       <input 
                        required={!editingId}
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-16 pr-20 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-600 font-bold text-sm dark:text-white"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder={editingId ? 'Maintain Institutional Default' : '••••••••'}
                       />
                       <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                       >
                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                    </div>
                 </div>
              </form>

              <div className="p-8 md:p-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row items-center justify-end gap-4 md:gap-6 sticky bottom-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full md:w-auto px-10 py-5 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-[0.25em] hover:text-slate-900 dark:hover:text-white order-2 md:order-1">Cancel</button>
                <button type="submit" onClick={handleSubmit} className="w-full md:w-auto px-16 py-6 bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all flex items-center justify-center order-1 md:order-2">
                   <Save size={18} className="mr-3" />
                   <span>{editingId ? 'Commit Updates' : 'Activate Account'}</span>
                </button>
              </div>
           </div>
        </div>
      )}

      {/* High-Security Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400 border border-white/10">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security Purge Protocol</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  Are you absolutely certain you want to permanently delete the profile for <span className="text-slate-900 dark:text-white font-black">"{deletingUser.name}"</span>?
                </p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest pt-2">Warning: Institutional access will be revoked immediately.</p>
              </div>
            </div>
            <div className="p-10 bg-slate-50 dark:bg-slate-950 flex gap-4">
              <button 
                type="button"
                onClick={() => setDeletingUser(null)} 
                className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Abort
              </button>
              <button 
                type="button"
                onClick={confirmPurge} 
                className="flex-1 py-5 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm"
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
    slate: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800',
  };

  return (
    <div className={`p-6 rounded-xl border ${colors[color]} shadow-sm flex items-center space-x-5 transition-all`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
        <p className="text-2xl font-black mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default UserManagement;
