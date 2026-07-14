# Initial Inquiry Automation

This infrastructure handles the first response to inbound WhatsApp enquiries:

1. Zernio signs and sends a `message.received` webhook.
2. The Next.js route verifies the raw-body HMAC.
3. A Supabase RPC atomically deduplicates and stores the message plus an outbox event.
4. Trigger.dev waits for a 15-second quiet period, capped at 60 seconds, then loads every unprocessed message in the conversation.
5. Vercel AI Gateway returns a schema-validated classification, event extraction and proposed reply.
6. A deterministic policy holds every reply for human review.
7. Telegram shows Approve and Reject buttons.
8. An authorised approval releases the exact stored draft to Zernio.

Attio remains unchanged. Supabase is the operational source of truth for this
new message-native flow and can later grow into the complete CRM.

## Safety properties

- Zernio webhooks require a valid HMAC-SHA256 signature.
- Provider event IDs are unique, so webhook retries cannot duplicate messages.
- Trigger failures cannot lose a stored message because the same transaction creates an outbox event.
- Stale outbox leases and interrupted Telegram notifications are recovered and requeued automatically.
- Each conversation has concurrency one, while unrelated conversations can process in parallel.
- The model cannot send messages. It only returns a typed proposal.
- Every reply requires Telegram approval during this rollout.
- Telegram requires both its webhook secret and an allow-listed reviewer user ID.
- Approval decisions are compare-and-set and Telegram updates are deduplicated.
- A send is claimed once before Zernio is called. Ambiguous network failures are never retried automatically, preventing accidental duplicate customer replies.
- Inbound storage and the final send claim serialize on the conversation record, so a newly stored customer message invalidates the old proposal.
- The atomic send claim blocks free-form replies after WhatsApp's 24-hour customer service window closes.



## 1. Supabase

Create a Supabase project, then apply:

```text
supabase/migrations/202607110001_initial_inquiry_automation.sql
```

You can paste it into the Supabase SQL editor, or link the Supabase CLI and run:

```bash
npx supabase@latest link --project-ref qrefdgmnifyufznuzwxu
npx supabase@latest db push
```

Create a new server secret (`sb_secret_...`) and configure:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

The secret must exist in Vercel and Trigger.dev. Never expose it through a
`NEXT_PUBLIC_` variable. RLS is enabled and no browser role receives access.

## 2. [Trigger.dev](http://Trigger.dev)

Create a Trigger.dev project and configure:

```env
TRIGGER_PROJECT_REF=proj_...
TRIGGER_SECRET_KEY=tr_...
```

The Vercel deployment needs `TRIGGER_SECRET_KEY`. Trigger.dev needs the
Supabase, AI Gateway, Telegram and Zernio variables used by its tasks.

For local task development and deployment (the CLI does not read `.env.local`,
so source it first — `trigger.config.ts` needs `TRIGGER_PROJECT_REF`):

```bash
set -a; source .env.local; set +a
npx trigger.dev@latest login
npx trigger.dev@latest dev
npx trigger.dev@latest deploy
```

The scheduled `dispatch-inquiry-outbox` task runs every minute as a recovery
path when a webhook is stored successfully but the immediate Trigger.dev call
cannot be made.

## 3. AI Gateway

Create a Vercel AI Gateway API key. Trigger.dev does not run inside Vercel, so
it cannot rely on Vercel deployment OIDC.

```env
AI_GATEWAY_API_KEY=...
AI_MODEL=anthropic/claude-sonnet-4.6
```

`AI_MODEL` is configuration rather than a code constant so a model can be
changed without deploying a new classifier. Re-run the shadow evaluation set
before changing it in production.

## 4. Telegram approval bot

1. Create a bot with BotFather and save its token.
2. Add the bot to a private chat or private group used only for approvals.
3. Record the numeric chat ID.
4. Record each authorised reviewer's numeric Telegram user ID.
5. Generate a random webhook secret containing only letters, digits, `_` and `-`.

