import { z } from "zod";

import { METEORA_COMPOUNDING_FEE_BPS } from "./principles.js";
import { JOURNEY_STAGES } from "./stages.js";

/**
 * Public address only. Solana public keys are 32 bytes (~32–44 base58 chars).
 * Secret keys are longer. This schema rejects those lengths.
 */
export const publicAddressSchema = z
  .string()
  .regex(
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    "Expected a Solana public address. Private keys are not accepted.",
  );

export const journeyStageSchema = z.enum(JOURNEY_STAGES);

export const socialLinksSchema = z
  .object({
    website: z.string().url().optional(),
    x: z.string().min(1).max(100).optional(),
    xCommunity: z.string().url().optional(),
    telegram: z.string().url().optional(),
    discord: z.string().url().optional(),
    github: z.string().url().optional(),
  })
  .strict();

export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const quoteSymbolSchema = z.enum(["SOL", "USDC"]);

export const tokenDesignSchema = z
  .object({
    launchStyle: z.literal("bonding_curve"),
    name: z.string().min(1).max(32),
    symbol: z
      .string()
      .min(1)
      .max(10)
      .regex(/^[A-Za-z0-9]+$/),
    description: z.string().min(1).max(400),
    category: z.string().min(1).max(40),
    /** Whole tokens, not base units. Stays inside safe integer math for the dev-buy quote. */
    supplyUi: z.number().positive().max(1e15),
    decimals: z.number().int().min(0).max(9),
    devBuySupplyBps: z.number().int().min(0).max(10_000),
    launchAt: z.string().datetime(),
    dumpHonestyAcknowledged: z.literal(true),
    snipersCommonAcknowledged: z.literal(true),
    socials: socialLinksSchema,
    imageUri: z.string().url().optional(),
    quoteSymbol: quoteSymbolSchema.default("SOL"),
  })
  .strict();

export type TokenDesign = z.infer<typeof tokenDesignSchema>;

export const lockKindSchema = z.enum(["meteora_damm_v2_lp", "team_vest_cliff_stream"]);

export const lockProofSchema = z
  .object({
    kind: lockKindSchema,
    /** Public position, stream, or token address. Never a secret. */
    subject: publicAddressSchema,
    supplyBps: z.number().int().min(0).max(10_000).optional(),
    cliffSeconds: z.number().int().min(0).optional(),
    streamSeconds: z.number().int().min(0).optional(),
    /**
     * Meteora DAMM v2 only. 10000 means 100% of LP fees auto-compound into quote token B.
     */
    compoundingFeeBps: z.literal(METEORA_COMPOUNDING_FEE_BPS).optional(),
    locker: z.string().min(1).max(80),
    proofUri: z.string().url().optional(),
    lockedAt: z.string().datetime().optional(),
    unlockAt: z.string().datetime().optional(),
    recipientLabel: z.string().min(1).max(80).optional(),
    quoteSymbol: quoteSymbolSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.kind === "meteora_damm_v2_lp" &&
      value.compoundingFeeBps !== METEORA_COMPOUNDING_FEE_BPS
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compoundingFeeBps"],
        message: "Meteora DAMM v2 locks use compounding_fee_bps = 10000",
      });
    }
    if (value.kind === "team_vest_cliff_stream") {
      if (value.cliffSeconds === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cliffSeconds"],
          message: "Team locks include a cliff",
        });
      }
      if (value.streamSeconds === undefined || value.streamSeconds < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["streamSeconds"],
          message: "Team locks include a stream",
        });
      }
      if (value.supplyBps === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supplyBps"],
          message: "Team locks name the share of supply",
        });
      }
    }
  });

export type LockProof = z.infer<typeof lockProofSchema>;

export const verificationStatusSchema = z.enum([
  "unverified",
  "pending",
  "verified",
  "anonymous_verified",
]);

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const identityModeSchema = z.enum(["public", "anonymous_verified"]);

export const claimStatusSchema = z.enum([
  "submitted",
  "unchecked",
  "supported",
  "unsupported",
]);

export const claimProofSchema = z
  .object({
    id: z.string().min(1).max(80),
    statement: z.string().min(1).max(500),
    evidenceUri: z.string().url(),
    aiCheckable: z.literal(true),
    status: claimStatusSchema,
  })
  .strict();

export type ClaimProof = z.infer<typeof claimProofSchema>;

