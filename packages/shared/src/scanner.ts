import { z } from "zod";

import type { LockTier, VerificationStatus } from "./schemas.js";

/**
 * Public scanner contract. Missing checks stay unverified, false, or null.
 * Phase 1 does not invent a pass, and it does not call X, GitHub, or chain RPCs.
 */

export const SCANNER_RATE_LIMIT = {
  enforced: false,
  window: "1 minute",
  suggestedLimit: 60,
  note: "Phase 1 does not meter this fixture. A live read-only deployment should cap anonymous clients at about 60 requests per minute per IP and answer 429 past that. Rate limiting must not fill in missing verifications.",
} as const;

export const triStateSchema = z.union([z.boolean(), z.literal("unverified")]);

export type TriState = z.infer<typeof triStateSchema>;

export const claimFieldSchema = z
  .object({
    id: z.string(),
    statement: z.string(),
    status: z.enum(["submitted", "unchecked", "supported", "unsupported"]),
  })
  .strict();

export type ClaimField = z.infer<typeof claimFieldSchema>;

export const verificationFlagsSchema = z
  .object({
    connected_x: triStateSchema,
    connected_github: triStateSchema,
    id_verified: triStateSchema,
    lp_locked_tier: z.enum(["none", "partial", "full", "unverified"]),
    auto_compound: z.union([z.boolean(), z.literal("unverified"), z.null()]),
    profile_completion: z.number().int().min(0).max(100).nullable(),
    claim_fields: z.array(claimFieldSchema),
  })
  .strict();

export type VerificationFlags = z.infer<typeof verificationFlagsSchema>;

export const scannerTokenPayloadSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    category: z.string(),
    shortDescription: z.string(),
    contract: z.string().nullable(),
    createdAt: z.string().nullable(),
    launchAt: z.string().nullable(),
    /** Phase 1 HTTP rows are fixtures. A caller must set this; it does not default. */
    mock: z.boolean(),
    live: z.literal(false),
    founderOwned: z.literal(true),
    optional: z.literal(true),
    blocksDiy: z.literal(false),
    identityMode: z.enum(["public", "anonymous_verified"]).nullable(),
    socials: z
      .object({
        x: z.string().nullable(),
        github: z.string().nullable(),
        telegram: z.string().nullable(),
        website: z.string().nullable(),
      })
      .strict(),
    verification: verificationFlagsSchema,
  })
  .strict();

export type ScannerTokenPayload = z.infer<typeof scannerTokenPayloadSchema>;

export const scanNotificationSchema = z
  .object({
    status: z.literal("placeholder"),
    enqueued: z.literal(false),
    delivered: z.literal(false),
    webhookCalled: z.literal(false),
    optional: z.literal(true),
    note: z.string(),
  })
  .strict();

export type ScanNotification = z.infer<typeof scanNotificationSchema>;

function triState(value: boolean | null | undefined): TriState {
  if (value === true) return true;
  if (value === false) return false;
  return "unverified";
}

export function verificationFlags(input: {
  connectedX?: boolean | null;
  connectedGithub?: boolean | null;
  verificationStatus?: VerificationStatus | null;
  lockTier?: LockTier | null;
  lockAssessed?: boolean;
  autoCompound?: boolean | null;
  profileCompletion?: number | null;
  claims?: readonly ClaimField[];
}): VerificationFlags {
  const status = input.verificationStatus;
  const idVerified: TriState =
    status === "verified" || status === "anonymous_verified" ? true : "unverified";
  const tier =
    input.lockAssessed === true &&
    (input.lockTier === "none" ||
      input.lockTier === "partial" ||
      input.lockTier === "full")
      ? input.lockTier
      : "unverified";
  const percent = input.profileCompletion;
  return verificationFlagsSchema.parse({
    connected_x: triState(input.connectedX),
    connected_github: triState(input.connectedGithub),
    id_verified: idVerified,
    lp_locked_tier: tier,
    auto_compound:
      input.autoCompound === true || input.autoCompound === false
        ? input.autoCompound
        : input.autoCompound === null
          ? null
          : "unverified",
    profile_completion:
      typeof percent === "number" && percent >= 0 && percent <= 100
        ? Math.round(percent)
        : null,
    claim_fields: (input.claims ?? []).map((claim) => claimFieldSchema.parse(claim)),
  });
}

export function buildScannerToken(input: {
  id: string;
  name: string;
  symbol: string;
  category: string;
  shortDescription: string;
  contract?: string | null;
  createdAt?: string | null;
  launchAt?: string | null;
  mock: boolean;
  identityMode?: "public" | "anonymous_verified" | null;
  socials?: {
    x?: string | null;
    github?: string | null;
    telegram?: string | null;
    website?: string | null;
  };
  flags: Parameters<typeof verificationFlags>[0];
}): ScannerTokenPayload {
  const socials = input.socials ?? {};
  return scannerTokenPayloadSchema.parse({
    id: input.id,
    name: input.name,
    symbol: input.symbol,
    category: input.category,
    shortDescription: input.shortDescription,
    contract: input.contract ?? null,
    createdAt: input.createdAt ?? null,
    launchAt: input.launchAt ?? null,
    mock: input.mock,
    live: false,
    founderOwned: true,
    optional: true,
    blocksDiy: false,
    identityMode: input.identityMode ?? null,
    socials: {
      x: socials.x ?? null,
      github: socials.github ?? null,
      telegram: socials.telegram ?? null,
      website: socials.website ?? null,
    },
    verification: verificationFlags(input.flags),
  });
}

