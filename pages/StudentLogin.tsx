import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Maximize, Minimize, AlertCircle, BookOpen, Upload, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

    // Normalize CNIC: strip all dashes and spaces
    const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();

    if (normalizedCnic.length < 4) {
      setError('Invalid CNIC. Please enter a valid 13-digit CNIC number.');
      return;
    }

    const last4 = normalizedCnic.slice(-4);
    if (password.trim() !== last4) {
      setError('Incorrect password. Your password is the last 4 digits of your CNIC.');
      return;
    }

    // Match student by CNIC — normalize both sides to strip dashes/spaces
    const student = students.find(
      s => (s.cnic || '').replace(/[-\s]/g, '').trim() === normalizedCnic
    );

    if (!student) {
      setError('Invalid CNIC. No student record found with this CNIC number.');
      return;
    }

    // Eligibility check: gs4Form must be exactly 'Submitted' or 'Approved'
    // (mirrors the ThesisTracking logic — gs4Form is the thesis submission status field)
    const thesisStatus = (student.gs4Form || '').trim();
    const isEligible = thesisStatus === 'Submitted' || thesisStatus === 'Approved';

    if (!isEligible) {
      setError('You are not eligible to upload thesis at this stage.');
      return;
    }

    // NEW: Save student state for dashboard
    localStorage.setItem('cas_student_user', JSON.stringify(student));
    
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
      <div className="hidden lg:flex w-[55%] bg-indigo-600 rounded-[2.5rem] relative items-center justify-center p-12 lg:p-20 overflow-hidden ml-6">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 max-w-lg w-full space-y-10"
        >
          {/* Heading */}
          <div className="space-y-4">
            <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.3em]">Student Thesis Portal</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Welcome,<br />
              <span className="text-indigo-200">Student</span>
            </h2>
            <p className="text-indigo-100/75 text-base font-medium leading-relaxed">
              Please log in using your CNIC to access your thesis submission portal.
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            {[
              { icon: BookOpen, text: 'Once logged in, you can access your thesis submission panel and review your academic timeline.' },
              { icon: Upload, text: 'Upload your thesis documents if you are eligible — your status must be marked as Submitted.' },
              { icon: ShieldCheck, text: 'Make sure your CNIC details are correct before proceeding. Use digits only — dashes are auto-removed.' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
                  <Icon size={15} className="text-white" />
                </div>
                <p className="text-indigo-100/85 text-sm font-medium leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>

          {/* Status Badge */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Portal Operational &amp; Secure</span>
            </div>
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
