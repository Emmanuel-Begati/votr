export function StatusPill({ status }: { status: string }) {
  const cls =
    status === "LIVE" || status === "SUCCESS"
      ? "bg-up/10 text-up"
      : status === "FLAGGED"
        ? "bg-down/10 text-down"
        : status === "PENDING"
          ? "bg-saffron/25 text-gold"
          : "bg-surface-2 text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}
