import { requireAdmin } from "@/lib/auth";
import { isValidYmd, todayInLA } from "@/lib/dates";
import { releaseExpiredHolds } from "@/lib/inventory";
import { StaffCalendar, type CalView } from "./StaffCalendar";

export const dynamic = "force-dynamic";

function parseView(value: string | undefined): CalView {
  if (value === "week" || value === "day" || value === "month") return value;
  return "month";
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  await requireAdmin();
  await releaseExpiredHolds();
  const sp = await searchParams;
  const today = todayInLA();
  const date = sp.date && isValidYmd(sp.date) ? sp.date : today;

  return (
    <main id="main" className="section">
      <div className="wrap wrap-wide">
        <StaffCalendar today={today} initialView={parseView(sp.view)} initialDate={date} />
      </div>
    </main>
  );
}
