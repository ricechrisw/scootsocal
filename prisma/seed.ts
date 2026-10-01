import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, todayInLA } from "../lib/dates";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@scootsocal.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-now";
  const hash = await bcrypt.hash(adminPassword, 12);

  const adminName = (process.env.ADMIN_NAME || "Admin").trim() || "Admin";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hash, name: adminName },
    create: { email: adminEmail, name: adminName, passwordHash: hash },
  });

  const classes = [
    {
      slug: "light",
      name: "Light Duty",
      dailyRateCents: 4900,
      unitCount: 3,
      weightCap: "300 lb",
      description: "Compact / travel, theme parks, hotels.",
      photoPath: "/images/pride-gogo-light-duty.jpg",
    },
    {
      slug: "standard",
      name: "Standard Duty",
      dailyRateCents: 5900,
      unitCount: 4,
      weightCap: "350 lb",
      description: "Everyday comfort and range.",
      photoPath: "/images/pride-victory-standard.jpg",
    },
    {
      slug: "heavy",
      name: "Heavy Duty",
      dailyRateCents: 7900,
      unitCount: 2,
      weightCap: "400–500 lb",
      description: "Higher capacity, longer days.",
      photoPath: "/images/pride-maxima-hd.jpg",
    },
  ];

  const saved = [];
  for (const c of classes) {
    saved.push(
      await prisma.scooterClass.upsert({
        where: { slug: c.slug },
        update: c,
        create: c,
      }),
    );
  }

  const light = saved.find((c) => c.slug === "light")!;
  const standard = saved.find((c) => c.slug === "standard")!;
  const heavy = saved.find((c) => c.slug === "heavy")!;

  await prisma.appSetting.upsert({
    where: { key: "tax_rate" },
    update: {},
    create: { key: "tax_rate", value: "0.0775" },
  });
  await prisma.appSetting.upsert({
    where: { key: "same_day_cutoff" },
    update: {},
    create: { key: "same_day_cutoff", value: "11:00" },
  });
  await prisma.appSetting.upsert({
    where: { key: "notify_email" },
    update: {},
    create: { key: "notify_email", value: adminEmail },
  });
  await prisma.appSetting.upsert({
    where: { key: "service_area_blurb" },
    update: {},
    create: {
      key: "service_area_blurb",
      value:
        "Same-day delivery available to Disneyland Resort area, Universal Studios, Downtown LA hotels, Hollywood and Palm Springs Resorts.",
    },
  });

  const existing = await prisma.reservation.count();
  if (existing === 0) {
    const t = todayInLA();
    const alice = await prisma.customer.create({
      data: {
        firstName: "Alice",
        lastName: "Nguyen",
        email: "alice.sample@scootsocal.com",
        phone: "7145550101",
      },
    });
    const bob = await prisma.customer.create({
      data: {
        firstName: "Bob",
        lastName: "Martinez",
        email: "bob.sample@scootsocal.com",
        phone: "3235550199",
      },
    });
    const cara = await prisma.customer.create({
      data: {
        firstName: "Cara",
        lastName: "Singh",
        email: "cara.sample@scootsocal.com",
        phone: "9495550144",
      },
    });

    await prisma.reservation.create({
      data: {
        code: "SSC-DEMO",
        customerId: alice.id,
        classId: light.id,
        startDate: addDays(t, 3),
        endDate: addDays(t, 6),
        status: "confirmed",
        street: "1150 Magic Way",
        city: "Anaheim",
        state: "CA",
        zip: "92802",
        placeType: "hotel",
        propertyName: "Disneyland Hotel",
        deliveryWindow: "morning",
        pickupWindow: "afternoon",
        riderWeight: 180,
        notes: "Front desk will hold for guest.",
        subtotalCents: 4900 * 4,
        taxCents: Math.round(4900 * 4 * 0.0775),
        totalCents: 4900 * 4 + Math.round(4900 * 4 * 0.0775),
        stripePaymentStatus: "paid",
        stripePaymentIntentId: "pi_test_demo_alice",
        stripeChargeId: "ch_test_demo_alice",
        receiptUrl: "https://dashboard.stripe.com/test/payments",
        cardBrand: "visa",
        cardLast4: "4242",
      },
    });

    await prisma.reservation.create({
      data: {
        code: "SSC-STD1",
        customerId: bob.id,
        classId: standard.id,
        startDate: addDays(t, 5),
        endDate: addDays(t, 7),
        status: "confirmed",
        street: "100 Universal City Plaza",
        city: "Universal City",
        state: "CA",
        zip: "91608",
        placeType: "hotel",
        propertyName: "Sheraton Universal",
        deliveryWindow: "flexible",
        pickupWindow: "morning",
        riderWeight: 220,
        subtotalCents: 5900 * 3,
        taxCents: Math.round(5900 * 3 * 0.0775),
        totalCents: 5900 * 3 + Math.round(5900 * 3 * 0.0775),
        stripePaymentStatus: "paid",
        stripePaymentIntentId: "pi_test_demo_bob",
        stripeChargeId: "ch_test_demo_bob",
        cardBrand: "mastercard",
        cardLast4: "4444",
      },
    });

    await prisma.reservation.create({
      data: {
        code: "SSC-CXL1",
        customerId: cara.id,
        classId: heavy.id,
        startDate: addDays(t, 10),
        endDate: addDays(t, 12),
        status: "canceled",
        street: "277 N Palm Canyon Dr",
        city: "Palm Springs",
        state: "CA",
        zip: "92262",
        placeType: "resort",
        propertyName: "Rowan Palm Springs",
        deliveryWindow: "afternoon",
        pickupWindow: "flexible",
        riderWeight: 280,
        subtotalCents: 7900 * 3,
        taxCents: Math.round(7900 * 3 * 0.0775),
        totalCents: 7900 * 3 + Math.round(7900 * 3 * 0.0775),
        stripePaymentStatus: "refunded",
        refundCents: 7900 * 3 + Math.round(7900 * 3 * 0.0775),
        stripeRefundIds: "re_test_demo_cara",
        adminNotes: "Sample canceled paid booking — payment history kept.",
      },
    });
  }

  console.log("Seeded classes, admin, settings, and sample reservations.");
  console.log(`Admin login: ${adminEmail}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
