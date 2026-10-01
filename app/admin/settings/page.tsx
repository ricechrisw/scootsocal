import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  const classes = await prisma.scooterClass.findMany({ orderBy: { dailyRateCents: "asc" } });
  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Fleet / inventory settings</h1>
        <form className="form-panel" action={saveSettings}>
          {classes.map((c) => (
            <fieldset key={c.id} style={{ border: 0, padding: 0, margin: 0 }}>
              <h2>{c.name}</h2>
              <div className="form-row">
                <label>
                  Daily rate (USD)
                  <input name={`rate_${c.slug}`} type="number" step="1" defaultValue={c.dailyRateCents / 100} />
                </label>
                <label>
                  Units
                  <input name={`units_${c.slug}`} type="number" min={0} defaultValue={c.unitCount} />
                </label>
                <label>
                  Weight cap
                  <input name={`cap_${c.slug}`} defaultValue={c.weightCap} />
                </label>
              </div>
            </fieldset>
          ))}
          <label>
            Tax rate (e.g. 0.0775)
            <input name="tax_rate" defaultValue={String(settings.taxRate)} />
          </label>
          <label>
            Same-day cutoff (HH:MM, America/Los_Angeles)
            <input name="same_day_cutoff" defaultValue={settings.sameDayCutoff} />
          </label>
          <label>
            Notify email
            <input name="notify_email" type="email" defaultValue={settings.notifyEmail} />
          </label>
          <label>
            Service-area blurb
            <textarea name="service_area_blurb" rows={3} defaultValue={settings.serviceAreaBlurb} />
          </label>
          <button className="btn btn-citrus" type="submit">
            Save settings
          </button>
        </form>
      </div>
    </main>
  );
}
