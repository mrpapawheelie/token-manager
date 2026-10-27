import { z } from "zod";

import type { ToolName } from "./catalog.js";
import { CAVEMAN_TOPICS } from "./copy.js";
import {
  brandAssetKindSchema,
  nameScoreInputSchema,
  targetMarketSchema,
} from "./naming.js";
import { dataLocationSchema } from "./api-builder.js";
import { membershipSourceSchema } from "./credentials.js";
import { claimFieldSchema } from "./scanner.js";
import {
  acknowledgementsSchema,
  claimProofSchema,
  coAdminSchema,
  creationEventSchema,
  guardianPolicySchema,
  journeyStageSchema,
  lockProofSchema,
  lockTierSchema,
  meteoraPoolConfigSchema,
  profileSignalsSchema,
  publicAddressSchema,
  quoteSymbolSchema,
  socialLinksSchema,
  tokenDesignSchema,
  verificationStatusSchema,
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

export const domainPlanInputSchema = z
  .object({
    label: z.string().min(1).max(32),
  })
  .strict();

export const domainConnectInputSchema = z
  .object({
    hostname: z.string().min(1).max(80).optional(),
  })
  .strict();

export const brandGenerateInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    kind: brandAssetKindSchema,
    background: z.enum(["light", "dark"]).default("light"),
  })
  .strict();

export const adminXConnectInputSchema = z
  .object({
    accountLabel: z.string().min(1).max(80),
  })
  .strict();

export const adminXAnalyticsInputSchema = z
  .object({
    handle: z.string().min(1).max(50),
  })
  .strict();

export const radarGuideInputSchema = z
  .object({
    ticker: z.string().min(1).max(10),
    keyword: z.string().min(1).max(40),
    tier: z.enum(["premium_plus", "business"]),
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

export const claimsIntakeInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    useCase: z.string().min(1).max(400),
    productGoal: z.string().min(1).max(400),
    audience: z.string().min(1).max(160),
  })
  .strict();

export const originalityCompareInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    statement: z.string().min(1).max(500),
    corpus: z
      .array(
        z
          .object({
            name: z.string().min(1).max(80),
            summary: z.string().min(1).max(400),
          })
          .strict(),
      )
      .max(20)
      .default([]),
  })
  .strict();

export const originalityCoachInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    useCase: z.string().min(1).max(400),
  })
  .strict();

export const scannerPreviewInputSchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(32),
    symbol: z.string().min(1).max(10),
    category: z.string().min(1).max(40),
    shortDescription: z.string().min(1).max(280),
    contract: publicAddressSchema.optional(),
    mock: z.boolean(),
    identityMode: z.enum(["public", "anonymous_verified"]).optional(),
    connectedX: z.boolean().nullable().optional(),
    connectedGithub: z.boolean().nullable().optional(),
    verificationStatus: verificationStatusSchema.optional(),
    lockTier: lockTierSchema.optional(),
    lockAssessed: z.boolean().optional(),
    autoCompound: z.boolean().nullable().optional(),
    profileCompletion: z.number().int().min(0).max(100).nullable().optional(),
    claims: z.array(claimFieldSchema).max(20).optional(),
    x: z.string().max(80).nullable().optional(),
    github: z.string().max(200).nullable().optional(),
  })
  .strict();

export const scannerNotifyInputSchema = z
  .object({
    eventId: z.string().min(1).max(80),
    webhookUrl: z.string().url().optional(),
  })
  .strict();

export const githubOauthBeginInputSchema = z
  .object({
    founderLogin: z.string().min(1).max(39),
  })
  .strict();

export const githubRepoPlanInputSchema = z
  .object({
    founderLogin: z.string().min(1).max(39),
    repoName: z.string().min(1).max(100),
    action: z.enum(["create", "manage"]),
  })
  .strict();

export const prelaunchChecklistInputSchema = z
  .object({
    publish_site: z.boolean().optional(),
    create_x: z.boolean().optional(),
    publish_account: z.boolean().optional(),
    first_ama: z.boolean().optional(),
    hype_cadence: z.boolean().optional(),
  })
  .strict();

export const apiBuilderLocateInputSchema = z
  .object({
    source: dataLocationSchema,
  })
  .strict();

export const apiBuilderDescribeInputSchema = z
  .object({
    wish: z.string().max(2000).default(""),
  })
  .strict();

export const apiBuilderReadonlyInputSchema = z.object({}).strict();

export const apiBuilderTokenGateInputSchema = z
  .object({
    enabled: z.boolean().default(false),
  })
  .strict();

export const apiBuilderX402InputSchema = z.object({}).strict();

