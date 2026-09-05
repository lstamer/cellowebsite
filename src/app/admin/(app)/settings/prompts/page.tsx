import { TemplateList } from "@/components/admin/TemplateList";
import { PageHeader } from "@/components/admin/ui";
import { listTemplateOverrides, templateDefinitions } from "@/lib/admin/queries";

export const metadata = { title: "AI prompts" };

export default async function PromptsPage() {
  const overrides = await listTemplateOverrides();
  const definitions = templateDefinitions().filter((definition) => definition.kind === "ai_prompt");

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Prompts"
        description="The scaffolding around the brain docs and examples. Each prompt has a code default; an active saved version overrides it. Every save is a new version and can be rolled back."
      />
      <TemplateList definitions={definitions} overrides={Object.fromEntries(overrides)} />
    </>
  );
}
