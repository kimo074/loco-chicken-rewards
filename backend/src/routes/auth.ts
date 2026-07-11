import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { asyncHandler, HttpError } from "../middleware/errorHandler";

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

authRouter.post(
  "/customer/signup",
  asyncHandler(async (req, res) => {
    const { name, email, password } = signupSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { name, email, passwordHash },
    });

    const token = signToken({ role: "CUSTOMER", customerId: customer.id });
    res.status(201).json({
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email, coinBalance: customer.coinBalance },
    });
  })
);

const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/customer/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = customerLoginSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) throw new HttpError(401, "Invalid email or password");

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid email or password");
    if (!customer.active) throw new HttpError(403, "This account has been deactivated");

    const token = signToken({ role: "CUSTOMER", customerId: customer.id });
    res.json({
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email, coinBalance: customer.coinBalance },
    });
  })
);

const staffLoginSchema = z.object({
  staffUserId: z.string().min(1),
  pin: z.string().min(1),
});

authRouter.post(
  "/staff/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { staffUserId, pin } = staffLoginSchema.parse(req.body);

    const staffUser = await prisma.staffUser.findUnique({ where: { id: staffUserId } });
    if (!staffUser || !staffUser.active) throw new HttpError(401, "Invalid staff account or PIN");

    const valid = await bcrypt.compare(pin, staffUser.pinHash);
    if (!valid) throw new HttpError(401, "Invalid staff account or PIN");

    const token = signToken({ role: "STAFF", staffUserId: staffUser.id, locationId: staffUser.locationId });
    res.json({
      token,
      staff: { id: staffUser.id, name: staffUser.name, locationId: staffUser.locationId },
    });
  })
);
