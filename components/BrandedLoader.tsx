import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CUVAS_LOGO = '/cuvaslogo.png';

function usePrefersDarkScheme(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setDark(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return dark;
}

export type BrandedLoaderVariant = 'fullscreen' | 'overlay' | 'inline';

export interface BrandedLoaderProps {
  variant?: BrandedLoaderVariant;
  /** Short label under logo */
  message?: string;
  /** Smaller subtitle */
  subLabel?: string;
  className?: string;
  /** Force dark styling. If omitted, follows system light/dark preference */
  dark?: boolean;
  /** Logo size in pixels (approximate max width) */
  logoSize?: number;
}

const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  variant = 'fullscreen',
  message = 'Loading',
  subLabel,
  className = '',
  dark: darkProp,
  logoSize = 320,
}) => {
  const prefersDark = usePrefersDarkScheme();
  const dark = darkProp !== undefined ? darkProp : prefersDark;

  const bg =
    variant === 'overlay'
      ? dark
        ? 'bg-slate-950/90 backdrop-blur-xl'
        : 'bg-white/95 backdrop-blur-xl'
      : dark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';

  const textMain = dark ? 'text-slate-100' : 'text-slate-900';
  const textSub = dark ? 'text-slate-400' : 'text-slate-500';

  const inner = (
    <div className={`flex flex-col items-center justify-center text-center px-10 ${variant === 'fullscreen' ? 'max-w-2xl' : 'max-w-md'}`}>
      <motion.div
        className="relative mb-12 flex items-center justify-center w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: [1, 1.02, 1],
        }}
        transition={{
          opacity: { duration: 0.8 },
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <motion.img
          src={CUVAS_LOGO}
          alt="CUVAS Official Logo"
          className="w-full h-auto object-contain select-none relative z-10"
          style={{ 
            maxWidth: logoSize, 
            imageRendering: 'crisp-edges',
            filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.1)) brightness(1.02)'
          }}
          animate={{ 
            y: [0, -6, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          draggable={false}
        />
        
        {/* High-quality glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none opacity-20 blur-[100px]"
          aria-hidden
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)',
          }}
        />
      </motion.div>
      
      <div className="space-y-4">
        <motion.p
          className={`text-[12px] font-black uppercase tracking-[0.4em] ${textMain}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
        
        {subLabel && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${textSub}`}
          >
            {subLabel}
          </motion.p>
        )}
      </div>

      <div className="mt-12 flex gap-3 justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-indigo-600/80"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>{inner}</div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${variant === 'fullscreen' ? 'fixed inset-0 z-[2500]' : 'absolute inset-0 z-[100]'} ${bg} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {inner}
    </div>
  );
};

export default BrandedLoader;
