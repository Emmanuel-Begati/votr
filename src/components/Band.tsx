/** Full-width indigo band that opens a page, directly under the header. */
export function Band({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className="band on-band">
      <div className={`relative mx-auto max-w-6xl px-4 ${className}`}>{children}</div>
    </section>
  );
}
