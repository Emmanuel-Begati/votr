import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <nav className="mb-8 flex flex-wrap items-center gap-2 border-b border-border pb-4 text-sm">
        <span className="mr-2 rounded-full bg-band px-3 py-1 text-xs font-bold text-saffron">Admin</span>
        <Link href="/admin" className="btn-ghost !py-1.5">Dashboard</Link>
        <Link href="/admin/contests/new" className="btn-ghost !py-1.5">New contest</Link>
        <Link href="/admin/transactions" className="btn-ghost !py-1.5">Transactions</Link>
        <form action={logout} className="ml-auto">
          <button className="text-muted-foreground hover:text-foreground">Log out</button>
        </form>
      </nav>
      {children}
    </div>
  );
}
