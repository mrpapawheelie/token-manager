import type { PriceSource } from "../schemas.js";

export interface TokenPriceQuery {
  contract: string;
  quoteSymbol: "SOL" | "USDC";
  priceSource: PriceSource;
}

export interface TokenPriceStub {
  status: "not_implemented";
  priceSource: PriceSource;
  priceUi: null;
  next: string;
}

/**
 * TODO(phase-2): Call the Codex.io token data API with a server-side key
 * loaded from the environment. Do not add the key to tool arguments or logs.
 * Almost-free tier, one-time $1 activation, is the intended plan.
 */
export function quotePriceFromCodex(query: TokenPriceQuery): TokenPriceStub {
  return {
    status: "not_implemented",
    priceSource: "codex",
    priceUi: null,
    next: `Codex.io price for ${query.contract} in ${query.quoteSymbol} is not fetched in Phase 1. Activate the almost-free tier (one-time $1) and keep the API key off the tool arguments.`,
  };
}

/**
 * TODO(phase-2): Read the pool price with viem against a public RPC.
 * This function must stay a read. It does not build a transaction.
 */
export function quotePriceOnchain(query: TokenPriceQuery): TokenPriceStub {
  return {
    status: "not_implemented",
    priceSource: "onchain",
    priceUi: null,
    next: `On-chain price for ${query.contract} in ${query.quoteSymbol} is not read in Phase 1. A later phase will use a public RPC and return a number.`,
  };
}

export function quoteTokenPrice(query: TokenPriceQuery): TokenPriceStub {
  if (query.priceSource === "codex") return quotePriceFromCodex(query);
  return quotePriceOnchain(query);
}
