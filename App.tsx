
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
import Login from './pages/Login';
import DataExport from './pages/DataExport';
import MobileApp from './pages/MobileApp';
import SynopsisSubmission from './pages/SynopsisSubmission';
import ThesisTracking from './pages/ThesisTracking';
import ReadmissionRegistry from './pages/ReadmissionRegistry';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import InstallPWA from './components/InstallPWA';

const NotificationHost = () => {
  const { notification } = useStore();
  
  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className={`fixed top-6 right-6 z-[1000] flex items-center gap-4 px-8 py-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-right-10 duration-500 border backdrop-blur-xl ${
      isSuccess 
        ? 'bg-emerald-600/95 border-emerald-500 text-white shadow-emerald-500/20' 
        : 'bg-rose-600/95 border-rose-500 text-white shadow-rose-500/20 animate-shake'
    }`}>
      <div className="p-2 bg-white/20 rounded-xl">
        {isSuccess ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
          {isSuccess ? 'System Sync' : 'System Alert'}
        </p>
        <p className="text-sm font-black tracking-tight">{notification.message}</p>
      </div>
    </div>
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
