
import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Zap, ArrowRight, Maximize, Minimize } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const { login, isLoading, currentUser, settings } = useStore();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Zap className="text-[#6366f1] animate-pulse" size={32} />
          </div>
        </div>
        <p className="mt-8 text-[10px] font-black text-[#6366f1] uppercase tracking-[0.5em] animate-pulse">Initializing Secure Access</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-stretch p-4 lg:p-6 font-sans">
      {/* Left Side: Login Form */}
      <div className="flex-1 flex flex-col relative">
        {/* Branding Logo & Name (Top Left) */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 border border-slate-100 shadow-sm">
            <img 
              src={settings.institution.logo || ''} 
              className="w-full h-full object-contain" 
              alt="University Logo" 
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">PostGrad Hub</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back, Admin</h2>
              <p className="text-slate-500 text-sm font-medium">Enter your credentials to log in to the system.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Username</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all" />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember Me</span>
                </label>
                
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <span>Log In</span>
              </button>
            </form>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Or Login With</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => login('admin', 'admin123')}
                  className="py-3.5 rounded-xl border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-xs font-bold text-slate-600"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                  <span>Google</span>
                </button>
                <button 
                  type="button"
                  className="py-3.5 rounded-xl border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-xs font-bold text-slate-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.45 17.1 3.55 11.5 5.85 8.2c1.13-1.6 2.73-2.58 4.35-2.5 1.28.07 2.1.8 3.1.8 1 0 2.1-.85 3.5-.75 1.6.1 2.8.7 3.6 1.8-3.3 1.9-2.7 6.3.8 7.8-.7 1.8-1.6 3.6-3.1 4.93zM14.15 5.2c-.1 2.1-1.8 3.8-3.8 3.7.1-2.1 1.9-3.9 3.8-3.7z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>

            <div className="text-center">

            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Copyright © 2026 {settings.institution.name}.
          </p>

        </div>
      </div>

      {/* Right Side: Visual Section */}
      <div className="hidden lg:flex w-[55%] bg-indigo-600 rounded-[2.5rem] relative items-center justify-center p-12 lg:p-24 overflow-hidden ml-6">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 max-w-xl text-center space-y-8"
        >
          <div className="space-y-6">
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Hello <br />
              <span className="text-indigo-200">PostGrad Hub</span>
            </h2>
            
            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed max-w-lg mx-auto">
              Keep the same professional standard in managing your academic registry with precision and ease.
            </p>
          </div>

          <div className="pt-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">System Operational & Secure</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Toggle */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-8 right-8 z-50 p-2.5 bg-white/80 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm backdrop-blur-sm border border-slate-100 lg:hidden"
      >
        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
      </button>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
