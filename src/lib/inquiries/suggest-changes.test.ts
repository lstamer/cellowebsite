import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * The contract between the redraft loop's TypeScript wrappers and the Postgres
 * functions they call.
 *
 * `supabase.ts` reaches Postgres through PostgREST, which resolves an RPC by
 * name and by NAMED arguments. A renamed parameter, a status the SQL never
 * writes, or an event type spelled a character differently in one file than the
 * other all fail at runtime, in production, on a webhook — never at build time.
 * These tests read both sides and compare them.
 *
 * Behaviour (the loop itself, idempotency, supersession, the accumulating
 * instruction history) is verified against real Postgres, not here.
 */

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../../../supabase/migrations/202608070002_suggest_change_requests.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const wrappers = readFileSync(
  fileURLToPath(new URL("./supabase.ts", import.meta.url)),
  "utf8",
);

const outboxTypes = readFileSync(
  fileURLToPath(new URL("./schema.ts", import.meta.url)),
  "utf8",
);

/** Every `create or replace function public.x(...)` -> its parameter names. */
function sqlFunctionParameters(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const pattern = /create or replace function public\.(\w+)\(([^)]*)\)/g;

  for (const match of migration.matchAll(pattern)) {
    const [, name, rawParameters] = match;
    const parameters = rawParameters
      .split(",")
      .map((parameter) => parameter.trim().split(/\s+/)[0])
      .filter((parameter) => parameter.startsWith("p_"));
    found.set(name, parameters);
  }

  return found;
}

/** Every `.rpc("x", { p_a: ..., p_b: ... })` in supabase.ts. */
function wrapperArguments(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const pattern = /\.rpc\(\s*"([a-z_]+)",\s*\{([^}]*)\}/g;

  for (const match of wrappers.matchAll(pattern)) {
    const [, name, body] = match;
    found.set(name, [...body.matchAll(/(p_[a-z_]+):/g)].map(([, key]) => key));
  }

  return found;
}

const SUGGEST_CHANGE_RPCS = [
  "open_suggest_change_request",
  "attach_suggest_change_prompt",
  "record_suggest_change_instructions",
  "complete_suggest_change_request",
  "cancel_suggest_change_request",
  "get_open_suggest_change_request",
] as const;

describe("the suggest-changes RPC surface", () => {
  it("defines every function the wrappers call", () => {
    const defined = sqlFunctionParameters();

    for (const name of SUGGEST_CHANGE_RPCS) {
      expect(defined.has(name), `${name} is missing from the migration`).toBe(
        true,
      );
    }
  });

  it("passes exactly the arguments each function declares", () => {
    const declared = sqlFunctionParameters();
    const passed = wrapperArguments();

    for (const name of SUGGEST_CHANGE_RPCS) {
      const expected = [...(declared.get(name) ?? [])].sort();
      const actual = [...(passed.get(name) ?? [])].sort();

      // PostgREST matches on names, so a missing or misspelled key is a 404 at
      // runtime rather than a compile error.
      expect(actual, `${name} arguments`).toEqual(expected);
    }
  });

  it("declares each function exactly once, so PostgREST has no overload to choose between", () => {
    for (const name of SUGGEST_CHANGE_RPCS) {
      const declarations = migration.match(
        new RegExp(`create or replace function public\\.${name}\\(`, "g"),
      );

      expect(declarations, `${name} declarations`).toHaveLength(1);
    }
  });
});

