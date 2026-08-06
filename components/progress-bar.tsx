"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function ProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(30);
    const t1 = setTimeout(() => setProgress(75), 150);
    const t2 = setTimeout(() => setProgress(100), 400);
    const t3 = setTimeout(() => setVisible(false), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[999] h-0.5 pointer-events-none">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 via-violet-400 to-violet-300 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
