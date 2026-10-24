import { afterEach, describe, expect, it, vi } from "vitest";

import { redactSecrets } from "./redact";

afterEach(() => vi.unstubAllEnvs());

describe("credential redaction", () => {
  it("removes bot credentials from API and file URLs even after rotation", () => {
    const token = `123456789:${"A".repeat(35)}`;
    const text = `Failed https://api.telegram.org/bot${token}/getMe and https://api.telegram.org/file/bot${token}/voice.ogg`;
    const result = redactSecrets(text);
    expect(result).not.toContain(token);
    expect(result).toContain("bot[REDACTED]/getMe");
    expect(result).toContain("bot[REDACTED]/voice.ogg");
  });

  it("redacts configured credentials but leaves ordinary error context", () => {
    vi.stubEnv("TEST_API_KEY", "private-test-value");
    vi.stubEnv("SUPABASE_SECRET_KEY", "private-database-value");
    expect(redactSecrets("Upstream 401: private-test-value")).toBe("Upstream 401: [REDACTED]");
    expect(redactSecrets("Database error: private-database-value")).toBe("Database error: [REDACTED]");
    expect(redactSecrets("Upstream 429: try again")).toBe("Upstream 429: try again");
  });
});
