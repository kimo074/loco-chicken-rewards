import { prisma } from "../lib/prisma";
import { generateOpaqueToken } from "../lib/tokens";
import { coinsForAmount, SALE_CODE_TTL_MS } from "../lib/coins";
import { HttpError } from "../middleware/errorHandler";

export async function createSaleCode(params: {
  staffUserId: string;
  locationId: string;
  amountCents: number;
}) {
  const { staffUserId, locationId, amountCents } = params;
  if (amountCents <= 0) throw new HttpError(400, "amountCents must be positive");

  const coinsAwarded = coinsForAmount(amountCents);
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + SALE_CODE_TTL_MS);

  const saleCode = await prisma.saleCode.create({
    data: { token, locationId, staffUserId, amountCents, coinsAwarded, expiresAt },
  });

  return saleCode;
}

export async function claimSaleCode(params: { token: string; customerId: string }) {
  const { token, customerId } = params;

  return prisma.$transaction(async (tx) => {
    const result = await tx.saleCode.updateMany({
      where: { token, status: "PENDING", expiresAt: { gt: new Date() } },
      data: { status: "CLAIMED", claimedByCustomerId: customerId, claimedAt: new Date() },
    });

    if (result.count === 0) {
      const existing = await tx.saleCode.findUnique({ where: { token } });
      if (!existing) throw new HttpError(404, "Invalid code");
      if (existing.status === "CLAIMED") throw new HttpError(409, "This code has already been claimed");
      if (existing.status === "EXPIRED" || existing.expiresAt <= new Date()) {
        throw new HttpError(410, "This code has expired");
      }
      throw new HttpError(409, "This code is not available");
    }

    const saleCode = await tx.saleCode.findUniqueOrThrow({ where: { token } });

    await tx.coinTransaction.create({
      data: {
        customerId,
        locationId: saleCode.locationId,
        type: "EARN",
        amount: saleCode.coinsAwarded,
        relatedSaleCodeId: saleCode.id,
      },
    });

    const customer = await tx.customer.update({
      where: { id: customerId },
      data: { coinBalance: { increment: saleCode.coinsAwarded } },
    });

    if (saleCode.staffUserId) {
      await tx.staffUser.update({
        where: { id: saleCode.staffUserId },
        data: { points: { increment: 1 }, customerScannedOrders: { increment: 1 } },
      });
    }

    return { saleCode, coinBalance: customer.coinBalance };
  });
}
