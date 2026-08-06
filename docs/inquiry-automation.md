# Initial Inquiry Automation

This infrastructure handles the first response to inbound WhatsApp enquiries:

1. Zernio signs and sends a `message.received` webhook.
2. The Next.js route verifies the raw-body HMAC.
3. A Supabase RPC atomically deduplicates and stores the message plus an outbox event.
4. Trigger.dev waits for a 2-minute quiet period (trailing debounce, no cap), then loads every unprocessed message in the conversation.
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

The scheduled `dispatch-inquiry-outbox` task runs every three minutes
(`*/3 * * * *`) as a recovery path when a webhook is stored successfully but
the immediate Trigger.dev call cannot be made. The same tick runs
`reconcile_stale_inquiry_work`, which expires stale leases and re-posts any
review card that was written but never delivered (see section 8).

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

The same key also pays for voicenote transcription (section 8). No new
credential is needed: `transcribe()` routes through the same gateway on
`AI_GATEWAY_API_KEY`. One optional variable tunes it:

```env
# Optional. Defaults to openai/whisper-1 when unset or blank.
AI_TRANSCRIBE_MODEL=openai/whisper-1
```

Whisper is flat-rate per minute rather than per token, which is the cheapest
way to turn a 30-second voicenote into redraft instructions. The `transcribe`
primitive needs `ai >= 7.0.31` and `@ai-sdk/gateway >= 4.0.23`; the repo pins
`ai@^7.0.55` and `@ai-sdk/gateway@^4.0.43`, comfortably past both.

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

`message` updates power two flows that share the same keystrokes. With no
suggest-change request open they are typed overrides: replying to a review card
with text applies immediately, while a bare message (no reply-to) binds to the
newest pending card and asks for a Send/Cancel confirmation first (see section
7). While a request *is* open the same text means redraft instructions instead
(see section 8). Voice notes ride the same update type and are only ever
redraft instructions. Unmatched messages in the group are acknowledged with 200
and ignored — never return non-2xx for updates you don't act on, or Telegram
retries them forever.

Review cards carry **Approve** and **Dismiss** on the first row and
**✏️ Suggest changes** on a second row of its own, so a mis-tap next to Approve
cannot send a real customer message. Dismiss sends nothing (stored as
`rejected` in the database — the rename is label-only, and the legacy `inq:r:`
callback on older live cards still parses as a dismiss).

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

**Client profiles (`inquiry_client_profiles`).** One row per contact, merged
automatically from every analysed burst (name, event type/date, venue,
location, guests, duration, budget mentions). Fields the extractor doesn't
produce yet — `quoted_amount_text`, `deposit_status`, `booking_stage`,
`preferences`, `notes` — are edited manually in Studio and are injected into
drafting as established facts the AI must not re-ask. This is the durable
memory that survives history trimming on very long threads, and the only place
facts Luke settled offline (a quoted amount, a deposit) can live at all.

**Multi-bubble replies.** Drafts may arrive as up to 3 WhatsApp bubbles. In
storage and on the card they are one text joined by a lone `---` line; the
card numbers them, and on approve they send sequentially (~2.5s apart). The
first bubble completes the send claim; later bubbles are best-effort with
failures reported on the card. An override reply can use a `---` line to
split into bubbles too.

**Chat backfill (`scripts/backfill-chats.mjs`).** Screens every Zernio
WhatsApp thread (and optional `--exports=dir` of WhatsApp "Export chat"
.txt files — the only way to recover history from before the number was
connected to Zernio, ~11 July) and inserts (customer → Luke's actual reply)
pairs as `past_chat` examples with `active=false`. Review in Studio: flip
`active=true` on the good ones, delete the rest. Business observations land
in `.omc/research/backfill-report.md` for folding into brain docs by hand.
Re-runs skip already-processed threads.

**Ongoing conversations / long-time customers.** Nothing is skipped: every
inbound message on any conversation flows through the same pipeline. Before
drafting, the task fetches the **whole thread** in both directions from Zernio
(`GET /v1/inbox/conversations/{id}/messages`) — including replies Luke typed
manually in WhatsApp, which never reach our webhook — and both AI stages see
it, with rules to not re-introduce Luke, not re-ask established details, and
never contradict what Luke already said. The fetch is best-effort: if it fails
(synthetic smoke conversations, Zernio outage) the draft falls back to
burst-only context.

There is no message-count window any more. `getZernioConversationHistory` walks
Zernio's cursor pagination (100 per page, `sortOrder=desc`, following
`pagination.nextCursor` until `hasMore` is false) and returns the thread
oldest-first. Two bounds sit on top of it:

