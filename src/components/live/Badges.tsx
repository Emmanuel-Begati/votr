import { ArrowDownIcon, ArrowUpIcon, FlameIcon } from "@/components/icons";

export function Movement({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="num inline-flex items-center gap-0.5 text-sm text-up" title={`Up ${value} in the last 24 hours`}>
        <ArrowUpIcon className="h-2.5 w-2.5" />
        {value}
        <span className="sr-only"> places up today</span>
      </span>
    );
  if (value < 0)
    return (
      <span className="num inline-flex items-center gap-0.5 text-sm text-down" title={`Down ${-value} in the last 24 hours`}>
        <ArrowDownIcon className="h-2.5 w-2.5" />
        {-value}
        <span className="sr-only"> places down today</span>
      </span>
    );
  return null;
}

/** Flame marker for the comedian getting the most votes today. */
export function TrendingBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-sm font-bold text-[#c2560f]" title="Most votes in the last 24 hours">
      <FlameIcon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Most votes today</span>
    </span>
  );
}

export const METAL = {
  1: { text: "text-gold", ring: "ring-gold", bg: "bg-saffron", label: "1st" },
  2: { text: "text-silver", ring: "ring-silver", bg: "bg-silver", label: "2nd" },
  3: { text: "text-bronze", ring: "ring-bronze", bg: "bg-bronze", label: "3rd" },
} as const;

/** Rank number, coloured for the top 3. */
export function RankChip({ rank }: { rank: number }) {
  const m = METAL[rank as 1 | 2 | 3];
  return <span className={`num text-3xl leading-none sm:text-4xl ${m ? m.text : "text-muted-foreground"}`}>{rank}</span>;
}
