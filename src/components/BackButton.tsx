import Link from "next/link";

export function BackButton({ href, label, onBand = false }: { href: string; label: string; onBand?: boolean }) {
  return (
    <Link
      href={href}
      className={`group -ml-1 inline-flex max-w-full items-center gap-1 rounded-full py-1.5 pl-1 pr-3 text-[15px] font-semibold transition-colors ${
        onBand ? "text-band-muted hover:text-white" : "text-muted-foreground hover:text-text"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="truncate">{label}</span>
    </Link>
  );
}
