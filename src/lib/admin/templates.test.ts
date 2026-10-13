import { afterEach, describe, expect, it } from "vitest";

import {
  clearTemplateOverrides,
  getTemplate,
  getTemplateDefinition,
  renderTemplate,
  setTemplateOverrides,
  TEMPLATE_DEFINITIONS,
  validateTemplateContent,
} from "./templates";

describe("renderTemplate", () => {
  it("substitutes placeholders and drops lines whose placeholders are all empty", () => {
    const text = renderTemplate(
      "Name: {{name}}\nPhone: {{phone}}\nNote: fixed\n\n\nMessage: {{message}}",
      { name: "Thandi", phone: "", message: null },
    );
    expect(text).toBe("Name: Thandi\nNote: fixed");
  });

  it("keeps a line when at least one of its placeholders has a value", () => {
    expect(renderTemplate("{{a}} / {{b}}", { a: "", b: "x" })).toBe(" / x");
  });

  it("renders booleans and numbers, and multi-line values verbatim", () => {
    expect(renderTemplate("Flex: {{flex}} Guests: {{n}}", { flex: true, n: 120 })).toBe(
      "Flex: Yes Guests: 120",
    );
    expect(renderTemplate("A\n{{block}}\nZ", { block: "one\ntwo" })).toBe("A\none\ntwo\nZ");
  });

  it("collapses blank runs and trims outer blank lines", () => {
    expect(renderTemplate("\n\nA\n\n\n\nB\n\n", {})).toBe("A\n\nB");
  });
});

describe("template registry", () => {
  afterEach(() => clearTemplateOverrides());

  it("returns the code default until an override is set", () => {
    const fallback = getTemplate("ai.drafting_persona");
    expect(fallback).toContain("Luke Stamer");

    setTemplateOverrides([["ai.drafting_persona", "You are Luke's ghostwriter."]]);
    expect(getTemplate("ai.drafting_persona")).toBe("You are Luke's ghostwriter.");

    clearTemplateOverrides();
    expect(getTemplate("ai.drafting_persona")).toBe(fallback);
  });

  it("throws on an unknown slug so a typo cannot silently render nothing", () => {
    expect(() => getTemplate("ai.nope")).toThrow(/Unknown template slug/);
  });

  it("has unique slugs and every default satisfies its own validation", () => {
    const slugs = TEMPLATE_DEFINITIONS.map((definition) => definition.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const definition of TEMPLATE_DEFINITIONS) {
      expect(validateTemplateContent(definition, definition.defaultContent)).toEqual({ ok: true });
    }
  });
});

describe("validateTemplateContent", () => {
  const leadAlert = getTemplateDefinition("telegram.lead_alert")!;

  it("rejects empty content, missing required placeholders, and unknown ones", () => {
    expect(validateTemplateContent(leadAlert, "   ")).toMatchObject({ ok: false });
    expect(validateTemplateContent(leadAlert, "Hi {{name}}")).toMatchObject({
      ok: false,
      reason: expect.stringContaining("{{source_label}}"),
    });
    expect(
      validateTemplateContent(leadAlert, "{{source_label}} {{name}} {{email}} {{bogus}}"),
    ).toMatchObject({ ok: false, reason: expect.stringContaining("{{bogus}}") });
    expect(validateTemplateContent(leadAlert, "{{source_label}} {{name}} {{email}}")).toEqual({
      ok: true,
    });
  });
});
