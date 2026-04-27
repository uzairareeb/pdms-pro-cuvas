
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Home, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  FileSpreadsheet,
  Upload,
  Menu,
  Maximize,
  Minimize,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';
import PostLoginLoaderGate from './PostLoginLoaderGate';
import RouteTransitionOverlay from './RouteTransitionOverlay';

const ResultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, settings } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('result_sidebar_collapsed') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('result_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const menuItems = [
    { name: 'Portal Dashboard', icon: LayoutDashboard, path: '/result-admin/dashboard' },
    { name: 'Bulk Upload Center', icon: Upload, path: '/result-admin/upload' },
    { name: 'Design Studio', icon: FileSpreadsheet, path: '/result-admin/templates' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] text-slate-900 relative overflow-hidden">
      <PostLoginLoaderGate />
      <RouteTransitionOverlay />

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? '88px' : '280px' }}
        className={`
          fixed inset-y-0 left-0 h-screen flex flex-col z-[100] transition-all duration-300 ease-in-out no-print
          bg-white border-slate-200 text-slate-900 border-r shadow-sm
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header / User Profile */}
        <div className="p-6 relative shrink-0">
          <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 p-0.5">
                <img 
                  src={`https://ui-avatars.com/api/?name=${currentUser?.name || 'Admin'}&background=6366f1&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <h2 className="text-sm font-bold truncate text-slate-900">{currentUser?.name || 'Administrator'}</h2>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Result Manager</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-4 top-10 w-8 h-8 bg-[#4ade80] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-[#22c55e] transition-all z-10"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6">
          <div>
            {!isCollapsed && (
              <p className="px-4 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Modules</p>
            )}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all group relative ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon size={20} className="shrink-0" />
                    {!isCollapsed && (
                      <span className="text-xs font-bold tracking-wide flex-1 text-left">{item.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-6 space-y-2 shrink-0">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 hover:bg-slate-200 ${isCollapsed ? 'p-3' : ''}`}
          >
            <Home size={18} />
            {!isCollapsed && <span>Main Dashboard</span>}
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 hover:bg-rose-500 hover:text-white ${isCollapsed ? 'p-3' : ''}`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[280px]'}`}
      >
        {/* Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 sticky top-0 z-40 bg-white border-b border-slate-200 shrink-0 no-print transition-all">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 transition-all active:scale-95"
            >
              <Menu size={20} className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-lg md:rounded-xl items-center justify-center p-1.5 md:p-2 border border-slate-100 shrink-0">
                <ShieldCheck className="text-emerald-500" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[17px] md:text-xl font-black text-slate-900 tracking-tight uppercase leading-none truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">Result Admin</h1>
                <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-[8px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest truncate">System Operational</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Active</span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">Result Administrator</span>
            </div>
            
            <div className="h-10 w-px bg-slate-200 mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all active:scale-95"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              
              <div className="relative">
                <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all active:scale-95">
                  <Bell size={20} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ResultLayout;
