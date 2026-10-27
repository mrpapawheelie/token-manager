import {
  METEORA_COMPOUNDING_FEE_BPS,
  TEAM_LOCK_EXTRA_SUPPLY_BPS_MIN,
  TEAM_LOCK_EXTRA_SUPPLY_BPS_TYPICAL_MAX,
} from "./principles.js";
import { bpsToPercent } from "./design.js";
import type { MeteoraPoolConfig } from "./schemas.js";

export interface MeteoraPreview {
  terms: {
    pool: "meteora_damm_v2";
    compoundingFeeBps: typeof METEORA_COMPOUNDING_FEE_BPS;
    quoteSymbol: "SOL" | "USDC";
    lpSupplyBps: number;
    feesGoTo: "quote_token_b";
    discouraged: ["buyback", "burn"];
  };
  config: MeteoraPoolConfig;
  explanation: string;
}

export function previewMeteora(input: {
  contract: string;
  quoteSymbol: "SOL" | "USDC";
  priceSource: "codex" | "onchain";
  lpSupplyBps?: number;
}): MeteoraPreview {
  const lpSupplyBps = input.lpSupplyBps ?? 500;
  return {
    terms: {
      pool: "meteora_damm_v2",
      compoundingFeeBps: METEORA_COMPOUNDING_FEE_BPS,
      quoteSymbol: input.quoteSymbol,
      lpSupplyBps,
      feesGoTo: "quote_token_b",
      discouraged: ["buyback", "burn"],
    },
    config: {
      contract: input.contract,
      quoteSymbol: input.quoteSymbol,
      priceSource: input.priceSource,
      compoundingFeeBps: METEORA_COMPOUNDING_FEE_BPS,
      lpSupplyBps,
      locked: true,
    },
    explanation:
      "Lock the graduated LP on Meteora DAMM v2. compounding_fee_bps stays at 10000 so fees auto-compound into quote token B. Buybacks and burns fight that design. Phase 1 does not send the transaction. Price comes from Codex or an on-chain read in a later phase.",
  };
}

export interface TeamLockPlan {
  extraSupplyBps: number;
  cliffSeconds: number;
  streamSeconds: number;
  recipientLabel: string;
  warnings: string[];
  summary: string;
}

export function planTeamLock(input: {
  extraSupplyBps: number;
  cliffDays: number;
  streamDays: number;
  recipientLabel: string;
}): TeamLockPlan {
  const warnings: string[] = [];
  if (input.extraSupplyBps < TEAM_LOCK_EXTRA_SUPPLY_BPS_MIN) {
    warnings.push(
      `Extra team lock is ${bpsToPercent(input.extraSupplyBps)}%. The habit is an additional 5–10% or more.`,
    );
  } else if (input.extraSupplyBps > TEAM_LOCK_EXTRA_SUPPLY_BPS_TYPICAL_MAX) {
    warnings.push("Above the 10% example is allowed. Publish the proof either way.");
  }
  if (input.cliffDays === 0) {
    warnings.push(
      "A cliff of zero still streams. A real cliff is the usual public commitment.",
    );
  }
  const cliffSeconds = input.cliffDays * 86_400;
  const streamSeconds = input.streamDays * 86_400;
  return {
    extraSupplyBps: input.extraSupplyBps,
    cliffSeconds,
    streamSeconds,
    recipientLabel: input.recipientLabel,
    warnings,
    summary: `${bpsToPercent(input.extraSupplyBps)}% of supply, cliff ${input.cliffDays} days, then stream ${input.streamDays} days, labeled ${input.recipientLabel}.`,
  };
}
