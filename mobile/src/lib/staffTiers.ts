export type StaffTier = { name: string; emoji: string; threshold: number };

export const STAFF_TIERS: StaffTier[] = [
  { name: "Bronze", emoji: "🥉", threshold: 5000 },
  { name: "Silver", emoji: "🥈", threshold: 10000 },
  { name: "Gold", emoji: "🥇", threshold: 100000 },
  { name: "Master", emoji: "🏆", threshold: 1000000 },
];

export function getStaffTierProgress(points: number): {
  current: StaffTier | null;
  next: StaffTier | null;
  pointsToNext: number | null;
} {
  let current: StaffTier | null = null;
  let next: StaffTier | null = null;

  for (const tier of STAFF_TIERS) {
    if (points >= tier.threshold) {
      current = tier;
    } else if (!next) {
      next = tier;
    }
  }

  return {
    current,
    next,
    pointsToNext: next ? next.threshold - points : null,
  };
}
