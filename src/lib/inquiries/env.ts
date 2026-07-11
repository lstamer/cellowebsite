export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getSupabaseSecret(): string {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function getTelegramApproverIds(): Set<string> {
  const ids = requireEnv("TELEGRAM_APPROVER_USER_IDS")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error("TELEGRAM_APPROVER_USER_IDS must contain at least one ID");
  }

  return new Set(ids);
}
