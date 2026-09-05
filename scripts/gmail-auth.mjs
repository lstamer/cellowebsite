// One-off: obtain a Gmail refresh token for the enquiry poller.
//
//   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/gmail-auth.mjs
//
// 1. In Google Cloud Console create an OAuth client (Desktop app) for the
//    Workspace project, enable the Gmail API, and add the Workspace account
//    as a test user (or publish the consent screen internally).
// 2. Run this script, open the printed URL in the browser signed in as
//    luke@stamer.co.za, approve read-only access.
// 3. Paste the printed GMAIL_REFRESH_TOKEN into Vercel and Trigger.dev.
//
// Scope is gmail.readonly: the poller never sends, labels or deletes mail.

import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in the environment first.");
  process.exit(1);
}

const port = 53682;
const redirectUri = `http://127.0.0.1:${port}/callback`;
const state = randomBytes(16).toString("hex");
const scope = "https://www.googleapis.com/auth/gmail.readonly";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope,
  access_type: "offline",
  prompt: "consent",
  state,
}).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", redirectUri);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  if (url.searchParams.get("state") !== state) {
    res.writeHead(400).end("State mismatch. Run the script again.");
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end(`Google returned: ${url.searchParams.get("error") ?? "no code"}`);
    return;
  }
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const body = await response.json();
    if (!response.ok || !body.refresh_token) {
      throw new Error(JSON.stringify(body));
    }
    res.writeHead(200, { "Content-Type": "text/plain" }).end("Done. You can close this tab and return to the terminal.");
    console.log("\nAdd these to Vercel and Trigger.dev:\n");
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${body.refresh_token}`);
    console.log("GMAIL_OWN_ADDRESS=luke@stamer.co.za\n");
  } catch (error) {
    res.writeHead(500).end("Token exchange failed; see the terminal.");
    console.error("Token exchange failed:", error);
  } finally {
    server.close();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("Open this URL in a browser signed in as the Workspace mailbox:\n");
  console.log(authUrl.toString());
  console.log("\nWaiting for Google to redirect back...");
});
