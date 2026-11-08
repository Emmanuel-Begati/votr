"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { Standing } from "@/lib/standings";
import { Avatar } from "@/components/Avatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Movement, RankChip, TrendingBadge } from "./Badges";

export function RankTable({ standings, contestSlug, canVote }: { standings: Standing[]; contestSlug: string; canVote: boolean }) {
  const leader = standings[0]?.votes || 1;
  const bumps = useVoteBumps(standings);
  return (
    <LayoutGroup>
      <ol className="panel divide-y divide-line overflow-hidden">
        {standings.map((s) => (
          <motion.li key={s.id} layout transition={{ layout: { type: "spring", stiffness: 300, damping: 32 } }} className="relative bg-surface">
            <AnimatePresence>
              {bumps[s.id] && (
                <motion.span
                  key={bumps[s.id].key}
                  className="num pointer-events-none absolute right-4 top-1 z-10 text-base text-up"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  +{bumps[s.id].n.toLocaleString()}
                </motion.span>
              )}
            </AnimatePresence>
            <Link
              key={bumps[s.id]?.key ?? "row"}
              href={`/c/${contestSlug}/${s.slug}`}
              aria-label={`${s.name}, number ${s.rank}, ${s.votes.toLocaleString()} votes. ${canVote ? "Tap to vote." : ""}`}
              className={`group flex items-center gap-2.5 px-3 py-4 transition-colors hover:bg-surface-2/60 sm:gap-5 sm:px-6 ${bumps[s.id] ? "flash-up" : ""}`}
            >
              <div className="flex w-7 shrink-0 flex-col items-center gap-1 sm:w-10">
                <RankChip rank={s.rank} />
                <Movement value={s.movement} />
              </div>

              <Avatar
                name={s.name}
                src={s.photoUrl}
                className={`h-10 w-10 shrink-0 rounded-xl text-xs sm:h-14 sm:w-14 sm:text-base ${s.rank === 1 ? "ring-gold" : ""}`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-[15px] font-bold leading-tight group-hover:text-stage sm:text-lg">{s.name}</span>
                  {s.trending && <TrendingBadge />}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground sm:text-sm">
                  {s.leadOverNext !== null ? (
                    <>
                      Ahead by <b className="text-text">{s.leadOverNext.toLocaleString()}</b> votes
                    </>
                  ) : s.gapToNext !== null ? (
                    <>
                      Needs <b className="text-text">{s.gapToNext.toLocaleString()}</b> votes to pass number {s.rank - 1}
                    </>
                  ) : (
                    s.handle
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className={`h-full rounded-full ${s.rank === 1 ? "bg-saffron" : "bg-stage"}`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.max(2, (s.votes / leader) * 100)}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right sm:w-36">
                <AnimatedNumber value={s.votes} className="num block text-2xl leading-none sm:text-3xl" />
                <span className="text-xs text-muted-foreground">
                  votes
                  {s.votes24h > 0 && (
                    <span className="hidden sm:inline">
                      , <span className="text-up">+{s.votes24h.toLocaleString()} today</span>
                    </span>
                  )}
                </span>
              </div>

              {canVote ? (
                <>
                  <span className="hidden rounded-full bg-stage px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-[#222887] md:inline-flex">
                    Vote
                  </span>
                  <ChevronIcon className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block md:hidden" />
                </>
              ) : (
                <ChevronIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </Link>
          </motion.li>
        ))}
      </ol>
    </LayoutGroup>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Tracks vote increases between live updates so rows can flash and show "+N". */
function useVoteBumps(standings: Standing[]) {
  const prev = useRef<Map<string, number> | null>(null);
  const [bumps, setBumps] = useState<Record<string, { n: number; key: number }>>({});

  useEffect(() => {
    const now = new Map(standings.map((s) => [s.id, s.votes]));
    if (prev.current) {
      const next: Record<string, { n: number; key: number }> = {};
      for (const [id, v] of now) {
        const before = prev.current.get(id);
        if (before !== undefined && v > before) next[id] = { n: v - before, key: Date.now() };
      }
      if (Object.keys(next).length) {
        setBumps((b) => ({ ...b, ...next }));
        const ids = Object.keys(next);
        setTimeout(
          () =>
            setBumps((b) => {
              const copy = { ...b };
              ids.forEach((id) => {
                if (copy[id]?.key === next[id].key) delete copy[id];
              });
              return copy;
            }),
          2200,
        );
      }
    }
    prev.current = now;
  }, [standings]);

  return bumps;
}
