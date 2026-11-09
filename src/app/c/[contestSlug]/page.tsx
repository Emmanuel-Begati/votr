import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isContestOpen, naira } from "@/lib/votes";
import { contestBySlug, liveData } from "@/lib/cached";
import { InlineCountdown } from "@/components/Countdown";
import { BackButton } from "@/components/BackButton";
import { Band } from "@/components/Band";
import { LiveBoard } from "@/components/live/LiveBoard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ contestSlug: string }> };

const load = contestBySlug;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).contestSlug);
  return c ? { title: c.title, description: c.description } : {};
}

export default async function ContestPage({ params }: Props) {
  const contest = await load((await params).contestSlug);
  if (!contest) notFound();
  const now = new Date();
  const open = isContestOpen(contest, now);
  const upcoming = contest.status === "LIVE" && contest.startsAt > now;
  const live = await liveData(contest.id, contest.showLiveResults);

  return (
    <div className="space-y-8 sm:space-y-10">
      <Band className="pb-8 pt-4 sm:pb-10 sm:pt-6">
        <BackButton href="/" label="All contests" onBand />
        <div className="mt-5 text-sm font-bold sm:mt-8">
          {open ? (
            <span className="inline-flex items-center gap-2 text-[#5ee39b]">
              <span className="live-dot" /> Voting is open
            </span>
          ) : upcoming ? (
            <span className="text-saffron">Starting soon</span>
          ) : (
            <span className="text-band-muted">Voting has ended</span>
          )}
        </div>
        <h1 className="display mt-2 max-w-4xl text-4xl sm:text-6xl">{contest.title}</h1>
        {contest.description && <p className="mt-3 max-w-2xl text-band-muted sm:text-lg">{contest.description}</p>}

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-band-line pt-5 sm:flex sm:gap-12">
          <BandFact label="1 vote costs" value={naira(contest.pricePerVote)} />
          <BandFact label="Comedians" value={String(contest._count.contestants)} />
          {live.totalVotes !== null && <BandFact label="Total votes" value={live.totalVotes.toLocaleString()} />}
          {open && <BandFact label="Ends in" value={<InlineCountdown to={contest.endsAt.toISOString()} label="" short />} />}
          {upcoming && <BandFact label="Starts in" value={<InlineCountdown to={contest.startsAt.toISOString()} label="" short />} />}
        </dl>
      </Band>

      <LiveBoard contestSlug={contest.slug} initial={live} canVote={open} />
    </div>
  );
}

function BandFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-band-muted">{label}</dt>
      <dd className="num mt-0.5 text-2xl text-white sm:text-3xl">{value}</dd>
    </div>
  );
}
