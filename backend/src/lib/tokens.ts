import { randomBytes, randomInt } from "crypto";

export function generateOpaqueToken(): string {
  return randomBytes(24).toString("base64url");
}

export function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomInt(chars.length)];
  }
  return code;
}
