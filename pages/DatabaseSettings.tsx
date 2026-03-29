
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  XCircle, 
  CheckCircle2, 
  Link2, 
  Clock,
  Activity,
  Save,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Server,
  Cloud,
  Cpu,
  Fingerprint,
  Globe,
  ArrowLeft,
  ArrowRight,
  Shield,
  History,
  Terminal,
  Layers,
  Zap,
  ChevronRight,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ label, value, gradient, icon: Icon }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32" style={{ background: gradient }}>
    <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none">
      <Icon size={80} className="text-white" />
    </div>
    <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-2xl font-black text-white tracking-tighter tabular-nums leading-none mb-1 uppercase">{value}</h4>
  </div>
);

const DatabaseSettings: React.FC = () => {
  const navigate = useNavigate();
  const { notify, settings } = useStore();
  const [config, setConfig] = useState({ url: '', key: '' });
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/supabase/status');
      if (!response.ok) {
        const text = await response.text();
        if (text.includes("Rate exceeded")) {
          setStatus({ connected: false, message: "Rate limit exceeded. Please wait." });
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setStatus(data);
      
      if (data.connected && !config.url) {
        const configRes = await fetch('/api/supabase/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.success) {
            setConfig({ url: configData.url, key: configData.key });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.url || !config.key) {
      notify("Institutional credentials missing URL or key.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        notify("Cloud infrastructure linked successfully.", "success");
        fetchStatus();
      } else {
        notify(data.message, "error");
      }
    } catch (error: any) {
      notify(error.message || "Protocol link failure.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/supabase/disconnect', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        notify("Cloud infrastructure unlinked and buffer purged.", "success");
        setConfig({ url: '', key: '' });
        setStatus({ connected: false, message: "Not Active / Disconnected" });
        setShowDisconnectConfirm(false);
      }
    } catch (error: any) {
      notify(error.message || "Revocation failure.", "error");
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    await fetchStatus();
    setIsLoading(false);
    if (status?.connected) {
      notify("Persistance layer verified and active.", "success");
    } else {
      notify(status?.message || "Verification failure.", "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/settings')} className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all text-slate-400 hover:text-indigo-600 active:scale-90">
             <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Database Control</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Manage Supabase Cloud Infrastructure · {settings.institution.name || 'CUVAS'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${
          status?.connected 
            ? (status?.setupRequired ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
            : 'bg-rose-50 border-rose-200 text-rose-600'
        } shadow-sm transition-all`}>
          <div className={`w-2 h-2 rounded-full ${status?.connected ? (status?.setupRequired ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-rose-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {status?.connected ? (status?.setupRequired ? 'Connected (Setup Required)' : 'Active Node') : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Node Status" value={status?.connected ? 'Online' : 'Offline'} gradient="linear-gradient(135deg,#0f172a 0%,#334155 100%)" icon={Activity} />
        <KpiCard label="Sync Engine" value={status?.connected ? 'Live' : 'Stopped'} gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" icon={Zap} />
        <KpiCard label="Data Layer" value="Supabase Cloud" gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" icon={Server} />
        <KpiCard label="Active Project" value={status?.projectName || 'N/A'} gradient="linear-gradient(135deg,#64748b 0%,#94a3b8 100%)" icon={Cloud} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Connection Form ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 lg:p-14 shadow-sm relative overflow-hidden flex flex-col min-h-[500px]">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
             
             <div className="flex items-start gap-6 mb-12 relative z-10">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
                   <Link2 size={24} />
                </div>
                <div>
                   <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Connection Configuration</h3>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Provision Supabase Cloud Credentials</p>
                </div>
             </div>

             <form onSubmit={handleConnect} className="space-y-10 relative z-10 flex-1">
                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Project Endpoint URL</label>
                      <div className="relative group">
                         <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                         <input 
                            type="url" 
                            required
                            placeholder="https://your-project.supabase.co" 
                            className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all tabular-nums"
                            value={config.url}
                            onChange={e => setConfig({ ...config, url: e.target.value })}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Anon Public Passkey</label>
                      <div className="relative group">
                         <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                         <input 
                            type={showKey ? "text" : "password"}
                            required
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                            className="w-full pl-11 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-900 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 transition-all tracking-widest"
                            value={config.key}
                            onChange={e => setConfig({ ...config, key: e.target.value })}
                         />
                         <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">
                            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row gap-5">
                   <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                      {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                      <span>Link Infrastructure</span>
                   </button>
                   {status?.connected && (
                      <button 
                         type="button" 
                         onClick={() => setShowDisconnectConfirm(true)}
                         className="px-10 py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                         <Trash2 size={18} />
                         <span>Disconnect Node</span>
                      </button>
                   )}
                </div>
             </form>
          </div>

          {/* ── Initialization Helper ─────────────────────────────────────── */}
          <div className="bg-[#0f172a] rounded-[32px] p-10 lg:p-14 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
             <div className="flex items-center gap-6 mb-8 relative z-10">
                <div className="w-14 h-14 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner border border-white/5">
                   <Terminal size={24} />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight uppercase">Database Initialization</h4>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Schema Deployment Protocols</p>
                </div>
             </div>
             
             <div className="space-y-6 relative z-10">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                   For new projects, ensure you execute the institutional schema script in your Supabase SQL Editor. This provision creates all required tables including <span className="text-indigo-400">students</span>, <span className="text-indigo-400">staff</span>, and <span className="text-indigo-400">audit_logs</span>.
                </p>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-[11px] text-emerald-400 overflow-x-auto flex items-center gap-4">
                   <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Cpu size={14} /></div>
                   <span>-- Source script: supabase_schema.sql [Root Path]</span>
                </div>
             </div>
          </div>
        </div>

        {/* ── Status Sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-10 shadow-sm overflow-hidden relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -mr-10 -mt-10" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Telemetry Status</h3>
            
             <div className="space-y-6">
                <StatusItem icon={Activity} label="Registry Status" value={status?.connected ? 'Online' : 'Offline'} color={status?.connected ? 'text-emerald-500' : 'text-rose-500'} />
                <StatusItem icon={Layers} label="Active Project" value={status?.projectName || 'Institutional Core'} />
                <StatusItem icon={Clock} label="Last Telemetry" value={status?.lastVerified ? new Date(status.lastVerified).toLocaleTimeString() : 'Pending'} />
             </div>

             <div className="pt-8 border-t border-slate-50">
                <button 
                   onClick={handleTestConnection}
                   disabled={isLoading}
                   className="group w-full py-4 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                   <RefreshCw size={16} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                   <span>Verify Node Health</span>
                </button>
             </div>
          </div>

          <div className="bg-indigo-600 rounded-[32px] p-10 text-white relative overflow-hidden group shadow-xl shadow-indigo-500/10">
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
             <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                <ShieldCheck size={24} />
             </div>
             <div className="space-y-4">
                <h4 className="text-xl font-black tracking-tight uppercase">Encrypted Persistence</h4>
                <p className="text-[11px] font-medium text-indigo-100 leading-relaxed uppercase tracking-tighter">
                   Institutional credentials are never exposed at the edge. Connection tokens are processed via secure server-side proxy routines for institutional verification.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* ── Disconnect Confirmation ─────────────────────────────────────── */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowDisconnectConfirm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl">
               <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-rose-100/50"><AlertTriangle size={36} /></div>
                  <div className="space-y-3">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Revocation Protocol</h3>
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Infrastructure link will be severed and local caches purged. All registry writes will fail immediately.</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 flex gap-4">
                  <button onClick={() => setShowDisconnectConfirm(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                  <button onClick={handleDisconnect} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">Confirm Revocation</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StatusItem = ({ icon: Icon, label, value, color = 'text-slate-900' }: any) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        <Icon size={16} />
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-tight ${color}`}>{value}</span>
  </div>
);

export default DatabaseSettings;
