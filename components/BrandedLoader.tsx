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
  logoSize = 160,
}) => {
  const prefersDark = usePrefersDarkScheme();
  const dark = darkProp !== undefined ? darkProp : prefersDark;

  const bg =
    variant === 'overlay'
      ? dark
        ? 'bg-slate-950/85 backdrop-blur-md'
        : 'bg-white/90 backdrop-blur-md'
      : dark
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';

  const textMain = dark ? 'text-slate-100' : 'text-slate-800';
  const textSub = dark ? 'text-slate-400' : 'text-slate-500';

  const inner = (
    <div className="flex flex-col items-center justify-center text-center px-6 max-w-md">
      <motion.div
        className="relative mb-6 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: 1,
          scale: [1, 1.04, 1],
        }}
        transition={{
          opacity: { duration: 0.45 },
          scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <motion.img
          src={CUVAS_LOGO}
          alt="CUVAS Logo"
          className="w-full h-auto object-contain drop-shadow-2xl select-none"
          style={{ maxWidth: logoSize, filter: 'drop-shadow(0 20px 30px rgba(79,70,229,0.15))' }}
          animate={{ 
            rotate: [0, 0.4, -0.4, 0],
            y: [0, -4, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          draggable={false}
        />
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          aria-hidden
          animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />
      </motion.div>
      <motion.p
        className={`text-[11px] font-black uppercase tracking-[0.35em] ${textMain}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {message}
      </motion.p>
      {subLabel && (
        <p className={`mt-2 text-[10px] font-semibold tracking-wide ${textSub}`}>{subLabel}</p>
      )}
      <div className="mt-8 flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-indigo-500/80"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
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
