import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getZernioConversationHistory } from "./zernio";

type MessagePage = {
  messages: {
    id: string;
    message: string;
    direction: "incoming" | "outgoing";
    sentAt: string;
  }[];
  pagination?: { hasMore: boolean; nextCursor: string | null };
};

const requests: URL[] = [];

// A ?sortOrder=desc page: newest message first, counting down from `newest`.
function page(
  newest: number,
  count: number,
  nextCursor: string | null,
): MessagePage {
  return {
    messages: Array.from({ length: count }, (_, offset) => {
      const index = newest - offset;
      return {
        id: `m${index}`,
        message: `Message ${index}`,
        direction: index % 2 === 0 ? ("incoming" as const) : ("outgoing" as const),
        sentAt: "2026-07-02T09:00:00.000Z",
      };
    }),
    pagination: { hasMore: nextCursor !== null, nextCursor },
  };
}

function respondWith(pages: MessagePage[]) {
  let index = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requests.push(new URL(url));
      const body = pages[Math.min(index, pages.length - 1)];
      index += 1;
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv("ZERNIO_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getZernioConversationHistory", () => {
  it("stops after a single page when the thread is exhausted", async () => {
    respondWith([page(2, 3, null)]);

    const history = await getZernioConversationHistory({
      conversationId: "conv-1",
      accountId: "acct-1",
    });

    // Newest-first from the API, oldest-first for callers.
    expect(history.map((message) => message.text)).toEqual([
      "Message 0",
      "Message 1",
      "Message 2",
    ]);
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get("limit")).toBe("100");
    expect(requests[0].searchParams.get("sortOrder")).toBe("desc");
    expect(requests[0].searchParams.has("cursor")).toBe(false);
  });

  it("follows the cursor across pages and keeps a single oldest-first order", async () => {
    respondWith([
      page(299, 100, "cursor-2"),
      page(199, 100, "cursor-3"),
      page(99, 100, null),
    ]);

    const history = await getZernioConversationHistory({
      conversationId: "conv-1",
      accountId: "acct-1",
    });

    expect(history).toHaveLength(300);
    expect(history[0].text).toBe("Message 0");
    expect(history[history.length - 1].text).toBe("Message 299");
    expect(requests).toHaveLength(3);
    expect(requests[1].searchParams.get("cursor")).toBe("cursor-2");
    expect(requests[2].searchParams.get("cursor")).toBe("cursor-3");
  });

  it("caps the walk at the runaway ceiling even when the API never ends", async () => {
    respondWith([page(99, 100, "always-more")]);

    const history = await getZernioConversationHistory({
      conversationId: "conv-1",
      accountId: "acct-1",
    });

    expect(history).toHaveLength(2_000);
    expect(requests).toHaveLength(20);
  });

  it("treats an explicit limit as a total cap, not a page size", async () => {
    respondWith([page(29, 30, "cursor-2")]);

    const history = await getZernioConversationHistory({
      conversationId: "conv-1",
      accountId: "acct-1",
      limit: 30,
    });

    expect(history).toHaveLength(30);
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get("limit")).toBe("30");
  });

  it("stops on an empty page rather than trusting hasMore forever", async () => {
    respondWith([page(0, 0, "still-claims-more")]);

    const history = await getZernioConversationHistory({
      conversationId: "conv-1",
      accountId: "acct-1",
    });

    expect(history).toEqual([]);
    expect(requests).toHaveLength(1);
  });

  it("reads a response with no pagination block as one final page", async () => {
    respondWith([{ messages: page(1, 2, null).messages }]);

    const history = await getZernioConversationHistory({
      conversationId: "conv-1",
      accountId: "acct-1",
    });

    expect(history).toHaveLength(2);
    expect(requests).toHaveLength(1);
  });

  it("throws so the caller can fall back to drafting without history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    await expect(
      getZernioConversationHistory({
        conversationId: "conv-1",
        accountId: "acct-1",
      }),
    ).rejects.toThrow("Zernio history fetch failed (500)");
  });
});
