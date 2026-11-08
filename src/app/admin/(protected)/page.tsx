import Link from "next/link";
import { db } from "@/lib/db";
import { naira } from "@/lib/votes";
import { formatWAT } from "@/lib/util";
import { StatusSwitch } from "@/components/StatusSwitch";

export default async function Dashboard() {
  const [contests, revenue, pending, flagged] = await Promise.all([
    db.contest.findMany({ include: { _count: { select: { contestants: true } } }, orderBy: { createdAt: "desc" } }),
    db.transaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKobo: true, votes: true }, _count: true }),
    db.transaction.count({ where: { status: "PENDING" } }),
    db.transaction.count({ where: { status: "FLAGGED" } }),
  ]);
  const perContest = await db.transaction.groupBy({
    by: ["contestId"],
    where: { status: "SUCCESS" },
    _sum: { amountKobo: true, votes: true },
  });
  const pc = new Map(perContest.map((p) => [p.contestId, p._sum]));

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total revenue" value={naira(revenue._sum.amountKobo ?? 0)} />
        <Stat label="Paid votes" value={(revenue._sum.votes ?? 0).toLocaleString()} />
        <Stat label="Successful payments" value={revenue._count.toLocaleString()} />
        <Stat
          label="Pending / flagged"
          value={`${pending} / ${flagged}`}
          href={flagged ? "/admin/transactions?status=FLAGGED" : "/admin/transactions?status=PENDING"}
        />
      </div>

      <div>
        <h2 className="font-display text-2xl font-extrabold">Contests</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          <b className="text-text">Live</b> shows on the site. <b className="text-text">Closed</b> shows as ended with no more votes.{" "}
          <b className="text-text">Draft</b> hides it from the site.
        </p>
        {contests.length === 0 && (
          <p className="text-muted-foreground">
            No contests yet. <Link href="/admin/contests/new" className="text-stage">Create one</Link>.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2">Contest</th>
                <th>Status</th>
                <th>Ends</th>
                <th>Comedians</th>
                <th className="text-right">Votes</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-3">
                    <Link href={`/admin/contests/${c.id}`} className="font-semibold hover:text-stage">{c.title}</Link>
                  </td>
                  <td className="py-3 pr-4"><StatusSwitch id={c.id} status={c.status} /></td>
                  <td className="text-muted-foreground">{formatWAT(c.endsAt)}</td>
                  <td>{c._count.contestants}</td>
                  <td className="text-right">{(pc.get(c.id)?.votes ?? 0).toLocaleString()}</td>
                  <td className="text-right">{naira(pc.get(c.id)?.amountKobo ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
    </>
  );
  return href ? (
    <Link href={href} className="card p-5 transition hover:border-stage">{inner}</Link>
  ) : (
    <div className="card p-5">{inner}</div>
  );
}
