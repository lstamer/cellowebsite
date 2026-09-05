import Link from "next/link";

import { formatRelative, Pill, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import type { TemplateOverrideRow } from "@/lib/admin/queries";
import type { TemplateDefinition } from "@/lib/admin/templates";

export function TemplateList({
  definitions,
  overrides,
}: {
  definitions: TemplateDefinition[];
  overrides: Record<string, TemplateOverrideRow>;
}) {
  return (
    <Table
      head={
        <tr>
          <Th>Template</Th>
          <Th>Status</Th>
          <Th>Version</Th>
          <Th>Updated</Th>
        </tr>
      }
    >
      {definitions.map((definition) => {
        const override = overrides[definition.slug];
        const customised = Boolean(override?.active);
        return (
          <tr key={definition.slug} className="hover:bg-cream/60">
            <Td>
              <Link href={adminPath(`/settings/templates/${definition.slug}`)} className="font-medium text-foreground underline-offset-4 hover:underline">
                {definition.title}
              </Link>
              <span className="mt-0.5 block max-w-xl font-sans text-xs text-foreground/60">{definition.description}</span>
              <span className="block font-mono text-xs text-foreground/50">{definition.slug}</span>
            </Td>
            <Td><Pill value={customised ? "warning" : "info"} label={customised ? "customised" : "default"} /></Td>
            <Td className="tabular-nums">{customised ? `v${override.version}` : "—"}</Td>
            <Td className="whitespace-nowrap text-foreground/60">{override ? `${formatRelative(override.updated_at)}${override.updated_by ? ` · ${override.updated_by}` : ""}` : "—"}</Td>
          </tr>
        );
      })}
    </Table>
  );
}