export const personalOauthInputSchema = z
  .object({
    provider: z.enum(["github", "linkedin", "x"]),
    accountLabel: z.string().min(1).max(80),
  })
  .strict();

export const credWalletProofInputSchema = z
  .object({
    walletAddress: publicAddressSchema,
  })
  .strict();

export const credResolveMembershipInputSchema = z
  .object({
    source: membershipSourceSchema,
    walletAddress: publicAddressSchema,
  })
  .strict();

export const credAssessInputSchema = z
  .object({
    category: z.string().min(1).max(40),
    recorded: z
      .object({
        new_x_account: z.boolean().optional(),
        long_x_silence: z.boolean().optional(),
        sudden_launch_posts: z.boolean().optional(),
        thin_history: z.boolean().optional(),
        gitcoin_passport: z.boolean().optional(),
        base_builder: z.boolean().optional(),
        build_guild: z.boolean().optional(),
        eth_aligned_contrib: z.boolean().optional(),
      })
      .strict()
      .default({}),
  })
  .strict();

export const credXHeuristicsInputSchema = z
  .object({
    subjectLabel: z.string().min(1).max(80),
    longInactivityThenLaunchSpam: z.boolean(),
    voiceStyleShift: z.boolean(),
  })
  .strict();

export const toolInputSchemas = {
  get_progress: getProgressInputSchema,
  resume: resumeInputSchema,
  prelaunch_checklist: prelaunchChecklistInputSchema,
  prep_x_checklist: prepXChecklistInputSchema,
  prep_x_schedule: prepXScheduleInputSchema,
  name_intake: targetMarketSchema,
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
  name_score: nameScoreInputSchema,
  domain_plan: domainPlanInputSchema,
  domain_connect: domainConnectInputSchema,
  brand_principles: emptyInputSchema,
  brand_generate: brandGenerateInputSchema,
  badge_milestones: emptyInputSchema,
  claims_intake: claimsIntakeInputSchema,
  originality_compare: originalityCompareInputSchema,
  originality_coach: originalityCoachInputSchema,
  launch_curve_quote_dev_buy: devBuyInputSchema,
  launch_curve_build_announcement: announcementInputSchema,
  launch_curve_submit: launchSubmitInputSchema,
  directory_build_event: creationEventSchema,
  directory_log_create: directoryLogInputSchema,
  scanner_preview: scannerPreviewInputSchema,
  scanner_notify: scannerNotifyInputSchema,
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
  github_oauth_begin: githubOauthBeginInputSchema,
  github_repo_plan: githubRepoPlanInputSchema,
  identity_explain_methods: emptyInputSchema,
  identity_score_from_inputs: identityScoreInputSchema,
  identity_add_claim: identityClaimInputSchema,
  identity_list_tags: emptyInputSchema,
  identity_personal_oauth: personalOauthInputSchema,
  cred_oauth_begin: personalOauthInputSchema,
  cred_wallet_proof: credWalletProofInputSchema,
  cred_resolve_membership: credResolveMembershipInputSchema,
  cred_assess: credAssessInputSchema,
  cred_x_heuristics: credXHeuristicsInputSchema,
  admin_session_preview: adminPreviewInputSchema,
  admin_list_co_admins: sessionOnlyInputSchema,
  admin_add_co_admin: adminAddInputSchema,
  admin_remove_co_admin: adminRemoveInputSchema,
  admin_x_credentials_change: adminCredentialsInputSchema,
  admin_guardian_policy: adminPolicyInputSchema,
  admin_dashboard_snapshot: sessionOnlyInputSchema,
  admin_x_connect: adminXConnectInputSchema,
  admin_x_analytics: adminXAnalyticsInputSchema,
  admin_x_radar_guide: radarGuideInputSchema,
  ai_chat_project: aiChatInputSchema,
  grow_x_ama_plan: amaInputSchema,
  grow_x_boost_plan: boostInputSchema,
  grow_x_dev_api_checklist: devApiInputSchema,
  ads_preview: adsPreviewInputSchema,
  ads_submit: boostInputSchema,
  api_builder_locate: apiBuilderLocateInputSchema,
  api_builder_describe: apiBuilderDescribeInputSchema,
  api_builder_readonly: apiBuilderReadonlyInputSchema,
  api_builder_token_gate: apiBuilderTokenGateInputSchema,
  api_builder_x402: apiBuilderX402InputSchema,
  ops_year_checklist: yearChecklistInputSchema,
  ops_year_log_week: yearLogInputSchema,
} as const satisfies Record<ToolName, z.ZodTypeAny>;
