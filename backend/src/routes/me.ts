import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";

export const meRouter = Router();

meRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.auth?.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({ where: { id: req.auth.customerId } });
      if (!customer) throw new HttpError(404, "Customer not found");
      res.json({
        role: "CUSTOMER",
        customer: { id: customer.id, name: customer.name, email: customer.email, coinBalance: customer.coinBalance },
      });
      return;
    }

    if (req.auth?.role === "STAFF") {
      const staff = await prisma.staffUser.findUnique({
        where: { id: req.auth.staffUserId },
        include: { location: { select: { id: true, name: true } } },
      });
      if (!staff) throw new HttpError(404, "Staff user not found");
      res.json({
        role: "STAFF",
        staff: { id: staff.id, name: staff.name, points: staff.points, location: staff.location },
      });
      return;
    }

    throw new HttpError(401, "Unauthorized");
  })
);

const logShiftOrdersSchema = z.object({
  orders: z.number().int().min(1).max(500),
});

meRouter.post(
  "/staff/shift-orders",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.auth?.role !== "STAFF") throw new HttpError(403, "Staff access required");

    const { orders } = logShiftOrdersSchema.parse(req.body);
    const staff = await prisma.staffUser.update({
      where: { id: req.auth.staffUserId },
      data: { points: { increment: orders }, manualOrdersLogged: { increment: orders } },
    });

    res.json({ points: staff.points });
  })
);

meRouter.get(
  "/transactions",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.auth?.role !== "CUSTOMER") throw new HttpError(403, "Customer access required");

    const transactions = await prisma.coinTransaction.findMany({
      where: { customerId: req.auth.customerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ transactions });
  })
);
