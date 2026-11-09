import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "./db";
import { getLiveData, getTopFans } from "./standings";
import { getContestRows } from "./contests";

/**
 * Short-lived shared cache for public pages. The database is far away, so each query costs
 * hundreds of ms; reusing results for a few seconds makes repeat visits and live polling fast.
 * Anything that changes votes or contests calls `refreshPublicData()` so changes show at once.
 */
const TTL = 5; // seconds
const TAG = "public";

/** Clear the public cache. Safe to call anywhere (it is a no-op during page render). */
export function refreshPublicData() {
  try {
    revalidateTag(TAG);
  } catch {
    // revalidateTag can't run while a page renders (e.g. the vote callback page); the TTL covers it.
  }
}

// unstable_cache stores results as JSON, so Date fields come back as strings and must be revived.
const DATE_KEYS = ["startsAt", "endsAt", "createdAt", "updatedAt"] as const;
function reviveDates<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = { ...o };
  for (const k of DATE_KEYS) if (typeof out[k] === "string") out[k] = new Date(out[k] as string);
  return out as T;
}

export const liveData = unstable_cache(getLiveData, ["live-data"], { revalidate: TTL, tags: [TAG] });
export const topFans = unstable_cache(getTopFans, ["top-fans"], { revalidate: TTL, tags: [TAG] });
export const contestRows = unstable_cache(getContestRows, ["contest-rows"], { revalidate: TTL, tags: [TAG] });

const contestBySlugRaw = unstable_cache(
  (slug: string) =>
    db.contest.findFirst({
      where: { slug, status: { in: ["LIVE", "CLOSED"] } },
      include: { _count: { select: { contestants: true } } },
    }),
  ["contest-by-slug"],
  { revalidate: TTL, tags: [TAG] },
);
/** Public contest by slug. Wrapped in React `cache` so metadata and page share one lookup. */
export const contestBySlug = cache(async (slug: string) => {
  const c = await contestBySlugRaw(slug);
  return c ? reviveDates(c) : null;
});

const contestantRaw = unstable_cache(
  (contestSlug: string, contestantSlug: string) =>
    db.contestant.findFirst({
      where: { slug: contestantSlug, contest: { slug: contestSlug, status: { in: ["LIVE", "CLOSED"] } } },
      include: { contest: true },
    }),
  ["contestant-by-slug"],
  { revalidate: TTL, tags: [TAG] },
);
/** Public contestant (with its contest) by slugs. */
export const contestantBySlug = cache(async (contestSlug: string, contestantSlug: string) => {
  const p = await contestantRaw(contestSlug, contestantSlug);
  return p ? { ...reviveDates(p), contest: reviveDates(p.contest) } : null;
});
