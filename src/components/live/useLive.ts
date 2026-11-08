"use client";
import { useEffect, useState } from "react";
import type { LiveData } from "@/lib/standings";

/** Polls the live standings for a contest. Pauses while the tab is hidden. */
export function useLive(contestSlug: string, initial: LiveData, intervalMs = 10_000) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    let stopped = false;
    async function tick() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/live/${contestSlug}`, { cache: "no-store" });
        if (res.ok && !stopped) setData(await res.json());
      } catch {
        /* offline: keep last data */
      }
    }
    const t = setInterval(tick, intervalMs);
    const onVis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [contestSlug, intervalMs]);

  return data;
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
