import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";

export const rewardsRouter = Router();

rewardsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rewards = await prisma.reward.findMany({
      where: { active: true },
      orderBy: { costCoins: "asc" },
    });
    res.json({ rewards });
  })
);
