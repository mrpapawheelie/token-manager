import { z } from "zod";

import type { ToolName } from "./catalog.js";
import { CAVEMAN_TOPICS } from "./copy.js";
import {
  acknowledgementsSchema,
  claimProofSchema,
  coAdminSchema,
  creationEventSchema,
  guardianPolicySchema,
  journeyStageSchema,
  lockProofSchema,
  meteoraPoolConfigSchema,
  profileSignalsSchema,
  publicAddressSchema,
  quoteSymbolSchema,
  socialLinksSchema,
  tokenDesignSchema,
} from "./schemas.js";

const sessionIdSchema = z.string().min(1).max(80).optional();

const confirmFields = {
  confirm: z.literal(true),
  cluster: z.enum(["devnet", "mainnet-beta"]),
};

const guardianFields = {
  guardianAcknowledged: z.literal(true),
  guardianMethod: z.enum(["wallet", "passkey", "totp"]),
};

const providerSchema = z.enum(["x", "github", "discord", "google"]);

const uncheckedClaimSchema = claimProofSchema
  .extend({
    status: z.literal("unchecked"),
  })
  .strict();

export const emptyInputSchema = z.object({}).strict();

export const getProgressInputSchema = z.object({ sessionId: sessionIdSchema }).strict();

export const resumeInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    projectSlug: z.string().min(1).max(80).optional(),
    stage: journeyStageSchema.optional(),
    markCurrentComplete: z.boolean().optional(),
    acknowledgements: acknowledgementsSchema.partial().optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const prepXChecklistInputSchema = z
  .object({
    hasPremium: z.boolean(),
    communityUrl: z.string().url().optional(),
    amaIso: z.string().datetime().optional(),
    devApiAppCreated: z.boolean(),
  })
  .strict();

export const prepXScheduleInputSchema = z
  .object({ launchAt: z.string().datetime() })
  .strict();

export const socialTelegramInputSchema = z
  .object({
    channelOrGroupUrl: z.string().url().optional(),
    purpose: z.enum(["announcements", "chat", "both"]),
  })
  .strict();

export const socialXCommunityInputSchema = z
  .object({
    communityName: z.string().min(1).max(80),
    launchAt: z.string().datetime(),
  })
  .strict();

export const cavemanExplainInputSchema = z
  .object({ topic: z.enum(CAVEMAN_TOPICS) })
  .strict();

export const setupEnvironmentInputSchema = z
  .object({
    cluster: z.enum(["devnet", "mainnet-beta"]),
    rpcUrl: z.string().url().optional(),
    walletAddress: publicAddressSchema.optional(),
    codexActivationPaid: z.boolean().optional(),
  })
  .strict();

export const setupCodexInputSchema = z
  .object({
    activationPaid: z.boolean(),
    tier: z.enum(["almost_free", "other"]).default("almost_free"),
  })
  .strict();

export const badgePreviewInputSchema = z
  .object({
    signals: profileSignalsSchema,
    lockTier: z.enum(["none", "partial", "full"]),
  })
  .strict();

export const devBuyInputSchema = z
  .object({
    supplyUi: z.number().positive().max(1e15),
    devBuySupplyBps: z.number().int().min(0).max(10_000).default(500),
  })
  .strict();

export const announcementInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    symbol: z.string().min(1).max(10),
    launchAt: z.string().datetime(),
    devBuySupplyBps: z.number().int().min(0).max(10_000),
    supplyUi: z.number().positive().max(1e15),
    socials: socialLinksSchema,
  })
  .strict();

export const launchSubmitInputSchema = z
  .object({
    ...confirmFields,
    design: tokenDesignSchema,
  })
  .strict();

export const directoryLogInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    event: creationEventSchema,
  })
  .strict();

export const graduateChecklistInputSchema = z
  .object({
    contract: publicAddressSchema,
    devBuySupplyBps: z.number().int().min(0).max(10_000),
    dumpHonestyAcknowledged: z.literal(true),
  })
  .strict();

export const graduateSubmitInputSchema = z
  .object({
    ...confirmFields,
    contract: publicAddressSchema,
  })
  .strict();

