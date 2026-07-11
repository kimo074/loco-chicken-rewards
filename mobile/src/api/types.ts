export type Customer = {
  id: string;
  name: string;
  email: string;
  coinBalance: number;
};

export type StaffUser = {
  id: string;
  name: string;
  locationId: string;
};

export type Location = {
  id: string;
  name: string;
  address: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  maxValueCents: number;
};

export type CoinTransaction = {
  id: string;
  type: "EARN" | "REDEEM" | "ADJUSTMENT";
  amount: number;
  createdAt: string;
};

export type Redemption = {
  id: string;
  token: string;
  shortCode: string;
  status: "PENDING" | "FULFILLED" | "EXPIRED";
  costCoins: number;
  expiresAt: string;
  createdAt: string;
  reward: Reward;
};
