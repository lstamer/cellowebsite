import { TemplateList } from "@/components/admin/TemplateList";
import { PageHeader } from "@/components/admin/ui";
import { listTemplateOverrides, templateDefinitions } from "@/lib/admin/queries";

export const metadata = { title: "Telegram cards" };

export default async function TelegramCardsPage() {
  const overrides = await listTemplateOverrides();
  const definitions = templateDefinitions().filter((definition) => definition.kind === "telegram_card");

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Telegram cards"
        description="What each card says. Placeholders in double braces are filled in at send time; a line whose placeholders are all empty is dropped. Buttons and their behaviour stay in code."
      />
      <TemplateList definitions={definitions} overrides={Object.fromEntries(overrides)} />
    </>
  );
}
