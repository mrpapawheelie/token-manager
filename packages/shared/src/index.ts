/**
 * Shared contracts for the year-one bonding-curve token manager.
 * Product principles live in ./principles.ts. Stage order lives in ./stages.ts.
 * Tool names live in ./catalog.ts. Do not fork a second journey.
 */

export {
  ALWAYS_TOOLS,
  TOOL_CATALOG,
  toolByName,
  toolsForStage,
  type ImplementedToolName,
  type ToolCatalogEntry,
  type ToolCatalogItem,
  type ToolName,
} from "./catalog.js";

export {
  API_BUILDER_OPENAPI,
  X402_FLOW,
  apiAuthSchema,
  apiEndpointSpecSchema,
  dataLocationSchema,
  describeEndpoints,
  locateProjectData,
  readonlyBalanceSpec,
  tokenGatedSpec,
  x402Config,
  x402ConfigSchema,
  x402EndpointSpec,
  type ApiAuth,
  type ApiEndpointSpec,
  type DataLocation,
  type X402Config,
} from "./api-builder.js";

export {
  quotePriceFromCodex,
  quotePriceOnchain,
  quoteTokenPrice,
} from "./clients/price.js";
export type { TokenPriceQuery, TokenPriceStub } from "./clients/price.js";

export {
  CREDENTIAL_TAG_IDS,
  MEMBERSHIP_ADAPTERS,
  adminFlagQueueItemSchema,
  assessCredentials,
  buildWalletProof,
  credAssessmentResultSchema,
  credentialTagSchema,
  credentialTags,
  membershipSourceSchema,
  reviewXHeuristics,
  walletProofSchema,
  type AdminFlagQueueItem,
  type AdminFlagReason,
  type CredAssessmentResult,
  type CredentialTag,
  type CredentialTagId,
  type MembershipSource,
  type WalletProof,
} from "./credentials.js";

export {
  CAVEMAN_TOPICS,
  buildFairLaunchAnnouncement,
  cavemanScript,
  listCavemanTopics,
  type CavemanTopic,
  type FairLaunchFields,
} from "./copy.js";

export { bpsToPercent, checkTokenDesign, quoteDevBuy } from "./design.js";
export type { DesignCheck, DevBuyQuote } from "./design.js";

export { previewAdminSession, reviewGuardianGate } from "./admin.js";
export type {
  AdminPreview,
  AdminPreviewInput,
  GuardianApproval,
  GuardianGateReview,
} from "./admin.js";

export {
  PROFILE_CHECKLIST,
  buildBadges,
  listBadgeCatalog,
  scoreProfile,
} from "./badges.js";

export {
  IDENTITY_METHODS,
  IDENTITY_SCORE_FORMULA,
  scoreIdentity,
  type IdentityScoreInput,
} from "./identity.js";

export { planTeamLock, previewMeteora } from "./liquidity.js";
export type { MeteoraPreview, TeamLockPlan } from "./liquidity.js";

export {
  BRAND_ASSET_SPECS,
  BRAND_PRINCIPLES,
  CLOUDFLARE_DOMAIN_STEPS,
  TOKEN_CREATION_FEE,
  TOKEN_CREATION_FEE_NOTE,
  WEEKLY_MILESTONES,
  brandAssetBrief,
  brandAssetKindSchema,
  domainPlanSchema,
  estimateSyllables,
  mockXAnalytics,
  nameScoreInputSchema,
  nameScoreSchema,
  planDomain,
  radarGuide,
  radarGuideSchema,
  scoreTokenName,
  targetMarketSchema,
  weeklyMilestoneSchema,
  xAnalyticsSnapshotSchema,
  type BrandAssetKind,
  type DomainPlan,
  type NameScore,
  type NameScoreInput,
  type RadarGuide,
  type TargetMarket,
  type WeeklyMilestone,
  type XAnalyticsSnapshot,
} from "./naming.js";

export {
  CONTRACT_ADDRESS_PLACEHOLDER,
  SITE_TEMPLATE_STACK,
  prelaunchChecklist,
  prelaunchChecklistSchema,
  prelaunchStepIdSchema,
  type PrelaunchChecklist,
  type PrelaunchStepId,
} from "./prelaunch.js";

export {
  SITE_PAGES,
  adsPreview,
  amaPlan,
  codexChecklist,
  devApiChecklist,
  environmentChecks,
  graduateChecklist,
  prepChecklist,
  schedulePrep,
  telegramPlan,
  xCommunityPlan,
  yearOneChecklist,
  type CheckItem,
} from "./plans.js";

export {
  DEV_BUY_RULE_MAX_BPS,
  DEV_BUY_RULE_MIN_BPS,
  DEV_BUY_SUPPLY_BPS,
  LAUNCH_STYLE,
  METEORA_COMPOUNDING_FEE_BPS,
  PRINCIPLES,
  PRODUCT_NAME,
  PLATFORM_RULE_FOUNDER_OWNERSHIP,
  PROFILE_COMPLETION_BENEFIT,
  TEAM_LOCK_EXTRA_SUPPLY_BPS_MIN,
  TEAM_LOCK_EXTRA_SUPPLY_BPS_TYPICAL_MAX,
  type Principle,
} from "./principles.js";

export { redactSecrets } from "./redact.js";

export {
  SCANNER_OPENAPI,
  SCANNER_RATE_LIMIT,
  buildScannerToken,
  claimFieldSchema,
  compareOriginality,
  coachOriginality,
  originalityCompareSchema,
  placeholderScanNotification,
  planFounderGithubRepo,
  scanNotificationSchema,
  scannerTokenPayloadSchema,
  verificationFlags,
  verificationFlagsSchema,
  type ClaimField,
  type OriginalityCompare,
  type ScanNotification,
  type ScannerTokenPayload,
  type VerificationFlags,
} from "./scanner.js";

export {
  acknowledgementsSchema,
  adminSessionSchema,
  badgeDefinitionSchema,
  badgeIdSchema,
  claimProofSchema,
  coAdminSchema,
  createProgressState,
  creationEventSchema,
  emptyAcknowledgements,
  guardianFactorSchema,
  guardianPolicySchema,
  identityModeSchema,
  identityScoreSchema,
  journeyStageSchema,
  lockKindSchema,
  lockProofSchema,
  lockTierSchema,
  meteoraPoolConfigSchema,
  priceSourceSchema,
  profileCompletionScoreSchema,
  profileSignalsSchema,
  progressStateSchema,
  publicAddressSchema,
  quoteSymbolSchema,
  sensitiveActionSchema,
  socialLinksSchema,
  tokenDesignSchema,
  verificationStatusSchema,
  type Acknowledgements,
  type AdminSession,
  type BadgeDefinition,
  type BadgeId,
  type ClaimProof,
  type CoAdmin,
  type CreationEvent,
  type GuardianFactor,
  type GuardianPolicy,
  type IdentityScore,
  type LockProof,
  type LockTier,
  type MeteoraPoolConfig,
  type PriceSource,
  type ProfileCompletionScore,
  type ProfileSignals,
  type ProgressState,
  type SensitiveAction,
  type SocialLinks,
  type TokenDesign,
  type VerificationStatus,
} from "./schemas.js";

export {
  JOURNEY_STAGES,
  STAGE_INDEX,
  STAGE_LABELS,
  STAGE_SUMMARIES,
  nextStage,
  stagesBefore,
  type JourneyStageId,
} from "./stages.js";

export { toolInputSchemas } from "./tool-inputs.js";
