import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import BrandedLoader from './BrandedLoader';

const MIN_MS = 5000;
const MAX_MS = 10000;

/**
 * Full-screen branded loader after login until data is ready (min 5s, max 10s).
 */
const PostLoginLoaderGate: React.FC = () => {
  const { justLoggedIn, isLoading, completePostLoginSession } = useStore();
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (justLoggedIn) {
      startRef.current = Date.now();
    } else {
      startRef.current = null;
    }
  }, [justLoggedIn]);

  useEffect(() => {
    if (!justLoggedIn || startRef.current === null) return;

    const tick = () => {
      const start = startRef.current!;
      const elapsed = Date.now() - start;
      const dataReady = !isLoading;
      if (elapsed >= MAX_MS) {
        completePostLoginSession();
        return;
      }
      if (elapsed >= MIN_MS && dataReady) {
        completePostLoginSession();
      }
    };

    const id = window.setInterval(tick, 120);
    tick();
    return () => window.clearInterval(id);
  }, [justLoggedIn, isLoading, completePostLoginSession]);

  return (
    <AnimatePresence mode="wait">
      {justLoggedIn && (
        <motion.div
          key="post-login-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[3000] pointer-events-auto"
        >
          <BrandedLoader
            variant="fullscreen"
            message="Preparing your workspace"
            subLabel="Higher Education Commission · DAS System"
            logoSize={180}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostLoginLoaderGate;
