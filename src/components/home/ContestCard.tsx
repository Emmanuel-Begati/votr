import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { InlineCountdown } from "@/components/Countdown";
import { CrownIcon } from "@/components/icons";
import { naira } from "@/lib/votes";
import { GrowBar } from "./GrowBar";
import type { ContestRowData } from "./ContestRow";

/** One open or upcoming contest, used when two or more share the top of the home page. */
export function ContestCard({ c }: { c: ContestRowData }) {
  const ranked = c.totalVotes !== null && c.totalVotes > 0;
  const leader = c.top[0]?.votes || 1;

  return (
    <article className="panel flex flex-col overflow-hidden shadow-[0_30px_60px_-34px_rgba(23,27,85,0.45)]">
      <div className="p-5 sm:p-6">
        {c.phase === "live" ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-up">
            <span className="live-dot" /> Voting is open
          </span>
        ) : (
          <span className="text-sm font-bold text-gold">Starting soon</span>
        )}
        <h2 className="display mt-2 text-2xl sm:text-3xl">
          <Link href={`/c/${c.slug}`} className="hover:text-stage">
            {c.title}
          </Link>
        </h2>
        {c.description && <p className="mt-2 line-clamp-2 text-muted-foreground">{c.description}</p>}
      </div>

      {ranked ? (
        <ol className="border-t border-line">
          {c.top.map((p, i) => (
            <li key={p.id} className="border-b border-line last:border-b-0">
              <Link
                href={`/c/${c.slug}/${p.slug}`}
                className="group grid grid-cols-[1.25rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/60 sm:px-6"
              >
                <span className={`num text-2xl ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>{i + 1}</span>
                <div className="relative">
                  {i === 0 && <CrownIcon className="absolute -top-3 left-1/2 h-3.5 w-3.5 -translate-x-1/2 text-saffron" />}
                  <Avatar name={p.name} src={p.photoUrl} className="h-9 w-9 rounded-lg text-xs" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold group-hover:text-stage">{p.name}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <GrowBar
                      pct={Math.max(3, (p.votes / leader) * 100)}
                      delay={0.15 + i * 0.1}
                      className={`h-full rounded-full ${i === 0 ? "bg-saffron" : "bg-stage"}`}
                    />
                  </div>
                </div>
                <span className="num text-xl">{p.votes.toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
          <div className="flex -space-x-2">
            {c.top.map((p) => (
              <Avatar key={p.id} name={p.name} src={p.photoUrl} className="h-9 w-9 rounded-lg text-xs ring-2 ring-surface" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {c.phase === "upcoming" ? "Voting has not started yet." : c.totalVotes === null ? "Results are hidden until voting ends." : "No votes yet. Be the first to vote."}
          </p>
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 border-t border-line bg-surface-2/50">
        <div className="border-r border-line px-5 py-3 sm:px-6">
          <div className="text-xs text-muted-foreground">1 vote costs</div>
          <div className="num text-lg">{naira(c.pricePerVote)}</div>
        </div>
        <div className="px-5 py-3 sm:px-6">
          <div className="text-xs text-muted-foreground">{c.phase === "upcoming" ? "Starts in" : "Ends in"}</div>
          <div className="num text-lg">
            <InlineCountdown to={c.phase === "upcoming" ? c.startsAt : c.endsAt} label="" short />
          </div>
        </div>
      </div>
      <div className="border-t border-line p-4">
        <Link href={`/c/${c.slug}`} className="btn-stage w-full">
          {c.phase === "upcoming" ? "See the comedians" : `Vote in this contest`}
        </Link>
      </div>
    </article>
  );
}
