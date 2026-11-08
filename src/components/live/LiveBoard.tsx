"use client";
import Link from "next/link";
import type { LiveData } from "@/lib/standings";
import { Avatar } from "@/components/Avatar";
import { useLive } from "./useLive";
import { Podium } from "./Podium";
import { RankTable } from "./RankTable";
import { Ticker } from "./Ticker";
import { VoteToasts } from "./VoteToasts";

export function LiveBoard({ contestSlug, initial, canVote }: { contestSlug: string; initial: LiveData; canVote: boolean }) {
  const data = useLive(contestSlug, initial);
  const s = data.standings;

  if (!data.showResults) {
    return (
      <div className="space-y-6">
        <Ticker feed={data.feed} contestSlug={contestSlug} />
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display-tight text-2xl sm:text-3xl">Comedians</h2>
          <span className="text-sm text-muted-foreground">Results are hidden until voting ends</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {s.map((c) => (
            <Link key={c.id} href={`/c/${contestSlug}/${c.slug}`} className="panel group overflow-hidden p-3 transition-colors hover:border-stage">
              <Avatar name={c.name} src={c.photoUrl} className="aspect-square w-full rounded-lg text-4xl" />
              <div className="mt-3 truncate font-bold group-hover:text-stage">{c.name}</div>
              {c.handle && <div className="truncate text-sm text-muted-foreground">{c.handle}</div>}
              {canVote && <div className="mt-2 text-sm font-bold text-stage">Vote</div>}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const hasVotes = (data.totalVotes ?? 0) > 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      <VoteToasts feed={data.feed} />
      <Ticker feed={data.feed} contestSlug={contestSlug} />

      {hasVotes && s.length >= 2 && (
        <section aria-label="Top 3">
          <Podium top={s.slice(0, 3)} contestSlug={contestSlug} />
        </section>
      )}

      <section aria-labelledby="ranking-title">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="ranking-title" className="display-tight text-2xl sm:text-3xl">
            Ranking
          </h2>
          <span className="text-sm text-muted-foreground">{canVote ? "Tap a comedian to vote" : "Final results"}</span>
        </div>
        <RankTable standings={s} contestSlug={contestSlug} canVote={canVote} />
      </section>
    </div>
  );
}