describe("the vocabularies both sides have to agree on", () => {
  it("writes only statuses the table allows", () => {
    const allowed = [
      ...(migration
        .match(/status in \('awaiting_instructions'[^)]*\)/)?.[0]
        .matchAll(/'([a-z_]+)'/g) ?? []),
    ].map(([, status]) => status);

    expect(allowed).toEqual([
      "awaiting_instructions",
      "drafting",
      "completed",
      "cancelled",
      "expired",
    ]);

    // Every status the RPC bodies assign has to be one the CHECK permits.
    const assigned = [
      ...migration.matchAll(/set\s+status = '([a-z_]+)'/g),
    ].map(([, status]) => status);

    expect(assigned.length).toBeGreaterThan(0);
    for (const status of assigned) {
      // `reconcile_stale_inquiry_work` also touches the other tables, whose
      // statuses overlap ('expired') or differ ('send_uncertain', 'failed').
      if (["send_uncertain", "failed", "pending", "approved"].includes(status)) {
        continue;
      }
      expect(allowed, `status '${status}' is assigned but not allowed`).toContain(
        status,
      );
    }
  });

  it("uses the same two target kinds as the wrappers", () => {
    expect(migration).toContain(
      "target_kind text not null check (target_kind in ('approval', 'website_lead'))",
    );
    expect(wrappers).toContain(
      'const suggestChangeTargetKindSchema = z.enum(["approval", "website_lead"]);',
    );
  });

  it("keeps the fall-through reason spelled identically on both sides", () => {
    // The caller reads this exact string to decide that a bare message was NOT
    // redraft instructions and must be handled as an override instead. A typo
    // here silently swallows Luke's message.
    expect(migration).toContain("'no_open_request'");
    expect(wrappers).toContain("no_open_request");
  });

  it("writes the redraft into the target table, not just the request row", () => {
    // The stale-card invariant: Approve reads the target, so a redraft that
    // only updated its own row would be sent as the draft it replaced.
    expect(migration).toMatch(
      /update public\.inquiry_response_runs response_run\s+set proposed_reply = btrim\(p_new_draft\)/,
    );
    expect(migration).toMatch(
      /update public\.inquiry_website_leads lead\s+set draft_reply = btrim\(p_new_draft\)/,
    );
  });
});

describe("the outbox event type", () => {
  it("spells inquiry.redraft_requested the same in SQL and TypeScript", () => {
    expect(migration).toContain("'inquiry.redraft_requested',");
    expect(outboxTypes).toContain('| "inquiry.redraft_requested"');
  });

  it("re-adds every event type the earlier migrations relied on", () => {
    const constraint = migration.match(
      /add constraint inquiry_outbox_events_event_type_check check \(\s*event_type in \(([^)]*)\)/,
    )?.[1];

    expect(constraint).toBeDefined();
    const sqlTypes = [...(constraint ?? "").matchAll(/'([^']+)'/g)].map(
      ([, type]) => type,
    );

    // Dropping and re-adding a CHECK is the only way to extend it, and forgetting
    // one of the existing values would break a flow that has nothing to do with
    // redrafts. The TypeScript union is the list of record.
    const tsTypes = [
      ...outboxTypes.matchAll(/\|\s*"((?:inquiry|website_lead)\.[a-z_]+)"/g),
    ].map(([, type]) => type);

    expect(tsTypes.length).toBeGreaterThan(1);
    expect(sqlTypes.slice().sort()).toEqual(tsTypes.slice().sort());
  });
});

describe("the reconciler", () => {
  it("is redeclared here so it can expire abandoned requests", () => {
    // 202608060001 owns the original; this migration supersedes it wholesale
    // rather than editing a shipped file.
    expect(migration).toContain(
      "create or replace function public.reconcile_stale_inquiry_work()",
    );
    expect(migration).toMatch(
      /where request\.status in \('awaiting_instructions', 'drafting'\)\s+and request\.expires_at <= now\(\)/,
    );
  });

  it("keeps every return key the existing parser expects", () => {
    const returned = migration
      .match(/return jsonb_build_object\(\s*'staleSends'[^;]*\);/)?.[0];

    expect(returned).toBeDefined();
    const keys = [...(returned ?? "").matchAll(/'([a-zA-Z]+)',/g)].map(
      ([, key]) => key,
    );

    expect(keys).toEqual([
      "staleSends",
      "staleReviews",
      "staleOutbox",
      "staleLeadWork",
      "expiredAvailabilityCards",
      "expiredLeadCards",
      "expiredOverridePrompts",
      "expiredSuggestChangePrompts",
    ]);
  });
});
