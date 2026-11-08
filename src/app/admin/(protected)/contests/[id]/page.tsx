import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { naira } from "@/lib/votes";
import { toLocalInput } from "@/lib/util";
import { Avatar } from "@/components/Avatar";
import { StatusSwitch } from "@/components/StatusSwitch";
import { addContestant, deleteContest, recomputeVoteCounts, updateContest } from "../../../actions";
import { ContestForm } from "../ContestForm";
import { ContestantForm } from "./ContestantForm";
import { ContestantRow } from "./ContestantRow";

export default async function EditContest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contest = await db.contest.findUnique({
    where: { id },
    include: { contestants: { orderBy: { voteCount: "desc" } } },
  });
  if (!contest) notFound();

  const revenue = await db.transaction.groupBy({
    by: ["contestantId"],
    where: { contestId: id, status: "SUCCESS" },
    _sum: { amountKobo: true },
  });
  const rev = new Map(revenue.map((r) => [r.contestantId, r._sum.amountKobo ?? 0]));
  const appUrl = process.env.APP_URL ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold">{contest.title}</h1>
        <StatusSwitch id={contest.id} status={contest.status} />
        {contest.status !== "DRAFT" && (
          <Link href={`/c/${contest.slug}`} target="_blank" className="text-sm text-stage">View public page ↗</Link>
        )}
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold">Settings</h2>
        <ContestForm
          key={contest.status /* remount so the Status field matches after a quick switch */}
          action={updateContest.bind(null, id)}
          submitLabel="Save changes"
          defaults={{
            title: contest.title,
            slug: contest.slug,
            description: contest.description,
            priceNaira: contest.pricePerVote / 100,
            minVotes: contest.minVotes,
            maxVotes: contest.maxVotes,
            startsAt: toLocalInput(contest.startsAt),
            endsAt: toLocalInput(contest.endsAt),
            status: contest.status,
            showLiveResults: contest.showLiveResults,
          }}
        />
      </section>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold">Comedians ({contest.contestants.length})</h2>
          <div className="flex gap-2">
            <a href={`/api/admin/export?contestId=${id}`} className="btn-ghost !py-1.5 text-sm">Export CSV</a>
            <form action={recomputeVoteCounts.bind(null, id)}>
              <button className="btn-ghost !py-1.5 text-sm" title="Recalculate vote counts from successful payments">Recount votes</button>
            </form>
          </div>
        </div>
        <div className="divide-y divide-border">
          {contest.contestants.map((p) => (
            <ContestantRow
              key={p.id}
              contestant={{ id: p.id, name: p.name, handle: p.handle, photoUrl: p.photoUrl, bio: p.bio }}
              summary={
                <div className="flex items-center gap-4">
                  <Avatar name={p.name} src={p.photoUrl} className="h-12 w-12 shrink-0 rounded-md text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      <span className="mr-2 text-xs text-muted-foreground">{p.code}</span>
                      {p.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{appUrl}/c/{contest.slug}/{p.slug}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{p.voteCount.toLocaleString()} votes</div>
                    <div className="text-muted-foreground">{naira(rev.get(p.id) ?? 0)}</div>
                  </div>
                </div>
              }
            />
          ))}
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-3 font-semibold">Add a comedian</h3>
          <ContestantForm action={addContestant.bind(null, id)} submitLabel="Add comedian" resetOnSuccess />
        </div>
      </section>

      <form action={deleteContest.bind(null, id)}>
        <button className="text-sm text-down hover:underline">Delete contest (only allowed if it has no paid votes)</button>
      </form>
    </div>
  );
}
