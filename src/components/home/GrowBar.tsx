"use client";
import { motion } from "motion/react";

/** A bar that grows to its width once, on load. The only entrance motion on the home page. */
export function GrowBar({ pct, className, delay = 0 }: { pct: number; className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ width: "0%" }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