export const identityScoreSchema = z
  .object({
    mode: identityModeSchema,
    /** 0–100 from a published formula. A method breakdown, not a rank badge. */
    total: z.number().int().min(0).max(100),
    breakdown: z
      .object({
        x: z.number().int().min(0).max(25),
        claims: z.number().int().min(0).max(40),
        externalId: z.number().int().min(0).max(20),
        methodsPublished: z.number().int().min(0).max(15),
      })
      .strict(),
    xHandle: z.string().min(1).max(50).optional(),
    xPremium: z.boolean().optional(),
    claimProofs: z.array(claimProofSchema).max(20),
    /** Provider name only. API keys are not part of this object. */
    externalIdProvider: z.string().min(1).max(80).optional(),
    methods: z.array(z.string().min(1).max(200)).min(1),
  })
  .strict();

export type IdentityScore = z.infer<typeof identityScoreSchema>;

export const creationEventSchema = z
  .object({
    id: z.string().min(1).max(80),
    createdAt: z.string().datetime(),
    name: z.string().min(1).max(32),
    symbol: z.string().min(1).max(10),
    category: z.string().min(1).max(40),
    shortDescription: z.string().min(1).max(280),
    socials: socialLinksSchema,
    contract: publicAddressSchema,
    locks: z.array(lockProofSchema),
    verification: z
      .object({
        status: verificationStatusSchema,
        methods: z.array(z.string().min(1).max(160)).max(20),
      })
      .strict(),
    identity: identityScoreSchema.optional(),
    stage: journeyStageSchema,
    launchAt: z.string().datetime(),
    dumpHonestyAcknowledged: z.literal(true),
    launchStyle: z.literal("bonding_curve"),
  })
  .strict();

export type CreationEvent = z.infer<typeof creationEventSchema>;

export const acknowledgementsSchema = z
  .object({
    fairLaunchTimeNamed: z.boolean(),
    dumpAfterGraduationTypical: z.boolean(),
    snipersAndBundlersCommon: z.boolean(),
    devBuyForLiquidityNotASnipe: z.boolean(),
    noBuybackBurnAsStrategy: z.boolean(),
  })
  .strict();

export type Acknowledgements = z.infer<typeof acknowledgementsSchema>;

export const sensitiveActionSchema = z.enum([
  "add_admin",
  "remove_admin",
  "large_liquidity",
  "x_api_credentials",
]);

export type SensitiveAction = z.infer<typeof sensitiveActionSchema>;

export const guardianMethodSchema = z.enum(["wallet", "passkey", "totp"]);

/**
 * A guardian factor. Wallet addresses and passkey credential ids are public.
 * TOTP is an enrolled flag. The schema has no field for a TOTP secret.
 */
export const guardianFactorSchema = z
  .object({
    kind: guardianMethodSchema,
    walletAddress: publicAddressSchema.optional(),
    passkeyCredentialId: z.string().min(1).max(200).optional(),
    totpEnrolled: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.kind === "wallet" && !value.walletAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["walletAddress"],
        message: "A guardian wallet needs a public address",
      });
    }
    if (value.kind === "passkey" && !value.passkeyCredentialId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passkeyCredentialId"],
        message: "A passkey factor needs a public credential id",
      });
    }
    if (value.kind === "totp" && value.totpEnrolled !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totpEnrolled"],
        message: "TOTP is recorded as enrolled or absent. Do not send the secret.",
      });
    }
  });

export type GuardianFactor = z.infer<typeof guardianFactorSchema>;

export const guardianPolicySchema = z
  .object({
    projectId: z.string().min(1).max(80),
    requiredFor: z.array(sensitiveActionSchema).min(1),
    factors: z.array(guardianFactorSchema).min(1),
    threshold: z.number().int().min(1),
    /** Quote-token size above which an add-liquidity op counts as large. */
    largeLiquidityQuoteUi: z.number().positive().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.threshold > value.factors.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["threshold"],
        message: "Threshold cannot exceed the number of guardian factors",
      });
    }
  });

export type GuardianPolicy = z.infer<typeof guardianPolicySchema>;

export const coAdminSchema = z
  .object({
    walletAddress: publicAddressSchema,
    addedBy: publicAddressSchema,
    addedAt: z.string().datetime(),
    label: z.string().min(1).max(80).optional(),
  })
  .strict();

export type CoAdmin = z.infer<typeof coAdminSchema>;

/**
 * Sign-In With Solana session shape. Phase 1 previews set authenticated to false.
 * This object is not a credential and must not carry a signature secret.
 */
