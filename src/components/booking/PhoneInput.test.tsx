// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "react-aria-components";
import { isValidPhoneNumber } from "libphonenumber-js";
import { PhoneInput } from "./PhoneInput";

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

afterEach(cleanup);

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = ResizeObserverStub;
  }
  // jsdom ships no CSS.escape; react-aria uses it to locate the focused option.
  if (typeof globalThis.CSS === "undefined") {
    Object.defineProperty(globalThis, "CSS", { value: {}, configurable: true });
  }
  if (typeof globalThis.CSS.escape !== "function") {
    globalThis.CSS.escape = (ident: string) =>
      ident.replace(/[^a-zA-Z0-9_\u00A0-\uFFFF-]/g, (c) => `\\${c}`);
  }
});

function renderPhone(
  props: Partial<React.ComponentProps<typeof PhoneInput>> = {},
) {
  const onChange = vi.fn<(phone: string) => void>();
  const view = render(
    <I18nProvider locale="en-ZA">
      <PhoneInput
        value=""
        onChange={onChange}
        label="Phone number"
        {...props}
      />
    </I18nProvider>,
  );
  const tel = screen.getByLabelText("Phone number") as HTMLInputElement;
  const country = screen.getByRole("combobox", {
    name: "Country code",
  }) as HTMLInputElement;
  return { ...view, onChange, tel, country };
}

describe("PhoneInput", () => {
  it("emits E.164 with the leading + for a ZA national number", async () => {
    const user = userEvent.setup();
    const { onChange, tel } = renderPhone();

    await user.type(tel, "0821234567");

    expect(onChange).toHaveBeenLastCalledWith("+27821234567");
    expect(isValidPhoneNumber("+27821234567")).toBe(true);
  });

  it("restores an external E.164 value into the right country and a national display", () => {
    const { tel, country } = renderPhone({ value: "+447400123456" });

    expect(country.value).toContain("+44");
    expect(tel.value).toBe("07400 123456");
  });

  it("emits an empty string when the number is cleared", async () => {
    const user = userEvent.setup();
    const { onChange, tel } = renderPhone();

    await user.type(tel, "082");
    await user.clear(tel);

    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("selects a country via the keyboard and emits that dial code", async () => {
    const user = userEvent.setup();
    const { onChange, tel, country } = renderPhone();

    await user.click(country);
    await user.clear(country);
    await user.type(country, "United K");

    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeTruthy();

    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(country.getAttribute("aria-activedescendant")).toBeTruthy(),
    );
    await user.keyboard("{Enter}");

    await waitFor(() => expect(country.value).toContain("+44"));

    await user.type(tel, "7400123456");
    expect(onChange).toHaveBeenLastCalledWith("+447400123456");
    expect(isValidPhoneNumber("+447400123456")).toBe(true);
  });
});
