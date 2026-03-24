import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Download, Share, PlusSquare, Info } from 'lucide-react';

const MobileApp: React.FC = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstallTrigger = () => {
    const event = new CustomEvent('trigger-pwa-install');
    window.dispatchEvent(event);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="glass p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/30 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/20">
          <Smartphone className="text-white" size={40} />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase mb-4">
          PDMS-PRO Mobile
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium">
          Access the Postgraduate Data Management System directly from your home screen. 
          No download from Play Store or App Store required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Android Instructions */}
        <div className={`glass p-8 rounded-[2rem] border border-white/20 ${isAndroid ? 'ring-2 ring-indigo-600' : ''}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Download size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Android (Chrome)</h2>
          </div>
          <ul className="space-y-4 text-sm text-slate-600 font-medium">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">01</span>
              <span>Open this website in <strong>Google Chrome</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">02</span>
              <span>Tap the <strong>three dots (⋮)</strong> in the top right corner.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">03</span>
              <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
            </li>
          </ul>
          <button 
            onClick={handleInstallTrigger}
            className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
          >
            Try Automatic Install
          </button>
        </div>

        {/* iOS Instructions */}
        <div className={`glass p-8 rounded-[2rem] border border-white/20 ${isIOS ? 'ring-2 ring-indigo-600' : ''}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Share size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">iPhone / iOS (Safari)</h2>
          </div>
          <ul className="space-y-4 text-sm text-slate-600 font-medium">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">01</span>
              <span>Open this website in <strong>Safari</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">02</span>
              <span>Tap the <strong>Share button</strong> (square with up arrow) at the bottom.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">03</span>
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={16} className="inline ml-1" />.</span>
            </li>
          </ul>
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">
              Apple does not allow automatic installation. You must use the "Add to Home Screen" option manually.
            </p>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-[2rem] border border-white/20 text-center">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Why use the Mobile App?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div className="space-y-2">
            <div className="text-indigo-600 font-black text-xl">01</div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Faster Access</p>
          </div>
          <div className="space-y-2">
            <div className="text-indigo-600 font-black text-xl">02</div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Full Screen Mode</p>
          </div>
          <div className="space-y-2">
            <div className="text-indigo-600 font-black text-xl">03</div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Real-time Sync</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileApp;
