import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export function generatePin(): string {
  return randomInt(0, 10000).toString().padStart(4, "0");
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export const PIN_TTL_MINUTES = 10;
export const PIN_MAX_ATTEMPTS = 5;
