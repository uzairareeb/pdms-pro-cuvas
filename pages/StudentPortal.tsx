import React from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

const StudentPortal: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                    🎓
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Portal</h1>
                    <p className="text-slate-500 font-medium text-sm">Welcome! You are eligible to upload your thesis.</p>
                </div>
                
                <button 
                  onClick={() => navigate('/')}
                  className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest transition-colors mt-8"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default StudentPortal;
