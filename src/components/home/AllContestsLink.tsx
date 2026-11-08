import Link from "next/link";

/**
 * Quiet link to the all-contests page, shown only when some contests are left off the home page.
 * `onBand` is the copy above the cards, sitting on the indigo band.
 */
export function AllContestsLink({ count, onBand = false }: { count: number; onBand?: boolean }) {
  return (
    <div className={`flex justify-end ${onBand ? "mb-3" : "mt-5"}`}>
      <Link
        href="/contests"
        className={`group inline-flex items-center gap-2 rounded-full py-2 pl-4 pr-3 font-bold transition-colors ${
          onBand ? "on-band text-white hover:bg-band-2" : "text-stage hover:bg-surface-2"
        }`}
      >
        See all {count} contests
        <span
          className={`grid h-7 w-7 place-items-center rounded-full transition-transform group-hover:translate-x-0.5 ${
            onBand ? "bg-saffron text-band" : "bg-stage text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
