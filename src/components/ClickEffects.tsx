"use client";
import { useEffect } from "react";

/**
 * Site-wide tap feedback: a small ring bursts from the exact point you press any
 * button or link. Drawn in a fixed layer so it never affects layout or clipping.
 */
export function ClickEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const target = (e.target as Element | null)?.closest("a, button, [role='button']");
      if (!target || (target as HTMLButtonElement).disabled || target.closest("[data-no-ripple]")) return;

      // Primary (red) buttons get a white ring, everything else the stage red.
      const primary = target.matches(".btn-stage, .btn");
      const ring = document.createElement("span");
      ring.className = "tap-ring";
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      ring.style.borderColor = primary ? "rgba(255,255,255,0.85)" : "var(--stage)";
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    }

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
