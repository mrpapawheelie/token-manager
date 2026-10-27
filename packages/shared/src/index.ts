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
  quotePriceFromCodex,
  quotePriceOnchain,
  quoteTokenPrice,
} from "./clients/price.js";
export type { TokenPriceQuery, TokenPriceStub } from "./clients/price.js";

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
  PROFILE_COMPLETION_BENEFIT,
  TEAM_LOCK_EXTRA_SUPPLY_BPS_MIN,
  TEAM_LOCK_EXTRA_SUPPLY_BPS_TYPICAL_MAX,
  type Principle,
} from "./principles.js";

export { redactSecrets } from "./redact.js";

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
