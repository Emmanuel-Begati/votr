import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { isContestOpen } from "@/lib/votes";
import { getLiveData, getTopFans } from "@/lib/standings";
import { TrophyIcon } from "@/components/icons";
import { ContestantLive } from "./ContestantLive";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ contestSlug: string; contestantSlug: string }> };

async function load(contestSlug: string, contestantSlug: string) {
  return db.contestant.findFirst({
    where: { slug: contestantSlug, contest: { slug: contestSlug, status: { in: ["LIVE", "CLOSED"] } } },
    include: { contest: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contestSlug, contestantSlug } = await params;
  const p = await load(contestSlug, contestantSlug);
  if (!p) return {};
  const title = `Vote ${p.name}`;
  const description = `Push ${p.name} to the top of ${p.contest.title}. Every vote counts!`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

export default async function ContestantPage({ params }: Props) {
  const { contestSlug, contestantSlug } = await params;
  const p = await load(contestSlug, contestantSlug);
  if (!p) notFound();
  const c = p.contest;
  const [live, fans] = await Promise.all([getLiveData(c.id, c.showLiveResults), getTopFans(p.id)]);

  const fanWall =
    c.showLiveResults && fans.length > 0 ? (
      <section className="panel p-5 sm:p-7">
        <div className="mb-3 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-gold" />
          <h2 className="display-tight text-xl">Top fans</h2>
        </div>
        <ol className="divide-y divide-line">
          {fans.map((f) => (
            <li key={f.rank} className="flex items-center gap-4 py-3">
              <span className={`num w-6 text-2xl ${f.rank === 1 ? "text-gold" : f.rank === 2 ? "text-silver" : f.rank === 3 ? "text-bronze" : "text-muted-foreground"}`}>
                {f.rank}
              </span>
              <span className="flex-1 truncate font-bold">{f.name}</span>
              <span className="text-muted-foreground">
                <b className="num text-lg text-text">{f.votes.toLocaleString()}</b> votes
              </span>
            </li>
          ))}
        </ol>
      </section>
    ) : null;

  return (
    <ContestantLive
      contestSlug={c.slug}
      contestTitle={c.title}
      contestantId={p.id}
      name={p.name}
      handle={p.handle}
      photoUrl={p.photoUrl}
      bio={p.bio}
      initial={live}
      open={isContestOpen(c)}
      notStarted={c.status === "LIVE" && c.startsAt > new Date()}
      startsAt={c.startsAt.toISOString()}
      endsAt={c.endsAt.toISOString()}
      pricePerVote={c.pricePerVote}
      minVotes={c.minVotes}
      maxVotes={c.maxVotes}
      fans={fanWall}
    />
  );
}
