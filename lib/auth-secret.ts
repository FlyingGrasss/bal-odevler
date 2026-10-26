export function authSecret(): string {
  const raw = process.env.AUTH_SECRET;
  // Return the exact configured bytes: existing writer key hashes depend on them.
  if (raw?.trim()) return raw;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET üretim ortamında tanımlanmalıdır.");
  }
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return "bal-odevler-development-secret-change-me";
  }
  throw new Error("AUTH_SECRET tanımlanmalıdır.");
}
