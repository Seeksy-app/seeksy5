import { useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Page transition variants - subtle fade + slight movement
const pageVariants = {
  initial: { 
    opacity: 0,
    y: 8,
  },
  animate: { 
    opacity: 1,
    y: 0,
  },
  exit: { 
    opacity: 0,
    y: -8,
  },
};

const pageTransition = {
  duration: 0.15,
  ease: "easeOut" as const,
};

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Create a stable key that only changes on meaningful route changes
  const routeKey = useMemo(() => {
    return location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Board routes render children directly without any wrapper
  const isBoardRoute = location.pathname.startsWith('/board');
  if (isBoardRoute) {
    return <>{children}</>;
  }

  // Wrap content in AnimatePresence for smooth page transitions
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="min-h-full bg-background"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
