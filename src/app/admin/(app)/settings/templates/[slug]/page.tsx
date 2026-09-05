import { notFound } from "next/navigation";

import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { PageHeader } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getTemplateVersions, listTemplateOverrides } from "@/lib/admin/queries";
import { getTemplateDefinition } from "@/lib/admin/templates";

export const metadata = { title: "Template" };

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const definition = getTemplateDefinition(slug);
  if (!definition) notFound();

  const [overrides, versions] = await Promise.all([listTemplateOverrides(), getTemplateVersions(slug)]);
  const override = overrides.get(slug) ?? null;

  return (
    <>
      <PageHeader
        eyebrow={definition.kind === "ai_prompt" ? "AI prompt" : "Telegram card"}
        title={definition.title}
        description={definition.description}
      />
      <TemplateEditor
        definition={definition}
        override={override}
        versions={versions}
        backHref={adminPath(definition.kind === "ai_prompt" ? "/settings/prompts" : "/settings/telegram")}
      />
    </>
  );
}
