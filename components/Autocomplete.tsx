import React, { useState, useRef, useEffect } from 'react';
import { Search, User } from 'lucide-react';

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({ label, value, onChange, suggestions, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    
    if (val.length >= 2) {
      const filteredList = suggestions.filter(s => 
        s.toLowerCase().includes(val.toLowerCase())
      );
      setFiltered(filteredList);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const onSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
          <Search size={16} />
        </div>
        <input 
          type="text"
          placeholder={placeholder || "Start typing name..."}
          className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all hover:border-slate-300 dark:hover:border-white/10 dark:text-white clay-inset"
          value={value}
          onChange={handleInputChange}
          onFocus={() => { if(value.length >= 2) setIsOpen(true); }}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[110] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto custom-scrollbar clay">
          {filtered.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(s)}
              className="w-full px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-3 border-b border-slate-50 dark:border-white/5 last:border-0"
            >
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500"><User size={12} /></div>
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;