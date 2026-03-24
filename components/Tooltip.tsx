
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900',
  };

  return (
    <div 
      className="relative inline-flex items-center group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <HelpCircle size={14} className="text-slate-400 hover:text-primary cursor-help transition-colors ml-1.5" />}
      
      {isVisible && (
        <div className={`absolute z-[100] w-48 px-3 py-2 bg-slate-900 text-white text-[10px] font-medium leading-relaxed rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in duration-200 font-poppins ${positionClasses[position]}`}>
          {content}
          <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
