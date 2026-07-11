import { prisma } from "../lib/prisma";
import { generateOpaqueToken, generateShortCode } from "../lib/tokens";
import { REDEMPTION_TTL_MS } from "../lib/coins";
import { HttpError } from "../middleware/errorHandler";

async function generateUniquePendingShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();
    const clash = await prisma.redemption.findFirst({ where: { shortCode, status: "PENDING" } });
    if (!clash) return shortCode;
  }
  throw new HttpError(500, "Could not generate a unique redemption code, please try again");
}

export async function createRedemption(params: { customerId: string; rewardId: string }) {
  const { customerId, rewardId } = params;

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) throw new HttpError(404, "Reward not found");

  const shortCode = await generateUniquePendingShortCode();
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + REDEMPTION_TTL_MS);

  return prisma.$transaction(async (tx) => {
    const debited = await tx.customer.updateMany({
      where: { id: customerId, coinBalance: { gte: reward.costCoins } },
      data: { coinBalance: { decrement: reward.costCoins } },
    });
    if (debited.count === 0) throw new HttpError(400, "Insufficient coin balance");

    const redemption = await tx.redemption.create({
      data: {
        token,
        shortCode,
        customerId,
        rewardId,
        costCoins: reward.costCoins,
        expiresAt,
      },
      include: { reward: true },
    });

    await tx.coinTransaction.create({
      data: {
        customerId,
        type: "REDEEM",
        amount: -reward.costCoins,
        relatedRedemptionId: redemption.id,
      },
    });

    const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });

    return { redemption, coinBalance: customer.coinBalance };
  });
}

export async function fulfillRedemption(params: {
  identifier: { token: string } | { shortCode: string };
  staffUserId: string;
  locationId: string;
}) {
  const { identifier, staffUserId, locationId } = params;

  return prisma.$transaction(async (tx) => {
    // shortCode is only unique among PENDING redemptions (see generateUniquePendingShortCode),
    // so a shortCode lookup must be scoped to PENDING to avoid matching a stale historical redemption.
    // token is globally unique, so no such scoping is needed there.
    const candidate = await tx.redemption.findFirst({
      where:
        "token" in identifier
          ? { token: identifier.token }
          : { shortCode: identifier.shortCode, status: "PENDING" },
    });
    if (!candidate) throw new HttpError(404, "Redemption code not found");

    const result = await tx.redemption.updateMany({
      where: { id: candidate.id, status: "PENDING", expiresAt: { gt: new Date() } },
      data: {
        status: "FULFILLED",
        fulfilledAt: new Date(),
        fulfilledByStaffId: staffUserId,
        fulfilledAtLocationId: locationId,
      },
    });

    if (result.count === 0) {
      const fresh = await tx.redemption.findUniqueOrThrow({ where: { id: candidate.id } });
      if (fresh.status === "FULFILLED") throw new HttpError(409, "This redemption has already been fulfilled");
      if (fresh.status === "EXPIRED" || fresh.expiresAt <= new Date()) {
        throw new HttpError(410, "This redemption has expired");
      }
      throw new HttpError(409, "This redemption is not available");
    }

    return tx.redemption.findUniqueOrThrow({
      where: { id: candidate.id },
      include: { reward: true, customer: { select: { id: true, name: true } } },
    });
  });
}
