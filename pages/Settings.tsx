
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Building, 
  ShieldCheck, 
  CheckCircle, 
  Database,
  Upload,
  ImageIcon,
  X,
  Save,
  Check
} from 'lucide-react';
import Tooltip from '../components/Tooltip';

import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { 
    settings, updateSettings, backupDatabase, isDatabaseConnected 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('institutional');
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size is too large. Please upload a logo smaller than 2MB.");
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
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalSettings({
      ...localSettings,
      institution: {
        ...localSettings.institution,
        logo: "/logo.jpg"
      }
    });
  };

  const tabs = [
    { id: 'institutional', label: 'Institution', icon: Building },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'milestones', label: 'Milestones', icon: CheckCircle },
    { id: 'databases', label: 'Databases', icon: Database },
    { id: 'maintenance', label: 'Backups', icon: Database },
  ];

  const [testStatus, setTestStatus] = useState<{ [key: string]: { loading: boolean, message: string, success?: boolean } }>({});

  const testConnection = async (type: string) => {
    setTestStatus(prev => ({ ...prev, [type]: { loading: true, message: 'Testing connection...' } }));
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned a non-JSON response: ${text.slice(0, 50)}...`);
      }

      setTestStatus(prev => ({ 
        ...prev, 
        [type]: { loading: false, message: data.message, success: data.success } 
      }));
    } catch (error: any) {
      setTestStatus(prev => ({ 
        ...prev, 
        [type]: { loading: false, message: error.message || 'Connection failed', success: false } 
      }));
    }
  };

  const supabaseSql = `-- SQL to run in Supabase SQL Editor
-- Create a test table for connection verification
CREATE TABLE IF NOT EXISTS _test_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example Students Table
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  sr_no TEXT,
  cnic TEXT,
  name TEXT,
  father_name TEXT,
  reg_no TEXT,
  gender TEXT,
  contact_number TEXT,
  degree TEXT,
  session TEXT,
  department TEXT,
  programme TEXT,
  current_semester INTEGER,
  status TEXT,
  supervisor_name TEXT,
  co_supervisor TEXT,
  member1 TEXT,
  member2 TEXT,
  thesis_id TEXT,
  synopsis TEXT,
  synopsis_submission_date TEXT,
  gs2_course_work TEXT,
  gs4_form TEXT,
  semi_final_thesis_status TEXT,
  semi_final_thesis_submission_date TEXT,
  final_thesis_status TEXT,
  final_thesis_submission_date TEXT,
  thesis_sent_to_coe TEXT,
  coe_submission_date TEXT,
  validation_status TEXT,
  validation_date TEXT,
  comments TEXT,
  is_locked BOOLEAN DEFAULT false
);`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700 relative pb-20">
      {showSavedToast && (
        <div className="fixed top-24 right-4 md:right-10 z-[100] bg-emerald-600 text-white px-6 md:px-8 py-4 rounded-xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right-10">
          <Check size={20} className="stroke-[3]" />
          <span className="text-xs font-bold uppercase tracking-widest">Settings Saved</span>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-sm">
          <img 
            src={settings.institution.logo || null} 
            className="w-full h-full object-contain" 
            alt="Logo" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Manage University and System Configurations</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[auto] lg:min-h-[700px]">
        {/* Adaptive Tab Sidebar / Header */}
        <div className="w-full lg:w-80 bg-slate-50/50 dark:bg-slate-900/50 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-4 md:p-8 space-y-0 lg:space-y-2">
          <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center lg:justify-start space-x-3 px-4 md:px-6 py-3 md:py-4 rounded-xl transition-all font-bold text-[9px] md:text-[10px] uppercase tracking-widest ${
                  activeTab === tab.id ? 'bg-[#0a0c10] dark:bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="hidden lg:block mt-12 pt-12 border-t border-slate-200 dark:border-slate-800">
             <button 
              onClick={handleSave}
              className="w-full bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl py-5 flex items-center justify-center space-x-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95"
             >
               <Save size={16} />
               <span>Save Changes</span>
             </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 md:p-14 overflow-y-auto max-h-[800px] custom-scrollbar">
          {activeTab === 'institutional' && (
            <div className="space-y-10 md:space-y-12">
              <SectionHeader title="University Details" desc="General information about your institution." />
              
              <div className="p-6 md:p-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">University Logo</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Upload logo for reports and dashboard</p>
                  </div>
                  <button 
                    onClick={handleSave}
                    className="w-full md:w-auto bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl py-3.5 px-6 flex items-center justify-center space-x-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95 lg:hidden"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 pt-4">
                  {localSettings.institution.logo ? (
                    <div className="relative group shrink-0">
                      <div className="h-32 w-32 md:h-40 md:w-40 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 flex items-center justify-center overflow-hidden">
                        <img src={localSettings.institution.logo || null} className="max-h-full max-w-full object-contain" alt="Logo Preview" />
                      </div>
                      <button 
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Delete Logo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 md:h-40 md:w-40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 space-y-3 shrink-0">
                       <ImageIcon size={32} className="opacity-30" />
                       <span className="text-[8px] font-bold uppercase tracking-tighter">No Logo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-5 w-full text-center md:text-left">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logo Upload</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm mx-auto md:mx-0">Upload your university logo. It will appear on all official documents and on the system dashboard.</p>
                    </div>
                    <label className="inline-flex items-center justify-center space-x-3 px-10 py-5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all w-full md:w-auto">
                      <Upload size={18} />
                      <span>Choose File</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <Field label="University Name" value={localSettings.institution.name} 
                  onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, name: v}})} />
                <Field label="Department / Office Name" value={localSettings.institution.directorate} 
                  onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, directorate: v}})} />
                <Field label="Contact Email Address" value={localSettings.institution.email} 
                  onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, email: v}})} />
                <Field label="Academic Year" value={localSettings.institution.academicYear} 
                  onChange={v => setLocalSettings({...localSettings, institution: {...localSettings.institution, academicYear: v}})} />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 md:space-y-12">
              <SectionHeader title="Security Settings" desc="Configure login sessions and record protections." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <Field label="Auto-Logout Time (Minutes)" type="number" value={localSettings.security.sessionTimeout.toString()} 
                  onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, sessionTimeout: parseInt(v)}})} 
                  tooltip="The duration of inactivity before a user is automatically signed out."
                />
                <Field label="Maximum Login Attempts" type="number" value={localSettings.security.maxLoginAttempts.toString()} 
                  onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, maxLoginAttempts: parseInt(v)}})} 
                  tooltip="Number of failed login attempts allowed before a temporary account lockout."
                />
                <ToggleField label="Lock Records After Submission" value={localSettings.security.enableRecordLocking} 
                  onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, enableRecordLocking: v}})} />
                <ToggleField label="Allow Record Deletion" value={localSettings.security.enableDeletion} 
                  onChange={v => setLocalSettings({...localSettings, security: {...localSettings.security, enableDeletion: v}})} />
              </div>
            </div>
          )}

          {activeTab === 'databases' && (
            <div className="space-y-12">
              <SectionHeader title="Database Control" desc="Manage your system's cloud infrastructure and persistent storage." />
              
              <div className="space-y-16">
                <div className="p-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center space-x-5">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 text-indigo-600 rounded-xl">
                        <Database size={28} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Supabase Cloud</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Primary Persistent Storage</p>
                      </div>
                    </div>
                    {isDatabaseConnected ? (
                      <div className="flex items-center space-x-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified & Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 px-6 py-2 bg-rose-500/10 text-rose-600 rounded-full border border-rose-500/20">
                        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Disconnected</span>
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      The system is currently configured to use Supabase as the primary database. This ensures all scholar records, staff accounts, and audit logs are stored securely in the cloud.
                    </p>
                    <button 
                      onClick={() => navigate('/settings/database')}
                      className="w-full md:w-auto bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl py-3.5 px-6 flex items-center justify-center space-x-3 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      <Database size={18} />
                      <span>Open Database Control Panel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-10 md:space-y-12">
              <SectionHeader title="System Maintenance" desc="Backup your data and check system version." />
              <div className="bg-[#0f172a] dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-xl text-white space-y-8 md:space-y-10 relative overflow-hidden shadow-sm border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Version</p>
                    <p className="text-2xl md:text-3xl font-bold text-indigo-400">{localSettings.maintenance.version}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Backup Date</p>
                    <p className="text-sm font-bold text-slate-300">{localSettings.maintenance.lastBackup}</p>
                  </div>
                </div>
                <button 
                  onClick={backupDatabase}
                  className="w-full flex items-center justify-center space-x-4 py-6 md:py-8 bg-white/5 border-2 border-dashed border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-white/10 hover:border-indigo-400 transition-all font-bold text-[10px] uppercase tracking-[0.3em] active:scale-[0.98]"
                >
                  <Database size={24} />
                  <span>Download Data Backup File</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Save Button (Sticky Bottom) */}
          <div className="lg:hidden mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
             <button 
              onClick={handleSave}
              className="w-full bg-[#0a0c10] dark:bg-indigo-600 text-white rounded-xl py-5 flex items-center justify-center space-x-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95"
             >
               <Save size={16} />
               <span>Save Changes</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, desc }: any) => (
  <div className="border-b border-slate-100 dark:border-white/5 pb-6 md:pb-8">
    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">{title}</h3>
    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1">{desc}</p>
  </div>
);

const Field = ({ label, value, onChange, type = "text", readOnly = false, tooltip }: any) => (
  <div className="space-y-3">
    <div className="flex items-center">
      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">{label}</label>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
    <input 
      type={type}
      readOnly={readOnly}
      className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
    />
  </div>
);

const ToggleField = ({ label, value, onChange }: any) => (
  <div className="flex items-center justify-between p-5 md:p-7 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl">
    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 pr-4">{label}</span>
    <button 
      onClick={() => onChange(!value)}
      className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${value ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${value ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const DatabaseStatus = ({ status, onTest, label = "Test Connection" }: any) => (
  <div className="flex flex-col items-end space-y-2">
    <button 
      onClick={onTest}
      disabled={status?.loading}
      className={`px-6 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center space-x-2 ${
        status?.loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#0f172a] text-white hover:bg-indigo-600'
      }`}
    >
      {status?.loading ? (
        <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Database size={14} />
      )}
      <span>{label}</span>
    </button>
    {status?.message && (
      <p className={`text-[9px] font-bold uppercase tracking-tight ${status.success ? 'text-emerald-500' : 'text-rose-500'}`}>
        {status.message}
      </p>
    )}
  </div>
);

export default Settings;
