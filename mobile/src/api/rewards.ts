import { apiFetch } from "./client";
import { Reward } from "./types";

export function fetchRewards() {
  return apiFetch<{ rewards: Reward[] }>("/api/rewards");
}
