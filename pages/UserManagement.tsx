
import React, { useState, useMemo } from 'react';
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
  Users,
  CheckCircle2,
  Mail,
  AlertTriangle,
  UserX,
  ShieldCheck,
  MoreVertical,
  Eye,
  EyeOff,
  Activity,
  UserCheck,
  Shield,
  Layers,
  ChevronRight,
  ArrowRight,
  Fingerprint,
  RotateCcw
} from 'lucide-react';
import { StaffUser, ModulePermissions, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const MODULE_LIST = [
  'Dashboard', 'StudentRecords', 'StudentRegistration', 'BulkUpload', 
  'DataExport', 'AuditTrail', 'SystemReports', 'UserManagement', 
  'Settings', 'ReadmissionRegistry', 'SynopsisSubmission', 'ThesisTracking'
];

const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, ModulePermissions>> = {
  Admin: {
    Dashboard: { view: true, create: true, edit: true, delete: true },
    StudentRecords: { view: true, create: true, edit: true, delete: true },
    StudentRegistration: { view: true, create: true, edit: true, delete: true },
    BulkUpload: { view: true, create: true, edit: true, delete: true },
    DataExport: { view: true, create: true, edit: true, delete: true },
    AuditTrail: { view: true, create: true, edit: true, delete: true },
    SystemReports: { view: true, create: true, edit: true, delete: true },
    UserManagement: { view: true, create: true, edit: true, delete: true },
    Settings: { view: true, create: true, edit: true, delete: true },
    ReadmissionRegistry: { view: true, create: true, edit: true, delete: true },
    SynopsisSubmission: { view: true, create: true, edit: true, delete: true },
    ThesisTracking: { view: true, create: true, edit: true, delete: true },
  },
  Editor: {
    Dashboard: { view: true, create: true, edit: true, delete: false },
    StudentRecords: { view: true, create: true, edit: true, delete: false },
    StudentRegistration: { view: true, create: true, edit: true, delete: false },
    BulkUpload: { view: true, create: true, edit: true, delete: false },
    DataExport: { view: true, create: true, edit: true, delete: false },
    AuditTrail: { view: true, create: false, edit: false, delete: false },
    SystemReports: { view: true, create: true, edit: true, delete: false },
    UserManagement: { view: false, create: false, edit: false, delete: false },
    Settings: { view: false, create: false, edit: false, delete: false },
    ReadmissionRegistry: { view: true, create: true, edit: true, delete: false },
    SynopsisSubmission: { view: true, create: true, edit: true, delete: false },
    ThesisTracking: { view: true, create: true, edit: true, delete: false },
  },
  Viewer: {
    Dashboard: { view: true, create: false, edit: false, delete: false },
    StudentRecords: { view: true, create: false, edit: false, delete: false },
    StudentRegistration: { view: false, create: false, edit: false, delete: false },
    BulkUpload: { view: false, create: false, edit: false, delete: false },
    DataExport: { view: false, create: false, edit: false, delete: false },
    AuditTrail: { view: false, create: false, edit: false, delete: false },
    SystemReports: { view: true, create: false, edit: false, delete: false },
    UserManagement: { view: false, create: false, edit: false, delete: false },
    Settings: { view: false, create: false, edit: false, delete: false },
    ReadmissionRegistry: { view: true, create: false, edit: false, delete: false },
    SynopsisSubmission: { view: true, create: false, edit: false, delete: false },
    ThesisTracking: { view: true, create: false, edit: false, delete: false },
  }
};

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none">
      <Icon size={80} className="text-white" />
    </div>
    <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none mb-1">{value}</h4>
  </div>
);

