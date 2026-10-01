import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdmin();
  const rows = await prisma.reservation.findMany({
    where: {
      OR: [{ stripePaymentIntentId: { not: null } }, { paidOffline: true }, { refundCents: { gt: 0 } }],
    },
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Payments</h1>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Stripe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/reservations/${r.id}`}>{r.code}</Link>
                  </td>
                  <td>
                    {r.customer.firstName} {r.customer.lastName}
                  </td>
                  <td>{money(r.totalCents)}</td>
                  <td>{r.stripePaymentStatus || r.status}</td>
                  <td>{r.updatedAt.toISOString().slice(0, 10)}</td>
                  <td>
                    {r.stripePaymentIntentId ? (
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${r.stripePaymentIntentId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Dashboard
                      </a>
                    ) : r.paidOffline ? (
                      "Offline"
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
