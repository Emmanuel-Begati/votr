import type { Metadata } from "next";
import { Band } from "@/components/Band";
import { BackButton } from "@/components/BackButton";
import { ContestCard } from "@/components/home/ContestCard";
import { ContestRow, type ContestRowData } from "@/components/home/ContestRow";
import { sortActive, sortPast } from "@/lib/contests";
import { contestRows } from "@/lib/cached";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All contests",
  description: "Every comedy contest on Votr: open now, starting soon and ended.",
};

export default async function ContestsPage() {
  const rows = await contestRows();
  const active = sortActive(rows);
  const open = active.filter((r) => r.phase === "live");
  const soon = active.filter((r) => r.phase === "upcoming");
  const past = sortPast(rows);

  return (
    <div className="space-y-12 sm:space-y-16">
      <Band className="pb-8 pt-4 sm:pb-10 sm:pt-6">
        <BackButton href="/" label="Home" onBand />
        <h1 className="display mt-6 text-4xl sm:mt-8 sm:text-6xl">All contests</h1>
        <p className="mt-3 max-w-xl text-band-muted sm:text-lg">Choose a contest to see the comedians and vote.</p>
        <dl className="mt-8 flex gap-8 border-t border-band-line pt-5 sm:gap-12">
          <BandFact label="Voting now" value={open.length} />
          <BandFact label="Starting soon" value={soon.length} />
          <BandFact label="Ended" value={past.length} />
        </dl>
      </Band>

      {rows.length === 0 && (
        <div className="panel p-10 text-center">
          <h2 className="display-tight text-2xl">No contests yet</h2>
          <p className="mt-2 text-muted-foreground">New contests will show here. Check back soon.</p>
        </div>
      )}

      <CardSection id="open" title="Voting now" rows={open} />
      <CardSection id="soon" title="Starting soon" rows={soon} />

      {past.length > 0 && (
        <section id="ended" className="scroll-mt-24">
          <h2 className="display-tight mb-4 text-2xl sm:text-3xl">Ended</h2>
          <div className="panel divide-y divide-line overflow-hidden">
            {past.map((c) => (
              <ContestRow key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CardSection({ id, title, rows }: { id: string; title: string; rows: ContestRowData[] }) {
  if (rows.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="display-tight mb-4 text-2xl sm:text-3xl">{title}</h2>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => (
          <ContestCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

function BandFact({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-band-muted">{label}</dt>
      <dd className="num mt-0.5 text-3xl text-white">{value}</dd>
    </div>
  );
}
