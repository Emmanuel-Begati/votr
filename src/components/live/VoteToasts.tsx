"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { FeedItem } from "@/lib/standings";
import { BoltIcon } from "@/components/icons";

type Toast = FeedItem & { key: number };

/** Pops a toast whenever a new vote appears in the live feed (not on first load). */
export function VoteToasts({ feed }: { feed: FeedItem[] }) {
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(feed.map((f) => f.id));
      return;
    }
    const fresh = feed.filter((f) => !seen.current!.has(f.id));
    fresh.forEach((f) => seen.current!.add(f.id));
    if (fresh.length === 0) return;
    const added = fresh.slice(0, 3).map((f, i) => ({ ...f, key: Date.now() + i }));
    setToasts((t) => [...added, ...t].slice(0, 3));
    const ids = added.map((a) => a.key);
    // Not cleared on the next feed update, so each toast always dismisses itself.
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => !ids.includes(x.key))), 4500));
  }, [feed]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-24 left-4 right-4 z-50 lg:bottom-4 flex flex-col items-start gap-2 sm:right-auto" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.key}
            layout
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="flex items-center gap-3 rounded-full bg-band px-4 py-2.5 text-sm text-white shadow-[0_16px_40px_-16px_rgba(23,27,85,0.7)]"
          >
            <BoltIcon className="h-4 w-4 shrink-0 text-saffron" />
            <span>
              <span className="font-semibold">{t.fan}</span>{" "}
              voted <span className="font-semibold">{t.contestantName}</span>
              {t.votes !== null && (
                <>
                  {" "}
                  <span className="num text-base text-[#5ee39b]">+{t.votes.toLocaleString()}</span>
                </>
              )}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
