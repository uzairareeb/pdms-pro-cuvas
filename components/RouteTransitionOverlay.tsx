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
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center pt-3 sm:pt-4"
        >
          <div className="rounded-2xl bg-white/92 shadow-lg ring-1 ring-slate-200/90 backdrop-blur-md px-5 py-3 max-w-[min(92vw,420px)]">
            <BrandedLoader
              variant="inline"
              message="Loading"
              subLabel="HEC · DAS"
              logoSize={56}
              className="!py-2"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RouteTransitionOverlay;