- **A hard ceiling of 2,000 messages**, which caps the walk at 20 requests. A
  thread that long is already far more relationship context than a draft needs.
- **A tiered character budget** applied when the history is rendered into the
  prompt. Under **60,000 rendered characters** (roughly 650 messages, about 15k
  tokens) the entire thread goes in verbatim, so a years-long client
  relationship reaches the drafter intact. Past that, the newest slice is kept
  up to **40,000 characters** and the prompt states how many earlier messages
  were dropped, so the model knows the relationship runs deeper than what it
  was shown. A floor of 10 messages outranks the budget: the newest messages
  are the ones being replied to and are never dropped.

A separate per-message clip at **10,000 characters** is a pathological-data
guard, not a budget control. WhatsApp caps a single message at 4,096
characters, so it never fires in normal operation and a detailed
3,000-character wedding brief reaches the drafter whole. It exists only for
text that did not come through WhatsApp's own limit (a transcript pasted in by
another system, a malformed payload). Such an entry is now **clipped rather
than dropped**, which fixed a real failure: dropping it emptied the history
block entirely, took the history rules with it, and made the model greet an
established client as a stranger.

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

**Replay harness.** `npm run eval:replay` re-runs real message bursts from
`inquiry_response_runs` through the current pipeline and prints the original
draft beside the new one. It needs no gold answers, so it works before anything
has been approved; use it to see the effect of a prompt or brain-doc change
immediately. Nothing is written and nothing is sent. `REPLAY_LIMIT` widens the
set, `REPLAY_CONVERSATION=<uuid>` narrows it to one contact, and
`REPLAY_HISTORY=true` also fetches Zernio thread history so the replay assembles
the same context the live task does. History is off by default because it is
fetched live: it reflects the conversation as it stands now, not as it stood
when the original draft was written.

**LangSmith tracing.** Optional observability over the drafting agent. Set
`LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY` and every analysis run is sent
to LangSmith as one trace: a parent `inquiry-agent` run with the extraction and
drafting model calls nested under it, carrying the model, message count, and
whether history and a client profile were available. Runs are tagged with
`conversation_id`, so LangSmith's Threads view shows a contact's whole history.
Production traces land in `LANGSMITH_PROJECT`; `npm run eval` writes to
`LANGSMITH_EVAL_PROJECT` (default `<project>-evals`) and `npm run eval:replay`
to `<project>-replay`, so neither mixes with live enquiries. Each gold case
becomes one trace containing its draft and the judge's scoring.

`LANGSMITH_*` in `.env.local` only affects locally run evals. Deployed Trigger.dev
runs read the Trigger.dev dashboard's environment variables, so production
traces need the vars set there followed by a redeploy.

A trace is five spans: `inquiry-agent` (root) wrapping `extract-inquiry-facts`,
`retrieve-knowledge`, and `draft-inquiry-reply`, each model call carrying its own
`gateway` LLM span. The root's inputs hold the burst, the rendered conversation
history, and the client profile; its outputs hold the draft bubbles and the full
extraction; its metadata records the model and a `history` breakdown of how far
back the window reached (`fetched`, `excluded_as_current_burst`,
`dropped_for_budget`, `individually_truncated`, `omitted_for_budget`,
`included`, and the oldest and newest timestamps). Those counts are reported
separately on purpose: burst echoes, whole messages dropped for budget, and
individual messages clipped for length are three different failures, and
collapsing them hides which one occurred.
`retrieve-knowledge` lists the brain docs, learned corrections, and media slugs
that reached the prompt, which varies per run because retrieval is intent-driven.

Two details make the model input visible and are easy to undo by accident: the
`instructions` string is passed to
`inquiryTelemetry()` as well as to `generateText`, because the AI SDK sends it
outside the messages array and LangSmith records only that array (drop it and
the trace shows the enquiry without the rules, brain docs, or examples applied
to it); and `traceInquiryRun` is given an `outputs` formatter that emits
`{ messages: [...] }`, which is the shape LangSmith's Threads view needs to
render a run as a conversation.

