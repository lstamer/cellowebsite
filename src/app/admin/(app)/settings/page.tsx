import Link from "next/link";

import { Card, PageHeader } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";

const SECTIONS = [
  { href: "/settings/prompts", title: "Prompts", body: "The instructions the drafting agent follows. Versioned, with rollback." },
  { href: "/settings/brain", title: "Brain docs", body: "Business knowledge the agent grounds every reply in: services, pricing policy, logistics, FAQ." },
  { href: "/settings/examples", title: "Reply examples", body: "Voice examples and learned corrections the drafter imitates for similar enquiries." },
  { href: "/settings/integrations", title: "Integrations", body: "Which services are configured, and a Telegram test button." },
];

export default async function SettingsPage() {
  const base = await getAdminBasePath();
  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" description="Everything that shapes how enquiries are handled, editable without a deploy." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={`${base}${section.href}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-accent">
            <Card className="h-full transition-colors hover:border-foreground/30">
              <h2 className="font-display text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/70">{section.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
