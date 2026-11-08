import { db } from "@/lib/db";
import type { ContestRowData } from "@/components/home/ContestRow";

export const PHASE_ORDER = { live: 0, upcoming: 1, ended: 2 } as const;

function phaseOf(c: { status: string; startsAt: Date; endsAt: Date }, now: Date): ContestRowData["phase"] {
  if (c.status === "CLOSED" || c.endsAt < now) return "ended";
  if (c.startsAt > now) return "upcoming";
  return "live";
}

/** Every public contest, shaped for the home page and the all-contests page. */
export async function getContestRows(): Promise<ContestRowData[]> {
  const now = new Date();
  const contests = await db.contest.findMany({
    where: { status: { in: ["LIVE", "CLOSED"] } },
    orderBy: { endsAt: "asc" },
    include: {
      contestants: {
        orderBy: { voteCount: "desc" },
        select: { id: true, slug: true, name: true, photoUrl: true, voteCount: true },
      },
    },
  });

  return contests.map((c) => {
    const total = c.contestants.reduce((s, p) => s + p.voteCount, 0);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      pricePerVote: c.pricePerVote,
      phase: phaseOf(c, now),
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      comedians: c.contestants.length,
      totalVotes: c.showLiveResults ? total : null,
      // when results are hidden, don't leak the order
      top: (c.showLiveResults ? c.contestants : [...c.contestants].sort((a, b) => a.name.localeCompare(b.name)))
        .slice(0, 3)
        .map((p) => ({ id: p.id, slug: p.slug, name: p.name, photoUrl: p.photoUrl, votes: p.voteCount })),
    };
  });
}

/** Open contests first (most votes first), then upcoming (soonest first). */
export function sortActive(rows: ContestRowData[]) {
  return rows
    .filter((r) => r.phase !== "ended")
    .sort(
      (a, b) =>
        PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] ||
        (a.phase === "upcoming" ? a.startsAt.localeCompare(b.startsAt) : (b.totalVotes ?? 0) - (a.totalVotes ?? 0)),
    );
}

/** Most recently ended first. */
export function sortPast(rows: ContestRowData[]) {
  return rows.filter((r) => r.phase === "ended").sort((a, b) => b.endsAt.localeCompare(a.endsAt));
}