Tracing is fail-open by design. Without the two variables nothing is sent and
no call site behaves differently; with them set, a LangSmith outage or bad key
is swallowed rather than failing the enquiry. Traces are flushed at the end of
each analysis because a Trigger.dev run can freeze the instant it resolves.

The usual loop: read the trace of a draft you rejected, adjust the prompt or a
brain doc, re-run `npm run eval`, compare. Rejected drafts already become
`override` examples in Supabase (see the feedback loop above); the trace is
what tells you *why* the draft came out that way.

## 7. Website leads, the availability gate, and confirmed overrides

Migration `202608060001_website_leads_availability_overrides.sql` adds three
tables (`inquiry_website_leads`, `inquiry_availability_checks`,
`inquiry_override_confirmations`), three outbox event types, and the RPCs that
drive them. All state transitions stay RPC-first and compare-and-set; the
`dispatchInquiryOutbox` cron remains the durability net for every new hop.

### Website lead availability flow

Website form submissions (`/api/leads`, `/api/contact`) are now persisted to
`inquiry_website_leads` (best-effort: a Supabase failure only costs the
buttons, never the form response or Attio writes). When the lead has a
WhatsApp-capable number, the Telegram alert gains **Available / Unavailable**
buttons (`wl:a:` / `wl:u:`):

1. Luke taps one → `decide_website_lead_availability` moves the lead to
   `drafting` and enqueues `website_lead.availability_decided`.
2. The `draft-website-lead-reply` task drafts Luke's **first outbound
   message** (single bubble, ≤700 chars, no media) with the availability
   answer stated as a human-confirmed fact — a warm pitch when available, a
   polite decline (asking about date flexibility when the form allows) when
   not.
3. The draft comes back as a review card with **Approve / Dismiss**
   (`wl:s:` / `wl:d:`), and typed overrides work exactly like Path B's.
4. **Approve does not send via Zernio.** Meta forbids opening a WhatsApp
   conversation with freeform text (Zernio returns `TEMPLATE_REQUIRED` for
   cold sends), so the approved card swaps in a **prefilled wa.me button**:
   one tap opens WhatsApp on Luke's phone with the exact message filled in,
   and he hits send himself. Messages too long to prefill fall back to a bare
   chat link with the text in the card for copy-paste. Once the lead replies
   on WhatsApp, the normal Zernio inbound pipeline owns the thread.

Website-lead overrides are stored in `inquiry_reply_examples`
(`source='website_lead_override'`, null conversation/approval FKs) so the
drafter learns from them like any other correction.

### Availability gate (inbound WhatsApp)

When extraction classifies a burst with the `availability` intent, the
pipeline pauses **between extraction and drafting**:

1. `ensure_inquiry_availability_check` (keyed on conversation + batch) either
   reuses a fresh answered check for the same date (→ continue with the fact),
   reuses the pending question (idempotent re-run), or creates a new check and
   enqueues `inquiry.availability_requested`.
2. The `notify-availability-check` task posts "📅 Are you available on
   {date}?" with **Available ✅ / Unavailable ❌** buttons (`inq:v:a:` /
   `inq:v:u:`), including the service-window deadline — the 24h WhatsApp
   window keeps ticking while the question waits.
3. The burst's messages deliberately stay unprocessed while paused. Luke's
   answer enqueues `inquiry.availability_answered`, which re-triggers
   `process-inquiry-conversation` immediately (no debounce); the re-run's
   extraction matches the answered date and drafting resumes with the fact.
4. The drafting rules relax the availability ban **only for the confirmed
   date** ("Luke has personally confirmed he IS/IS NOT available on {date}");
   prices and all other dates stay banned. Unavailable answers produce a
   polite decline draft — still human-reviewed like everything else.

If new customer messages arrive mid-question, they enlarge the unprocessed
batch: the next run either reuses the answer (same date) or supersedes the
old question and asks again. A completed non-availability analysis also
supersedes any dangling question cards. Non-availability inquiries flow
exactly as before.

### Dismiss + confirmed bare-message overrides

The Reject button is now **Dismiss** (send nothing). Typed overrides come in
two forms:

