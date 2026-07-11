import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";

export const locationsRouter = Router();

locationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const locations = await prisma.location.findMany({
      where: { active: true },
      select: { id: true, name: true, address: true },
    });
    res.json({ locations });
  })
);

locationsRouter.get(
  "/:id/staff-names",
  asyncHandler(async (req, res) => {
    const staff = await prisma.staffUser.findMany({
      where: { locationId: req.params.id, active: true },
      select: { id: true, name: true },
    });
    res.json({ staff });
  })
);
