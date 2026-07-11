import { apiFetch } from "./client";

export type RedemptionResult = {
  token: string;
  shortCode: string;
  reward: { id: string; name: string };
  costCoins: number;
  expiresAt: string;
  coinBalance: number;
};

export function createRedemption(token: string, rewardId: string) {
  return apiFetch<RedemptionResult>("/api/redemptions", {
    method: "POST",
    token,
    body: { rewardId },
  });
}

export type FulfillResult = {
  reward: { id: string; name: string };
  customer: { id: string; name: string };
  fulfilledAt: string;
};

export function fulfillRedemption(token: string, identifier: { token: string } | { shortCode: string }) {
  return apiFetch<FulfillResult>("/api/staff/redemptions/fulfill", {
    method: "POST",
    token,
    body: identifier,
  });
}
