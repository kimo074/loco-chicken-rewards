import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { createSaleCode, claimSaleCode } from "../services/sales";
import { HttpError } from "../middleware/errorHandler";

let locationId: string;
let staffUserId: string;
let customerId: string;
let otherCustomerId: string;

beforeAll(async () => {
  const location = await prisma.location.create({
    data: { name: `Test Location ${Date.now()}`, address: "Test St 1" },
  });
  locationId = location.id;

  const staff = await prisma.staffUser.create({
    data: { name: "Test Staff", pinHash: "unused-in-tests", locationId },
  });
  staffUserId = staff.id;

  const customer = await prisma.customer.create({
    data: { name: "Test Customer", email: `test-${Date.now()}@example.com`, passwordHash: "unused" },
  });
  customerId = customer.id;

  const other = await prisma.customer.create({
    data: { name: "Other Customer", email: `other-${Date.now()}@example.com`, passwordHash: "unused" },
  });
  otherCustomerId = other.id;
});

afterAll(async () => {
  await prisma.coinTransaction.deleteMany({ where: { customerId: { in: [customerId, otherCustomerId] } } });
  await prisma.saleCode.deleteMany({ where: { locationId } });
  await prisma.customer.deleteMany({ where: { id: { in: [customerId, otherCustomerId] } } });
  await prisma.staffUser.deleteMany({ where: { id: staffUserId } });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.$disconnect();
});

describe("coin-earning flow", () => {
  it("awards 1 coin per euro spent", async () => {
    const saleCode = await createSaleCode({ staffUserId, locationId, amountCents: 1250 });
    expect(saleCode.coinsAwarded).toBe(12);
  });

  it("claiming credits the customer's balance", async () => {
    const before = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const saleCode = await createSaleCode({ staffUserId, locationId, amountCents: 500 });

    const { coinBalance } = await claimSaleCode({ token: saleCode.token, customerId });

    expect(coinBalance).toBe(before.coinBalance + 5);
    const txn = await prisma.coinTransaction.findFirst({ where: { relatedSaleCodeId: saleCode.id } });
    expect(txn?.type).toBe("EARN");
    expect(txn?.amount).toBe(5);
  });

  it("rejects claiming the same code twice (double-spend)", async () => {
    const saleCode = await createSaleCode({ staffUserId, locationId, amountCents: 300 });

    await claimSaleCode({ token: saleCode.token, customerId });

    await expect(claimSaleCode({ token: saleCode.token, customerId: otherCustomerId })).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>);
  });

  it("rejects an expired code", async () => {
    const saleCode = await createSaleCode({ staffUserId, locationId, amountCents: 400 });
    await prisma.saleCode.update({
      where: { id: saleCode.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(claimSaleCode({ token: saleCode.token, customerId })).rejects.toMatchObject({
      status: 410,
    } satisfies Partial<HttpError>);
  });

  it("rejects an unknown token", async () => {
    await expect(claimSaleCode({ token: "not-a-real-token", customerId })).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>);
  });

  it("prevents concurrent double-claim of the same code (race condition)", async () => {
    const saleCode = await createSaleCode({ staffUserId, locationId, amountCents: 1000 });

    const results = await Promise.allSettled([
      claimSaleCode({ token: saleCode.token, customerId }),
      claimSaleCode({ token: saleCode.token, customerId: otherCustomerId }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
