import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveData } from "@/lib/standings";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ contestSlug: string }> }) {
  const { contestSlug } = await params;
  const contest = await db.contest.findFirst({ where: { slug: contestSlug, status: { in: ["LIVE", "CLOSED"] } } });
  if (!contest) return NextResponse.json({ error: "not found" }, { status: 404 });
  const data = await getLiveData(contest.id, contest.showLiveResults);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
