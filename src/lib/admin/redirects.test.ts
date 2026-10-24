import { afterEach, describe, expect, it, vi } from "vitest";

import {
  adminCallbackDestination,
  safeAdminNext,
  trustedRequestOrigin,
} from "@/lib/admin/redirects";

describe("admin redirect guards", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "/%5cevil.example/path",
    "/%2fevil.example/path",
    "/a/..//evil.example",
    "/a/%2e%2e//evil.example",
    "/path\r\nLocation: https://evil.example",
  ])("rejects hostile return path %s", (value) => {
    expect(safeAdminNext(value)).toBeNull();
  });

  it("preserves a same-origin admin path with query and fragment", () => {
    expect(safeAdminNext("/admin/inquiries?status=new#latest")).toBe(
      "/admin/inquiries?status=new#latest",
    );
  });

  it.each([
    "/admin//evil.example",
    "/admin///evil.example",
    "/admin/..//evil.example",
    "/a/..//evil.example",
    "/a/%2e%2e//evil.example",
  ])(
    "keeps the final admin-host destination local for %s",
    (value) => {
      vi.stubEnv("ADMIN_HOST", "admin.stamer.co.za");
      const destination = adminCallbackDestination(
        "https://admin.stamer.co.za",
        safeAdminNext(value),
      );

      expect(destination).toBe("/");
      expect(new URL(destination, "https://admin.stamer.co.za").origin).toBe(
        "https://admin.stamer.co.za",
      );
    },
  );

  it("accepts only configured request hosts and ignores forwarded-host values", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_HOST", "admin.stamer.co.za");

    expect(trustedRequestOrigin("admin.stamer.co.za")).toBe("https://admin.stamer.co.za");
    expect(trustedRequestOrigin("evil.example")).toBeNull();
    expect(trustedRequestOrigin("evil.example\\@admin.stamer.co.za")).toBeNull();
  });
});
