import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { requireAdmin, requireFullAdmin } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";

export const adminRouter = Router();

if (!process.env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}
if (!process.env.LIMITED_ADMIN_PASSWORD) {
  throw new Error("LIMITED_ADMIN_PASSWORD environment variable is required");
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LIMITED_ADMIN_PASSWORD = process.env.LIMITED_ADMIN_PASSWORD;

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

const loginSchema = z.object({
  password: z.string().min(1),
});

adminRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { password } = loginSchema.parse(req.body);

    const level = password === ADMIN_PASSWORD ? "full" : password === LIMITED_ADMIN_PASSWORD ? "limited" : null;
    if (!level) throw new HttpError(401, "Invalid password");

    const token = signToken({ role: "ADMIN", level }, "12h");
    res.json({ token, level });
  })
);

adminRouter.get(
  "/customers",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, coinBalance: true, active: true, createdAt: true },
    });
    res.json({ customers });
  })
);

adminRouter.get(
  "/staff",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const staff = await prisma.staffUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        active: true,
        createdAt: true,
        location: { select: { id: true, name: true } },
      },
    });
    res.json({ staff });
  })
);

const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  coinBalance: z.number().int().min(0).optional(),
});

adminRouter.post(
  "/customers",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const { name, email, password, coinBalance } = createCustomerSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { name, email, passwordHash, coinBalance: coinBalance ?? 0 },
      select: { id: true, name: true, email: true, coinBalance: true, active: true, createdAt: true },
    });
    res.status(201).json({ customer });
  })
);

adminRouter.delete(
  "/customers/:id",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await prisma.customer.delete({ where: { id: req.params.id } }).catch(() => null);
    if (!deleted) throw new HttpError(404, "Customer not found");
    res.status(204).send();
  })
);

const adjustCoinsSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, "amount must not be zero"),
});

adminRouter.post(
  "/customers/:id/coins",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const { amount } = adjustCoinsSchema.parse(req.body);
    const customerId = req.params.id;

    const customer = await prisma.$transaction(async (tx) => {
      const updated = await tx.customer.updateMany({
        where: { id: customerId, coinBalance: { gte: -amount } },
        data: { coinBalance: { increment: amount } },
      });
      if (updated.count === 0) {
        const existing = await tx.customer.findUnique({ where: { id: customerId } });
        if (!existing) throw new HttpError(404, "Customer not found");
        throw new HttpError(400, "This would make the balance negative");
      }

      await tx.coinTransaction.create({
        data: { customerId, type: "ADJUSTMENT", amount },
      });

      return tx.customer.findUniqueOrThrow({
        where: { id: customerId },
        select: { id: true, name: true, email: true, coinBalance: true, active: true, createdAt: true },
      });
    });

    res.json({ customer });
  })
);

const toggleActiveSchema = z.object({
  active: z.boolean(),
});

adminRouter.patch(
  "/customers/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { active } = toggleActiveSchema.parse(req.body);
    const customer = await prisma.customer
      .update({
        where: { id: req.params.id },
        data: { active },
        select: { id: true, name: true, email: true, coinBalance: true, active: true, createdAt: true },
      })
      .catch(() => null);
    if (!customer) throw new HttpError(404, "Customer not found");
    res.json({ customer });
  })
);

adminRouter.patch(
  "/staff/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { active } = toggleActiveSchema.parse(req.body);
    const staff = await prisma.staffUser
      .update({
        where: { id: req.params.id },
        data: { active },
        select: {
          id: true,
          name: true,
          active: true,
          createdAt: true,
          location: { select: { id: true, name: true } },
        },
      })
      .catch(() => null);
    if (!staff) throw new HttpError(404, "Staff member not found");
    res.json({ staff });
  })
);

const createStaffSchema = z.object({
  name: z.string().min(1).max(100),
  pin: z.string().min(4).max(6),
  locationId: z.string().min(1),
});

adminRouter.post(
  "/staff",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const { name, pin, locationId } = createStaffSchema.parse(req.body);

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new HttpError(404, "Location not found");

    const pinHash = await bcrypt.hash(pin, 10);
    const staff = await prisma.staffUser.create({
      data: { name, pinHash, locationId },
      select: {
        id: true,
        name: true,
        active: true,
        createdAt: true,
        location: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ staff });
  })
);

adminRouter.delete(
  "/staff/:id",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await prisma.staffUser.delete({ where: { id: req.params.id } }).catch(() => null);
    if (!deleted) throw new HttpError(404, "Staff member not found");
    res.status(204).send();
  })
);

adminRouter.get(
  "/locations",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, address: true, active: true, createdAt: true },
    });
    res.json({ locations });
  })
);

const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
});

adminRouter.post(
  "/locations",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const { name, address } = createLocationSchema.parse(req.body);
    const location = await prisma.location.create({
      data: { name, address },
      select: { id: true, name: true, address: true, active: true, createdAt: true },
    });
    res.status(201).json({ location });
  })
);

const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
});

adminRouter.patch(
  "/locations/:id",
  requireFullAdmin,
  asyncHandler(async (req, res) => {
    const data = updateLocationSchema.parse(req.body);
    if (Object.keys(data).length === 0) throw new HttpError(400, "No changes provided");

    const location = await prisma.location
      .update({
        where: { id: req.params.id },
        data,
        select: { id: true, name: true, address: true, active: true, createdAt: true },
      })
      .catch(() => null);
    if (!location) throw new HttpError(404, "Location not found");
    res.json({ location });
  })
);

adminRouter.patch(
  "/locations/:id/active",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { active } = toggleActiveSchema.parse(req.body);
    const location = await prisma.location
      .update({
        where: { id: req.params.id },
        data: { active },
        select: { id: true, name: true, address: true, active: true, createdAt: true },
      })
      .catch(() => null);
    if (!location) throw new HttpError(404, "Location not found");
    res.json({ location });
  })
);
