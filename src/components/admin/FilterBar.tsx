"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Input, Label, SearchField } from "react-aria-components";

import { inputClass, labelClass, SelectField, type Option } from "@/components/admin/fields";

export interface FilterSpec {
  name: string;
  label: string;
  options: Option[];
}

/**
 * URL-driven filters: every change rewrites the query string, so filtered
 * views are bookmarkable and the page stays a Server Component.
 */
export function FilterBar({ filters, searchPlaceholder }: { filters: FilterSpec[]; searchPlaceholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  // Client-only: React Aria's SearchField/Select generate ids that do not line
  // up between the server pass and the browser inside a useSearchParams
  // boundary, which logs a hydration mismatch. A same-height placeholder is
  // painted until mount so the table below does not jump.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    search.delete("page");
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  if (!mounted) {
    return <div aria-hidden className="mb-6 min-h-[5.5rem] rounded-card border border-foreground/10 bg-background" />;
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 rounded-card border border-foreground/10 bg-background p-4 md:grid-cols-4">
      <SearchField
        value={q}
        onChange={setQ}
        onSubmit={(value) => apply({ q: value })}
        onClear={() => apply({ q: "" })}
        aria-label="Search"
        className="flex flex-col gap-1.5 md:col-span-2"
      >
        <Label className={labelClass}>Search</Label>
        <Input placeholder={searchPlaceholder ?? "Name, email, phone…"} className={inputClass} />
      </SearchField>
      {filters.map((filter) => (
        <SelectField
          key={filter.name}
          name={filter.name}
          label={filter.label}
          options={[{ value: "", label: "Any" }, ...filter.options]}
          defaultValue={params.get(filter.name) ?? ""}
          onChange={(value) => apply({ [filter.name]: value })}
        />
      ))}
    </div>
  );
}
