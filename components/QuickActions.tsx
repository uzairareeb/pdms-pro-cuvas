
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, BookOpenCheck, BarChart3, X, Zap } from 'lucide-react';

const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { 
      label: 'Add Student', 
      icon: UserPlus, 
      path: '/registration', 
      color: 'bg-emerald-500' 
    },
    { 
      label: 'Approve Thesis', 
      icon: BookOpenCheck, 
      path: '/thesis-tracking', 
      color: 'bg-indigo-500' 
    },
    { 
      label: 'Generate Report', 
      icon: BarChart3, 
      path: '/reports', 
      color: 'bg-amber-500' 
    },
  ];

  const handleAction = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return createPortal(
    <div className="fixed bottom-8 right-8 z-[999] flex flex-col items-end space-y-4 no-print">
      {/* Action Buttons */}
      <div className={`flex flex-col items-end space-y-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        {actions.map((action, index) => (
          <div key={index} className="flex items-center space-x-3 group">
            <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              {action.label}
            </span>
            <button
              onClick={() => handleAction(action.path)}
              className={`w-12 h-12 ${action.color} text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95`}
              title={action.label}
            >
              <action.icon size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group ${isOpen ? 'bg-rose-600 rotate-45' : 'bg-indigo-600 hover:scale-105'}`}
        aria-label="Toggle Quick Actions"
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <div className="relative">
            <Zap size={28} className="text-white fill-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-indigo-600 animate-pulse" />
          </div>
        )}
      </button>
    </div>,
    portalRoot
  );
};

export default QuickActions;
