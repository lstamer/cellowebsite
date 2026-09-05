import Link from "next/link";

import { Badge, Card, PageHeader, relativeTime } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { listPromptTemplateRows } from "@/lib/admin/queries";
import { PROMPT_TEMPLATE_DEFAULTS, PROMPT_TEMPLATE_SLUGS } from "@/lib/inquiries/prompt-templates";

export default async function PromptsPage() {
  const base = await getAdminBasePath();
  const rows = await listPromptTemplateRows();
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Prompts"
        description="The scaffolding around the brain docs and examples. Each prompt has a code default; an active saved version overrides it. Every save is a new version and can be rolled back."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROMPT_TEMPLATE_SLUGS.map((slug) => {
          const definition = PROMPT_TEMPLATE_DEFAULTS[slug];
          const row = bySlug.get(slug);
          const overridden = Boolean(row?.active);
          return (
            <Link key={slug} href={`${base}/settings/prompts/${slug}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-accent">
              <Card className="h-full transition-colors hover:border-foreground/30">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-foreground">{definition.title}</h2>
                  <Badge tone={overridden ? "accent" : "neutral"}>{overridden ? `Custom v${row?.version}` : "Default"}</Badge>
                </div>
                <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/70">{definition.description}</p>
                {row ? <p className="mt-3 font-sans text-xs text-foreground/50">Last saved {relativeTime(row.updated_at)}{row.updated_by ? ` by ${row.updated_by}` : ""}</p> : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
