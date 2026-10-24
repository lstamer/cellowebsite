/** Keep transport errors from copying API credentials into logs or stored events. */
export function redactSecrets(value: string): string {
  let redacted = value.replace(
    /(https?:\/\/api\.telegram\.org\/(?:file\/)?bot)[^/\s"'<>]+/gi,
    "$1[REDACTED]",
  );
  for (const [name, secret] of Object.entries(process.env)) {
    if (!/(?:SECRET|SECRET_KEY|TOKEN|PASSWORD|API_KEY|SERVICE_ROLE_KEY)$/.test(name)) continue;
    if (!secret || secret.length < 8) continue;
    redacted = redacted.split(secret).join("[REDACTED]");
  }
  return redacted;
}