Configure:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
TELEGRAM_APPROVER_USER_IDS=123456789,987654321
TELEGRAM_WEBHOOK_SECRET=...
```

After the site is deployed, register the Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://stamer.co.za/api/webhooks/telegram\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"allowed_updates\":[\"callback_query\",\"message\"]}"
```

`message` updates power the reject-override flow (reply to a review card with
the text that should be sent). Unmatched messages in the group are acknowledged
with 200 and ignored — never return non-2xx for updates you don't act on, or
Telegram retries them forever.

Webhooks must target the apex domain `https://stamer.co.za`. The `www`
subdomain 307-redirects (webhook callers do not follow redirects), and the
`*.vercel.app` URLs are blocked by Vercel Deployment Protection.

Telegram's secret authenticates the webhook transport. The route separately
checks `TELEGRAM_CHAT_ID` and `TELEGRAM_APPROVER_USER_IDS` before accepting a
decision.

## 5. Zernio

Create an API key and a webhook signing secret:

```env
ZERNIO_API_KEY=...
ZERNIO_WEBHOOK_SECRET=...
```

In Zernio, create a webhook subscription for `message.received` pointing to:

```text
https://YOUR_DOMAIN/api/webhooks/zernio
```

Use the same signing secret in Zernio and `ZERNIO_WEBHOOK_SECRET`. The route
accepts only incoming WhatsApp messages matching Zernio's documented inbox
schema. Other event types are acknowledged and ignored.

The API key is needed in Trigger.dev to send an approved reply through:

```text
POST /api/v1/inbox/conversations/{conversationId}/messages
```



## 6. Knowledge layer, media library, and the feedback loop

Migration `202607140001_knowledge_feedback_media.sql` adds three tables, all
edited directly in Supabase Studio (service-role access only; RLS is on with
no public policies):

- **`inquiry_brain_docs`** — business knowledge injected into every drafting
  prompt (identity, services, pricing policy, availability policy, travel,
  repertoire). Keep the corpus small and factual: every active row is included
  verbatim. To let the AI quote real pricing later, replace the
  `pricing-policy` doc with versioned package rules — until then it hard-bans
  price talk.
- **`inquiry_reply_examples`** — the growing voice corpus. `kind='override'`
  rows are created automatically by the reject-override flow;
  `kind='past_chat'|'manual'` rows are imported by hand. At draft time the
  pipeline retrieves the newest examples whose `intents` overlap the current
  enquiry's extracted intents, so a correction only influences similar
  messages. Deactivate a bad example with `active=false`.
- **`inquiry_media_assets`** — the curated media the AI may propose. `url`
  must be publicly reachable at send time; `description` tells the model when
  the asset is appropriate. The public bucket `inquiry-media` exists for this:
  upload a file in Studio → Storage → inquiry-media, then use
  `https://qrefdgmnifyufznuzwxu.supabase.co/storage/v1/object/public/inquiry-media/<file>`
  as the asset's `url`. WhatsApp size limits: images ≤8MB, video/audio ≤25MB.
  Free-form media only sends inside the open 24-hour service window — already
  guaranteed here, because attachments ride the same claim that enforces the
  window for the text reply.
  The draft may propose at most two; the Telegram card lists them and they are
  sent through Zernio (`attachmentUrl`/`attachmentType`) after the approved
  text. Attachment failures never fail the text send — they're reported on
  the card.

**Ongoing conversations / long-time customers.** Nothing is skipped: every
inbound message on any conversation flows through the same pipeline. Before
drafting, the task fetches the last 30 thread messages in both directions from
Zernio (`GET /v1/inbox/conversations/{id}/messages`) — including replies Luke
typed manually in WhatsApp, which never reach our webhook — and both AI stages
see them, with rules to not re-introduce Luke, not re-ask established details,
and never contradict what Luke already said. The fetch is best-effort: if it
fails (synthetic smoke conversations, Zernio outage) the draft falls back to
burst-only context.