- **Reply to a card** (any review card, Path B or website lead): applied
  immediately — approval flips to `approved` with Luke's text, a teaching
  example is stored, and the guarded send (or wa.me prefill) proceeds. This
  works on `pending` cards too; no Dismiss press is needed first.
- **Bare message** (no reply-to): `stage_inquiry_override` binds it to the
  newest actionable review card in the chat and the bot replies "Send this to
  {name}?" with **Send / Cancel** (`ovr:s:` / `ovr:c:`). Only Send applies
  the override; Cancel (or 24h of silence, or a newer bare message) discards
  it. This confirmation gate is what keeps stray chat text from ever reaching
  a customer. Slash commands and messages of one or two characters are ignored
  outright, and if nothing is pending the bot says so and does nothing.

## 8. Suggest changes: the voicenote redraft loop

Migrations `202608070002` through `202608070006` add
`inquiry_suggest_change_requests` plus the RPCs that drive it, the
`inquiry.redraft_requested` outbox type, and the `process-suggest-change`
Trigger.dev task.

Tap **✏️ Suggest changes** on any AI draft card, send a Telegram voice note
saying what you want different, and a new card appears with the same three
buttons. Tap ✏️ on that one and the loop repeats, indefinitely. It works
identically on both draft paths: inbound WhatsApp approvals (`inq:sc:`) and
website leads (`wl:sc:`).

The round trip:

1. **Tap ✏️.** `open_suggest_change_request` checks the draft is still worth
   revising, snapshots it as `source_draft`, and cancels any other open request
   in the chat. Only one request per chat may await instructions, because
   instructions arrive as a bare message with nothing tying them to a card.
   Superseded prompts are repainted so no stale one invites a voicenote.
2. **The bot posts a prompt** threaded under the card you tapped, quoting the
   current draft and carrying a single **🚫 Cancel** button (`sug:x:`).
3. **Send a voice note.** The webhook transcribes nothing itself: transcription
   costs money and Telegram retries a slow webhook, so it hands the `file_id`
   to `process-suggest-change` and returns immediately.
4. **The task transcribes and redrafts.** `transcribeTelegramVoice` fetches the
   file through the Bot API (rejecting anything over Telegram's 20 MB download
   limit) and sends the raw OGG/Opus bytes to the gateway. There is no
   transcoding step and no ffmpeg dependency: the AI SDK sniffs the `OggS`
   magic bytes itself. The client-supplied `mime_type` and `duration` fields
   are not trusted for either decision.
5. **A new card is posted** headed `✏️ Revision N`, printing the new draft, the
   attachments that still send, and what you asked for.

Typed notes work too: with a request open, typed text is instructions rather
than an override (see mode arbitration below).

### One uuid per callback, and why

Telegram caps `callback_data` at 64 bytes, and `parseTelegramCallback` splits on
the **last** colon: everything before it is the verb, everything after it must
be a uuid. A uuid is 36 characters, so exactly one fits alongside a short verb
and there is no room to carry both a target kind and a target id. That is why
the feature needs three verbs rather than one:

| Callback   | Meaning                                    | The uuid is         |
| ---------- | ------------------------------------------ | ------------------- |
| `inq:sc:`  | Suggest changes on an inbound-WhatsApp card | an approval id      |
| `wl:sc:`   | Suggest changes on a website-lead card      | a website lead id   |
| `sug:x:`   | 🚫 Cancel on the prompt                     | a request id        |

The single uuid points at a different table on each side, so the verb is what
disambiguates it. An unknown prefix or a malformed uuid yields `null` and the
webhook answers the callback without acting.

### Binding is request-scoped

A voicenote binds to **the request it was recorded against**, never to whatever
happens to be open when it is dequeued. The webhook reads the open request and
passes its id to the task; `enqueueRedraft` requires that id at the type level
so no caller can enqueue an unbound redraft.

If Luke tapped ✏️ on another card in the meantime, `bind_suggest_change_instructions`
returns `request_superseded` or `request_not_found` and the task **hard stops**:
nothing is written, and Telegram says the note arrived after he moved on and
was not applied. The instructions are never rebound to the newer request.
Rebinding is the wrong-customer bug this design exists to prevent: the
enqueue-to-dequeue gap is seconds to tens of seconds, and a second ✏️ tap inside
that window would otherwise land one customer's spoken instructions, prices and
all, on another customer's draft.

