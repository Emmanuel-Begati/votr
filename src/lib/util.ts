export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Admin date inputs are interpreted as Lagos time (WAT, UTC+1, no DST).
const WAT_OFFSET = "+01:00";

export function fromLocalInput(v: string) {
  return new Date(`${v}:00${WAT_OFFSET}`);
}

export function toLocalInput(d: Date) {
  const wat = new Date(d.getTime() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 16);
}

export function formatWAT(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
