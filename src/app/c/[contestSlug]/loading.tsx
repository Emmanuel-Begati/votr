import { Sk } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading leaderboard">
      <Sk className="h-11 w-36" />
      <div className="space-y-4">
        <Sk className="h-6 w-28" />
        <Sk className="h-14 w-full max-w-xl" />
        <Sk className="h-5 w-72" />
      </div>
      <Sk className="h-11 w-full" />
      <Sk className="h-[420px] w-full" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Sk key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
