import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { createRedemption, fulfillRedemption } from "../services/redemptions";
import { runExpirySweep } from "../jobs/expireStale";
import { HttpError } from "../middleware/errorHandler";

let locationId: string;
let staffUserId: string;
let customerId: string;
let rewardId: string;
const COST_COINS = 100;

beforeAll(async () => {
  const location = await prisma.location.create({
    data: { name: `Redemption Test Location ${Date.now()}`, address: "Test St 2" },
  });
  locationId = location.id;

  const staff = await prisma.staffUser.create({
    data: { name: "Redemption Test Staff", pinHash: "unused-in-tests", locationId },
  });
  staffUserId = staff.id;

  const customer = await prisma.customer.create({
    data: {
      name: "Redemption Test Customer",
      email: `redeem-test-${Date.now()}@example.com`,
      passwordHash: "unused",
      coinBalance: 250,
    },
  });
  customerId = customer.id;

  const reward = await prisma.reward.create({
    data: { name: "Test Reward", description: "For tests", costCoins: COST_COINS, maxValueCents: 1000 },
  });
  rewardId = reward.id;
});

afterAll(async () => {
  await prisma.coinTransaction.deleteMany({ where: { customerId } });
  await prisma.redemption.deleteMany({ where: { customerId } });
  await prisma.reward.deleteMany({ where: { id: rewardId } });
  await prisma.customer.deleteMany({ where: { id: customerId } });
  await prisma.staffUser.deleteMany({ where: { id: staffUserId } });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.$disconnect();
});

describe("redemption flow", () => {
  it("deducts coins immediately on redemption creation", async () => {
    const before = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const { coinBalance } = await createRedemption({ customerId, rewardId });
    expect(coinBalance).toBe(before.coinBalance - COST_COINS);
  });

  it("rejects redemption when balance is insufficient", async () => {
    // Drain balance below the cost first.
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    await prisma.customer.update({ where: { id: customerId }, data: { coinBalance: COST_COINS - 1 } });

    await expect(createRedemption({ customerId, rewardId })).rejects.toMatchObject({ status: 400 } satisfies Partial<
      HttpError
    >);

    // restore
    await prisma.customer.update({ where: { id: customerId }, data: { coinBalance: customer.coinBalance } });
  });

  it("staff can fulfill a redemption by token, and double-fulfill is blocked", async () => {
    await prisma.customer.update({ where: { id: customerId }, data: { coinBalance: 500 } });
    const { redemption } = await createRedemption({ customerId, rewardId });

    const fulfilled = await fulfillRedemption({
      identifier: { token: redemption.token },
      staffUserId,
      locationId,
    });
    expect(fulfilled.reward.id).toBe(rewardId);

    await expect(
      fulfillRedemption({ identifier: { token: redemption.token }, staffUserId, locationId })
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<HttpError>);
  });

  it("staff can fulfill a redemption by shortCode fallback", async () => {
    const { redemption } = await createRedemption({ customerId, rewardId });

    const fulfilled = await fulfillRedemption({
      identifier: { shortCode: redemption.shortCode },
      staffUserId,
      locationId,
    });
    expect(fulfilled.reward.id).toBe(rewardId);
  });

  it("prevents concurrent double-fulfill of the same redemption (race condition)", async () => {
    const { redemption } = await createRedemption({ customerId, rewardId });

    const results = await Promise.allSettled([
      fulfillRedemption({ identifier: { token: redemption.token }, staffUserId, locationId }),
      fulfillRedemption({ identifier: { token: redemption.token }, staffUserId, locationId }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it("refunds coins when a pending redemption expires via the sweep", async () => {
    const before = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const { redemption } = await createRedemption({ customerId, rewardId });

    // Force it into the past so the sweep picks it up.
    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await runExpirySweep();

    const after = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(after.coinBalance).toBe(before.coinBalance); // costCoins was deducted then refunded

    const refreshed = await prisma.redemption.findUniqueOrThrow({ where: { id: redemption.id } });
    expect(refreshed.status).toBe("EXPIRED");

    const adjustment = await prisma.coinTransaction.findFirst({
      where: { relatedRedemptionId: redemption.id, type: "ADJUSTMENT" },
    });
    expect(adjustment?.amount).toBe(COST_COINS);
  });
});
