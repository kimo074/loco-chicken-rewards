import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireCustomer, requireStaff } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { createSaleCode, claimSaleCode } from "../services/sales";
import { scanReceiptAmount } from "../lib/receiptScan";

export const salesRouter = Router();

const claimLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
const scanLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });

const createSaleSchema = z.object({
  amountCents: z.number().int().positive(),
});

salesRouter.post(
  "/staff/sales",
  requireStaff,
  asyncHandler(async (req, res) => {
    const { amountCents } = createSaleSchema.parse(req.body);
    if (req.auth?.role !== "STAFF") throw new HttpError(403, "Staff access required");

    const saleCode = await createSaleCode({
      staffUserId: req.auth.staffUserId,
      locationId: req.auth.locationId,
      amountCents,
    });

    res.status(201).json({
      token: saleCode.token,
      coinsAwarded: saleCode.coinsAwarded,
      amountCents: saleCode.amountCents,
      expiresAt: saleCode.expiresAt,
    });
  })
);

const scanReceiptSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(["image/jpeg", "image/png"]),
});

salesRouter.post(
  "/staff/sales/scan-receipt",
  requireStaff,
  scanLimiter,
  asyncHandler(async (req, res) => {
    const { imageBase64, mediaType } = scanReceiptSchema.parse(req.body);
    const amountCents = await scanReceiptAmount(imageBase64, mediaType);
    res.json({ amountCents });
  })
);

const claimSchema = z.object({
  token: z.string().min(1),
});

salesRouter.post(
  "/sales/claim",
  requireCustomer,
  claimLimiter,
  asyncHandler(async (req, res) => {
    const { token } = claimSchema.parse(req.body);
    if (req.auth?.role !== "CUSTOMER") throw new HttpError(403, "Customer access required");

    const { saleCode, coinBalance } = await claimSaleCode({ token, customerId: req.auth.customerId });

    res.json({
      coinsAwarded: saleCode.coinsAwarded,
      coinBalance,
    });
  })
);
