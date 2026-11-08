"use client";
import { useEffect, useState } from "react";

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function split(diff: number) {
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

/** Big scoreboard-style countdown. */
export function Countdown({ to, label = "Voting closes in", compact = false }: { to: string; label?: string; compact?: boolean }) {
  const now = useNow();
  const diff = now === null ? 0 : Math.max(0, new Date(to).getTime() - now);
  const t = split(diff);
  const parts: [string, number][] = [
    ["days", t.d],
    ["hours", t.h],
    ["min", t.m],
    ["sec", t.s],
  ];
  const urgent = now !== null && diff < 24 * 3600_000;

  return (
    <div>
      <div className="eyebrow mb-2">{label}</div>
      <div className="flex gap-1.5">
        {parts.map(([u, v]) => (
          <div
            key={u}
            className={`flex flex-col items-center rounded-xl bg-surface-2 ${compact ? "min-w-12 px-2 py-1.5" : "min-w-16 px-3 py-2"}`}
          >
            <span className={`num font-bold ${compact ? "text-xl" : "text-3xl"} ${urgent ? "text-down" : ""}`} suppressHydrationWarning>
              {now === null ? "--" : String(v).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground">{u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One-line countdown: "Voting closes in 13d 22h 21m". */
export function InlineCountdown({ to, label = "Voting closes in", short = false }: { to: string; label?: string; short?: boolean }) {
  const now = useNow();
  const diff = now === null ? 0 : Math.max(0, new Date(to).getTime() - now);
  const t = split(diff);
  const urgent = now !== null && diff < 24 * 3600_000;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  if (short) {
    // Just the biggest unit, for tight spaces: "13 days" / "5 hours" / "12 min"
    const value = now === null ? "…" : t.d > 0 ? plural(t.d, "day") : t.h > 0 ? plural(t.h, "hour") : `${t.m} min`;
    return (
      <span className={`num ${urgent ? "text-down" : ""}`} suppressHydrationWarning>
        {value}
      </span>
    );
  }
  const text =
    now === null ? "…" : t.d > 0 ? `${plural(t.d, "day")} ${plural(t.h, "hour")}` : t.h > 0 ? `${plural(t.h, "hour")} ${t.m} min` : `${t.m} min ${t.s} sec`;
  return (
    <span className="text-sm text-muted-foreground">
      {label}{" "}
      <span className={`num text-base ${urgent ? "text-down" : "text-text"}`} suppressHydrationWarning>
        {text}
      </span>
    </span>
  );
}
