import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

process.env.APP_URL = "http://localhost:3000";

async function loadLogoutRoute() {
  return import("../app/auth/cikis/route");
}

function logoutRequest(headers?: Record<string, string>) {
  return import("next/server").then(
    ({ NextRequest }) =>
      new NextRequest("http://localhost:3000/auth/cikis", {
        method: "POST",
        headers,
      }),
  );
}

describe("/auth/cikis", () => {
  beforeAll(() => {
    process.env.APP_URL = "http://localhost:3000";
  });

  it("returns 405 with Allow: POST for GET", async () => {
    const { GET } = await loadLogoutRoute();
    const response = GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("rejects a cross-origin POST with 403", async () => {
    const { POST } = await loadLogoutRoute();
    const response = await POST(await logoutRequest({ origin: "https://evil.example" }));

    expect(response.status).toBe(403);
  });

  it("rejects a POST without an Origin or same-origin fetch metadata with 403", async () => {
    const { POST } = await loadLogoutRoute();
    const response = await POST(await logoutRequest());

    expect(response.status).toBe(403);
  });

  it("redirects home and clears the session cookie for a same-origin POST", async () => {
    const { POST } = await loadLogoutRoute();
    const response = await POST(await logoutRequest({ origin: "http://localhost:3000" }));
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(setCookie).toContain("bal_odevler_session=");
    expect(setCookie?.toLowerCase()).toContain("path=/");
    expect(setCookie?.toLowerCase()).toContain("expires=thu, 01 jan 1970 00:00:00 gmt");
  });
});
