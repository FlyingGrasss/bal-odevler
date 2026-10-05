import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function homeworkSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET üretim ortamında tanımlanmalıdır.");
  }
  return secret ?? "bal-odevler-development-secret-change-me";
}

export function hashHomeworkToken(token: string) {
  return createHmac("sha256", homeworkSecret()).update(token).digest("hex");
}

export function hashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createHomeworkToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
