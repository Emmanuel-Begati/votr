"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Standing } from "@/lib/standings";
import { ArrowUpIcon, CrownIcon } from "@/components/icons";

const TIERS: { votes: number; tag?: string }[] = [
  { votes: 1 },
  { votes: 10 },
  { votes: 25 },
  { votes: 50, tag: "Popular" },
  { votes: 100 },
  { votes: 500 },
];

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
}

type Props = {
  contestantId: string;
  contestantName: string;
  pricePerVote: number;
  minVotes: number;
  maxVotes: number;
  standings: Standing[];
  showResults: boolean;
};

function predict(standings: Standing[], id: string, add: number) {
  const me = standings.find((s) => s.id === id);
  if (!me || add <= 0) return null;
  const after = me.votes + add;
  const newRank = 1 + standings.filter((s) => s.id !== id && s.votes > after).length;
  const passed = standings.filter((s) => s.id !== id && s.rank < me.rank && s.votes < after);
  const nextAbove = standings.filter((s) => s.id !== id && s.votes >= after).sort((a, b) => a.votes - b.votes)[0];
  const runnerUp = standings.filter((s) => s.id !== id).sort((a, b) => b.votes - a.votes)[0];
  return { me, newRank, passed, nextAbove, runnerUp, after };
}

export function VoteForm(props: Props) {
  const tiers = TIERS.filter((t) => t.votes >= props.minVotes && t.votes <= props.maxVotes);
  const [votes, setVotes] = useState<number>(tiers.find((t) => t.tag)?.votes ?? tiers[0]?.votes ?? props.minVotes);
  const [email, setEmail] = useState("");
  const [voterName, setVoterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = Number.isInteger(votes) && votes >= props.minVotes && votes <= props.maxVotes;
  const p = useMemo(
    () => (props.showResults && valid ? predict(props.standings, props.contestantId, votes) : null),
    [props.showResults, props.standings, props.contestantId, votes, valid],
  );
  const first = props.contestantName.split(/\s+/)[0];

  let message: React.ReactNode = null;
  if (p) {
    if (p.me.rank === 1 && p.runnerUp) {
      message = (
        <>
          <CrownIcon className="h-4 w-4 text-gold" /> {first} stays number 1, <b className="num">{(p.after - p.runnerUp.votes).toLocaleString()}</b> votes ahead
        </>
      );
    } else if (p.newRank < p.me.rank) {
      message = (
        <>
          <ArrowUpIcon className="h-3 w-3 text-up" /> {first} moves up to <b className="text-up">number {p.newRank}</b>
        </>
      );
    } else if (p.nextAbove) {
      message = (
        <>
          {first} needs <span className="num font-bold">{(p.nextAbove.votes - p.after + 1).toLocaleString()}</span> more votes to pass {p.nextAbove.name.split(/\s+/)[0]}
        </>
      );
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/votes/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestantId: props.contestantId, votes, email, voterName: voterName || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
      window.location.href = json.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-bold">1. How many votes?</span>
          <span className="text-sm text-muted-foreground">
            1 vote costs <b className="num text-base text-text">{naira(props.pricePerVote)}</b>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiers.map((t) => {
            const active = votes === t.votes;
            return (
              <motion.button
                type="button"
                key={t.votes}
                onClick={() => setVotes(t.votes)}
                aria-pressed={active}
                whileTap={{ scale: 0.96 }}
                className={`relative rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-transparent text-white" : "border-line bg-surface hover:border-stage"
                }`}
              >
                {/* highlight slides between packs */}
                {active && (
                  <motion.span
                    layoutId="tier-highlight"
                    className="absolute inset-0 rounded-xl bg-stage"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
                <span className="relative block">
                  <motion.span
                    className="num block text-3xl leading-none"
                    animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: "left center" }}
                  >
                    {t.votes.toLocaleString()}
                  </motion.span>
                  <span className={`mt-1 block text-xs ${active ? "text-white/75" : "text-muted-foreground"}`}>
                    {t.votes === 1 ? "vote" : "votes"}
                    {t.tag && <b className={active ? "text-saffron" : "text-gold"}>, {t.tag.toLowerCase()}</b>}
                  </span>
                  <span className={`num mt-1.5 block text-base ${active ? "text-white" : "text-text"}`}>{naira(t.votes * props.pricePerVote)}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
        <label className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 focus-within:border-stage">
          <span className="shrink-0 text-sm text-muted-foreground">Or type a number</span>
          <input
            className="num w-full bg-transparent text-right text-2xl outline-none"
            type="number"
            inputMode="numeric"
            min={props.minVotes}
            max={props.maxVotes}
            value={Number.isNaN(votes) ? "" : votes}
            onChange={(e) => setVotes(parseInt(e.target.value, 10))}
            aria-label="Number of votes"
          />
          <span className="text-sm text-muted-foreground">votes</span>
        </label>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={`${votes}-${p?.newRank}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap items-center gap-1.5 rounded-xl bg-surface-2 px-4 py-3 text-sm"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        <span className="font-bold">2. Your details</span>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted-foreground">Email, for your receipt</span>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted-foreground">Your name, shown on the top fans list (optional)</span>
          <input
            className="input"
            autoComplete="given-name"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            maxLength={80}
            placeholder="Musa"
          />
        </label>
      </div>

      {error && <p className="rounded-xl bg-down/10 px-4 py-3 text-sm text-down" role="alert">{error}</p>}

      <button className="btn-stage w-full !py-4 text-lg" disabled={!valid || loading}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden /> Please wait…
          </>
        ) : (
          <>
            Pay{" "}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={valid ? votes : "x"}
                className="num inline-block text-xl"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              >
                {valid ? naira(votes * props.pricePerVote) : ""}
              </motion.span>
            </AnimatePresence>
            {valid && (
              <span className="font-normal opacity-90">
                {" "}
                for {votes.toLocaleString()} vote{votes === 1 ? "" : "s"}
              </span>
            )}
          </>
        )}
      </button>
      <p className="text-center text-xs text-muted-foreground">Pay with card, bank transfer or USSD. Safe payment by Paystack.</p>
    </form>
  );
}
