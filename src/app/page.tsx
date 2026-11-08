import Link from "next/link";
import { db } from "@/lib/db";
import { naira } from "@/lib/votes";
import { getLiveData } from "@/lib/standings";
import { Avatar } from "@/components/Avatar";
import { Band } from "@/components/Band";
import { InlineCountdown } from "@/components/Countdown";
import { CrownIcon } from "@/components/icons";
import { HowItWorks } from "@/components/home/HowItWorks";
import { GrowBar } from "@/components/home/GrowBar";
import { ContestRow, type ContestRowData } from "@/components/home/ContestRow";
import { AllContestsLink } from "@/components/home/AllContestsLink";
import { getContestRows, sortActive, sortPast } from "@/lib/contests";
import { ContestCard } from "@/components/home/ContestCard";

export const dynamic = "force-dynamic";

// Beyond these, contests are reached through the "See all contests" link.
const HOME_ACTIVE = 3;
const HOME_PAST = 3;

export default async function Home() {
  const rows = await getContestRows();
  const activeAll = sortActive(rows);
  const pastAll = sortPast(rows);

  // Two or more open/upcoming contests share the top as equal cards instead of one big scoreboard.
  const many = activeAll.length >= 2;
  const active = activeAll.slice(0, HOME_ACTIVE);
  // With one or no open contest, feature it (or the latest result) as a big scoreboard.
  const featuredRow = many ? undefined : (activeAll[0] ?? pastAll[0]);
  const others = pastAll.filter((r) => r.id !== featuredRow?.id).slice(0, HOME_PAST);
  const shown = (many ? active.length : featuredRow ? 1 : 0) + others.length;
  const hidden = rows.length - shown;
  // Pull the contests up over the band; further when the top "See all" link sits above them.
  const pull = hidden > 0 ? "!-mt-56 sm:!-mt-[17rem]" : "!-mt-44 sm:!-mt-56";

  const featured = featuredRow ? await db.contest.findUnique({ where: { id: featuredRow.id } }) : null;
  const live = featured ? await getLiveData(featured.id, featured.showLiveResults) : null;
  const top = live?.showResults ? live.standings.slice(0, 3) : [];
  const leaderVotes = top[0]?.votes || 1;
  const hasVotes = top.length > 0 && top[0].votes > 0;

  return (
    <div className="space-y-14 sm:space-y-20">
      <Band className={`pt-10 sm:pt-16 ${hidden > 0 ? "pb-52 sm:pb-64" : "pb-40 sm:pb-52"}`}>
        <h1 className="display max-w-3xl text-[2.6rem] sm:text-6xl lg:text-7xl">Vote for your favourite comedian</h1>
        <p className="mt-4 max-w-xl text-lg text-band-muted sm:text-xl">Pick a comedian. Pay for votes. Watch the ranking change live.</p>
      </Band>

      {many ? (
        <section className={`relative ${pull}`} aria-label="Open contests">
          {hidden > 0 && <AllContestsLink count={rows.length} onBand />}
          <div className={`grid gap-4 sm:gap-6 ${active.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
            {active.map((c) => (
              <ContestCard key={c.id} c={c} />
            ))}
          </div>
          {hidden > 0 && <AllContestsLink count={rows.length} />}
        </section>
      ) : /* One contest: a big scoreboard that sits over the bottom of the band */
      featured && featuredRow ? (
        <section className={`relative ${pull}`} aria-labelledby="featured-title">
          {hidden > 0 && <AllContestsLink count={rows.length} onBand />}
          <div className="panel overflow-hidden shadow-[0_30px_60px_-30px_rgba(23,27,85,0.5)]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-8">
              <div className="min-w-0">
                <Phase phase={featuredRow.phase} />
                <h2 id="featured-title" className="display mt-2 text-3xl sm:text-4xl">
                  {featured.title}
                </h2>
                {featured.description && <p className="mt-2 max-w-xl text-muted-foreground">{featured.description}</p>}
              </div>
              <Link href={`/c/${featured.slug}`} className="btn-stage hidden shrink-0 sm:inline-flex">
                See all {featuredRow.comedians} comedians
              </Link>
            </div>

            {hasVotes ? (
              <ol className="border-t border-line">
                {top.map((s, i) => (
                  <li key={s.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/c/${featured.slug}/${s.slug}`}
                      className="group grid grid-cols-[1.75rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-2/60 sm:grid-cols-[2.5rem_auto_minmax(0,1fr)_auto] sm:gap-5 sm:px-8"
                    >
                      <span className={`num text-3xl sm:text-4xl ${s.rank === 1 ? "text-gold" : "text-muted-foreground"}`}>{s.rank}</span>
                      <div className="relative">
                        {s.rank === 1 && <CrownIcon className="absolute -top-3.5 left-1/2 h-4 w-4 -translate-x-1/2 text-saffron" />}
                        <Avatar name={s.name} src={s.photoUrl} className="h-11 w-11 rounded-xl text-sm sm:h-12 sm:w-12" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-lg font-bold group-hover:text-stage">{s.name}</div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                          <GrowBar
                            pct={Math.max(3, (s.votes / leaderVotes) * 100)}
                            delay={0.15 + i * 0.1}
                            className={`h-full rounded-full ${s.rank === 1 ? "bg-saffron" : "bg-stage"}`}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="num text-2xl leading-none sm:text-3xl">{s.votes.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-muted-foreground">votes</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-5 sm:px-8">
                <div className="flex -space-x-2">
                  {featuredRow.top.map((p) => (
                    <Avatar key={p.id} name={p.name} src={p.photoUrl} className="h-11 w-11 rounded-xl text-sm ring-2 ring-surface" />
                  ))}
                </div>
                <p className="text-muted-foreground">{top.length ? "No votes yet. Be the first to vote." : "Results are hidden until voting ends."}</p>
              </div>
            )}

            <dl className="grid grid-cols-3 border-t border-line bg-surface-2/50">
              <Fact label="1 vote costs" value={naira(featured.pricePerVote)} />
              <Fact label="Comedians" value={String(featuredRow.comedians)} />
              <Fact
                label={featuredRow.phase === "upcoming" ? "Starts in" : featuredRow.phase === "ended" ? "Voting" : "Ends in"}
                value={
                  featuredRow.phase === "ended" ? (
                    "Closed"
                  ) : (
                    <InlineCountdown to={featuredRow.phase === "upcoming" ? featuredRow.startsAt : featuredRow.endsAt} label="" short />
                  )
                }
              />
            </dl>
            <div className="border-t border-line p-4 sm:hidden">
              <Link href={`/c/${featured.slug}`} className="btn-stage w-full !py-3.5 text-base">
                See all {featuredRow.comedians} comedians
              </Link>
            </div>
          </div>
          {hidden > 0 && <AllContestsLink count={rows.length} />}
        </section>
      ) : (
        <div className="panel relative !-mt-44 p-10 text-center sm:!-mt-56">
          <h2 className="display-tight text-2xl">No contests yet</h2>
          <p className="mt-2 text-muted-foreground">New contests will show here. Check back soon.</p>
        </div>
      )}

      {others.length > 0 && (
        <section id="contests" className="scroll-mt-24">
          <h2 className="display-tight mb-4 text-2xl sm:text-3xl">Past contests</h2>
          <div className="panel divide-y divide-line overflow-hidden">
            {others.map((c) => (
              <ContestRow key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      <HowItWorks />
    </div>
  );
}

function Phase({ phase }: { phase: ContestRowData["phase"] }) {
  if (phase === "live")
    return (
      <span className="inline-flex items-center gap-2 text-sm font-bold text-up">
        <span className="live-dot" /> Voting is open
      </span>
    );
  if (phase === "upcoming") return <span className="text-sm font-bold text-gold">Starting soon</span>;
  return <span className="text-sm font-bold text-muted-foreground">Voting has ended</span>;
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-r border-line px-4 py-4 last:border-r-0 sm:px-8">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="num mt-0.5 text-xl sm:text-2xl">{value}</dd>
    </div>
  );
}