export const adminSessionSchema = z
  .object({
    projectId: z.string().min(1).max(80),
    walletAddress: publicAddressSchema,
    role: z.enum(["root", "co_admin"]),
    method: z.literal("sign_in_with_solana"),
    authenticated: z.boolean(),
    rootWallet: publicAddressSchema,
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    note: z.string().min(1).max(400),
  })
  .strict();

export type AdminSession = z.infer<typeof adminSessionSchema>;

export const badgeIdSchema = z.enum([
  "locked_liquidity",
  "auto_compounding",
  "github",
  "x",
  "telegram",
  "team_lock",
]);

export type BadgeId = z.infer<typeof badgeIdSchema>;

export const lockTierSchema = z.enum(["none", "partial", "full"]);

export type LockTier = z.infer<typeof lockTierSchema>;

/**
 * Factual status label. `active: false` is the grey state.
 * These are checks, not rank badges.
 */
export const badgeDefinitionSchema = z
  .object({
    id: badgeIdSchema,
    label: z.string().min(1).max(80),
    active: z.boolean(),
    tier: lockTierSchema.optional(),
    detail: z.string().min(1).max(240),
  })
  .strict();

export type BadgeDefinition = z.infer<typeof badgeDefinitionSchema>;

export const profileSignalsSchema = z
  .object({
    hasListingMeta: z.boolean(),
    launchTimeNamed: z.boolean(),
    dumpHonestyAcknowledged: z.boolean(),
    hasX: z.boolean(),
    hasTelegram: z.boolean(),
    hasGithub: z.boolean(),
    devBuyNearRule: z.boolean(),
    liquidityLocked: z.boolean(),
    autoCompounding: z.boolean(),
    teamLockPublished: z.boolean(),
  })
  .strict();

export type ProfileSignals = z.infer<typeof profileSignalsSchema>;

export const profileCompletionScoreSchema = z
  .object({
    percent: z.number().int().min(0).max(100),
    completed: z.array(z.string().min(1)),
    missing: z.array(z.string().min(1)),
    benefit: z.string().min(1),
  })
  .strict();

export type ProfileCompletionScore = z.infer<typeof profileCompletionScoreSchema>;

export const priceSourceSchema = z.enum(["codex", "onchain"]);

export type PriceSource = z.infer<typeof priceSourceSchema>;

/**
 * Pool terms for a Meteora DAMM v2 create/lock. compoundingFeeBps is fixed at 10000.
 * priceUi is optional because Phase 1 price clients are stubs.
 */
export const meteoraPoolConfigSchema = z
  .object({
    contract: publicAddressSchema,
    quoteSymbol: quoteSymbolSchema,
    priceSource: priceSourceSchema,
    priceUi: z.number().positive().optional(),
    compoundingFeeBps: z.literal(METEORA_COMPOUNDING_FEE_BPS),
    lpSupplyBps: z.number().int().min(0).max(10_000).default(500),
    locked: z.boolean().default(true),
  })
  .strict();

export type MeteoraPoolConfig = z.infer<typeof meteoraPoolConfigSchema>;

export const progressStateSchema = z
  .object({
    version: z.literal(1),
    sessionId: z.string().min(1).max(80),
    projectSlug: z.string().min(1).max(80).nullable(),
    currentStage: journeyStageSchema,
    completedStages: z.array(journeyStageSchema),
    acknowledgements: acknowledgementsSchema,
    updatedAt: z.string().datetime(),
    creationEvent: creationEventSchema.nullable(),
    lockProofs: z.array(lockProofSchema),
    claims: z.array(claimProofSchema),
    notes: z.array(z.string().max(500)).max(100),
    creatorWallet: publicAddressSchema.nullable(),
    coAdmins: z.array(coAdminSchema),
    guardianPolicy: guardianPolicySchema.nullable(),
  })
  .strict();

export type ProgressState = z.infer<typeof progressStateSchema>;

export function emptyAcknowledgements(): Acknowledgements {
  return {
    fairLaunchTimeNamed: false,
    dumpAfterGraduationTypical: false,
    snipersAndBundlersCommon: false,
    devBuyForLiquidityNotASnipe: false,
    noBuybackBurnAsStrategy: false,
  };
}

export function createProgressState(sessionId: string): ProgressState {
  return {
    version: 1,
    sessionId,
    projectSlug: null,
    currentStage: "prep_weeks_out",
    completedStages: [],
    acknowledgements: emptyAcknowledgements(),
    updatedAt: new Date().toISOString(),
    creationEvent: null,
    lockProofs: [],
    claims: [],
    notes: [],
    creatorWallet: null,
    coAdmins: [],
    guardianPolicy: null,
  };
}
