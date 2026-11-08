/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vote for your favourite comedian";

export default async function OG({ params }: { params: Promise<{ contestSlug: string; contestantSlug: string }> }) {
  const { contestSlug, contestantSlug } = await params;
  const p = await db.contestant.findFirst({
    where: { slug: contestantSlug, contest: { slug: contestSlug } },
    include: { contest: true },
  });
  const name = p?.name ?? "Votr";
  const contest = p?.contest.title ?? "";
  const initials = name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#08070b", color: "#f4f1ea", padding: 64, alignItems: "center", gap: 56 }}>
        {p?.photoUrl ? (
          <img src={p.photoUrl} width={420} height={420} style={{ borderRadius: 40, objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: 420, height: 420, borderRadius: 40, background: "linear-gradient(135deg,#ff2e4d,#ff8a3d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 160, fontWeight: 800, color: "#1a1400" }}>
            {initials}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 32, color: "#ffc54d", fontWeight: 700 }}>VOTE NOW</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 12 }}>{name}</div>
          <div style={{ fontSize: 34, color: "#a29fb0", marginTop: 20 }}>{contest}</div>
          <div style={{ fontSize: 28, marginTop: 48, display: "flex" }}>
            votr<span style={{ color: "#ffc54d" }}>.</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
