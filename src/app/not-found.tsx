import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto max-w-md p-8 text-center sm:p-10">
      <h1 className="display-tight text-2xl">This page is not available</h1>
      <p className="mt-3 text-muted-foreground">The contest may have ended, been hidden, or the link may be wrong.</p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/contests" className="btn-stage">
          See all contests
        </Link>
        <Link href="/" className="btn-ghost">
          Home
        </Link>
      </div>
    </div>
  );
}
