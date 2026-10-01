import Link from "next/link";
import { readAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminNav />
      {children}
    </div>
  );
}

async function AdminNav() {
  const session = await readAdminSession();
  if (!session) return null;
  const me = await prisma.adminUser.findUnique({
    where: { email: session.email },
    select: { name: true },
  });
  const who = me?.name?.trim() || session.email;
  return (
    <nav className="admin-nav wrap" aria-label="Admin">
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/reservations">Reservations</Link>
      <Link href="/admin/calendar">Calendar</Link>
      <Link href="/admin/customers">Customers</Link>
      <Link href="/admin/payments">Payments</Link>
      <Link href="/admin/users">Staff</Link>
      <Link href="/admin/settings">Settings</Link>
      <span className="admin-nav-who">{who}</span>
      <form action="/api/admin/logout" method="post">
        <button className="btn btn-ghost" type="submit">
          Log out
        </button>
      </form>
    </nav>
  );
}
