import Link from "next/link";
import type { Prisma, TxStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { naira } from "@/lib/votes";
import { formatWAT } from "@/lib/util";
import { StatusPill } from "@/components/StatusPill";
import { reverifyTransaction } from "../../actions";

const STATUSES: TxStatus[] = ["SUCCESS", "PENDING", "FAILED", "FLAGGED"];
const PAGE = 50;

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

export default async function Transactions({ searchParams }: Props) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as TxStatus) ? (sp.status as TxStatus) : undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // SQLite's LIKE is already case-insensitive; Postgres needs mode: "insensitive".
  const isPostgres = process.env.DATABASE_URL?.startsWith("postgres");
  const text = (v: string) => ({ contains: v, ...(isPostgres ? { mode: "insensitive" } : {}) }) as Prisma.StringFilter;

  const where: Prisma.TransactionWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { reference: text(q) },
            { email: text(q) },
            { voterName: text(q) },
            { contestant: { name: text(q) } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { contestant: true, contest: true },
      orderBy: { createdAt: "desc" },
      take: PAGE,
      skip: (page - 1) * PAGE,
    }),
    db.transaction.count({ where }),
  ]);

  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (status) s.set("status", status);
    if (q) s.set("q", q);
    s.set("page", String(p));
    return `?${s}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Transactions</h1>
        <a href="/api/admin/export" className="btn-ghost !py-1.5 text-sm">Export all CSV</a>
      </div>

      <form className="mb-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search reference, email, name, comedian" className="input max-w-sm !py-2" />
        <select name="status" defaultValue={status ?? ""} className="input max-w-[160px] !py-2">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn !py-2">Filter</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2">Date</th>
              <th>Status</th>
              <th>Comedian</th>
              <th className="text-right">Votes</th>
              <th className="text-right">Amount</th>
              <th>Voter</th>
              <th>Reference</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border align-top">
                <td className="py-3 text-muted-foreground">{formatWAT(r.createdAt)}</td>
                <td>
                  <StatusPill status={r.status} />
                  {r.note && <div className="mt-1 max-w-[200px] text-xs text-muted-foreground">{r.note}</div>}
                </td>
                <td>
                  <div>{r.contestant.name}</div>
                  <div className="text-xs text-muted-foreground">{r.contest.title}</div>
                </td>
                <td className="text-right">{r.votes.toLocaleString()}</td>
                <td className="text-right">{naira(r.amountKobo)}</td>
                <td>
                  <div>{r.voterName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td className="font-mono text-xs text-muted-foreground">{r.reference}</td>
                <td>
                  {r.status === "PENDING" && (
                    <form action={reverifyTransaction.bind(null, r.reference)}>
                      <button className="text-xs text-stage hover:underline">Re-verify</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString()} total</span>
        <div className="flex gap-3">
          {page > 1 && <Link href={qs(page - 1)} className="hover:text-foreground">← Prev</Link>}
          {page * PAGE < total && <Link href={qs(page + 1)} className="hover:text-foreground">Next →</Link>}
        </div>
      </div>
    </div>
  );
}