The same reasoning governs the failure paths. When the open request cannot be
read at all, the webhook takes **no consequential action** and says so, because
both tempting answers are wrong: treating it as "nothing open" hands the text
to the override path where it becomes `final_reply` on a live enquiry, and
enqueueing without a request id falls into the unbound path.

### Mode arbitration: what typed text means

This is the single most confusing part of the system to operate, so it is worth
stating plainly.

| State                            | Typed text means                        |
| -------------------------------- | --------------------------------------- |
| No suggest-change request open   | **An override.** Send this to the customer. |
| A request is `awaiting_instructions` | **Instructions.** Redraft using this.   |
| A request is `drafting`          | Neither. The bot says it is still redrafting and applies nothing. |

`arbitrateTypedText` is the only place this is decided, and every typed path
runs through it before it can reach an override, bare messages and swipe
replies alike. Arbitration deliberately runs **before** the override write, not
after. It used to be keyed on the prompt's own message id, which only caught a
swipe on the prompt itself; but the prompt is posted threaded under the review
card and quotes the draft, so the *card* reads as the subject and swiping it is
the natural gesture. Those replies fell straight through to
`record_inquiry_override`, which sets `final_reply` and approves in one
statement with no confirm tap. "Make it warmer and mention parking" left for
the customer as Luke's reply.

With no request open the existing override behaviour is completely unchanged:
reply to a card and it applies, send a bare message and you get the Send/Cancel
confirmation.

Note also that mode arbitration is **not replayable**. A 500 would make
Telegram redeliver the update and re-run arbitration against chat state that
has moved, so the same keystrokes could mean something different on the retry.
Every one of these paths therefore answers 200 and refuses out loud instead.

### The ordering invariant

When the redraft comes back, three writes happen in a fixed order. Each step
closes a different hole:

1. **Retire the source card's Approve button.** Approve sends
   `coalesce(final_reply, proposed_reply)`, which is whatever the target row
   holds when the button is *tapped*, not the text the card prints. The instant
   the revision lands, that old button would start offering text Luke has never
   read. Retiring it first means **no button can send unread text**. Dismiss
   and ✏️ Suggest changes stay on the old card: neither can send anything.
2. **Write the draft** (`complete_suggest_change_request`). This comes before
   the new card because the reverse order left a card quoting a corrected price
   over a target row still holding the old one. **No button may offer text the
   target does not contain.**
3. **Post the new card, then attach its id** (`attach_suggest_change_card`).
   Attaching records the card and repoints the target at it, so a typed
   correction swipe-replied to the *new* card still finds its target.

Between steps 1 and 2 the old card carries Dismiss and ✏️ over the text it
prints, which is consistent in both directions. A throw before step 1 leaves
everything untouched. A throw after step 1 leaves nothing written, but the old
card has temporarily lost its Approve button; the run retries from the stored
transcript, and if every attempt fails the failure handler puts the button
back (the retired card's coordinates are recorded when it is stripped, and the
reconcile cron re-restores it within a few minutes if that restore itself
fails). A restored card holds exactly the draft it prints, so approving it is
safe.

