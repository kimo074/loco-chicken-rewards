import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { requireCustomer, requireStaff } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { createRedemption, fulfillRedemption } from "../services/redemptions";

export const redemptionsRouter = Router();

const fulfillLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });

const createRedemptionSchema = z.object({
  rewardId: z.string().min(1),
});

redemptionsRouter.post(
  "/redemptions",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const { rewardId } = createRedemptionSchema.parse(req.body);
    if (req.auth?.role !== "CUSTOMER") throw new HttpError(403, "Customer access required");

    const { redemption, coinBalance } = await createRedemption({ customerId: req.auth.customerId, rewardId });

    res.status(201).json({
      token: redemption.token,
      shortCode: redemption.shortCode,
      reward: { id: redemption.reward.id, name: redemption.reward.name },
      costCoins: redemption.costCoins,
      expiresAt: redemption.expiresAt,
      coinBalance,
    });
  })
);

redemptionsRouter.get(
  "/me/redemptions",
  requireCustomer,
  asyncHandler(async (req, res) => {
    if (req.auth?.role !== "CUSTOMER") throw new HttpError(403, "Customer access required");

    const redemptions = await prisma.redemption.findMany({
      where: { customerId: req.auth.customerId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ redemptions });
  })
);

const fulfillSchema = z.union([
  z.object({ token: z.string().min(1) }),
  z.object({ shortCode: z.string().min(1) }),
]);

redemptionsRouter.post(
  "/staff/redemptions/fulfill",
  requireStaff,
  fulfillLimiter,
  asyncHandler(async (req, res) => {
    const identifier = fulfillSchema.parse(req.body);
    if (req.auth?.role !== "STAFF") throw new HttpError(403, "Staff access required");

    const redemption = await fulfillRedemption({
      identifier,
      staffUserId: req.auth.staffUserId,
      locationId: req.auth.locationId,
    });

    res.json({
      reward: { id: redemption.reward.id, name: redemption.reward.name },
      customer: redemption.customer,
      fulfilledAt: redemption.fulfilledAt,
    });
  })
);
