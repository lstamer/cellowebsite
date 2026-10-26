# Security maintenance

## Credentials and incident containment

A Telegram bot credential was found in historical tracked agent runtime state. Treat it as compromised. Removing the files does not revoke the credential.

1. The bot owner must revoke and replace it through the official BotFather account. Do not paste it into a chat, issue, command line, or report.
2. Update TELEGRAM_BOT_TOKEN in Vercel and Trigger.dev, and the ignored local environment. Redeploy both applications.
3. Re-register the Telegram webhook with its configured secret and URL, then verify the bot identity and a controlled approval. A stolen bot token allows the webhook to be changed. Do not log token-bearing API URLs.
4. Review webhook and admin event logs for unexpected activity. Bot API access does not automatically reveal all historic chat messages, but future updates and impersonation are at risk.
5. Coordinate a backed-up history rewrite for every affected branch/tag, then GitHub cache/fork cleanup as needed. Force-pushing shared history requires coordination with other checkouts. Rotation is the immediate containment step.

The public admin login only sends email magic links. No login bypass or Telegram login delivery remains. Inquiry approval messaging remains separate.

## Deployment

The application uses Node 24.x. Vercel maintains runtime patch releases; separately hosted workers, CI and local Node installations require their own runtime updates. Build and test the exact release before deployment. Database migrations must precede deploying the fail-closed request limiter.

On 24 October 2026, the live Vercel function reported Node 24.21.0, while the deployed Trigger.dev worker reported patched Node 22.23.4. The Node 24 security release is 24.22.1. Vercel's [current advisory](https://vercel.com/kb/bulletin/node-js-security-advisory) says its managed-runtime rollout is continuing; its inbound WAF mitigation does not cover responses fetched from other servers. Verify the private health endpoint's runtimeNode value after the provider rollout. The image optimizer accepts only the single approved Unsplash avatar URL, including its fixed query, to reduce unnecessary remote fetching. This restriction does not replace the runtime patch.

The local terminal reported Node 26.9.0; update that separate installation to a patched runtime (26.12.1 or the project's Node 24.22.1 LTS line). Global workstation runtimes were not replaced during this site release. The release used Vercel CLI 65.2.0 through npx; upgrade the older global CLI with npm i -g vercel@latest for future commands.

Keep SITE_ORIGIN=https://stamer.co.za and configure TURNSTILE_HOSTNAMES for every approved form hostname. The booking action is book; the legacy contact endpoint requires contact. No current frontend calls the legacy contact endpoint. Never expose TURNSTILE_SECRET to the browser.

## Shared abuse limits

The service-role-only consume_public_request_limit RPC stores short-lived HMACs, not raw IPs. Both forms share 5 attempts per IP and 120 total per 10 minutes. Telemetry permits 120/IP and 6000 total per minute. Admin login permits 10/IP and 60 total per 15 minutes. Rejected IP attempts do not consume global capacity. Tune against actual legitimate traffic. Global quotas are deliberate cost/availability boundaries and are not a substitute for filtering at the edge.

Forms and login fail closed when the limiter is unavailable; telemetry drops events. Only Vercel's platform client-IP header is used. Non-Vercel deployments need an explicitly trusted proxy/IP integration; arbitrary forwarded headers must not be accepted.

## Hosting settings requiring account access

The project assignment for admin.stamer.co.za and the hosting-level www redirect were repaired on 24 October 2026. HTTPS admin login returned 200 and www redirected to the apex with 308. The apex /admin/login remains supported. Re-check the domain assignment and certificate after hosting changes; application-level redirects cannot override an earlier hosting redirect.

Review active WAF rules and false positives using verified-bot signals and observed traffic. Do not disable bot protection or broadly allow a spoofable User-Agent. The additional public POST burst rule was published in log mode on 24 October 2026; the shared application limits are enforced. Tune the edge rule against legitimate traffic before switching it to block or challenge.

The resource CSP is enforced on production builds following browser compatibility checks, including Google Places suggestions and both booking steps with the Turnstile frame. Public pages retain inline Next bootstrap support and static caching; this allowlist does not block injected inline scripts. Admin pages use a separate strict script policy with a fresh nonce per response, forwarded to Next's renderer. Public scripts require a separate rendering/cache design before a nonce policy can replace their inline allowance. Development keeps the base/form/object/frame restrictions without the production resource restrictions needed by the dev tooling.

The Zernio webhook rejects absent or malformed signature headers before reading its body, then streams at most 256 KiB of UTF-8 text before HMAC verification. Actual received bytes are counted even without a trustworthy Content-Length. Binary attachments arrive as provider metadata, not inline files. Keep this cap aligned with actual provider payloads when adding new webhook event types.

## Mail DNS

Authoritative DNS is Vercel. Google Workspace SPF and DMARC reporting were added on 24 October 2026. Inventory any additional envelope senders, including Supabase custom SMTP, before enforcing DMARC. Do not copy an invented Supabase SPF include.

If Google Workspace is the only envelope sender, the SPF TXT value at @ is:

    v=spf1 include:_spf.google.com ~all

Start DMARC reporting at _dmarc with:

    v=DMARC1; p=none; rua=mailto:luke@stamer.co.za

Check reports and DKIM/SPF alignment, then change to p=quarantine and eventually p=reject. Publish exactly one SPF and one DMARC record at their respective names. Missing records increase spoofing risk but do not guarantee delivery to any recipient's inbox. Vercel DNS does not currently support DNSSEC; enabling it requires a separately planned DNS-provider migration and registrar DS publication. Do not publish an unverified DS value.

## Monitoring and recovery

/ping is a minimal no-store readiness endpoint. It does not establish that a booking submission works. The existing Trigger.dev health-probe runs every five minutes; it checks /book for a server-rendered application-shell marker so a checkpoint returned with HTTP 200 cannot look healthy. The form loads client-side, so the HTTP check does not verify browser rendering or completed submissions; use browser checks for those. The web app checks its own Supabase/Telegram connections; the worker checks Zernio and AI Gateway using its existing credentials. A shared HEALTH_PROBE_SECRET is configured on both hosts and must stay server-only. Verify the schedule and notification delivery after deployment. Confirm encrypted backup retention and conduct a restore rehearsal in an isolated database.

Run npm audit, npm test, npm run typecheck, npm run lint, and python3 scripts/scan-secrets.py before release. The scanner checks current source and reports paths and categories only; it does not replace provider rotation or historical scanning.

GitHub secret scanning and push protection are enabled. Dependency alerts and Dependabot security update proposals were enabled on 26 October 2026; proposed updates still require review and passing checks before deployment.

The hosted GitHub secret-scan workflow is configured, but GitHub refused to start the earlier release job because the account is locked due to a billing issue. The same scanner passed locally. Resolve the GitHub account restriction, then re-run the hosted workflow.
