"use client";
import { motion } from "motion/react";
import type { LiveData } from "@/lib/standings";
import { BackButton } from "@/components/BackButton";
import { Avatar } from "@/components/Avatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Band } from "@/components/Band";
import { Countdown, InlineCountdown } from "@/components/Countdown";
import { CrownIcon } from "@/components/icons";
import { Movement, TrendingBadge } from "@/components/live/Badges";
import { useLive } from "@/components/live/useLive";
import { VoteToasts } from "@/components/live/VoteToasts";
import { VoteForm } from "./VoteForm";
import { ShareButton } from "./ShareButton";
import { MobileVoteBar } from "./MobileVoteBar";

type Props = {
  contestSlug: string;
  contestTitle: string;
  contestantId: string;
  name: string;
  handle: string | null;
  photoUrl: string | null;
  bio: string;
  initial: LiveData;
  open: boolean;
  notStarted: boolean;
  startsAt: string;
  endsAt: string;
  pricePerVote: number;
  minVotes: number;
  maxVotes: number;
  fans: React.ReactNode;
};

export function ContestantLive(props: Props) {
  const data = useLive(props.contestSlug, props.initial);
  const me = data.standings.find((s) => s.id === props.contestantId);
  const show = data.showResults && !!me;
  const idx = me ? data.standings.indexOf(me) : -1;
  const above = show && idx > 0 ? data.standings[idx - 1] : undefined;
  const below = show ? data.standings[idx + 1] : undefined;
  const rival = me?.rank === 1 ? below : above;
  const first = firstName(props.name);

  return (
    <div className="space-y-8 sm:space-y-10">
      <VoteToasts feed={data.feed} />

      <Band className="pb-8 pt-4 sm:pb-10 sm:pt-6">
        <BackButton href={`/c/${props.contestSlug}`} label={props.contestTitle} onBand />
        <div className="mt-6 flex items-center gap-5 sm:mt-8 sm:gap-8">
          <div className="relative shrink-0">
            {show && me!.rank === 1 && (
              <CrownIcon className="absolute -top-6 left-1/2 h-7 w-7 -translate-x-1/2 text-saffron sm:-top-9 sm:h-10 sm:w-10" />
            )}
            <Avatar
              name={props.name}
              src={props.photoUrl}
              className={`h-24 w-24 rounded-2xl text-3xl sm:h-36 sm:w-36 sm:text-5xl ${show && me!.rank === 1 ? "ring-gold" : ""}`}
            />
          </div>
          <div className="min-w-0">
            {show && (
              <div className={`flex flex-wrap items-center gap-x-2 text-sm font-bold sm:text-base ${me!.rank === 1 ? "text-saffron" : "text-band-muted"}`}>
                Number {me!.rank} of {data.standings.length}
                <span className="[&_.text-up]:text-[#5ee39b] [&_.text-down]:text-[#ff8a7e]">
                  <Movement value={me!.movement} />
                </span>
                {me!.trending && (
                  <span className="[&>span]:text-[#ffb27a]">
                    <TrendingBadge />
                  </span>
                )}
              </div>
            )}
            <h1 className="display mt-1 break-words text-4xl sm:text-6xl lg:text-7xl">{props.name}</h1>
            {props.handle && <div className="mt-2 text-band-muted sm:text-lg">{props.handle}</div>}
          </div>
        </div>

        {show && (
          <dl className="mt-8 grid grid-cols-3 border-t border-band-line pt-5 sm:max-w-xl">
            <BandStat label="Votes">
              <AnimatedNumber value={me!.votes} />
            </BandStat>
            <BandStat label="Position">{me!.rank}</BandStat>
            <BandStat label="Votes today">
              <span className="text-[#5ee39b]">+{me!.votes24h.toLocaleString()}</span>
            </BandStat>
          </dl>
        )}
      </Band>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        {/* Vote panel: first on mobile, sticky right column on desktop */}
        <aside id="vote" className="min-w-0 scroll-mt-20 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start">
          <div className="panel p-5 sm:p-7">
            {props.open ? (
              <>
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h2 className="display-tight text-2xl">Vote for {first}</h2>
                  <InlineCountdown to={props.endsAt} label="Ends in" />
                </div>
                <VoteForm
                  contestantId={props.contestantId}
                  contestantName={props.name}
                  pricePerVote={props.pricePerVote}
                  minVotes={props.minVotes}
                  maxVotes={props.maxVotes}
                  standings={data.standings}
                  showResults={data.showResults}
                />
              </>
            ) : props.notStarted ? (
              <div className="py-8 text-center">
                <h2 className="display-tight mb-6 text-2xl">Voting opens soon</h2>
                <div className="flex justify-center">
                  <Countdown to={props.startsAt} label="Opens in" />
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <h2 className="display-tight text-2xl">Voting has ended</h2>
                {show && (
                  <p className="mt-3 text-muted-foreground">
                    {first} finished number {me!.rank}.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
          {show && rival && (
            <section className="panel p-5 sm:p-7">
              <h2 className="display-tight mb-5 text-xl">{me!.rank === 1 ? `${first} is number 1` : `${first} and ${firstName(rival.name)}`}</h2>
              <Battle
                left={{ name: props.name, votes: me!.votes, photoUrl: props.photoUrl }}
                right={{ name: rival.name, votes: rival.votes, photoUrl: rival.photoUrl }}
              />
              <p className="mt-4 text-muted-foreground">
                {me!.rank === 1 ? (
                  <>
                    {first} is <b className="text-text">{(me!.votes - rival.votes).toLocaleString()} votes</b> ahead of {firstName(rival.name)}. Vote to
                    keep {first} on top.
                  </>
                ) : (
                  <>
                    {first} needs <b className="text-text">{me!.gapToNext?.toLocaleString()} more votes</b> to pass {firstName(rival.name)}.
                  </>
                )}
              </p>
            </section>
          )}

          {props.bio && (
            <section className="panel p-5 sm:p-7">
              <h2 className="display-tight mb-2 text-xl">About {first}</h2>
              <p className="leading-relaxed text-muted-foreground">{props.bio}</p>
            </section>
          )}

          {props.fans}

          <ShareButton title={`Vote ${props.name} in ${props.contestTitle}`} />
        </div>
      </div>

      {props.open && <MobileVoteBar name={first} />}
    </div>
  );
}

function firstName(n: string) {
  return n.split(/\s+/)[0];
}

function BandStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-band-muted">{label}</dt>
      <dd className="num mt-0.5 whitespace-nowrap text-2xl text-white sm:text-3xl">{children}</dd>
    </div>
  );
}

type Side = { name: string; votes: number; photoUrl: string | null };

function Battle({ left, right }: { left: Side; right: Side }) {
  const total = Math.max(1, left.votes + right.votes);
  const pct = (left.votes / total) * 100;
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={left.name} src={left.photoUrl} className="h-11 w-11 shrink-0 rounded-xl text-sm" />
          <div className="min-w-0">
            <div className="truncate font-bold">{firstName(left.name)}</div>
            <AnimatedNumber value={left.votes} className="num text-xl text-stage" />
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 text-right">
          <div className="min-w-0">
            <div className="truncate font-bold">{firstName(right.name)}</div>
            <AnimatedNumber value={right.votes} className="num text-xl text-muted-foreground" />
          </div>
          <Avatar name={right.name} src={right.photoUrl} className="h-11 w-11 shrink-0 rounded-xl text-sm" />
        </div>
      </div>
      <div className="flex h-3 gap-1 overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full bg-stage"
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="h-full flex-1 rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
