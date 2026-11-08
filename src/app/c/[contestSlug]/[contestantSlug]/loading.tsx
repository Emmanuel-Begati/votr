import { Sk } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading comedian">
      <Sk className="h-11 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Sk className="h-[300px] w-full" />
          <Sk className="h-[180px] w-full" />
          <Sk className="h-[240px] w-full" />
        </div>
        <Sk className="h-[620px] w-full" />
      </div>
    </div>
  );
}
