import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export type CustomerTokenPayload = {
  role: "CUSTOMER";
  customerId: string;
};

export type StaffTokenPayload = {
  role: "STAFF";
  staffUserId: string;
  locationId: string;
};

export type TokenPayload = CustomerTokenPayload | StaffTokenPayload;

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}
