import { db } from "./db";

export type Standing = {
  id: string;
  slug: string;
  code: string;
  name: string;
  handle: string | null;
  photoUrl: string | null;
  votes: number;
  rank: number;
  share: number; // 0..1
  gapToNext: number | null; // votes needed to pass the one above (null for #1)
  leadOverNext: number | null; // lead over the one below (only for #1)
  movement: number; // positive = climbed places in the last 24h
  votes24h: number;
  trending: boolean;
};

export type FeedItem = {
  id: string;
  contestantName: string;
  contestantSlug: string;
  votes: number | null; // null when results are hidden
  fan: string;
  at: string;
};

export type LiveData = {
  showResults: boolean;
  totalVotes: number | null;
  standings: Standing[];
  feed: FeedItem[];
  updatedAt: string;
};

function rankOf(list: { id: string; votes: number; name: string }[]) {
  const sorted = [...list].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  const ranks = new Map<string, number>();
  sorted.forEach((c, i) => {
    // ties share the same rank
    const prev = sorted[i - 1];
    ranks.set(c.id, prev && prev.votes === c.votes ? ranks.get(prev.id)! : i + 1);
  });
  return { sorted, ranks };
}

export function fanName(voterName: string | null) {
  if (!voterName) return "Someone";
  const first = voterName.trim().split(/\s+/)[0];
  return first ? first.slice(0, 18) : "Someone";
}

export async function getLiveData(contestId: string, showResults: boolean): Promise<LiveData> {
  const since = new Date(Date.now() - 24 * 3600_000);
  const [contestants, recent, feedRows] = await Promise.all([
    db.contestant.findMany({ where: { contestId } }),
    db.transaction.groupBy({
      by: ["contestantId"],
      where: { contestId, status: "SUCCESS", paidAt: { gte: since } },
      _sum: { votes: true },
    }),
    db.transaction.findMany({
      where: { contestId, status: "SUCCESS" },
      orderBy: { paidAt: "desc" },
      take: 15,
      include: { contestant: { select: { name: true, slug: true } } },
    }),
  ]);

  const recentMap = new Map(recent.map((r) => [r.contestantId, r._sum.votes ?? 0]));
  const now = contestants.map((c) => ({ id: c.id, name: c.name, votes: c.voteCount }));
  const before = contestants.map((c) => ({ id: c.id, name: c.name, votes: c.voteCount - (recentMap.get(c.id) ?? 0) }));
  const { sorted, ranks } = rankOf(now);
  const { ranks: ranksBefore } = rankOf(before);
  const total = now.reduce((s, c) => s + c.votes, 0);
  const maxRecent = Math.max(0, ...recentMap.values());
  const byId = new Map(contestants.map((c) => [c.id, c]));

  const standings: Standing[] = sorted.map((s, i) => {
    const c = byId.get(s.id)!;
    const above = sorted[i - 1];
    const below = sorted[i + 1];
    const v24 = recentMap.get(c.id) ?? 0;
    return {
      id: c.id,
      slug: c.slug,
      code: c.code,
      name: c.name,
      handle: c.handle,
      photoUrl: c.photoUrl,
      votes: c.voteCount,
      rank: ranks.get(c.id)!,
      share: total ? c.voteCount / total : 0,
      gapToNext: above ? above.votes - s.votes + 1 : null,
      leadOverNext: !above && below ? s.votes - below.votes : null,
      movement: (ranksBefore.get(c.id) ?? 0) - ranks.get(c.id)!,
      votes24h: v24,
      trending: v24 > 0 && v24 === maxRecent,
    };
  });

  const feed: FeedItem[] = feedRows.map((t) => ({
    id: t.id,
    contestantName: t.contestant.name,
    contestantSlug: t.contestant.slug,
    votes: showResults ? t.votes : null,
    fan: fanName(t.voterName),
    at: (t.paidAt ?? t.createdAt).toISOString(),
  }));

  if (!showResults) {
    // Hide all numbers and order alphabetically when the admin turned live results off.
    const hidden = [...standings]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ ...s, votes: 0, rank: 0, share: 0, gapToNext: null, leadOverNext: null, movement: 0, votes24h: 0, trending: false }));
    return { showResults, totalVotes: null, standings: hidden, feed, updatedAt: new Date().toISOString() };
  }

  return { showResults, totalVotes: total, standings, feed, updatedAt: new Date().toISOString() };
}

export async function getTopFans(contestantId: string, limit = 5) {
  const rows = await db.transaction.groupBy({
    by: ["email"],
    where: { contestantId, status: "SUCCESS" },
    _sum: { votes: true },
    orderBy: { _sum: { votes: "desc" } },
    take: limit,
  });
  if (rows.length === 0) return [];
  // Use the most recent name each fan gave; never expose emails.
  const names = await db.transaction.findMany({
    where: { contestantId, status: "SUCCESS", email: { in: rows.map((r) => r.email) } },
    orderBy: { createdAt: "desc" },
    select: { email: true, voterName: true },
  });
  const nameByEmail = new Map<string, string | null>();
  for (const n of names) if (!nameByEmail.has(n.email) || (!nameByEmail.get(n.email) && n.voterName)) nameByEmail.set(n.email, n.voterName);
  return rows.map((r, i) => ({ rank: i + 1, name: fanName(nameByEmail.get(r.email) ?? null), votes: r._sum.votes ?? 0 }));
}
