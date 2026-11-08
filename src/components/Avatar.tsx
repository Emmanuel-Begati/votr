/* eslint-disable @next/next/no-img-element */
// Flat dye colours, all dark enough for white initials.
const COLOURS = ["#2b32a0", "#12804a", "#7a2e5f", "#0f6b78", "#8a4b1c", "#4a3a9a"];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function Avatar({ name, src, className = "" }: { name: string; src?: string | null; className?: string }) {
  if (src) return <img src={src} alt={name} className={`object-cover ${className}`} />;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex select-none items-center justify-center font-display font-bold text-white ${className}`}
      style={{ backgroundColor: COLOURS[hash(name) % COLOURS.length], fontStretch: "92%" }}
      role="img"
      aria-label={name}
    >
      {initials}
    </div>
  );
}
