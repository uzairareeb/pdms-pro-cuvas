
import React, { useState, useRef, useEffect } from 'react';
import { Search, User, CreditCard, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Student } from '../types';

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ 
  placeholder = "Search Scholar Registry...", 
  className = "" 
}) => {
  const { students } = useStore();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (newValue.trim().length > 0) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(newValue.toLowerCase()) ||
        student.regNo.toLowerCase().includes(newValue.toLowerCase()) ||
        student.cnic.includes(newValue)
      ).slice(0, 5);
      setSuggestions(filtered);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (suggestion: Student) => {
    navigate(`/students/${suggestion.id}`);
    setValue('');
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className={`relative group ${className}`} ref={containerRef}>
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors z-10" size={20} />
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim().length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full pl-14 pr-8 py-4 md:py-5 bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary font-bold text-sm transition-all font-poppins"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
          <ul className="list-none p-0 m-0">
            {suggestions.map((suggestion, index) => (
              <li 
                key={suggestion.id}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between px-6 py-4 transition-colors cursor-pointer border-b border-slate-50 last:border-0 font-poppins ${highlightedIndex === index ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-none">{suggestion.name}</p>
                    <div className="flex items-center space-x-3 mt-1.5">
                      <span className="flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Hash size={10} className="mr-1" />
                        {suggestion.regNo}
                      </span>
                      <span className="flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <CreditCard size={10} className="mr-1" />
                        {suggestion.cnic}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest">
                  {suggestion.degree}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
