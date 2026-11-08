"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Phone-only bar that appears when the vote panel is scrolled out of view. */
export function MobileVoteBar({ name }: { name: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById("vote");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function go() {
    document.getElementById("vote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 400, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 backdrop-blur lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button type="button" onClick={go} className="btn-stage w-full !py-3.5 text-base">
            Vote for {name}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
