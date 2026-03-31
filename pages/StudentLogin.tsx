import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Maximize, Minimize, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentLogin: React.FC = () => {
  const { students, settings } = useStore();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cnicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cnicRef.current) {
      cnicRef.current.focus();
    }
  }, []);

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

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCnic(val);
    setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cnic.length < 4) {
      setError('Invalid CNIC. Please enter a valid CNIC number.');
      return;
    }

    const last4 = cnic.slice(-4);
    if (password !== last4) {
      setError('Invalid password. Password must be the last 4 digits of your CNIC.');
      return;
    }

    const student = students.find(s => s.cnic === cnic);
    if (!student) {
      setError('Invalid CNIC. No student found with this CNIC.');
      return;
    }

    if (student.finalThesisStatus !== 'Submitted' && student.semiFinalThesisStatus !== 'Submitted') {
      setError('You are not eligible to upload thesis at this stage.');
      return;
    }

    navigate('/student-portal');
  };

  return (
    <div className="min-h-screen bg-white flex items-stretch p-4 lg:p-6 font-sans">
      {/* Left Side: Login Form */}
      <div className="flex-1 flex flex-col relative">
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
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Student Portal Access</h2>
              <p className="text-slate-500 text-sm font-medium">Log in to upload your thesis documents.</p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                {/* CNIC Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">CNIC Number</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input 
                      ref={cnicRef}
                      type="text"
                      placeholder="e.g. 3120212345678"
                      value={cnic}
                      onChange={handleCnicChange}
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
                      placeholder="Last 4 digits of CNIC"
                      value={password}
                      onChange={handlePasswordChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <span>Log In</span>
              </button>
            </form>
          </motion.div>
        </div>

        <div className="flex items-center justify-between pt-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Copyright © 2026 {settings.institution.name}.
          </p>
        </div>
      </div>

      {/* Right Side: Visual Section */}
      <div className="hidden lg:flex w-[55%] bg-indigo-600 rounded-[2.5rem] relative items-center justify-center p-12 lg:p-24 overflow-hidden ml-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
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
              Securely access your academic timeline and upload your thesis materials.
            </p>
          </div>
        </motion.div>
      </div>

      <button 
        onClick={toggleFullscreen}
        className="absolute top-8 right-8 z-50 p-2.5 bg-white/80 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm backdrop-blur-sm border border-slate-100 lg:hidden"
      >
        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
      </button>
    </div>
  );
};

export default StudentLogin;
