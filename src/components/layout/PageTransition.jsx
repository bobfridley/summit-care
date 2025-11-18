// src/components/layout/PageTransition.jsx
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

function getPageTransitionConfig(pathname) {
  // normalize a bit in case of base paths
  const path = pathname.toLowerCase();

  // Dashboard: gentle fade + tiny zoom in
  if (path === "/" || path.endsWith("/dashboard")) {
    return {
      initial: { opacity: 0, scale: 0.97, y: 6 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.98, y: -6 },
      transition: { duration: 0.22, ease: "easeOut" },
    };
  }

  // My Climbs: slide in from the right (feels like moving into the mountains)
  if (path.endsWith("/climbs")) {
    return {
      initial: { opacity: 0, x: 32 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.22, ease: "easeOut" },
    };
  }

  // My Medications: slide up, like cards rising into view
  if (path.endsWith("/medications")) {
    return {
      initial: { opacity: 0, y: 28 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -18 },
      transition: { duration: 0.22, ease: "easeOut" },
    };
  }

  // Medication Database: fade + slight upward motion
  if (path.endsWith("/database")) {
    return {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.2, ease: "easeOut" },
    };
  }

  // Trip Reports: horizontal slide, like flipping between logs
  if (path.endsWith("/reports")) {
    return {
      initial: { opacity: 0, x: -24 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 24 },
      transition: { duration: 0.22, ease: "easeOut" },
    };
  }

  // Summit Assistant / AI pages: quicker, more “snappy” fade
  if (path.endsWith("/summit-assistant") || path.endsWith("/ai-playground")) {
    return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.18, ease: "easeOut" },
    };
  }

  // Default: simple fade
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.18, ease: "easeOut" },
  };
}

export default function PageTransition({ children }) {
  const location = useLocation();
  const { initial, animate, exit, transition } = getPageTransitionConfig(
    location.pathname,
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
