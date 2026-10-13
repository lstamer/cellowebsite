import { afterEach, describe, expect, it, vi } from "vitest";

import { getAllowedAdminEmails, isAllowedAdminEmail } from "@/lib/admin/allow-list";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin allow-list", () => {
  it("supports only Luke's address in development when no list is loaded", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_EMAILS", "");

    expect(getAllowedAdminEmails()).toEqual(new Set(["lukestamer5853@gmail.com"]));
    expect(isAllowedAdminEmail("LUKESTAMER5853@GMAIL.COM")).toBe(true);
    expect(isAllowedAdminEmail("someone-else@example.com")).toBe(false);
  });

  it("filters any configured values down to Luke's address", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_EMAILS", "someone-else@example.com, lukestamer5853@gmail.com");

    expect(getAllowedAdminEmails()).toEqual(new Set(["lukestamer5853@gmail.com"]));
    expect(isAllowedAdminEmail("someone-else@example.com")).toBe(false);
  });

  it("fails closed in production when ADMIN_EMAILS is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_EMAILS", "");

    expect(getAllowedAdminEmails()).toEqual(new Set());
    expect(isAllowedAdminEmail("lukestamer5853@gmail.com")).toBe(false);
  });
});
