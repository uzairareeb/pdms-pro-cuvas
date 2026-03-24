
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
  EyeOff
} from 'lucide-react';

const DatabaseSettings: React.FC = () => {
  const { notify } = useStore();
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
      
      // If connected and we don't have the URL/Key in state yet, fetch them
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
    const interval = setInterval(fetchStatus, 30000); // Heartbeat every 30s
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.url || !config.key) {
      notify("Please provide both URL and Key", "error");
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
        notify(data.message, "success");
        fetchStatus();
      } else {
        notify(data.message, "error");
      }
    } catch (error: any) {
      notify(error.message || "Failed to connect", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/supabase/disconnect', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        notify(data.message, "success");
        setConfig({ url: '', key: '' });
        setStatus({ connected: false, message: "Not Active / Disconnected" });
        setShowDisconnectConfirm(false);
      }
    } catch (error: any) {
      notify(error.message || "Failed to disconnect", "error");
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    await fetchStatus();
    setIsLoading(false);
    if (status?.connected) {
      notify("Connection verified and active!", "success");
    } else {
      notify(status?.message || "Connection failed", "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Database Control Panel</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Manage Supabase Cloud Infrastructure</p>
        </div>
        <div className={`flex items-center space-x-3 px-6 py-3 rounded-xl border ${
          status?.connected 
            ? (status?.setupRequired ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600')
            : 'bg-rose-50 border-rose-100 text-rose-600'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${status?.connected ? (status?.setupRequired ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-rose-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {status?.connected ? (status?.setupRequired ? 'Connected (Setup Required)' : 'Active (Connected)') : 'Not Active / Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm p-8 md:p-12 space-y-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-indigo-600 rounded-xl">
                <Link2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Connection Configuration</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Enter your Supabase project credentials</p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Supabase Project URL</label>
                  <input 
                    type="url"
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                    value={config.url}
                    onChange={e => setConfig({ ...config, url: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Anon Public Key</label>
                  <div className="relative">
                    <input 
                      type={showKey ? "text" : "password"}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all pr-16"
                      value={config.key}
                      onChange={e => setConfig({ ...config, key: e.target.value })}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                      {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#0a0c10] dark:bg-indigo-600 text-white py-5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Database size={18} />
                  )}
                  <span>Connect Database</span>
                </button>
                
                {status?.connected && (
                  <button 
                    type="button"
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="px-8 py-5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center space-x-3"
                  >
                    <Trash2 size={18} />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Disconnect Confirmation Modal */}
          {showDisconnectConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400">
                <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Disconnect Database?</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                      Are you sure you want to disconnect? This will remove your Supabase credentials from the server.
                    </p>
                  </div>
                </div>
                <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowDisconnectConfirm(false)} 
                    className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleDisconnect} 
                    className="flex-1 py-5 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20"
                  >
                    Confirm Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SQL Setup Helper */}
          <div className="bg-slate-900 rounded-xl p-8 md:p-12 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="flex items-center space-x-4 relative z-10">
              <div className="p-3 bg-white/10 text-indigo-400 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Database Initialization</h3>
                <p className="text-xs text-slate-400 font-medium">Ensure your Supabase instance is ready</p>
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              <p className="text-xs text-slate-300 leading-relaxed">
                If this is a new project, you must run the schema setup in your Supabase SQL Editor to create the required tables (students, settings, staff, audit_logs, sessions_config).
              </p>
              <div className="p-6 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                -- Run the provided supabase_schema.sql in your Supabase dashboard
              </div>
            </div>
          </div>
        </div>

        {/* Status Sidebar */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm p-8 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Connection Health</h3>
            
            <div className="space-y-6">
              <StatusItem 
                icon={Activity} 
                label="Status" 
                value={status?.connected ? 'Active (Connected)' : 'Not Active / Disconnected'} 
                color={status?.connected ? 'text-emerald-500' : 'text-rose-500'}
              />
              <StatusItem 
                icon={Database} 
                label="Project" 
                value={status?.projectName || '---'} 
              />
              <StatusItem 
                icon={Clock} 
                label="Last Verified" 
                value={status?.lastVerified ? new Date(status.lastVerified).toLocaleTimeString() : '---'} 
              />
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
              <button 
                onClick={handleTestConnection}
                disabled={isLoading}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>Re-verify Connection</span>
              </button>
            </div>
          </div>

          <div className="p-8 bg-indigo-600 rounded-xl text-white space-y-6 shadow-sm">
            <div className="p-3 bg-white/20 w-fit rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-tight">Secure Storage</h4>
              <p className="text-[10px] text-indigo-100 leading-relaxed font-medium">
                Your credentials are stored server-side and are never exposed to the client browser. All database operations are proxied through the secure system backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ icon: Icon, label, value, color = 'text-slate-900' }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl">
        <Icon size={14} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-tight dark:text-white ${color}`}>{value}</span>
  </div>
);

export default DatabaseSettings;
