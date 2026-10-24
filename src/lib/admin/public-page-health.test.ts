import { describe, expect, it } from "vitest";

import { isBookingPageHealthy } from "./public-page-health";

describe("booking page health", () => {
  it("requires the actual booking UI in a successful HTML response", async () => {
    expect(await isBookingPageHealthy(new Response('<form data-booking-flow="true"></form>', {
      headers: { "content-type": "text/html; charset=utf-8" },
    }))).toBe(true);
  });

  it("rejects checkpoints, non-HTML responses and errors", async () => {
    expect(await isBookingPageHealthy(new Response("Verifying your browser", {
      headers: { "content-type": "text/html" },
    }))).toBe(false);
    expect(await isBookingPageHealthy(new Response('data-booking-flow="true"'))).toBe(false);
    expect(await isBookingPageHealthy(new Response('<form data-booking-flow="true"></form>', {
      status: 403, headers: { "content-type": "text/html" },
    }))).toBe(false);
  });
});
