import { z } from "zod";

import { publicAddressSchema } from "./schemas.js";

/**
 * Credential tags name recorded actions. They are not ratings and not grades.
 * Grey or missing means the check was not recorded. Phase 1 does not publish
 * a compromise heuristic as verified.
 */

export const credentialTagIdSchema = z.enum([
  "new_x_account",
  "long_x_silence",
  "sudden_launch_posts",
  "thin_history",
  "gitcoin_passport",
  "base_builder",
  "build_guild",
  "eth_aligned_contrib",
]);

export type CredentialTagId = z.infer<typeof credentialTagIdSchema>;

export const credentialTagSchema = z
  .object({
    id: credentialTagIdSchema,
    label: z.string(),
    detail: z.string(),
    /** Color when true. Grey when false. False is a signal, not a score of zero. */
    active: z.boolean(),
    rating: z.null(),
  })
  .strict();

export type CredentialTag = z.infer<typeof credentialTagSchema>;

export const walletProofSchema = z
  .object({
    method: z.literal("siws"),
    walletAddress: publicAddressSchema,
    purpose: z.literal("building"),
    signed: z.literal(false),
    verified: z.literal(false),
    pastedMembershipUrl: z.literal("rejected"),
    note: z.string(),
  })
  .strict();

export type WalletProof = z.infer<typeof walletProofSchema>;

export const adminFlagReasonSchema = z.enum([
  "long_inactivity_then_launch_spam",
  "voice_style_shift",
]);

export type AdminFlagReason = z.infer<typeof adminFlagReasonSchema>;

export const adminFlagQueueItemSchema = z
  .object({
    id: z.string(),
    kind: z.literal("x_compromise_heuristic"),
    reason: adminFlagReasonSchema,
    queue: z.literal("admin_review"),
    visibility: z.literal("private"),
    published: z.literal(false),
    verified: z.literal(false),
    autoPublished: z.literal(false),
    detail: z.string(),
  })
  .strict();

export type AdminFlagQueueItem = z.infer<typeof adminFlagQueueItemSchema>;

export const credAssessmentResultSchema = z
  .object({
    aiCalled: z.literal(false),
    gradesPeople: z.literal(false),
    ratings: z.null(),
    category: z.string(),
    tags: z.array(credentialTagSchema).length(8),
    note: z.string(),
  })
  .strict();

export type CredAssessmentResult = z.infer<typeof credAssessmentResultSchema>;

export const membershipSourceSchema = z.enum([
  "gitcoin_passport",
  "build_guild",
  "base_builders",
]);

export type MembershipSource = z.infer<typeof membershipSourceSchema>;

const TAG_COPY: Record<CredentialTagId, { label: string; detail: string }> = {
  new_x_account: {
    label: "New X account",
    detail: "The X account was recorded as new. This is a tag, not a grade.",
  },
  long_x_silence: {
    label: "Long X silence",
    detail: "A long quiet stretch was recorded before this launch.",
  },
  sudden_launch_posts: {
    label: "Sudden launch posts",
    detail: "Launch posting showed up after a quiet stretch.",
  },
  thin_history: {
    label: "Thin history",
    detail: "Little public building history was recorded.",
  },
  gitcoin_passport: {
    label: "Gitcoin Passport",
    detail:
      "Recorded only from a signed wallet via the Passport API. A pasted URL does not count.",
  },
  base_builder: {
    label: "Base builder",
    detail:
      "Recorded only from a signed wallet via the documented Base API. A pasted URL does not count.",
  },
  build_guild: {
    label: "Build Guild",
    detail:
      "Recorded only from a signed wallet via the documented guild API. A pasted URL does not count.",
  },
  eth_aligned_contrib: {
    label: "ETH-aligned contributions",
    detail:
      "GitHub history was recorded as blockchain-aligned work on the founder's own account.",
  },
};

export const CREDENTIAL_TAG_IDS = Object.keys(TAG_COPY) as CredentialTagId[];

export function credentialTags(
  recorded: Partial<Record<CredentialTagId, boolean>> = {},
): CredentialTag[] {
  return CREDENTIAL_TAG_IDS.map((id) =>
    credentialTagSchema.parse({
      id,
      label: TAG_COPY[id].label,
      detail: TAG_COPY[id].detail,
      active: recorded[id] === true,
      rating: null,
    }),
  );
}

export function assessCredentials(input: {
  category: string;
  recorded?: Partial<Record<CredentialTagId, boolean>>;
}): CredAssessmentResult {
  return credAssessmentResultSchema.parse({
    aiCalled: false,
    gradesPeople: false,
    ratings: null,
    category: input.category,
    tags: credentialTags(input.recorded),
    note: "Tags name recorded actions next to the stated category. Phase 1 does not read GitHub or X and does not grade the person. Grey tags were not recorded. Buyers decide.",
  });
}

export function buildWalletProof(walletAddress: string): WalletProof {
  return walletProofSchema.parse({
    method: "siws",
    walletAddress,
    purpose: "building",
    signed: false,
    verified: false,
    pastedMembershipUrl: "rejected",
    note: "Sign-In With Solana only. Phase 1 does not check the signature. Pasted Gitcoin Passport, Build Guild, or Base membership URLs are rejected.",
  });
}

const FLAG_DETAIL: Record<AdminFlagReason, string> = {
  long_inactivity_then_launch_spam:
    "Long inactivity, then launch spam. Held for private admin review. Not published as verified.",
  voice_style_shift:
    "Voice or style shift on X. Held for private admin review. Not published as verified.",
};

export function reviewXHeuristics(input: {
  subjectLabel: string;
  longInactivityThenLaunchSpam: boolean;
  voiceStyleShift: boolean;
}): {
  published: false;
  verified: false;
  items: AdminFlagQueueItem[];
} {
  const reasons: AdminFlagReason[] = [];
  if (input.longInactivityThenLaunchSpam)
    reasons.push("long_inactivity_then_launch_spam");
  if (input.voiceStyleShift) reasons.push("voice_style_shift");
  return {
    published: false,
    verified: false,
    items: reasons.map((reason) =>
      adminFlagQueueItemSchema.parse({
        id: `${input.subjectLabel}:${reason}`,
        kind: "x_compromise_heuristic",
        reason,
        queue: "admin_review",
        visibility: "private",
        published: false,
        verified: false,
        autoPublished: false,
        detail: FLAG_DETAIL[reason],
      }),
    ),
  };
}

export const MEMBERSHIP_ADAPTERS = {
  gitcoin_passport: {
    resolvesFrom: "signed_wallet",
    pastedUrl: "rejected",
    implemented: false,
    note: "TODO(phase-2): call the documented Gitcoin Passport API with the SIWS address. Do not fetch a pasted membership URL.",
  },
  build_guild: {
    resolvesFrom: "signed_wallet",
    pastedUrl: "rejected",
    implemented: false,
    note: "TODO(phase-2): call the documented Build Guild API with the SIWS address. Do not trust a pasted URL.",
  },
  base_builders: {
    resolvesFrom: "signed_wallet",
    pastedUrl: "rejected",
    implemented: false,
    note: "TODO(phase-2): call the documented Base builders API with the SIWS address. Do not trust a pasted URL.",
  },
} as const;
