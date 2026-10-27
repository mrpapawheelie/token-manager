import { z } from "zod";

/**
 * Optional KYC. Tier 0 is none. Higher tiers are chosen by the founder.
 * Phase 1 does not call a venue, a vendor, or Privy, and it does not attest.
 */

export const kycTierSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export type KycTier = z.infer<typeof kycTierSchema>;

export const kycBadgeSchema = z
  .object({
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    label: z.string(),
    detail: z.string(),
    optional: z.literal(true),
    stackable: z.literal(true),
    /** Local mark that the founder says this tier was finished. Not a vendor pass. */
    recorded: z.boolean(),
    vendorAttested: z.literal(false),
    /** Color only for a local tier 2 or 3 mark. Tier 1 stays grey. Attestation is never implied. */
    active: z.boolean(),
  })
  .strict();

export type KycBadge = z.infer<typeof kycBadgeSchema>;

export const emailProofStatusSchema = z.enum([
  "unproven",
  "matched",
  "mismatch_needs_magic_link",
]);

export type EmailProofStatus = z.infer<typeof emailProofStatusSchema>;

export const emailProofSchema = z
  .object({
    status: emailProofStatusSchema,
    registrationEmail: z.string().nullable(),
    oauthEmail: z.string().nullable(),
    oauthProvider: z.string().nullable(),
    magicLinkRequired: z.boolean(),
    magicLinkSent: z.literal(false),
    oauthIsIdentityProof: z.boolean(),
  })
  .strict();

export type EmailProof = z.infer<typeof emailProofSchema>;

export const privySessionStubSchema = z
  .object({
    provider: z.literal("privy"),
    plan: z.literal("free"),
    freePlanFirst: z.literal(true),
    authenticated: z.literal(false),
    google: z.literal(false),
    walletConnected: z.literal(false),
    alongside: z.literal("siws"),
    note: z.string(),
  })
  .strict();

export type PrivySessionStub = z.infer<typeof privySessionStubSchema>;

export const KYC_TIERS = [
  {
    tier: 0 as const,
    name: "None",
    cost: "free",
    optional: true,
    summary: "No KYC. The launch does not require it.",
  },
  {
    tier: 1 as const,
    name: "Light",
    cost: "free-ish",
    optional: true,
    summary:
      "OAuth to an already-KYC'd venue such as Coinbase, only if that product's API can attest the account. Phase 1 does not call the API and does not attest.",
  },
  {
    tier: 2 as const,
    name: "Paid ID",
    cost: "paid",
    optional: true,
    summary: "A KYC vendor ID upload. The flow is a stub. No document is stored.",
  },
  {
    tier: 3 as const,
    name: "Paid interview",
    cost: "higher-paid",
    optional: true,
    summary: "ID plus a short video interview. The flow is a stub. No video is stored.",
  },
] as const;

const BADGE_COPY: Record<1 | 2 | 3, { label: string; detail: string }> = {
  1: {
    label: "KYC tier 1",
    detail:
      "Would mean a venue API attested an already-KYC'd account. Phase 1 leaves this grey and does not attest.",
  },
  2: {
    label: "KYC tier 2",
    detail:
      "ID upload was marked locally. The vendor flow did not run and nothing was attested.",
  },
  3: {
    label: "KYC tier 3",
    detail:
      "ID and a short video interview were marked locally. The vendor flow did not run and nothing was attested.",
  },
};

export function kycBadges(
  recorded: Partial<Record<1 | 2 | 3, boolean>> = {},
): KycBadge[] {
  return ([1, 2, 3] as const).map((tier) => {
    const asked = recorded[tier] === true;
    const active = tier === 1 ? false : asked;
    return kycBadgeSchema.parse({
      tier,
      label: BADGE_COPY[tier].label,
      detail: BADGE_COPY[tier].detail,
      optional: true,
      stackable: true,
      recorded: tier === 1 ? false : asked,
      vendorAttested: false,
      active,
    });
  });
}

export function tier1AttestationStub(venue: string): {
  venue: string;
  tier: 1;
  optional: true;
  apiCapability: "unverified";
  attested: false;
  note: string;
} {
  return {
    venue,
    tier: 1,
    optional: true,
    apiCapability: "unverified",
    attested: false,
    note: `Confirm whether ${venue}'s product API can attest account KYC before using it. Phase 1 does not call that API and will not invent an attestation.`,
  };
}

function normalizeEmail(value: string | undefined): string | null {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function reviewEmailProof(input: {
  registrationEmail?: string;
  oauthEmail?: string;
  oauthProvider?: string;
}): EmailProof {
  const registrationEmail = normalizeEmail(input.registrationEmail);
  const oauthEmail = normalizeEmail(input.oauthEmail);
  let status: EmailProofStatus = "unproven";
  if (registrationEmail && oauthEmail) {
    status = registrationEmail === oauthEmail ? "matched" : "mismatch_needs_magic_link";
  }
  return emailProofSchema.parse({
    status,
    registrationEmail,
    oauthEmail,
    oauthProvider: input.oauthProvider ?? null,
    magicLinkRequired: status === "mismatch_needs_magic_link",
    magicLinkSent: false,
    oauthIsIdentityProof: status === "matched",
  });
}

export function privySessionStub(): PrivySessionStub {
  return privySessionStubSchema.parse({
    provider: "privy",
    plan: "free",
    freePlanFirst: true,
    authenticated: false,
    google: false,
    walletConnected: false,
    alongside: "siws",
    note: "Use Privy for Google or other social login and for wallet connect. Start on the free plan. This stub sits beside Sign-In With Solana for the creator admin. Phase 1 does not open a Privy session.",
  });
}
