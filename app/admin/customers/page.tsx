import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireAdmin();
  const customers = await prisma.customer.findMany({
    include: { reservations: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Customers</h1>
        {customers.map((c) => (
          <section key={c.id} className="form-panel" style={{ marginBottom: "1rem" }}>
            <h2>
              {c.firstName} {c.lastName}
            </h2>
            <p>
              {c.email} · {c.phone}
            </p>
            <ul>
              {c.reservations.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reservations/${r.id}`}>
                    {r.code} · {r.status} · {r.startDate}–{r.endDate}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