export const meteoraPreviewInputSchema = z
  .object({
    contract: publicAddressSchema,
    quoteSymbol: quoteSymbolSchema,
    priceSource: z.enum(["codex", "onchain"]),
    lpSupplyBps: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();

export const meteoraQuoteInputSchema = z
  .object({
    contract: publicAddressSchema,
    quoteSymbol: quoteSymbolSchema,
    priceSource: z.enum(["codex", "onchain"]),
  })
  .strict();

export const meteoraCreateInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    config: meteoraPoolConfigSchema,
  })
  .strict();

export const meteoraAddInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    contract: publicAddressSchema,
    quoteSymbol: quoteSymbolSchema,
    quoteUi: z.number().positive(),
  })
  .strict();

export const meteoraLockInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    contract: publicAddressSchema,
    quoteSymbol: quoteSymbolSchema,
  })
  .strict();

export const meteoraReinvestInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    contract: publicAddressSchema,
  })
  .strict();

export const vestPlanInputSchema = z
  .object({
    extraSupplyBps: z.number().int().min(1).max(10_000),
    cliffDays: z.number().int().min(0).max(3650),
    streamDays: z.number().int().min(1).max(3650),
    recipientLabel: z.string().min(1).max(80),
  })
  .strict();

export const vestLockInputSchema = z
  .object({
    ...confirmFields,
    extraSupplyBps: z.number().int().min(1).max(10_000),
    cliffDays: z.number().int().min(0).max(3650),
    streamDays: z.number().int().min(1).max(3650),
    recipientLabel: z.string().min(1).max(80),
  })
  .strict();

export const sitePreviewInputSchema = z
  .object({
    projectSlug: z.string().min(1).max(80),
    includeLockProofs: z.boolean(),
    includeIdentity: z.boolean(),
  })
  .strict();

export const sitePublishInputSchema = z
  .object({
    projectSlug: z.string().min(1).max(80),
    proofUris: z.array(z.string().url()).max(20),
  })
  .strict();

export const oauthBeginInputSchema = z
  .object({
    provider: providerSchema,
    redirectNote: z.string().max(200).optional(),
  })
  .strict();

export const oauthStatusInputSchema = z
  .object({
    provider: providerSchema,
    accountLabel: z.string().min(1).max(80),
  })
  .strict();

export const verifyAccountsInputSchema = z
  .object({
    contract: publicAddressSchema,
    providers: z.array(providerSchema).min(1),
    mode: z.enum(["public", "anonymous_verified"]),
  })
  .strict();

export const verifyContractInputSchema = z
  .object({
    contract: publicAddressSchema,
    accountLabel: z.string().min(1).max(80),
    provider: providerSchema,
  })
  .strict();

export const identityScoreInputSchema = z
  .object({
    mode: z.enum(["public", "anonymous_verified"]),
    xHandle: z.string().min(1).max(50).optional(),
    xPremium: z.boolean().optional(),
    claimProofs: z.array(claimProofSchema).max(20).default([]),
    externalIdProvider: z.string().min(1).max(80).optional(),
    methods: z.array(z.string().min(1).max(200)).min(1).optional(),
  })
  .strict();

export const identityClaimInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    claim: uncheckedClaimSchema,
  })
  .strict();

export const adminPreviewInputSchema = z
  .object({
    projectId: z.string().min(1).max(80),
    walletAddress: publicAddressSchema,
    creatorWallet: publicAddressSchema,
    coAdmins: z.array(coAdminSchema).default([]),
  })
  .strict();

export const sessionOnlyInputSchema = z.object({ sessionId: sessionIdSchema }).strict();

export const adminAddInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    projectId: z.string().min(1).max(80),
    walletAddress: publicAddressSchema,
    label: z.string().min(1).max(80).optional(),
  })
  .strict();

export const adminRemoveInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    walletAddress: publicAddressSchema,
  })
  .strict();

export const adminCredentialsInputSchema = z
  .object({
    ...confirmFields,
    ...guardianFields,
    changeLabel: z.string().min(1).max(80),
  })
  .strict();

export const adminPolicyInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    policy: guardianPolicySchema,
  })
  .strict();

export const aiChatInputSchema = z
  .object({
    projectId: z.string().min(1).max(80),
    message: z.string().min(1).max(500),
  })
  .strict();

