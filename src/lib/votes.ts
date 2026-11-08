import { Prisma } from "@prisma/client";
import { db } from "./db";
import { verifyTransaction } from "./paystack";

export type ApplyResult =
  | { ok: true; status: "SUCCESS"; votes: number; alreadyApplied: boolean }
  | { ok: false; status: "PENDING" | "FAILED" | "FLAGGED" | "NOT_FOUND"; reason?: string };

/**
 * Verifies a reference with Paystack and credits the votes exactly once.
 * Called by the webhook, the callback page, the cron job and the admin re-verify button.
 */
export async function applyVerifiedPayment(reference: string): Promise<ApplyResult> {
  const tx = await db.transaction.findUnique({
    where: { reference },
    include: { contest: true },
  });
  if (!tx) return { ok: false, status: "NOT_FOUND" };
  if (tx.status === "SUCCESS") {
    return { ok: true, status: "SUCCESS", votes: tx.votes, alreadyApplied: true };
  }
  if (tx.status !== "PENDING") return { ok: false, status: tx.status };

  const data = await verifyTransaction(reference);
  const payload = data as unknown as Prisma.InputJsonValue;

  if (data.status !== "success") {
    if (["failed", "abandoned", "reversed"].includes(data.status)) {
      await db.transaction.updateMany({
        where: { id: tx.id, status: "PENDING" },
        data: { status: "FAILED", paystackPayload: payload, note: `Paystack status: ${data.status}` },
      });
      return { ok: false, status: "FAILED", reason: data.status };
    }
    return { ok: false, status: "PENDING", reason: data.status };
  }

  if (data.amount !== tx.amountKobo || data.currency !== "NGN") {
    await db.transaction.updateMany({
      where: { id: tx.id, status: "PENDING" },
      data: {
        status: "FLAGGED",
        paystackPayload: payload,
        note: `Amount/currency mismatch: got ${data.amount} ${data.currency}, expected ${tx.amountKobo} NGN`,
      },
    });
    return { ok: false, status: "FLAGGED", reason: "amount_mismatch" };
  }

  const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
  if (tx.contest.status === "CLOSED" || paidAt > tx.contest.endsAt) {
    await db.transaction.updateMany({
      where: { id: tx.id, status: "PENDING" },
      data: { status: "FLAGGED", paystackPayload: payload, paidAt, note: "Paid after contest closed — refund" },
    });
    return { ok: false, status: "FLAGGED", reason: "contest_closed" };
  }

  // Conditional update guarantees votes are credited once, even with concurrent webhook + callback.
  const applied = await db.$transaction(async (t) => {
    const res = await t.transaction.updateMany({
      where: { id: tx.id, status: "PENDING" },
      data: { status: "SUCCESS", paidAt, paystackPayload: payload },
    });
    if (res.count === 0) return false;
    await t.contestant.update({
      where: { id: tx.contestantId },
      data: { voteCount: { increment: tx.votes } },
    });
    return true;
  });

  return { ok: true, status: "SUCCESS", votes: tx.votes, alreadyApplied: !applied };
}

export function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    kobo / 100,
  );
}

export function isContestOpen(c: { status: string; startsAt: Date; endsAt: Date }, now = new Date()) {
  return c.status === "LIVE" && now >= c.startsAt && now <= c.endsAt;
}
