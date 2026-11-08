/**
 * Used to fade every section in on scroll. Now a plain wrapper: one orchestrated
 * moment (the bars growing in the leaderboards) is enough motion for the site.
 */
export function Reveal({ children, className }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return <div className={className}>{children}</div>;
}
