export const COINS_PER_EURO = 1;

export function coinsForAmount(amountCents: number): number {
  return Math.floor((amountCents / 100) * COINS_PER_EURO);
}

export const SALE_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const REDEMPTION_TTL_MS = 15 * 60 * 1000; // 15 minutes
