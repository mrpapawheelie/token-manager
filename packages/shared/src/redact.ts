const SECRET_KEY = /(secret|mnemonic|password|private|api[_-]?key|seed|passwd)/i;

const BASE58_SECRET = /^[1-9A-HJ-NP-Za-km-z]{80,}$/;
const HEX_SECRET = /^(0x)?[0-9a-fA-F]{64,}$/;
const WORDLIST_SECRET = /^[a-z]+(?: [a-z]+){11,23}$/;

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/-/g, "_");
  if (normalized === "token" || normalized === "seed" || normalized === "key")
    return true;
  return SECRET_KEY.test(normalized);
}

function redactString(value: string): string {
  const trimmed = value.trim();
  if (
    BASE58_SECRET.test(trimmed) ||
    HEX_SECRET.test(trimmed) ||
    WORDLIST_SECRET.test(trimmed)
  ) {
    return "[redacted]";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      let changed = false;
      for (const key of [...url.searchParams.keys()]) {
        if (/(key|token|secret|password|sig)/i.test(key)) {
          url.searchParams.set(key, "[redacted]");
          changed = true;
        }
      }
      if (changed) return url.toString();
    } catch {
      return "[redacted]";
    }
  }
  return value;
}

function isByteArray(value: unknown[]): boolean {
  return (
    value.length >= 64 &&
    value.every(
      (item) =>
        Number.isInteger(item) && (item as number) >= 0 && (item as number) <= 255,
    )
  );
}

/**
 * Walk a JSON-like value and strip secret-shaped fields before they are
 * echoed, stored, or logged. Public addresses (32–44 base58 chars) are kept.
 */
export function redactSecrets<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) {
    if (isByteArray(value)) return "[redacted]";
    return value.map((item) => walk(item));
  }
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = isSecretKey(key) ? "[redacted]" : walk(entry);
  }
  return output;
}
