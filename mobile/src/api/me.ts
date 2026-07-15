import { apiFetch } from "./client";
import { Customer, CoinTransaction, Redemption } from "./types";

export type MeResponse =
  | { role: "CUSTOMER"; customer: Customer }
  | { role: "STAFF"; staff: { id: string; name: string; points: number; location: { id: string; name: string } } };

export function fetchMe(token: string) {
  return apiFetch<MeResponse>("/api/me", { token });
}

export function fetchMyTransactions(token: string) {
  return apiFetch<{ transactions: CoinTransaction[] }>("/api/me/transactions", { token });
}

export function fetchMyRedemptions(token: string) {
  return apiFetch<{ redemptions: Redemption[] }>("/api/me/redemptions", { token });
}

export function logShiftOrders(token: string, orders: number) {
  return apiFetch<{ points: number }>("/api/me/staff/shift-orders", {
    method: "POST",
    token,
    body: { orders },
  });
}
