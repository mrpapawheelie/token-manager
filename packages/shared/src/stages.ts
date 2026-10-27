/**
 * Journey order is the single source of truth for stage ids.
 * Index 0 is prep_weeks_out. Do not reorder without a migration note.
 */
export const JOURNEY_STAGES = [
  "prep_weeks_out",
  "environment",
  "design_listing_meta",
  "bonding_curve_launch",
  "log_creation_event",
  "graduate",
  "meteora_damm_v2",
  "team_locks",
  "oauth_verify",
  "grow_x",
  "year_one_ops",
] as const;

export type JourneyStageId = (typeof JOURNEY_STAGES)[number];

export const STAGE_INDEX: Record<JourneyStageId, number> = {
  prep_weeks_out: 0,
  environment: 1,
  design_listing_meta: 2,
  bonding_curve_launch: 3,
  log_creation_event: 4,
  graduate: 5,
  meteora_damm_v2: 6,
  team_locks: 7,
  oauth_verify: 8,
  grow_x: 9,
  year_one_ops: 10,
};

export const STAGE_LABELS: Record<JourneyStageId, string> = {
  prep_weeks_out: "Prep, weeks out",
  environment: "Environment",
  design_listing_meta: "Design listing and metadata",
  bonding_curve_launch: "Bonding-curve launch",
  log_creation_event: "Log the creation",
  graduate: "Graduate",
  meteora_damm_v2: "Meteora DAMM v2",
  team_locks: "Team locks",
  oauth_verify: "OAuth and verification",
  grow_x: "Grow on X",
  year_one_ops: "Year-one operations",
};

export const STAGE_SUMMARIES: Record<JourneyStageId, string> = {
  prep_weeks_out:
    "Name a launch time. Open X and Telegram. Write the dump caveat in public. Skip sniper setup.",
  environment:
    "Check the public wallet address, cluster, and Codex activation. Keep seeds and API keys out of the tools.",
  design_listing_meta:
    "Validate bonding-curve listing fields, socials, and the profile checks that start grey.",
  bonding_curve_launch:
    "Quote the ~5% dev buy, build the fair-launch post, and only then consider a confirmed create.",
  log_creation_event:
    "Record category, description, socials, contract, locks, and verification for the directory.",
  graduate:
    "Graduate on purpose. A dump after graduation is typical. Say that again before the migrate.",
  meteora_damm_v2:
    "Price the pool from Codex or chain data, lock LP, and set compounding_fee_bps to 10000.",
  team_locks:
    "Cliff and stream the extra team tokens. Publish the proof on the project site.",
  oauth_verify:
    "Connect accounts, score identity from published methods, and stub the admin guardian gate.",
  grow_x:
    "AMAs, fee-funded boosts, and the X Developer API. Attention is part of the job.",
  year_one_ops:
    "Keep proofs, the directory row, and the honest updates current for the first year.",
};

export function nextStage(stage: JourneyStageId): JourneyStageId | null {
  const index = STAGE_INDEX[stage];
  return JOURNEY_STAGES[index + 1] ?? null;
}

export function stagesBefore(stage: JourneyStageId): JourneyStageId[] {
  return JOURNEY_STAGES.slice(0, STAGE_INDEX[stage]);
}
