
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentRegistration from './pages/StudentRegistration';
import StudentRecords from './pages/StudentRecords';
import StudentProfile from './pages/StudentProfile';
import BulkUpload from './pages/BulkUpload';
import AuditTrail from './pages/AuditTrail';
import SystemReports from './pages/SystemReports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import DatabaseSettings from './pages/DatabaseSettings';
import SessionSettings from './pages/SessionSettings';
import Login from './pages/Login';
import DataExport from './pages/DataExport';
import MobileApp from './pages/MobileApp';
import SynopsisSubmission from './pages/SynopsisSubmission';
import ThesisTracking from './pages/ThesisTracking';
import ReadmissionRegistry from './pages/ReadmissionRegistry';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import InstallPWA from './components/InstallPWA';

const NotificationHost = () => {
  const { notification, clearNotification } = useStore();
  
  return (
    <AnimatePresence>
      {notification && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearNotification}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/10"
          >
            <div className={`h-1.5 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            
            <div className="p-10 flex flex-col items-center text-center space-y-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                  {notification.type === 'success' ? 'Confirmation' : 'Error'}
                </h3>
                <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {notification.message}
                </p>
              </div>
              
              <button 
                onClick={clearNotification}
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
                  notification.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                }`}
              >
                Accept & Proceed
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  permission?: keyof any; 
  adminOnly?: boolean;
  module?: string;
  action?: 'view' | 'create' | 'edit' | 'delete';
}> = ({ children, permission, adminOnly, module, action = 'view' }) => {
  const { currentUser, currentRole } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (adminOnly && currentUser.role !== 'Admin') return <Navigate to="/" replace />;
  
  if (module && currentRole) {
    const modPerms = (currentRole as any)[module];
    if (!modPerms || !modPerms[action]) return <Navigate to="/" replace />;
  } else if (permission && currentRole && !(currentRole as any)[permission]) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute module="Dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/registration" element={<ProtectedRoute module="StudentRegistration" action="create"><StudentRegistration /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute module="StudentRecords"><StudentRecords /></ProtectedRoute>} />
        <Route path="/synopsis-submission" element={<ProtectedRoute module="SynopsisSubmission"><SynopsisSubmission /></ProtectedRoute>} />
        <Route path="/thesis-tracking" element={<ProtectedRoute module="ThesisTracking"><ThesisTracking /></ProtectedRoute>} />
        <Route path="/readmission-registry" element={<ProtectedRoute module="ReadmissionRegistry"><ReadmissionRegistry /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute module="StudentRecords"><StudentProfile /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute module="BulkUpload"><BulkUpload /></ProtectedRoute>} />
        <Route path="/export" element={<ProtectedRoute module="DataExport"><DataExport /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute module="AuditTrail"><AuditTrail /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute module="SystemReports"><SystemReports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute module="UserManagement"><UserManagement /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute module="Settings"><Settings /></ProtectedRoute>} />
        <Route path="/settings/database" element={<ProtectedRoute module="Settings"><DatabaseSettings /></ProtectedRoute>} />
        <Route path="/settings/sessions" element={<ProtectedRoute module="Settings"><SessionSettings /></ProtectedRoute>} />
        <Route path="/mobile-app" element={<ProtectedRoute><MobileApp /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <NotificationHost />
        <InstallPWA />
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
