import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const downtown = await prisma.location.create({
    data: {
      name: "Loco Chicken - Downtown",
      address: "Damrak 1, Amsterdam",
    },
  });

  const westside = await prisma.location.create({
    data: {
      name: "Loco Chicken - Westside",
      address: "Kinkerstraat 88, Amsterdam",
    },
  });

  const defaultPinHash = await bcrypt.hash("1234", 10);

  await prisma.staffUser.create({
    data: { name: "Ana (Downtown)", pinHash: defaultPinHash, locationId: downtown.id },
  });
  await prisma.staffUser.create({
    data: { name: "Bram (Westside)", pinHash: defaultPinHash, locationId: westside.id },
  });

  await prisma.reward.createMany({
    data: [
      {
        name: "Free Loco Wrap",
        description: "One free classic Loco Chicken wrap.",
        costCoins: 100,
        maxValueCents: 950,
      },
      {
        name: "Free Loaded Fries",
        description: "One free portion of loaded fries.",
        costCoins: 100,
        maxValueCents: 650,
      },
      {
        name: "Free Meal Deal",
        description: "One free meal deal, up to €15 in value.",
        costCoins: 100,
        maxValueCents: 1500,
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Locations: ${downtown.name}, ${westside.name}`);
  console.log("  Staff PIN for both seeded staff: 1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