export function placeholderScanNotification(): ScanNotification {
  return scanNotificationSchema.parse({
    status: "placeholder",
    enqueued: false,
    delivered: false,
    webhookCalled: false,
    optional: true,
    note: "Optional auto-scan hook. Phase 1 does not enqueue a job and does not call a webhook. Leaving Token Manager does not depend on this hook.",
  });
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "token",
  "coin",
  "launch",
  "project",
  "that",
  "this",
]);

function significantWords(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (part.length < 3 || STOP_WORDS.has(part)) continue;
    seen.add(part);
  }
  return [...seen];
}

export const originalityCompareSchema = z
  .object({
    searched: z.literal(false),
    verdict: z.enum(["unchecked", "possible_overlap", "no_local_overlap"]),
    unique: z.null(),
    similar: z.array(
      z
        .object({
          name: z.string(),
          sharedWords: z.array(z.string()),
        })
        .strict(),
    ),
    note: z.string(),
  })
  .strict();

export type OriginalityCompare = z.infer<typeof originalityCompareSchema>;

/**
 * Local overlap helper. An empty corpus stays unchecked.
 * `unique` stays null: this is not a search and not an originality certificate.
 */
export function compareOriginality(input: {
  name: string;
  statement: string;
  corpus?: readonly { name: string; summary: string }[];
}): OriginalityCompare {
  const corpus = input.corpus ?? [];
  if (corpus.length === 0) {
    return originalityCompareSchema.parse({
      searched: false,
      verdict: "unchecked",
      unique: null,
      similar: [],
      note: "No projects were supplied. This tool does not search GitHub, X, or the web, and it does not call the name unique.",
    });
  }
  const mine = new Set(significantWords(`${input.name} ${input.statement}`));
  const similar = corpus.flatMap((item) => {
    const shared = significantWords(`${item.name} ${item.summary}`).filter((word) =>
      mine.has(word),
    );
    const sameName = item.name.trim().toLowerCase() === input.name.trim().toLowerCase();
    if (!sameName && shared.length < 2) return [];
    return [{ name: item.name, sharedWords: shared }];
  });
  return originalityCompareSchema.parse({
    searched: false,
    verdict: similar.length > 0 ? "possible_overlap" : "no_local_overlap",
    unique: null,
    similar,
    note:
      similar.length > 0
        ? "Local text overlap only. Contract checks are easy; copycat and claim risk is harder. This is not a LARP verdict."
        : "No local overlap on the list you passed. That is not a web search and not a uniqueness certificate.",
  });
}

export function coachOriginality(input: { name: string; useCase: string }): {
  blocksDiy: false;
  lines: string[];
} {
  return {
    blocksDiy: false,
    lines: [
      `${input.name} can launch without this coach. Guidance does not block a do-it-yourself path.`,
      `Use case on record: ${input.useCase}`,
      "Contract checks are the easy part for a LARP-style scanner. Claims and copycat risk are the hard part.",
      "Say what the product does in words that fit this use case. Do not reuse another project's promise.",
      "Point at a GitHub repo the founder owns. Token Manager does not host that repo and is not the source of truth.",
      "A scanner scores the claim higher when the evidence is specific and the status stays unchecked until something supports it.",
    ],
  };
}

const PLATFORM_GITHUB_LOGINS = new Set(["token-manager", "tokenmanager"]);

export function planFounderGithubRepo(input: {
  founderLogin: string;
  repoName: string;
  action: "create" | "manage";
}): {
  owner: string | null;
  repo: string;
  action: "create" | "manage";
  sourceOfTruth: "founder";
  platformOrg: null;
  created: false;
  acceptable: boolean;
  oauthTarget: "founder_github_account";
  note: string;
} {
  const login = input.founderLogin.trim();
  const forbidden = PLATFORM_GITHUB_LOGINS.has(login.toLowerCase());
  return {
    owner: forbidden ? null : login,
    repo: input.repoName,
    action: input.action,
    sourceOfTruth: "founder",
    platformOrg: null,
    created: false,
    acceptable: !forbidden,
    oauthTarget: "founder_github_account",
    note: forbidden
      ? "That login is not a founder account. Repos stay on the founder's GitHub. Token Manager is not the source of truth."
      : "OAuth, when it exists, targets the founder's GitHub account. Phase 1 does not redirect and does not create the repo.",
  };
}

export const SCANNER_OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "Token Manager Scanner API",
    version: "0.1.0",
    description:
      "Read-only sketch for scanner authors (LARP check, Reagent, Crawl Scan, and later tools). Phase 1 serves mock directory rows. live is false. Missing checks are false, null, or unverified. The API does not fabricate a pass and does not require Token Manager to keep the project working.",
  },
  paths: {
    "/api/scanner/tokens": {
      get: {
        summary: "List fixture tokens",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description:
              "Fixture list. mock is true. rateLimit.enforced is false in Phase 1. See SCANNER_RATE_LIMIT.",
          },
        },
      },
    },
    "/api/scanner/tokens/{id}": {
      get: {
        summary: "One fixture token and its verification flags",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description:
              "ScannerTokenPayload. verification uses VerificationFlags. Absent steps are false, null, or unverified.",
          },
          "404": {
            description:
              "Unknown id. Body has verification: null. No flags are invented.",
          },
        },
      },
    },
    "/api/scanner/openapi": {
      get: {
        summary: "This document",
        responses: { "200": { description: "OpenAPI 3.1 JSON sketch." } },
      },
    },
  },
} as const;
