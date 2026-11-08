"use client";
import { MotionConfig } from "motion/react";

// "user" = respect the visitor's reduced-motion setting everywhere (transforms/layout
// animations are skipped) without rendering different markup on server vs client.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
