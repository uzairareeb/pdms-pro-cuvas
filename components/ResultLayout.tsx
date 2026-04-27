
import React, { useState } from 'react';
import { 
  BarChart3, 
  Home, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';

const ResultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, settings } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Portal Dashboard', icon: LayoutDashboard, path: '/result-admin' },
    { name: 'Result Management', icon: BarChart3, path: '/result-admin/records' },
    { name: 'Card Templates', icon: FileSpreadsheet, path: '/result-admin/templates' },
    { name: 'System Settings', icon: SettingsIcon, path: '/settings/general' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '80px' : '280px' }}
        className="fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-white/5 flex flex-col no-print"
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center p-1">
                  <BarChart3 className="text-white" size={18} />
                </div>
                <h1 className="text-sm font-black text-white uppercase tracking-widest truncate">Result Admin</h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'} />
                {!isCollapsed && (
                  <span className="text-[11px] font-black uppercase tracking-widest truncate">
                    {item.name}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Home size={20} />
            {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Main Dashboard</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: isCollapsed ? '80px' : '280px' }}
      >
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 no-print">
          <div className="flex items-center gap-3">
             <ShieldCheck size={20} className="text-emerald-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Secure Session</span>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
               <Bell size={20} />
               <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-10 w-px bg-slate-100 mx-2" />

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{currentUser?.username}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{currentUser?.role}</p>
              </div>
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[1600px] mx-auto w-full">
           {children}
        </div>
      </main>
    </div>
  );
};

export default ResultLayout;
