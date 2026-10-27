import {
  DOMAIN_AVAILABILITY_GAP,
  domainAvailabilitySchema,
  offlineAvailability,
  type DomainAvailability,
} from "../naming.js";

export interface CloudflareEnv {
  token?: string;
  accountId?: string;
}

const WHOIS_ORIGIN = "https://api.cloudflare.com/client/v4/accounts";

/** Read the optional Cloudflare hint from the process environment. Never from tool args. */
export function readCloudflareEnv(
  env: Record<string, string | undefined> = process.env,
): CloudflareEnv {
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  return {
    ...(token ? { token } : {}),
    ...(accountId ? { accountId } : {}),
  };
}

export function cloudflareEnvConfigured(
  env: CloudflareEnv = readCloudflareEnv(),
): boolean {
  return Boolean(env.token && env.accountId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** A WHOIS result object means the name looks registered. Anything else is inconclusive. */
export function interpretWhoisLookup(
  hostname: string,
  status: number,
  body: unknown,
): DomainAvailability {
  if (status === 401 || status === 403) {
    return domainAvailabilitySchema.parse({
      checked: false,
      available: null,
      hostname,
      source: "cloudflare",
      livePurchase: false,
      registrar: "cloudflare",
      gap: "Cloudflare rejected the credentials. The token was not stored and no domain was purchased.",
    });
  }
  const result = isRecord(body) ? body.result : undefined;
  const registered =
    isRecord(result) &&
    (typeof result.domain === "string" ||
      typeof result.registrar === "string" ||
      typeof result.created_date === "string");
  if (status >= 200 && status < 300 && registered) {
    return domainAvailabilitySchema.parse({
      checked: true,
      available: false,
      hostname,
      source: "cloudflare",
      livePurchase: false,
      registrar: "cloudflare",
      gap: "Cloudflare Intel WHOIS returned a record, so this .com looks registered. Confirm in the Registrar search before you pay. Nothing was purchased.",
    });
  }
  const failed = isRecord(body) && body.success === false;
  if (status === 404 || failed) {
    return domainAvailabilitySchema.parse({
      checked: true,
      available: null,
      hostname,
      source: "cloudflare",
      livePurchase: false,
      registrar: "cloudflare",
      gap: "Cloudflare Intel WHOIS did not return a registration record. That is a hint, not proof the .com can be registered. Buy it yourself in the dashboard if you want it. Nothing was purchased.",
    });
  }
  return domainAvailabilitySchema.parse({
    checked: false,
    available: null,
    hostname,
    source: "cloudflare",
    livePurchase: false,
    registrar: "cloudflare",
    gap: "The Cloudflare response was not a clear WHOIS result. No purchase was attempted.",
  });
}

/**
 * Optional .com hint. Offline unless both env vars are set.
 * Calls GET /accounts/{account_id}/intel/whois?domain= — not the Registrar purchase API.
 */
export async function lookupComAvailability(
  label: string,
  options: {
    env?: CloudflareEnv;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<DomainAvailability> {
  const trimmed = label.trim();
  const lettersOnly = /^[A-Za-z]+$/.test(trimmed);
  if (!lettersOnly) {
    return offlineAvailability(
      null,
      "The label must be letters only before an availability check.",
    );
  }
  const hostname = `${trimmed.toLowerCase()}.com`;
  const env = options.env ?? readCloudflareEnv();
  if (!env.token || !env.accountId) {
    return offlineAvailability(hostname, DOMAIN_AVAILABILITY_GAP);
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${WHOIS_ORIGIN}/${encodeURIComponent(env.accountId)}/intel/whois?domain=${encodeURIComponent(hostname)}`;
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    const body: unknown = await response.json().catch(() => null);
    return interpretWhoisLookup(hostname, response.status, body);
  } catch {
    return domainAvailabilitySchema.parse({
      checked: false,
      available: null,
      hostname,
      source: "cloudflare",
      livePurchase: false,
      registrar: "cloudflare",
      gap: "The Cloudflare request failed. No purchase was attempted and the token was not stored.",
    });
  }
}
