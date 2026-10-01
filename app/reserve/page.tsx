import { ReserveWizard } from "./ReserveWizard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const classes = await prisma.scooterClass.findMany({
    where: { active: true },
    orderBy: { dailyRateCents: "asc" },
  });
  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Reserve a scooter</h1>
        <p className="section-intro">
          Pick a class, choose open dates, enter delivery details, and pay. We’ll confirm the delivery window after
          you’re booked.
        </p>
        <ReserveWizard classes={classes} initialClass={sp.class} canceled={sp.canceled === "1"} />
      </div>
    </main>
  );
}