**Reject-override flow (Phase 3 seed).** Reply to any review card in the
approval group with the text that should be sent. The route matches the reply
to the card's approval, stores your text as `final_reply`, moves the approval
to `approved` (the same guarded single-claim send machinery delivers it, so
supersede/window rules still apply), and records a
`(customer message, rejected draft, your reply)` example tagged with the
enquiry's intents. Works on pending cards too — replying without tapping
Reject first counts as reject-plus-override. Overrides send text only, never
proposed media.

**Draft-quality eval.** `npm run eval` replays the newest decided inquiries
(status `sent`) through the current pipeline and has an LLM judge score each
fresh draft against what was actually sent (content match, voice match,
guardrail violations). Guardrail violations fail the run. Read-only against
production; use `EVAL_LIMIT=20` to widen. Run it after any prompt, brain-doc,
or policy change.

## Environment placement


| Variable                     | Vercel       | Trigger.dev            |
| ---------------------------- | ------------ | ---------------------- |
| `SUPABASE_URL`               | Yes          | Yes                    |
| `SUPABASE_SECRET_KEY`        | Yes          | Yes                    |
| `TRIGGER_SECRET_KEY`         | Yes          | No                     |
| `TRIGGER_PROJECT_REF`        | Local/config | Project already linked |
| `AI_GATEWAY_API_KEY`         | No           | Yes                    |
| `AI_MODEL`                   | No           | Yes                    |
| `ZERNIO_WEBHOOK_SECRET`      | Yes          | No                     |
| `ZERNIO_API_KEY`             | No           | Yes                    |
| `TELEGRAM_WEBHOOK_SECRET`    | Yes          | No                     |
| `TELEGRAM_BOT_TOKEN`         | Yes          | Yes                    |
| `TELEGRAM_CHAT_ID`           | Yes          | Yes                    |
| `TELEGRAM_APPROVER_USER_IDS` | Yes          | No                     |




## Verification

Local static checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Scripted smoke test (synthetic signed event, verifies ingest, dedupe, outbox,
and — once tasks are deployed — the AI draft and Telegram card; cleans up its
rows afterwards):

```bash
node scripts/smoke-inquiry.mjs --url=https://stamer.co.za --wait=300  # full pipeline
node scripts/smoke-inquiry.mjs --url=http://localhost:3000 --wait=0   # ingest only
```

Use `--wait=300`: the conversation debounce waits for 2 minutes of customer
silence before analysing, so the draft appears roughly 2–3 minutes after
ingest.

Tap **Reject** on the Telegram card the production run produces — the smoke
conversation must never receive a WhatsApp reply.

Live smoke test:

1. Send a burst of WhatsApp bubbles — any number; each new bubble resets the
   2-minute quiet-period timer, so keep typing as long as you like.
2. About 2 minutes after the last bubble, confirm Supabase contains all the
   messages and exactly one response run for the whole burst.
3. Confirm the Telegram card reflects all supplied details and leaves unknowns blank.
4. Tap Reject and confirm nothing appears in WhatsApp.
5. Send another enquiry and tap Approve.
6. Confirm exactly one WhatsApp reply, `approval_requests.status = 'sent'`, and a stored Zernio message ID.
7. Redeliver the same Zernio event and confirm no second message or review is created.



## Current boundary

This release does not claim dates are available and does not calculate prices.
Those stay explicitly unverified until an authoritative calendar and versioned
pricing rules are connected (the `pricing-policy` and `availability-policy`
brain docs enforce this at draft time). The AI can now ground drafts in the
knowledge base, learn from reject-overrides, and propose curated media — but
it still cannot send anything without human approval. Media understanding of
*incoming* attachments, voice-note transcription, and automatic replies for
proven FAQ categories are later phases.