// ─── FilterSelect Component ───────────────────────────────────────────────────
const FilterSelect = ({ label, value, icon: Icon, options, onChange }: any) => {
  const active = Boolean(value && value !== 'All');
  return (
    <div className="flex flex-col gap-1.5 flex-1 max-w-[200px]">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
          <Icon size={14} />
        </div>
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={`w-full pl-10 pr-9 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all border
            ${active
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 focus:ring-4 focus:ring-indigo-500/10'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/8'
            }`}
        >
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt === 'All' ? `All ${label}s` : opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff, currentUser, settings, notify } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<{id: string, name: string} | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'Viewer' as StaffUser['role'],
    password: '',
    permissions: DEFAULT_PERMISSIONS['Viewer']
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomizingPermissions, setIsCustomizingPermissions] = useState(false);

  const stats = useMemo(() => ({
    total: staff.length,
    admins: staff.filter(s => s.role === 'Admin').length,
    editors: staff.filter(s => s.role === 'Editor').length,
    viewers: staff.filter(s => s.role === 'Viewer').length,
  }), [staff]);

  const filteredStaff = useMemo(() => staff.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? !!user.lastLogin : !user.lastLogin);
    return matchesSearch && matchesRole && matchesStatus;
  }), [staff, searchTerm, roleFilter, statusFilter]);

  const handleRoleChange = (role: StaffUser['role']) => {
    setFormData({ ...formData, role, permissions: DEFAULT_PERMISSIONS[role] });
    setIsCustomizingPermissions(false);
  };

  const handlePermissionChange = (module: string, field: keyof ModulePermissions, value: boolean) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: { ...formData.permissions[module], [field]: value }
      }
    });
    setIsCustomizingPermissions(true);
  };

  const handleEdit = (user: StaffUser) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: '',
      permissions: user.permissions || DEFAULT_PERMISSIONS[user.role]
    });
    setIsCustomizingPermissions(!!user.permissions);
    setIsModalOpen(true);
  };

  const initiateDelete = (user: StaffUser) => {
    if (user.username === currentUser?.username || user.username === 'admin' || user.id === 'u1') {
      notify("Institutional Security Protocol: You cannot purge protected records or your own session.", "error");
      return;
    }
    setDeletingUser({ id: user.id, name: user.name });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && staff.some(s => s.username === formData.username)) {
      notify("Security Conflict: This username is already assigned.", "error");
      return;
    }
    if (editingId) {
      updateStaff({ ...formData, id: editingId, permissions: isCustomizingPermissions ? formData.permissions : undefined });
      notify(`Identity for ${formData.name} updated.`, "success");
    } else {
      addStaff({ ...formData, permissions: isCustomizingPermissions ? formData.permissions : undefined } as Omit<StaffUser, 'id'>);
      notify(`New access node provisioned for ${formData.name}.`, "success");
    }
    setIsModalOpen(false); setEditingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8 pb-20 px-4 max-w-7xl mx-auto">
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
             <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Identity Control</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Personnel Registry & Permission Management · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingId(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-3 px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 group"
        >
          <UserPlus size={18} />
          <span>Provision Account</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Total Personnel" value={stats.total} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={Users} />
        <KpiCard label="Admin Tier" value={stats.admins} gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={ShieldCheck} />
        <KpiCard label="Editor Access" value={stats.editors} gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" icon={Shield} />
        <KpiCard label="Public Viewers" value={stats.viewers} gradient="linear-gradient(135deg,#64748b 0%,#94a3b8 100%)" icon={Eye} />
      </div>

      {/* ── Search & Filter Engine ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 flex flex-col md:flex-row items-end gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex-1 w-full space-y-1.5">
           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Search Identities</label>
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Name or Username..." 
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="flex flex-wrap gap-5 w-full md:w-auto">
           <FilterSelect label="Privilege Tier" icon={Layers} value={roleFilter} options={['All', 'Admin', 'Editor', 'Viewer']} onChange={setRoleFilter} />
           <FilterSelect label="Status Hub" icon={Activity} value={statusFilter} options={['All', 'Active', 'Inactive']} onChange={setStatusFilter} />
           <button onClick={() => { setSearchTerm(''); setRoleFilter('All'); setStatusFilter('All'); }} className="px-6 py-3.5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 mb-[1px]">
             <RotateCcw size={14} /> Reset
           </button>
        </div>
      </div>

      {/* ── Table & List ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[300px]">Identity Details</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[200px]">Privilege Tier</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 min-w-[200px]">Status Node</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right">Registry Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.map(user => {
                const isActive = !!user.lastLogin;
                const isProtected = user.username === 'admin';
                return (
                  <tr key={user.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm transition-all group-hover:scale-110 ${user.username === currentUser?.username ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                            {user.name[0]}
                         </div>
                         <div>
                            <p className="text-base font-black text-slate-900 tracking-tight flex items-center">
                               {user.name}
                               {user.username === currentUser?.username && <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[7.5px] font-black uppercase tracking-tighter shadow-sm animate-pulse">Session active</span>}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {user.username}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className={`px-4 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                         user.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                         user.role === 'Editor' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         'bg-slate-50 text-slate-500 border-slate-200'
                       }`}>
                         {user.role === 'Admin' ? <ShieldCheck size={12} /> : user.role === 'Editor' ? <Shield size={12} /> : <Eye size={12} />}
                         {user.role}
                       </span>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`px-3 py-1.5 rounded-2xl flex items-center gap-2 border text-[8.5px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                             {isActive ? 'Active Node' : 'Inactive Agent'}
                          </div>
                          {user.lastLogin && <span className="text-[10px] font-bold text-slate-300 tabular-nums uppercase">{user.lastLogin}</span>}
                       </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(user)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm transition-all active:scale-90" title="Modify Node">
                             <Edit2 size={16} />
                          </button>
                          <button onClick={() => initiateDelete(user)} disabled={isProtected} className={`p-3 bg-white border border-slate-200 rounded-xl shadow-sm transition-all active:scale-90 ${isProtected ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:border-rose-200'}`} title={isProtected ? 'Protected Protocol' : 'Purge Node'}>
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden p-6 space-y-4">
           {filteredStaff.map(user => (
             <div key={user.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">{user.name[0]}</div>
                   <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none truncate">{user.name}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {user.username}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Privilege</p>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{user.role}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Status Node</p>
                      <p className={`text-[10px] font-black uppercase tracking-tight ${!!user.lastLogin ? 'text-emerald-500' : 'text-slate-400'}`}>{!!user.lastLogin ? 'Active' : 'Inactive'}</p>
                   </div>
                </div>
                <div className="flex gap-3 pt-2">
                   <button onClick={() => handleEdit(user)} className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                      <Edit2 size={14} /> Profile
                   </button>
                   <button onClick={() => initiateDelete(user)} disabled={user.username === 'admin'} className="flex-1 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-20">
                      <Trash2 size={14} /> Purge
                   </button>
                </div>
             </div>
           ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="py-24 flex flex-col items-center text-center space-y-6">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200"><UserX size={40} /></div>
             <div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Matching Identities</h4>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Adjust your scopes or reset the registry filter.</p>
             </div>
          </div>
        )}
      </div>

      {/* ── Provisioning Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 backdrop-blur-md">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{editingId ? 'Identity Calibration' : 'Provision New Identity'}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Security Hub Access Protocol</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-rose-500 rounded-xl transition-all shadow-sm active:scale-95"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                   <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Legal Name</label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                              <input required className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 font-black text-[13px] tracking-tight text-slate-900 transition-all placeholder:text-slate-300" 
                              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Official Surname & First" />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Access ID (Email)</label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                              <input required type="email" className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 font-black text-[13px] tracking-tight text-slate-900 transition-all placeholder:text-slate-300"
                              value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="id@domain.com" />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Security Tier</label>
                            <div className="relative group">
                               <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                               <select className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 font-black text-[10px] uppercase tracking-widest text-slate-900 appearance-none cursor-pointer overflow-hidden transition-all"
                               value={formData.role || ''} onChange={e => handleRoleChange(e.target.value as any)}>
                                 <option value="Admin">System Administrator</option>
                                 <option value="Editor">Data Controller (Editor)</option>
                                 <option value="Viewer">Institutional Viewer</option>
                               </select>
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300"><ChevronRight size={14} className="rotate-90" /></div>
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assigned Passkey</label>
                            <div className="relative group">
                               <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                               <input required={!editingId} type={showPassword ? "text" : "password"} className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 font-bold text-sm tracking-widest text-slate-900 transition-all placeholder:text-slate-300"
                               value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingId ? 'Maintain Institutional Pass' : '••••••••'} />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"><Eye size={16} /></button>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-slate-50 space-y-6">
                      <div className="flex items-center justify-between">
                         <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Module Access Control</h4>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Granular Permission Matrix</p>
                         </div>
                         <div className="flex items-center gap-2">
                           {isCustomizingPermissions && <button type="button" onClick={() => handleRoleChange(formData.role)} className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all">Reset Matrix</button>}
                           <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isCustomizingPermissions ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>{isCustomizingPermissions ? 'Custom Matrix' : 'Role Default'}</span>
                         </div>
                      </div>
                      
                      <div className="overflow-hidden border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-[9px] border-separate border-spacing-0">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-1/3 text-[8px]">Academic Unit</th>
                              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center border-b border-l border-slate-100 w-1/6 text-[8px]">View</th>
                              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center border-b border-l border-slate-100 w-1/6 text-[8px]">Create</th>
                              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center border-b border-l border-slate-100 w-1/6 text-[8px]">Edit</th>
                              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center border-b border-l border-slate-100 w-1/6 text-[8px]">Purge</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {MODULE_LIST.map(mod => {
                               const perms = formData.permissions[mod] || { view: false, create: false, edit: false, delete: false };
                               return (
                                 <tr key={mod} className="hover:bg-slate-50 transition-colors">
                                   <td className="px-6 py-3 font-bold text-slate-600 tracking-tight">{mod.replace(/([A-Z])/g, ' $1').trim()}</td>
                                   <td className="px-6 py-3 text-center border-l border-slate-50"><PermissionCheckbox checked={perms.view} onChange={v => handlePermissionChange(mod, 'view', v)} /></td>
                                   <td className="px-6 py-3 text-center border-l border-slate-50"><PermissionCheckbox checked={perms.create} onChange={v => handlePermissionChange(mod, 'create', v)} /></td>
                                   <td className="px-6 py-3 text-center border-l border-slate-50"><PermissionCheckbox checked={perms.edit} onChange={v => handlePermissionChange(mod, 'edit', v)} /></td>
                                   <td className="px-6 py-3 text-center border-l border-slate-50"><PermissionCheckbox checked={perms.delete} onChange={v => handlePermissionChange(mod, 'delete', v)} /></td>
                                 </tr>
                               );
                             })}
                          </tbody>
                        </table>
                      </div>
                   </div>
                </form>

                <div className="p-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-end gap-5 bg-slate-50/50">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest transition-colors order-2 md:order-1">Discard Request</button>
                   <button onClick={handleSubmit} className="px-12 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-4 w-full md:w-auto order-1 md:order-2">
                      <Save size={18} />
                      <span>{editingId ? 'Commit Identities' : 'Activate Access Node'}</span>
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Purge Confirmation ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeletingUser(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
               <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={36} /></div>
                  <div className="space-y-2">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Purge Protocol</h3>
                     <p className="text-slate-500 text-sm font-medium leading-relaxed">Identity for <span className="font-black text-slate-900">"{deletingUser.name}"</span> will be permanently revoked from the system registry. Proceed with caution.</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 flex gap-4">
                  <button onClick={() => setDeletingUser(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                  <button onClick={() => { deleteStaff(deletingUser.id); notify(`Identity purged.`, "success"); setDeletingUser(null); }} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md">Confirm Purge</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PermissionCheckbox = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto ${checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-200 text-transparent'}`}>
    <CheckCircle2 size={12} className={checked ? 'opacity-100' : 'opacity-0'} />
  </button>
);

export default UserManagement;
