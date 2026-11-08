import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyVerifiedPayment } from "@/lib/votes";

// Re-verifies PENDING transactions older than 15 minutes; expires ones older than 24h.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = Date.now();
  const pending = await db.transaction.findMany({
    where: { status: "PENDING", createdAt: { lt: new Date(now - 15 * 60_000) } },
    take: 100,
    orderBy: { createdAt: "asc" },
  });

  const results: Record<string, string> = {};
  for (const tx of pending) {
    try {
      const r = await applyVerifiedPayment(tx.reference);
      if (r.status === "PENDING" && tx.createdAt.getTime() < now - 24 * 3600_000) {
        await db.transaction.updateMany({
          where: { id: tx.id, status: "PENDING" },
          data: { status: "FAILED", note: "Expired (unpaid after 24h)" },
        });
        results[tx.reference] = "EXPIRED";
      } else {
        results[tx.reference] = r.status;
      }
    } catch (e) {
      // Paystack returns an error for references that were never paid; expire them after 24h.
      if (tx.createdAt.getTime() < now - 24 * 3600_000) {
        await db.transaction.updateMany({
          where: { id: tx.id, status: "PENDING" },
          data: { status: "FAILED", note: "Expired (not found on Paystack)" },
        });
        results[tx.reference] = "EXPIRED";
      } else {
        results[tx.reference] = `ERROR: ${(e as Error).message}`;
      }
    }
  }
  return NextResponse.json({ checked: pending.length, results });
}
