import { TelegramTestButton } from "@/app/admin/(app)/settings/SettingsForms";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { getAdminHost, getAllowedAdminEmails } from "@/lib/admin/auth";

interface IntegrationRow {
  name: string;
  purpose: string;
  vars: string[];
}

const INTEGRATIONS: IntegrationRow[] = [
  { name: "Supabase", purpose: "System of record for every enquiry, contact and setting.", vars: ["SUPABASE_URL", "SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PUBLISHABLE_KEY"] },
  { name: "Telegram", purpose: "Lead alerts, approvals and health incidents.", vars: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_APPROVER_USER_IDS", "TELEGRAM_WEBHOOK_SECRET"] },
  { name: "Zernio (WhatsApp)", purpose: "Inbound WhatsApp webhooks and outbound sends.", vars: ["ZERNIO_API_KEY", "ZERNIO_WEBHOOK_SECRET"] },
  { name: "Trigger.dev", purpose: "Background tasks: drafting, retries, health probes, email polling.", vars: ["TRIGGER_PROJECT_REF", "TRIGGER_SECRET_KEY"] },
  { name: "AI Gateway", purpose: "Extraction and drafting model.", vars: ["AI_GATEWAY_API_KEY", "AI_MODEL"] },
  { name: "Gmail", purpose: "Email enquiry ingestion (Phase 5).", vars: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"] },
  { name: "Health probe", purpose: "Shared secret for /api/health.", vars: ["HEALTH_PROBE_SECRET"] },
];

function configured(spec: string): boolean {
  return spec.split("|").some((name) => Boolean(process.env[name]?.trim()));
}

export default function IntegrationsPage() {
  const emails = [...getAllowedAdminEmails()];
  return (
    <>
      <PageHeader eyebrow="Settings" title="Integrations" description="Which services this deployment can reach. Values are never shown, only whether they are set." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" padded={false}>
          <ul className="divide-y divide-foreground/5">
            {INTEGRATIONS.map((integration) => {
              const states = integration.vars.map((spec) => ({ spec, ok: configured(spec) }));
              const allOk = states.every((state) => state.ok);
              const anyOk = states.some((state) => state.ok);
              return (
                <li key={integration.name} className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-start md:justify-between md:px-6">
                  <div>
                    <p className="font-sans text-sm font-semibold text-foreground">{integration.name}</p>
                    <p className="font-sans text-xs text-foreground/60">{integration.purpose}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {states.map((state) => (
                        <li key={state.spec}>
                          <Badge tone={state.ok ? "success" : "neutral"}>{state.spec.split("|")[0]}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Badge tone={allOk ? "success" : anyOk ? "warning" : "danger"}>{allOk ? "Configured" : anyOk ? "Partial" : "Missing"}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card title="Telegram" eyebrow="Test">
            <p className="mb-3 font-sans text-sm text-foreground/70">Sends a short message to the configured chat so you can confirm the bot is reachable.</p>
            <TelegramTestButton />
          </Card>
          <Card title="Admin access" eyebrow="Allow-list">
            <p className="font-sans text-sm text-foreground/70">Host: <span className="font-jakarta text-xs">{getAdminHost()}</span></p>
            <ul className="mt-2 space-y-1">
              {emails.length === 0 ? <li className="font-sans text-sm text-error">ADMIN_EMAILS is empty: nobody can sign in.</li> : emails.map((email) => <li key={email} className="font-sans text-sm text-foreground">{email}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
