import { NextResponse } from "next/server";
import { contestBySlug, liveData } from "@/lib/cached";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ contestSlug: string }> }) {
  const { contestSlug } = await params;
  const contest = await contestBySlug(contestSlug);
  if (!contest) return NextResponse.json({ error: "not found" }, { status: 404 });
  const data = await liveData(contest.id, contest.showLiveResults);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
