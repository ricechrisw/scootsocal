import { prisma } from "./prisma";
import { DEFAULT_CUTOFF, DEFAULT_TAX_RATE, EMAIL } from "./constants";

export type AppSettings = {
  taxRate: number;
  sameDayCutoff: string;
  notifyEmail: string;
  serviceAreaBlurb: string;
};

const DEFAULTS: Record<string, string> = {
  tax_rate: DEFAULT_TAX_RATE,
  same_day_cutoff: DEFAULT_CUTOFF,
  notify_email: process.env.ADMIN_EMAIL || EMAIL,
  service_area_blurb:
    "Same-day delivery available to Disneyland Resort area, Universal Studios, Downtown LA hotels, Hollywood and Palm Springs Resorts.",
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return {
    taxRate: Number(map.tax_rate),
    sameDayCutoff: map.same_day_cutoff,
    notifyEmail: map.notify_email,
    serviceAreaBlurb: map.service_area_blurb,
  };
}

export async function setSetting(key: string, value: string) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
