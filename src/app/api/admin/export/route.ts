import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminId } from "@/lib/auth";

function csv(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  if (!(await getAdminId())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const contestId = req.nextUrl.searchParams.get("contestId") ?? undefined;
  const rows = await db.transaction.findMany({
    where: contestId ? { contestId } : {},
    include: { contestant: true, contest: true },
    orderBy: { createdAt: "desc" },
  });
  const header = ["createdAt", "paidAt", "reference", "status", "contest", "contestant", "votes", "amountNaira", "email", "voterName", "phone", "note"];
  const lines = rows.map((r) =>
    [r.createdAt.toISOString(), r.paidAt?.toISOString(), r.reference, r.status, r.contest.title, r.contestant.name, r.votes, r.amountKobo / 100, r.email, r.voterName, r.phone, r.note]
      .map(csv)
      .join(","),
  );
  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="votr-transactions.csv"`,
    },
  });
}
