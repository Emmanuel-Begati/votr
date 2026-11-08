import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";
import { isContestOpen } from "@/lib/votes";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  contestantId: z.string().min(1),
  votes: z.coerce.number().int().positive(),
  email: z.string().email(),
  voterName: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`init:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many tries. Please wait 1 minute." }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your email and number of votes." }, { status: 400 });
  }
  const { contestantId, votes, email, voterName, phone } = parsed.data;

  const contestant = await db.contestant.findUnique({ where: { id: contestantId }, include: { contest: true } });
  if (!contestant) return NextResponse.json({ error: "Comedian not found." }, { status: 404 });
  const contest = contestant.contest;

  if (!isContestOpen(contest)) {
    return NextResponse.json({ error: "Voting is closed for this contest." }, { status: 400 });
  }
  if (votes < contest.minVotes || votes > contest.maxVotes) {
    return NextResponse.json(
      { error: `Choose between ${contest.minVotes} and ${contest.maxVotes} votes.` },
      { status: 400 },
    );
  }

  // Price is always computed server-side.
  const amountKobo = votes * contest.pricePerVote;
  const reference = `votr_${randomUUID().replace(/-/g, "")}`;

  await db.transaction.create({
    data: {
      reference,
      contestId: contest.id,
      contestantId: contestant.id,
      votes,
      amountKobo,
      email,
      voterName: voterName || null,
      phone: phone || null,
    },
  });

  try {
    const init = await initializeTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl: `${process.env.APP_URL}/vote/callback`,
      metadata: {
        contest: contest.title,
        contestant: contestant.name,
        votes,
        custom_fields: [
          { display_name: "Contestant", variable_name: "contestant", value: contestant.name },
          { display_name: "Votes", variable_name: "votes", value: String(votes) },
        ],
      },
    });
    return NextResponse.json({ url: init.authorization_url });
  } catch (e) {
    console.error(e);
    await db.transaction.update({ where: { reference }, data: { status: "FAILED", note: "Init failed" } });
    return NextResponse.json({ error: "Payment could not start. Please try again." }, { status: 502 });
  }
}
