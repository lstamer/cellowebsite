import Link from "next/link";

import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getIntegrationStatuses } from "@/lib/admin/queries";

import { sendTelegramTest } from "../actions";

export const metadata = { title: "Settings" };

const SECTIONS = [
  { href: adminPath("/settings/brain"), title: "Brain docs", body: "The facts the drafter is allowed to state: services, pricing policy, logistics, repertoire. Every active document is injected into each draft." },
  { href: adminPath("/settings/examples"), title: "Reply examples", body: "Real replies Luke sent and corrections he made. Retrieved by intent so a correction only shapes similar enquiries." },
  { href: adminPath("/settings/prompts"), title: "Prompts", body: "The instruction scaffolds around the knowledge: extraction rules, drafting rules, redraft rules. Versioned, with one-click rollback." },
  { href: adminPath("/settings/telegram"), title: "Telegram cards", body: "The wording of the lead alert, review cards, availability question and approval cards." },
];

export default function SettingsPage() {
  const integrations = getIntegrationStatuses();
  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" description="Everything that shapes how enquiries are handled, editable without a deploy." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="rounded-card border border-foreground/10 bg-background p-6 transition-colors duration-300 hover:border-foreground/15">
            <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{section.title}</h2>
            <p className="mt-2 font-sans text-base leading-relaxed text-foreground/70">{section.body}</p>
          </Link>
        ))}
      </div>

      <Panel title="Integrations" className="mt-8" actions={<ActionButton action={sendTelegramTest} fields={{}}>Send Telegram test</ActionButton>}>
        <p className="mb-4 font-sans text-sm text-foreground/60">Whether each integration has its environment variables set on this deployment. Values are never shown. Live reachability is on the Health page.</p>
        <ul className="flex flex-col divide-y divide-foreground/10">
          {integrations.map((integration) => (
            <li key={integration.name} className="flex flex-col gap-1 py-3 md:flex-row md:items-start md:justify-between md:gap-6">
              <div>
                <p className="font-sans text-base font-medium text-foreground">{integration.name}</p>
                <p className="font-sans text-sm text-foreground/60">{integration.note}</p>
                <p className="mt-1 font-mono text-xs text-foreground/50">{integration.envVars.join(", ")}</p>
              </div>
              <Pill value={integration.configured ? "ok" : "skipped"} label={integration.configured ? "configured" : "not set"} className="self-start" />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
