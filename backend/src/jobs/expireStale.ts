import { prisma } from "../lib/prisma";

const SWEEP_INTERVAL_MS = 60 * 1000;

async function expireStaleSaleCodes() {
  await prisma.saleCode.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

async function expireStaleRedemptions() {
  const stale = await prisma.redemption.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
  });

  for (const redemption of stale) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.redemption.updateMany({
        where: { id: redemption.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
      if (updated.count === 0) return; // already handled concurrently

      await tx.coinTransaction.create({
        data: {
          customerId: redemption.customerId,
          type: "ADJUSTMENT",
          amount: redemption.costCoins,
          relatedRedemptionId: redemption.id,
        },
      });
      await tx.customer.update({
        where: { id: redemption.customerId },
        data: { coinBalance: { increment: redemption.costCoins } },
      });
    });
  }
}

export async function runExpirySweep() {
  await expireStaleSaleCodes();
  await expireStaleRedemptions();
}

export function startExpirySweep() {
  setInterval(() => {
    runExpirySweep().catch((err) => console.error("Expiry sweep failed:", err));
  }, SWEEP_INTERVAL_MS);
}
