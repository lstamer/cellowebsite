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
        title="AI prompts"
        description="The instruction scaffolds the drafting model runs with. Each one ships with a built-in default; an edit becomes a new version that takes effect on the next draft, and one click restores the default."
      />
      <TemplateList definitions={definitions} overrides={Object.fromEntries(overrides)} />
    </>
  );
}
