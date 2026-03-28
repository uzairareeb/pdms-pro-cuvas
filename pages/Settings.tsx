
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Building,
  Calendar,
  ShieldCheck, 
  CheckCircle, 
  Database,
  Upload,
  ImageIcon,
  X,
  Save,
  Check,
  Globe,
  Lock,
  Zap,
  RefreshCw,
  Activity,
  Layers,
  FileText,
  Shield,
  History,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Download,
  Terminal,
  Server,
  Cloud,
  Cpu,
  Fingerprint,
  Clock,
  Trash2,
  ClipboardList,
  TrendingUp,
  Search,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import Tooltip from '../components/Tooltip';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none">
      <Icon size={80} className="text-white" />
    </div>
    <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none mb-1 uppercase">{value}</h4>
  </div>
);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { 
    settings, updateSettings, backupDatabase, isDatabaseConnected, notify 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('institutional');
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    notify("Institutional configurations committed successfully.", "success");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify("Asset exceeds 2MB threshold. Compression required.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLocalSettings({
          ...localSettings,
          institution: {
            ...localSettings.institution,
            logo: result
          }
        });
        notify("Institutional logo cached locally. Commit to save.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalSettings({
      ...localSettings,
      institution: {
        ...localSettings.institution,
        logo: ""
      }
    });
    notify("Institutional logo purged from buffer.", "success");
  };

  const tabs = [
    { id: 'institutional', label: 'Identity', icon: Building, desc: 'Institutional Branding' },
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Access Protocols' },
    { id: 'milestones', label: 'Logic', icon: Zap, desc: 'Academic Milestones' },
    { id: 'databases', label: 'Infrastructure', icon: Server, desc: 'Cloud Data Hub' },
    { id: 'maintenance', label: 'Telemetry', icon: Activity, desc: 'Backups & Health' },
  ];

  const maintenanceStats = useMemo(() => ({
    version: localSettings.maintenance.version,
    lastBackup: localSettings.maintenance.lastBackup,
    connectionStatus: isDatabaseConnected ? 'Nodes Active' : 'Offline',
    integrityScore: '98.4%'
  }), [localSettings, isDatabaseConnected]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-7xl mx-auto space-y-10 pb-20 px-4">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
             <img src={localSettings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">System Architect</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional Configuration & Protocol Management Hub</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center justify-center gap-3 px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 group"
        >
          <Save size={18} />
          <span>Commit Changes</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Registry Health" value={maintenanceStats.connectionStatus} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={Activity} />
        <KpiCard label="Security Tier" value="Institutional" gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={Fingerprint} />
        <KpiCard label="Storage Scale" value="Cloud Native" gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" icon={Cloud} />
        <KpiCard label="System Core" value={`v${maintenanceStats.version}`} gradient="linear-gradient(135deg,#64748b 0%,#94a3b8 100%)" icon={Cpu} />
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        {/* ── Adaptive Sidebar ─────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 p-8 space-y-6">
          <div className="space-y-1">
             <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4">Configuration Sections</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative overflow-hidden ${
                      activeTab === tab.id 
                        ? 'bg-white border border-indigo-100 shadow-sm text-indigo-600' 
                        : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {activeTab === tab.id && <motion.div layoutId="tab-pill" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-full" />}
                    <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                       <tab.icon size={18} />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{tab.desc}</p>
                    </div>
                  </button>
                ))}
             </div>
          </div>
          
          <div className="hidden lg:block pt-10 mt-10 border-t border-slate-200/60">
             <div className="bg-white/60 rounded-2xl p-6 border border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Protocol Guard Active</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">All changes are logged in the persistent audit trail for institutional security.</p>
             </div>
          </div>
        </div>

        {/* ── Tab Content Container ────────────────────────────────────────── */}
        <div className="flex-1 p-6 lg:p-14 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
               key={activeTab}
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               transition={{ duration: 0.2 }}
               className="space-y-12"
            >
              {activeTab === 'institutional' && (
                <div className="space-y-12">
                  <SectionHeader title="Institutional Identity" desc="Primary identifiers and branding assets for the university." icon={Building} />
                  
                  <div className="bg-slate-50/50 rounded-3xl p-8 lg:p-12 border border-slate-100 space-y-10">
                     <div className="flex flex-col lg:flex-row gap-12 items-center">
                        <div className="relative group shrink-0">
                           <div className="h-40 w-40 md:h-48 md:w-48 rounded-[32px] bg-white border border-slate-100 p-6 flex items-center justify-center shadow-sm overflow-hidden group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                              {localSettings.institution.logo ? (
                                <img src={localSettings.institution.logo} className="max-h-full max-w-full object-contain" alt="Logo Preview" />
                              ) : (
                                <div className="text-slate-100"><ImageIcon size={64} /></div>
                              )}
                           </div>
                           {localSettings.institution.logo && (
                             <button onClick={removeLogo} className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-rose-600 transition-all hover:rotate-90 active:scale-90">
                                <X size={20} />
                             </button>
                           )}
                        </div>

                        <div className="flex-1 space-y-6 text-center lg:text-left">
                           <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Institutional Asset</h4>
                              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                                Upload a high-resolution PNG or JPG asset. Minimum 512x512 recommended for crisp report rendering across GS-Forms.
                              </p>
                           </div>
                           <label className="inline-flex items-center gap-3 px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10">
                              <Upload size={18} />
                              <span>Provision Logo Asset</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                           </label>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <Field label="University Name" value={localSettings.institution.name} icon={Building}
                      onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, name: v}})} />
                    <Field label="Management Office" value={localSettings.institution.directorate} icon={Layers}
                      onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, directorate: v}})} />
                    <Field label="Administrative Contact" value={localSettings.institution.email} icon={Globe}
                      onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, email: v}})} placeholder="admin@domain.edu.pk" />
                    <Field label="Current Academic Year" value={localSettings.institution.academicYear} icon={History}
                      onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, academicYear: v}})} placeholder="2025-26" />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-12">
                  <SectionHeader title="Security Protocol" desc="Core authentication limits and record protection logic." icon={ShieldCheck} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <Field label="Session TTL (Minutes)" type="number" value={localSettings.security.sessionTimeout.toString()} icon={Clock}
                      onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, sessionTimeout: parseInt(v)}})} 
                      tooltip="Auto-logout duration after terminal inactivity." />
                    <Field label="Max Auth Retry Count" type="number" value={localSettings.security.maxLoginAttempts.toString()} icon={Lock}
                      onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, maxLoginAttempts: parseInt(v)}})} 
                      tooltip="Threshold before temporary IP throttle." />
                    <ToggleField label="Immutable Record Locking" value={localSettings.security.enableRecordLocking} icon={Shield}
                      desc="Prevent modification of sanctioned scholar records."
                      onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, enableRecordLocking: v}})} />
                    <ToggleField label="Registry Deletion Rights" value={localSettings.security.enableDeletion} icon={Trash2}
                      desc="Allow permanent removal of archival records."
                      onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, enableDeletion: v}})} />
                  </div>
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="space-y-12">
                  <SectionHeader title="Academic Logic Matrix" desc="Enable or disable progress gates for the postgraduate degree timeline." icon={Zap} />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ToggleMilestone 
                      label="GS-2 Matrix" desc="Postgraduate coursework verification." icon={FileText}
                      value={localSettings.milestones.gs2.enabled}
                      onChange={v => setLocalSettings({...localSettings, milestones: {...localSettings.milestones, gs2: {enabled: v}}})} />
                    <ToggleMilestone 
                      label="Synopsis Hub" desc="Proposal submission & departmental vetting." icon={ClipboardList}
                      value={localSettings.milestones.synopsis.enabled}
                      onChange={v => setLocalSettings({...localSettings, milestones: {...localSettings.milestones, synopsis: {enabled: v}}})} />
                    <ToggleMilestone 
                      label="GS-4 Seminars" desc="Formal progress reports & public seminars." icon={TrendingUp}
                      value={localSettings.milestones.gs4.enabled}
                      onChange={v => setLocalSettings({...localSettings, milestones: {...localSettings.milestones, gs4: {enabled: v}}})} />
                    <ToggleMilestone 
                      label="Semi-Final Review" desc="Internal review & plagiarism scan." icon={Search}
                      value={localSettings.milestones.semiFinal.enabled}
                      onChange={v => setLocalSettings({...localSettings, milestones: {...localSettings.milestones, semiFinal: {enabled: v}}})} />
                    <ToggleMilestone 
                      label="Final Defense" desc="The final exam before external evaluation." icon={UserCheck}
                      value={localSettings.milestones.final.enabled}
                      onChange={v => setLocalSettings({...localSettings, milestones: {...localSettings.milestones, final: {enabled: v}}})} />
                    <ToggleMilestone 
                      label="COE Dispatch" desc="Result transmission to Controller office." icon={CheckCircle2}
                      value={localSettings.milestones.coe.enabled}
                      onChange={v => setLocalSettings({...localSettings, milestones: {...localSettings.milestones, coe: {enabled: v}}})} />
                    
                    {/* Link to Academic Sessions */}
                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px] flex flex-col justify-between space-y-8 hover:bg-white hover:border-indigo-300 transition-all group lg:col-span-2 xl:col-span-1 shadow-sm">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                             <Calendar size={28} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Academic Sessions</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Timeline Management</p>
                          </div>
                       </div>
                       <button onClick={() => navigate('/settings/sessions')} className="w-full py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3">
                          <History size={18} /> Manage Timeline Horizons
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'databases' && (
                <div className="space-y-12">
                  <SectionHeader title="Infrastructure Control" desc="Persistent cloud storage & decentralized node management." icon={Server} />
                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-[#0f172a] rounded-[32px] p-10 lg:p-14 text-white relative overflow-hidden flex flex-col lg:flex-row gap-12 items-center">
                       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                       <div className="shrink-0 relative">
                          <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center border-4 ${isDatabaseConnected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'} shadow-2xl`}>
                             <Database size={48} className={isDatabaseConnected ? 'text-emerald-400' : 'text-rose-400'} />
                          </div>
                          <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isDatabaseConnected ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-lg`}>
                             {isDatabaseConnected ? 'Connected' : 'Disconnected'}
                          </div>
                       </div>
                       
                       <div className="flex-1 space-y-6 text-center lg:text-left">
                          <div>
                             <h4 className="text-2xl font-black tracking-tight uppercase">Supabase Cloud Infrastructure</h4>
                             <p className="text-slate-400 text-xs font-medium mt-3 leading-relaxed max-w-xl">
                               Primary persistent layer active. All degree records, audit logs, and institutional security tokens are synced to your dedicated Supabase instance.
                             </p>
                          </div>
                          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                             <button onClick={() => navigate('/settings/database')} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3">
                                <Database size={18} /> Direct Control Panel
                             </button>
                             <button className="px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10 flex items-center gap-3">
                                <RefreshCw size={18} /> Sync Registry
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="space-y-12">
                  <SectionHeader title="Telemetry & Health" desc="System extraction protocols and backup archival." icon={Activity} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-10 space-y-8">
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100"><Download size={24} /></div>
                           <div>
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Backup Archival</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Data Retention Strategy</p>
                           </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Extract a full encrypted JSON backup for archival purposes. This routine ensures institucional data redundancy.</p>
                        <div className="pt-4 flex flex-col space-y-3">
                           <button onClick={backupDatabase} className="w-full py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3">
                              <Download size={18} /> High-Security Extraction
                           </button>
                           <p className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest">Last routine extraction performed on {maintenanceStats.lastBackup}</p>
                        </div>
                     </div>

                     <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-10 space-y-8">
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-slate-100"><Terminal size={24} /></div>
                           <div>
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System Engine</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Build Integrity Telemetry</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white p-5 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Version</p>
                              <p className="text-lg font-black text-slate-900 mt-1 uppercase">v{maintenanceStats.version}</p>
                           </div>
                           <div className="bg-white p-5 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registry Sync</p>
                              <p className="text-lg font-black text-emerald-500 mt-1 uppercase">Optimal</p>
                           </div>
                        </div>
                        <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-3">
                           <CheckCircle size={18} /> Verify System Integrity
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, desc, icon: Icon }: any) => (
  <div className="border-b border-slate-100 pb-8 flex items-start gap-6">
    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
       <Icon size={24} />
    </div>
    <div>
      <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{title}</h3>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{desc}</p>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", readOnly = false, tooltip, placeholder, icon: Icon }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 mb-1.5 overflow-visible">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{label}</label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <div className="relative group">
       {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"><Icon size={16} /></div>}
       <input 
        type={type}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 ${Icon ? 'pl-11' : ''} py-4 text-sm font-bold text-slate-900 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  </div>
);

const ToggleField = ({ label, value, onChange, desc, icon: Icon }: any) => (
  <div className="flex items-start justify-between p-8 bg-slate-50 border border-slate-100 rounded-[24px] hover:border-indigo-100 transition-all group">
    <div className="flex gap-5">
       <div className={`p-3 rounded-xl transition-colors ${value ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-300 shadow-sm'}`}>
          <Icon size={20} />
       </div>
       <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block leading-none">{label}</span>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter leading-relaxed max-w-[200px]">{desc}</p>
       </div>
    </div>
    <button 
      onClick={() => onChange(!value)}
      className={`w-14 h-8 rounded-full transition-all relative shrink-0 shadow-inner ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <motion.div 
        animate={{ x: value ? 24 : 4 }}
        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" 
      />
    </button>
  </div>
);

const ToggleMilestone = ({ label, desc, value, onChange, icon: Icon }: any) => (
  <div className="p-8 bg-white border border-slate-100 rounded-[32px] flex flex-col justify-between space-y-8 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
    {value && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10" />}
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${value ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
           <Icon size={20} />
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${value ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
           {value ? 'Active Step' : 'Inactive'}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{label}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
    
    <button 
      onClick={() => onChange(!value)}
      className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${value ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
    >
      {value ? <Check size={14} /> : <Zap size={14} />}
      {value ? 'Deselect Step' : 'Activate Protocol'}
    </button>
  </div>
);

export default Settings;
