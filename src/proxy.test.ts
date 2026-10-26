import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/allow-list", () => ({
  isAllowedAdminEmail: (email: string | undefined) => email === "admin@example.com",
}));

vi.mock("@/lib/admin/supabase-auth", () => ({
  createProxyAuthClient: (_request: unknown, response: { cookies: { set: (name: string, value: string, options: { path: string; httpOnly: boolean }) => void } }) => {
    response.cookies.set("sb-session", "refreshed-session", { path: "/", httpOnly: true });
    return { auth: { getUser: getUserMock } };
  },
}));

import { NextRequest } from "next/server";

import { proxy } from "./proxy";

function nextRequest(url: string, init?: { method?: string; headers?: HeadersInit }): NextRequest {
  const requestHeaders = new Headers(init?.headers);
  requestHeaders.set("host", new URL(url).host);
  return new NextRequest(url, { ...init, headers: requestHeaders });
}

function extractNonce(csp: string | null): string {
  const match = csp?.match(/'nonce-([^']+)'/);
  if (!match) throw new Error("CSP nonce directive missing");
  return match[1];
}

function requestNonce(response: Response): string | null {
  return response.headers.get("x-middleware-request-x-nonce");
}

function requestCsp(response: Response): string | null {
  return response.headers.get("x-middleware-request-content-security-policy");
}

describe("admin CSP in proxy", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_HOST", "admin.stamer.co.za");
    getUserMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { email: "admin@example.com" } } });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("passes an aligned nonce and CSP through the admin-host rewrite", async () => {
    const response = await proxy(nextRequest("https://admin.stamer.co.za/"));
    const csp = response.headers.get("Content-Security-Policy");
    const nonce = extractNonce(csp);

    expect(response.headers.get("x-middleware-rewrite")).toContain("/admin");
    expect(requestNonce(response)).toBe(nonce);
    expect(requestCsp(response)).toBe(csp);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("passes the same nonce and CSP to an apex /admin request", async () => {
    const response = await proxy(nextRequest("https://stamer.co.za/admin/analytics"));
    const csp = response.headers.get("Content-Security-Policy");
    const nonce = extractNonce(csp);

    expect(response.headers.get("x-middleware-override-headers")).toContain("content-security-policy");
    expect(requestNonce(response)).toBe(nonce);
    expect(requestCsp(response)).toBe(csp);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("generates a fresh nonce for each admin request", async () => {
    const request = nextRequest("https://admin.stamer.co.za/console");
    const first = await proxy(request);
    const second = await proxy(request);

    expect(extractNonce(first.headers.get("Content-Security-Policy"))).not.toBe(
      extractNonce(second.headers.get("Content-Security-Policy")),
    );
  });

  it("preserves refreshed auth cookies and applies CSP on auth redirects", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const response = await proxy(nextRequest("https://admin.stamer.co.za/analytics"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("set-cookie")).toContain("sb-session=refreshed-session");
    expect(response.headers.get("Content-Security-Policy")).toContain("'strict-dynamic'");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("leaves public pages and API routes untouched", async () => {
    const publicResponse = await proxy(nextRequest("https://stamer.co.za/"));
    const apiResponse = await proxy(nextRequest("https://stamer.co.za/api/contact", { method: "POST" }));

    for (const response of [publicResponse, apiResponse]) {
      expect(response.headers.get("Content-Security-Policy")).toBeNull();
      expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
      expect(response.headers.get("Cache-Control")).toBeNull();
    }
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
