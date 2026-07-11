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
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

Create a new server secret (`sb_secret_...`) and configure:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

The secret must exist in Vercel and Trigger.dev. Never expose it through a
`NEXT_PUBLIC_` variable. RLS is enabled and no browser role receives access.

## 2. Trigger.dev

Create a Trigger.dev project and configure:

```env
TRIGGER_PROJECT_REF=proj_...
TRIGGER_SECRET_KEY=tr_...
```

The Vercel deployment needs `TRIGGER_SECRET_KEY`. Trigger.dev needs the
Supabase, AI Gateway, Telegram and Zernio variables used by its tasks.

For local task development and deployment:

```bash
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
AI_MODEL=openai/gpt-5.4-mini
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
  -d "{\"url\":\"https://YOUR_DOMAIN/api/webhooks/telegram\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"allowed_updates\":[\"callback_query\"]}"
```

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

## Environment placement

| Variable | Vercel | Trigger.dev |
|---|---:|---:|
| `SUPABASE_URL` | Yes | Yes |
| `SUPABASE_SECRET_KEY` | Yes | Yes |
| `TRIGGER_SECRET_KEY` | Yes | No |
| `TRIGGER_PROJECT_REF` | Local/config | Project already linked |
| `AI_GATEWAY_API_KEY` | No | Yes |
| `AI_MODEL` | No | Yes |
| `ZERNIO_WEBHOOK_SECRET` | Yes | No |
| `ZERNIO_API_KEY` | No | Yes |
| `TELEGRAM_WEBHOOK_SECRET` | Yes | No |
| `TELEGRAM_BOT_TOKEN` | Yes | Yes |
| `TELEGRAM_CHAT_ID` | Yes | Yes |
| `TELEGRAM_APPROVER_USER_IDS` | Yes | No |

## Verification

Local static checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Live smoke test:

1. Send three short WhatsApp bubbles within 15 seconds.
2. Confirm Supabase contains three messages and one response run for the burst.
3. Confirm the Telegram card reflects all supplied details and leaves unknowns blank.
4. Tap Reject and confirm nothing appears in WhatsApp.
5. Send another enquiry and tap Approve.
6. Confirm exactly one WhatsApp reply, `approval_requests.status = 'sent'`, and a stored Zernio message ID.
7. Redeliver the same Zernio event and confirm no second message or review is created.

## Current boundary

This release does not claim dates are available and does not calculate prices.
Those stay explicitly unverified until an authoritative calendar and versioned
pricing rules are connected. Media understanding, voice-note transcription,
reply editing in Telegram, and automatic replies are later phases.
