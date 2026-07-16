type RewardLike = { name: string; description?: string };

const ICON_RULES: { keywords: string[]; emoji: string }[] = [
  { keywords: ["burger"], emoji: "🍔" },
  { keywords: ["wrap"], emoji: "🌯" },
  { keywords: ["fries", "chips"], emoji: "🍟" },
  { keywords: ["coffee", "latte", "espresso"], emoji: "☕" },
  { keywords: ["drink", "soda", "cola", "juice", "shake"], emoji: "🥤" },
  { keywords: ["ice cream", "sundae"], emoji: "🍨" },
  { keywords: ["cookie", "dessert", "cake"], emoji: "🍪" },
  { keywords: ["meal", "combo", "deal"], emoji: "🍽️" },
  { keywords: ["chicken", "wing", "tender", "nugget"], emoji: "🍗" },
];

export function rewardIcon(reward: RewardLike): string {
  const text = `${reward.name} ${reward.description ?? ""}`.toLowerCase();
  for (const rule of ICON_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) return rule.emoji;
  }
  return "🎁";
}
