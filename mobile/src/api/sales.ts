import { apiFetch } from "./client";

export type SaleCode = {
  token: string;
  coinsAwarded: number;
  amountCents: number;
  expiresAt: string;
};

export function createSale(token: string, amountCents: number) {
  return apiFetch<SaleCode>("/api/staff/sales", {
    method: "POST",
    token,
    body: { amountCents },
  });
}

export function claimSale(token: string, saleToken: string) {
  return apiFetch<{ coinsAwarded: number; coinBalance: number }>("/api/sales/claim", {
    method: "POST",
    token,
    body: { token: saleToken },
  });
}
