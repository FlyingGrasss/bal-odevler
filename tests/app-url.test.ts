import { afterEach, describe, expect, it, vi } from "vitest";
import { appUrl } from "../lib/utils";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("appUrl", () => {
  it("uses APP_URL and strips a trailing slash", () => {
    vi.stubEnv("APP_URL", "https://odevler.example/");

    expect(appUrl("/auth/callback")).toBe("https://odevler.example/auth/callback");
    expect(appUrl("panel")).toBe("https://odevler.example/panel");
  });

  it("uses VERCEL_URL only for preview deployments", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "odevler-preview.vercel.app");

    expect(appUrl("/admin")).toBe("https://odevler-preview.vercel.app/admin");
  });

  it("throws in production without APP_URL even when VERCEL_URL exists", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "odevler.vercel.app");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => appUrl()).toThrow("APP_URL");
  });

  it("falls back to localhost outside production", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(appUrl("/admin")).toBe("http://localhost:3000/admin");
  });
});
