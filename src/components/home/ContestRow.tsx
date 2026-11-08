import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { InlineCountdown } from "@/components/Countdown";
import { naira } from "@/lib/votes";

export type ContestRowData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pricePerVote: number;
  phase: "live" | "upcoming" | "ended";
  startsAt: string;
  endsAt: string;
  comedians: number;
  totalVotes: number | null; // null when results are hidden
  top: { id: string; slug: string; name: string; photoUrl: string | null; votes: number }[];
};

/** One contest as a list row: status and title on the left, leader and price on the right. */
export function ContestRow({ c }: { c: ContestRowData }) {
  const leader = c.totalVotes ? c.top[0] : undefined;
  return (
    <Link href={`/c/${c.slug}`} className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-surface-2/60 sm:px-8">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">
          {c.phase === "live" && (
            <span className="inline-flex items-center gap-2 text-up">
              <span className="live-dot" /> Voting is open
            </span>
          )}
          {c.phase === "upcoming" && <span className="text-gold">Starting soon</span>}
          {c.phase === "ended" && <span className="text-muted-foreground">Voting has ended</span>}
        </div>
        <div className="display-tight mt-1 truncate text-xl group-hover:text-stage">{c.title}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {c.phase === "live" && <InlineCountdown to={c.endsAt} label="Ends in" />}
          {c.phase === "upcoming" && <InlineCountdown to={c.startsAt} label="Starts in" />}
          {c.phase === "ended" && <span>{c.comedians} comedians</span>}
        </div>
      </div>

      {leader && (
        <div className="hidden items-center gap-3 sm:flex">
          <Avatar name={leader.name} src={leader.photoUrl} className="h-10 w-10 rounded-xl text-xs" />
          <div>
            <div className="text-xs text-muted-foreground">{c.phase === "ended" ? "Winner" : "Number 1"}</div>
            <div className="max-w-40 truncate text-sm font-bold">{leader.name}</div>
          </div>
        </div>
      )}

      <div className="hidden w-28 text-right md:block">
        <div className="text-xs text-muted-foreground">1 vote costs</div>
        <div className="num text-lg">{naira(c.pricePerVote)}</div>
      </div>

      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-stage" aria-hidden>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