**A cardless redraft is recovered by the `*/3` cron.** If step 3's send fails,
the revision sits in the target row with `card_message_id` null and nothing in
the chat can send it unread (step 1 already removed Approve). The task's own
apology is a Telegram `sendMessage` issued moments after a Telegram
`sendMessage` failed, so under flood control or a 5xx it fails for exactly the
same reason. A correlated fallback is not a fallback. The real recovery is
`reconcile_stale_inquiry_work`, which sweeps `cardlessRedrafts` on the first
`dispatch-inquiry-outbox` tick more than two minutes after the write (the
floor keeps the sweep off the task's own retries), so two to five minutes
later over a different connection, and it keeps retrying every three minutes
until the card lands or the target expires.
Its card text is read fresh from the target row, so it prints what Approve
would actually send.

### Prompting

A revision must satisfy **every** earlier instruction, not just the newest one,
or a later note silently undoes an earlier correction and the loop never
converges. `inquiry_suggest_change_requests.instruction_history` accumulates
them oldest-first and the whole list goes into the prompt.

The three prompt blocks are labelled explicitly (current draft, earlier
instructions, this revision's instruction) and the labelling is load-bearing:
an unlabelled transcript reading "tell them we're available on the 14th" is
indistinguishable from something the customer wrote, and a drafter that
confuses the two writes a reply answering Luke instead of the customer.

Guardrails are not re-stated for revisions. Both paths run the same rule
builders as the first draft, so the price ban, the availability ban and the
em-dash ban bind a revision exactly as they bind a first draft, and a
human-confirmed availability fact relaxes exactly the one bullet it always
relaxed. An instruction cannot authorise a price the rules forbid.

Requests expire after 24 hours. Only a *completed* request advances the
revision counter, so a cancelled one does not consume a revision. Redrafts get
their own LangSmith traces (`redraft-inquiry-agent`,
`redraft-website-lead-agent`) carrying the revision number and how many earlier
revisions applied.

## 9. Cross-platform identity

Migration `202608070001_person_identity_linking.sql` adds `inquiry_people` and
a `person_id` foreign key on both `inquiry_website_leads` and
`inquiry_contacts`.

Until now, someone who filled in the website form and then messaged on WhatsApp
from the same number existed twice: once as a lead row keyed on a digits-only
string, once as a contact row keyed on a Zernio identity. Nothing joined them,
so the drafting model met every returning enquirer as a stranger.
`inquiry_people` is the join. One row per canonical E.164 number, which is the
only identifier the two channels share.

`upsert_inquiry_person` uses `on conflict (phone_e164) do update` rather than
select-then-insert, so a simultaneous form submit and WhatsApp webhook for the
same number collapse into one row: the loser blocks on the unique index, falls
into the update branch, and returns the winner's id.

Name resolution deliberately runs **opposite** to the contact upsert in
`ingest_zernio_message`. A contact mirrors one WhatsApp identity, so the
freshest Zernio snapshot should win. A person should not work that way: the
first name we learn is almost always the one typed into the website form
("Sarah Whitfield"), while the WhatsApp display name arriving later is a
self-set nickname ("Sazzz ✨") Luke would not recognise on a Telegram card. So
the stored value wins and only a null is filled in.

**`src/lib/inquiries/phone.ts`** is the single normaliser, pure and
dependency-light (`libphonenumber-js`, no env reads, no I/O). It converts to
E.164 with a **ZA default** for input that carries no country information of
its own, so `082 123 4567`, `0821234567`, `+27 82 123 4567`, `27821234567` and
`0027821234567` all converge on `+27821234567`. A leading `+` means no default
is applied, so an international number cannot be re-read as South African, and
`0044 20 7946 0958` still resolves to `+44` because `00` is read as the exit
code. Anything `isValid()` rejects returns `null` rather than a best guess: a
missing number degrades to "reply by email", while a wrong one sends a quote to
a stranger and leaves the real lead waiting.

This closed a live bug. `toWaMeDigits` previously amounted to stripping
non-digits, so a lead who typed their number in local format got
`wa.me/0821234567`, a link that silently opens a chat with nobody. Both
`/api/leads` and `/api/contact` now normalise before building the button, and
`src/lib/inquiries/identity.test.ts` pins the TypeScript output against the
`inquiry_people.phone_e164` check constraint so the two sides cannot drift.

## Environment placement


| Variable                     | Vercel       | Trigger.dev            |
| ---------------------------- | ------------ | ---------------------- |
| `SUPABASE_URL`               | Yes          | Yes                    |
| `SUPABASE_SECRET_KEY`        | Yes          | Yes                    |
| `TRIGGER_SECRET_KEY`         | Yes          | No                     |
| `TRIGGER_PROJECT_REF`        | Local/config | Project already linked |
| `AI_GATEWAY_API_KEY`         | No           | Yes                    |
| `AI_MODEL`                   | No           | Yes                    |
| `AI_TRANSCRIBE_MODEL`        | No           | Yes (optional)         |
| `ZERNIO_WEBHOOK_SECRET`      | Yes          | No                     |
| `ZERNIO_API_KEY`             | No           | Yes                    |
| `TELEGRAM_WEBHOOK_SECRET`    | Yes          | No                     |
| `TELEGRAM_BOT_TOKEN`         | Yes          | Yes                    |
| `TELEGRAM_CHAT_ID`           | Yes          | Yes                    |
| `TELEGRAM_APPROVER_USER_IDS` | Yes          | No                     |
| `LANGSMITH_TRACING`          | No           | Yes (optional)         |
| `LANGSMITH_API_KEY`          | No           | Yes (optional)         |
| `LANGSMITH_PROJECT`          | No           | Yes (optional)         |




## Deploy

Three things, in this order:

1. **Apply the migrations in sequence**, `202608070001` through `202608070006`.
   They are not independent: `202608070003`, `202608070005` and `202608070006`
   each replace `get_suggest_change_target_context`, and `202608070004`
   replaces `open_suggest_change_request` and
   `record_suggest_change_instructions` from `202608070002`. Running them out
   of order leaves an older definition in place.

   ```bash
   npx supabase@latest db push
   ```

2. **Deploy Trigger.dev.** `process-suggest-change` is a new task, and the
   redraft outbox path enqueues it by id. Until the deploy lands, tapping
   ✏️ Suggest changes opens a request that nothing services.

   ```bash
   set -a; source .env.local; set +a
   npx trigger.dev@latest deploy
   ```

3. **Deploy the site** for the Telegram webhook route's new callback verbs and
   voicenote handling.

**No new environment variable is mandatory.** Transcription reuses
`AI_GATEWAY_API_KEY`; `AI_TRANSCRIBE_MODEL` is optional and defaults to
`openai/whisper-1`.

## Known limitations

- **A redraft cannot add or remove media attachments.** The redraft prompt
  forces `proposed_media_slugs` to an empty array, because
  `complete_suggest_change_request` writes only the text back to the target
  row. The card now states this outright rather than implying the reply is
  text-only. There is an asymmetry underneath it: a **typed override** drops
  the proposed media (the send claim blanks the slug list, but only when
  `final_reply` is set and differs from the proposal), while a **voice
  redraft keeps it** (a redraft rewrites `proposed_reply`, so `final_reply`
  stays null and the guard never trips). Which behaviour is correct is a
  product decision, not a bug fix.
- **`redraftWebsiteLeadReply` retrieves against a fixed intent set.** A website
  lead has no response run to extract intents from, so its redraft retrieves
  learned corrections against a hardcoded `["availability", "event_details",
  "greeting"]` rather than the lead's own intents. The inbound-WhatsApp path
  threads the run's real stored intents through, so the two paths ground
  differently.
- **`evals/inquiry-replay.eval.ts` still hardcodes `limit: 30`.** Production
  drafting now walks the whole thread, so replays no longer reproduce
  production behaviour on long conversations. Short threads are unaffected.
- **Incoming *customer* voice notes are still not transcribed.** They reach the
  model as `[audio]`, the same as any other attachment. Only Luke's own
  operator voicenotes in the Telegram approval chat are transcribed.
- **The database still stores no outgoing messages.** We subscribe only to
  `message.received`, so thread history is read live from Zernio on every run.
  A Zernio outage means drafting falls back to burst-only context, and history
  always reflects the conversation as it stands *now*, not as it stood when an
  earlier draft was written.

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

Tap **Dismiss** on the Telegram card the production run produces. The smoke
conversation must never receive a WhatsApp reply.

Live smoke test:

1. Send a burst of WhatsApp bubbles — any number; each new bubble resets the
   2-minute quiet-period timer, so keep typing as long as you like.
2. About 2 minutes after the last bubble, confirm Supabase contains all the
   messages and exactly one response run for the whole burst.
3. Confirm the Telegram card reflects all supplied details and leaves unknowns blank.
4. Tap Dismiss and confirm nothing appears in WhatsApp.
5. Send another enquiry and tap Approve.
6. Confirm exactly one WhatsApp reply, `approval_requests.status = 'sent'`, and a stored Zernio message ID.
7. Redeliver the same Zernio event and confirm no second message or review is created.



## Current boundary

This release does not claim dates are available and does not calculate prices.
Those stay explicitly unverified until an authoritative calendar and versioned
pricing rules are connected (the `pricing-policy` and `availability-policy`
brain docs enforce this at draft time). The AI can now ground drafts in the
knowledge base, learn from reject-overrides, propose curated media, read the
whole thread, recognise a website lead and a WhatsApp sender as one person, and
be redrafted by voice; it still cannot send anything without human
approval. Media understanding of *incoming* attachments (including transcribing
a customer's voice notes, as opposed to Luke's own), and automatic replies for
proven FAQ categories, are later phases.