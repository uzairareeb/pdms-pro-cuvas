import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Building2, ShieldCheck, Users, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DepartmentLogin: React.FC = () => {
  const { deptLogin, settings } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    const ok = await deptLogin(email.trim(), password);
    setLoading(false);
    if (ok) navigate('/dept-portal');
    else setError('Invalid credentials. Please check your email and password.');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/15">

        {/* Left: Visual Panel */}
        <div className="hidden lg:flex flex-col bg-[#0f172a] relative overflow-hidden p-12 xl:p-16">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1.5 border border-white/10">
              <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest">PostGrad Hub</h1>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Department Access Portal</p>
              <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight">
                Department<br />
                <span className="text-indigo-400">Coordinator</span><br />
                Portal
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
                Securely access your department's student data, generate reports, and manage academic records.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Users, title: 'Student Management', desc: 'View & manage your department students' },
                { icon: BarChart3, title: 'Analytics & Reports', desc: 'Download department-specific reports' },
                { icon: ShieldCheck, title: 'Secure Access', desc: 'Role-based, department-scoped access control' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/8 rounded-2xl"
                >
                  <div className="w-9 h-9 bg-indigo-600/30 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{title}</p>
                    <p className="text-slate-500 text-[10px] font-medium mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Operational</span>
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="bg-white flex flex-col justify-center p-8 sm:p-12 xl:p-16">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 border border-slate-100">
              <img src={settings.institution.logo || ''} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">PostGrad Hub</h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-sm w-full mx-auto">
            <div className="space-y-2">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/25">
                <Building2 size={26} className="text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Department Login</h2>
              <p className="text-slate-500 text-sm font-medium">Sign in with your department credentials.</p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    placeholder="dept@cuvas.edu.pk"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/8 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-50">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                Access is restricted to authorised department coordinators only
              </p>
            </div>
          </motion.div>

          <div className="mt-auto pt-8">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Copyright © 2026 {settings.institution.name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentLogin;
