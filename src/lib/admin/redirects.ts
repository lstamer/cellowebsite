const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function parseConfiguredOrigin(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function configuredOrigins(): URL[] {
  const values = [
    process.env.ADMIN_ORIGIN,
    process.env.SITE_ORIGIN,
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.ADMIN_HOST ?? "admin.stamer.co.za",
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  const origins = values
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => parseConfiguredOrigin(value.trim()))
    .filter((value): value is URL => value !== null);

  // The public admin host and the apex site are both valid callback origins.
  for (const origin of [...origins]) {
    if (origin.hostname.toLowerCase().startsWith("admin.")) {
      const apex = new URL(origin);
      apex.hostname = apex.hostname.slice("admin.".length);
      origins.push(apex);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.push(new URL("http://localhost:3000"), new URL("http://127.0.0.1:3000"));
  }
  return origins;
}

function normaliseRequestHost(host: string | null): string | null {
  if (!host || /[\\/@?#\s,]/.test(host)) return null;
  try {
    const url = new URL(`https://${host}`);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}

/** Resolve a request Host only when it matches a configured deployment origin. */
export function trustedRequestOrigin(host: string | null): string | null {
  const requestHost = normaliseRequestHost(host);
  if (!requestHost) return null;

  for (const configured of configuredOrigins()) {
    if (configured.host.toLowerCase() !== requestHost) continue;
    const protocol = LOCAL_HOSTS.has(configured.hostname.toLowerCase()) ? "http:" : "https:";
    return `${protocol}//${configured.host.toLowerCase()}`;
  }
  return null;
}

/** Only accept a local path; reject URL parser backslash normalization tricks. */
export function safeAdminNext(value: string | null): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /%(?:2f|5c)/i.test(value) ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://admin.invalid");
    if (
      parsed.origin !== "https://admin.invalid" ||
      parsed.pathname.startsWith("//") ||
      parsed.pathname.includes("\\")
    ) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/** Map a validated public return path onto the configured admin host shape. */
export function adminCallbackDestination(origin: string, next: string | null): string {
  const base =
    new URL(origin).hostname.toLowerCase() ===
    (process.env.ADMIN_HOST ?? "admin.stamer.co.za").toLowerCase().split(":")[0]
      ? ""
      : "/admin";
  const fallback = base || "/";
  if (!next) return fallback;
  const safeNext = safeAdminNext(next);
  if (!safeNext) return fallback;

  let destination: string;
  if (!base) {
    destination = safeNext.startsWith("/admin/") ? safeNext.slice("/admin".length) : safeNext;
  } else {
    destination = safeNext.startsWith("/admin")
      ? safeNext
      : `${base}${safeNext === "/" ? "" : safeNext}`;
  }

  // Revalidate after host-specific prefix handling: stripping /admin can turn
  // /admin//host into //host, which URL would interpret as another origin.
  return safeAdminNext(destination) ?? fallback;
}
