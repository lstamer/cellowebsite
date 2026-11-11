import { afterEach, describe, expect, it, vi } from "vitest";

import { generateBookingDrafts } from "./openai-drafts";
import type { BookingSnapshot } from "./progress";

const launch: BookingSnapshot = {
  eventType: "other",
  eventTypeOther: "Product launch",
  date: "2026-11-19",
  dateUnsure: false,
  location: "CTICC",
  fullName: "Casey Example",
  email: "casey@example.com",
  phone: "+27821234567",
  whatsappSameAsPhone: false,
  whatsapp: "+27829876543",
  guestCount: 116,
  performanceMinutes: 120,
  message: "2 sets with a 15 min interval.",
  bookingOnBehalf: false,
  organisation: "",
  bookerRole: "corporate-organiser",
  bookerRoleOther: "",
};

const modelProse = {
  city: "Cape Town",
  company: "Example",
  notes: "We'd like 2 sets with a 15 min interval.",
};

function stubProvider(text = JSON.stringify(modelProse)) {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
  }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

afterEach(() => vi.unstubAllGlobals());

describe("OpenAI booking draft generation", () => {
  it("uses one structured request and keeps the visitor's contact fields local", async () => {
    const fetcher = stubProvider();
    const signal = new AbortController().signal;
    const drafts = await generateBookingDrafts(launch, "booking-test-key", signal);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(request?.signal).toBe(signal);
    const payload = JSON.parse(String(request?.body));
    expect(payload).toMatchObject({
      service_tier: "fast",
      store: false,
      reasoning: { effort: "none" },
      text: { format: { type: "json_schema", strict: true } },
    });
    expect(JSON.parse(payload.input)).toMatchObject({ venue: "CTICC", workEmailDomain: "example.com" });
    for (const contactField of [launch.fullName, launch.email, launch.phone, launch.whatsapp]) {
      expect(payload.input).not.toContain(contactField);
    }
    expect(drafts?.whatsapp.match(/Hi Luke,/g)).toHaveLength(1);
    expect(drafts?.whatsapp).toContain("CTICC in Cape Town");
    expect(drafts?.whatsapp).toContain("I'm organising the event for Example.");
    expect(drafts?.email).toMatchObject({
      subject: "Live cello enquiry: Product launch",
      body: expect.stringContaining(modelProse.notes),
    });
    expect(drafts?.email.body).toContain("2 hours of live music. I'm expecting about 110 to 120 guests.");
  });

  it("omits a consumer email domain and retains notes if the polish changes numbers", async () => {
    const fetcher = stubProvider(JSON.stringify({ ...modelProse, notes: "We'd like 3 sets." }));
    const drafts = await generateBookingDrafts({ ...launch, email: "casey@gmail.com" }, "booking-test-key", new AbortController().signal);
    expect(String(fetcher.mock.calls[0][1]?.body)).not.toContain("gmail.com");
    expect(drafts?.email.body).toContain(launch.message);
    expect(drafts?.email.body).toContain("I'm organising the event for my company.");
  });

  it.each(["Please email casey@example.com.", "Please call +27 82 123 4567."])(
    "keeps free text with contact details in the local draft (%s)",
    async (message) => {
      const fetcher = stubProvider();
      await expect(generateBookingDrafts({ ...launch, message }, "booking-test-key", new AbortController().signal)).resolves.toBeNull();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("keeps the event facts and skips duplicate cities or unrelated companies", async () => {
    stubProvider(JSON.stringify({ ...modelProse, company: "Unrelated Company" }));
    const drafts = await generateBookingDrafts(
      { ...launch, location: "CTICC, Cape Town" },
      "booking-test-key",
      new AbortController().signal,
    );
    expect(drafts?.email.body).toContain("a product launch on 19 November 2026 at the CTICC, Cape Town.");
    expect(drafts?.email.body.match(/Cape Town/g)).toHaveLength(1);
    expect(drafts?.email.body).not.toContain("Unrelated Company");
  });

  it("keeps the shortened address when applying AI prose", async () => {
    stubProvider(JSON.stringify({ ...modelProse, notes: "We'd like 2 sets of 30 minutes each." }));
    const drafts = await generateBookingDrafts({
      ...launch,
      eventType: "wedding",
      location: "1 Adderley St, Cape Town City Centre, Cape Town, 8000, South Africa",
      bookerRole: "groom",
      message: "2 sets, 30 mins each",
    }, "booking-test-key", new AbortController().signal);
    for (const body of [drafts?.whatsapp, drafts?.email.body]) {
      expect(body).toContain("at 1 Adderley St in Cape Town. I'm the groom.");
      expect(body).toContain("We'd like 2 sets of 30 minutes each.");
    }
  });
});