export const amaInputSchema = z
  .object({
    launchAt: z.string().datetime(),
    amaAt: z.string().datetime(),
    hostHandle: z.string().min(1).max(50),
  })
  .strict();

export const boostInputSchema = z
  .object({
    ...confirmFields,
    objective: z.enum(["ama", "launch_post", "community"]),
    budgetNote: z.string().min(1).max(200),
  })
  .strict();

export const devApiInputSchema = z
  .object({
    appCreated: z.boolean(),
    usage: z.array(z.enum(["read_posts", "post_as_project", "communities"])).default([]),
  })
  .strict();

export const adsPreviewInputSchema = z
  .object({
    objective: z.enum(["ama", "launch_post", "community"]),
    budgetNote: z.string().min(1).max(200),
  })
  .strict();

export const yearChecklistInputSchema = z
  .object({
    monthsLive: z.number().int().min(0).max(24),
  })
  .strict();

export const yearLogInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    weekOf: z.string().datetime(),
    didPublishUpdate: z.boolean(),
    didCheckLocks: z.boolean(),
    buybackRequested: z.boolean(),
  })
  .strict();

export const toolInputSchemas = {
  get_progress: getProgressInputSchema,
  resume: resumeInputSchema,
  prep_x_checklist: prepXChecklistInputSchema,
  prep_x_schedule: prepXScheduleInputSchema,
  social_telegram_plan: socialTelegramInputSchema,
  social_x_community_plan: socialXCommunityInputSchema,
  caveman_list_topics: emptyInputSchema,
  caveman_explain: cavemanExplainInputSchema,
  setup_check_environment: setupEnvironmentInputSchema,
  setup_codex: setupCodexInputSchema,
  launch_curve_validate_design: tokenDesignSchema,
  social_validate_links: socialLinksSchema,
  badge_list: emptyInputSchema,
  badge_preview: badgePreviewInputSchema,
  score_profile: profileSignalsSchema,
  score_benefits: emptyInputSchema,
  launch_curve_quote_dev_buy: devBuyInputSchema,
  launch_curve_build_announcement: announcementInputSchema,
  launch_curve_submit: launchSubmitInputSchema,
  directory_build_event: creationEventSchema,
  directory_log_create: directoryLogInputSchema,
  graduate_checklist: graduateChecklistInputSchema,
  graduate_submit: graduateSubmitInputSchema,
  meteora_preview_damm_v2: meteoraPreviewInputSchema,
  meteora_quote_pool: meteoraQuoteInputSchema,
  meteora_create_pool: meteoraCreateInputSchema,
  meteora_add_liquidity: meteoraAddInputSchema,
  meteora_lock_lp: meteoraLockInputSchema,
  meteora_reinvest_fees: meteoraReinvestInputSchema,
  vest_plan_lock: vestPlanInputSchema,
  vest_build_proof: lockProofSchema,
  vest_lock_tokens: vestLockInputSchema,
  site_preview_pages: sitePreviewInputSchema,
  site_publish_proofs: sitePublishInputSchema,
  oauth_begin: oauthBeginInputSchema,
  oauth_connection_status: oauthStatusInputSchema,
  verify_connected_accounts: verifyAccountsInputSchema,
  verify_contract_link: verifyContractInputSchema,
  identity_explain_methods: emptyInputSchema,
  identity_score_from_inputs: identityScoreInputSchema,
  identity_add_claim: identityClaimInputSchema,
  admin_session_preview: adminPreviewInputSchema,
  admin_list_co_admins: sessionOnlyInputSchema,
  admin_add_co_admin: adminAddInputSchema,
  admin_remove_co_admin: adminRemoveInputSchema,
  admin_x_credentials_change: adminCredentialsInputSchema,
  admin_guardian_policy: adminPolicyInputSchema,
  admin_dashboard_snapshot: sessionOnlyInputSchema,
  ai_chat_project: aiChatInputSchema,
  grow_x_ama_plan: amaInputSchema,
  grow_x_boost_plan: boostInputSchema,
  grow_x_dev_api_checklist: devApiInputSchema,
  ads_preview: adsPreviewInputSchema,
  ads_submit: boostInputSchema,
  ops_year_checklist: yearChecklistInputSchema,
  ops_year_log_week: yearLogInputSchema,
} as const satisfies Record<ToolName, z.ZodTypeAny>;
