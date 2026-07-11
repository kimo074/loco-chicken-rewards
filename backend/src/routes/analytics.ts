import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

export const analyticsRouter = Router();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

analyticsRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const [
      totalCustomers,
      activeCustomers,
      totalStaff,
      activeStaff,
      totalLocations,
      activeLocations,
      coinBalanceAgg,
      earnAgg,
      redeemAgg,
      revenueAgg,
      redemptionsFulfilledCount,
      salesClaimedCount,
      signupsLast7d,
      signupsLast30d,
      topCustomers,
      allStaff,
      allLocations,
      salesByStaff,
      redemptionsByStaff,
      salesByLocation,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { active: true } }),
      prisma.staffUser.count(),
      prisma.staffUser.count({ where: { active: true } }),
      prisma.location.count(),
      prisma.location.count({ where: { active: true } }),
      prisma.customer.aggregate({ _sum: { coinBalance: true } }),
      prisma.coinTransaction.aggregate({ where: { type: "EARN" }, _sum: { amount: true } }),
      prisma.coinTransaction.aggregate({ where: { type: "REDEEM" }, _sum: { amount: true } }),
      prisma.saleCode.aggregate({ where: { status: "CLAIMED" }, _sum: { amountCents: true } }),
      prisma.redemption.count({ where: { status: "FULFILLED" } }),
      prisma.saleCode.count({ where: { status: "CLAIMED" } }),
      prisma.customer.count({ where: { createdAt: { gte: daysAgo(7) } } }),
      prisma.customer.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      prisma.customer.findMany({
        orderBy: { coinBalance: "desc" },
        take: 10,
        select: { id: true, name: true, email: true, coinBalance: true, active: true },
      }),
      prisma.staffUser.findMany({
        select: { id: true, name: true, active: true, location: { select: { id: true, name: true } } },
      }),
      prisma.location.findMany({ select: { id: true, name: true, active: true } }),
      prisma.saleCode.groupBy({
        by: ["staffUserId"],
        where: { status: "CLAIMED", staffUserId: { not: null } },
        _count: { _all: true },
        _sum: { amountCents: true, coinsAwarded: true },
      }),
      prisma.redemption.groupBy({
        by: ["fulfilledByStaffId"],
        where: { status: "FULFILLED", fulfilledByStaffId: { not: null } },
        _count: { _all: true },
      }),
      prisma.saleCode.groupBy({
        by: ["locationId"],
        where: { status: "CLAIMED" },
        _count: { _all: true },
        _sum: { amountCents: true, coinsAwarded: true },
      }),
    ]);

    const redemptionsByStaffMap = new Map(redemptionsByStaff.map((r) => [r.fulfilledByStaffId, r._count._all]));

    const staffLeaderboard = allStaff
      .map((staff) => {
        const sales = salesByStaff.find((s) => s.staffUserId === staff.id);
        return {
          id: staff.id,
          name: staff.name,
          active: staff.active,
          locationName: staff.location.name,
          salesCount: sales?._count._all ?? 0,
          totalAmountCents: sales?._sum.amountCents ?? 0,
          coinsAwarded: sales?._sum.coinsAwarded ?? 0,
          redemptionsFulfilled: redemptionsByStaffMap.get(staff.id) ?? 0,
        };
      })
      .sort((a, b) => b.salesCount - a.salesCount);

    const staffCountByLocation = new Map<string, number>();
    for (const staff of allStaff) {
      if (!staff.active) continue;
      staffCountByLocation.set(staff.location.id, (staffCountByLocation.get(staff.location.id) ?? 0) + 1);
    }

    const locationPerformance = allLocations
      .map((location) => {
        const sales = salesByLocation.find((s) => s.locationId === location.id);
        return {
          id: location.id,
          name: location.name,
          active: location.active,
          activeStaffCount: staffCountByLocation.get(location.id) ?? 0,
          salesCount: sales?._count._all ?? 0,
          totalAmountCents: sales?._sum.amountCents ?? 0,
          coinsAwarded: sales?._sum.coinsAwarded ?? 0,
        };
      })
      .sort((a, b) => b.totalAmountCents - a.totalAmountCents);

    res.json({
      overview: {
        totalCustomers,
        activeCustomers,
        totalStaff,
        activeStaff,
        totalLocations,
        activeLocations,
        coinsOutstanding: coinBalanceAgg._sum.coinBalance ?? 0,
        coinsEverEarned: earnAgg._sum.amount ?? 0,
        coinsEverRedeemed: Math.abs(redeemAgg._sum.amount ?? 0),
        totalRevenueCents: revenueAgg._sum.amountCents ?? 0,
        redemptionsFulfilled: redemptionsFulfilledCount,
        salesClaimed: salesClaimedCount,
        signupsLast7d,
        signupsLast30d,
      },
      topCustomers,
      staffLeaderboard,
      locationPerformance,
    });
  })
);
