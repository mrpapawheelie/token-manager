import {
  DEV_BUY_RULE_MAX_BPS,
  DEV_BUY_RULE_MIN_BPS,
  DEV_BUY_SUPPLY_BPS,
} from "./principles.js";
import { tokenDesignSchema, type TokenDesign } from "./schemas.js";

export interface DesignCheck {
  valid: boolean;
  design?: TokenDesign;
  errors: string[];
  warnings: string[];
}

export function bpsToPercent(bps: number): string {
  const percent = bps / 100;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2);
}

export interface DevBuyQuote {
  supplyUi: number;
  devBuySupplyBps: number;
  devBuyTokenUi: number;
  ruleOfThumbBps: number;
  withinRuleOfThumb: boolean;
  purpose: string;
}

/** Dev-buy size in whole tokens. The buy is the liquidity rule of thumb, not a snipe. */
export function quoteDevBuy(
  supplyUi: number,
  devBuySupplyBps = DEV_BUY_SUPPLY_BPS,
): DevBuyQuote {
  return {
    supplyUi,
    devBuySupplyBps,
    devBuyTokenUi: (supplyUi * devBuySupplyBps) / 10_000,
    ruleOfThumbBps: DEV_BUY_SUPPLY_BPS,
    withinRuleOfThumb:
      devBuySupplyBps >= DEV_BUY_RULE_MIN_BPS && devBuySupplyBps <= DEV_BUY_RULE_MAX_BPS,
    purpose:
      "Post-graduation liquidity. About 5% of supply is the year-one rule of thumb.",
  };
}

export function checkTokenDesign(input: unknown): DesignCheck {
  const parsed = tokenDesignSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "design"}: ${issue.message}`,
      ),
      warnings: [],
    };
  }
  const design = parsed.data;
  const warnings: string[] = [];
  const quote = quoteDevBuy(design.supplyUi, design.devBuySupplyBps);
  if (!quote.withinRuleOfThumb) {
    warnings.push(
      `Dev buy is ${bpsToPercent(design.devBuySupplyBps)}% of supply. The rule of thumb is about 5% for post-graduation liquidity.`,
    );
  }
  if (Date.parse(design.launchAt) < Date.now()) {
    warnings.push("launchAt is in the past. Name a future time before you announce.");
  }
  if (/\b(guaranteed|risk-free|risk free|100x)\b/i.test(design.description)) {
    warnings.push("Drop profit language. The launch post states the dump risk instead.");
  }
  return { valid: true, design, errors: [], warnings };
}
