"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeedItem } from "@/lib/standings";
import { BoltIcon } from "@/components/icons";
import { timeAgo } from "./useLive";

export function Ticker({ feed, contestSlug }: { feed: FeedItem[]; contestSlug: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (feed.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm">
        <BoltIcon className="h-4 w-4 shrink-0 text-gold" />
        <span className="text-muted-foreground">No votes yet. Be the first to vote.</span>
      </div>
    );
  }

  const items = [...feed, ...feed]; // duplicated for a seamless loop
  return (
    <div className="flex items-center overflow-hidden rounded-full border border-line bg-surface">
      <span className="z-10 flex shrink-0 items-center gap-2 self-stretch bg-band px-4 text-sm font-bold text-white">
        <span className="live-dot" />
        <span className="hidden sm:inline">Latest votes</span>
      </span>
      <div className="ticker relative min-w-0 flex-1 overflow-hidden py-3 [contain:inline-size] [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_94%,transparent)]">
        <div className="ticker-track">
          {items.map((f, i) => (
            <Link
              key={`${f.id}-${i}`}
              href={`/c/${contestSlug}/${f.contestantSlug}`}
              className="flex shrink-0 items-center gap-1.5 px-5 text-sm hover:text-stage"
              aria-hidden={i >= feed.length}
              tabIndex={i >= feed.length ? -1 : undefined}
            >
              <span className="text-muted-foreground">{f.fan} voted</span>
              <span className="font-bold">{f.contestantName}</span>
              {f.votes !== null && <span className="num text-base text-up">+{f.votes.toLocaleString()}</span>}
              {now !== null && <span className="ml-1 text-xs text-muted-foreground">{timeAgo(f.at, now)}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
