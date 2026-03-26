import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrandedLoader from './BrandedLoader';

/**
 * Brief branded hint on SPA route changes (sidebar navigation).
 */
const RouteTransitionOverlay: React.FC = () => {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 400);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="route-t"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center"
        >
          <div className="rounded-2xl bg-white/92 shadow-2xl ring-1 ring-slate-200/90 backdrop-blur-md px-8 py-6 max-w-[min(92vw,420px)] pointer-events-auto">
            <BrandedLoader
              variant="inline"
              message="Loading"
              subLabel="HEC · DAS"
              logoSize={80}
              className="!py-2"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RouteTransitionOverlay;
