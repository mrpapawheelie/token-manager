/**
 * Year-one Solana token manager for Pump.fun-style bonding-curve launches.
 * Classic SPL mint-first launches are out of scope.
 *
 * Principles — keep the product pointed here:
 * 1. About 5% of supply is the post-graduation liquidity rule of thumb (the dev buy).
 * 2. Fair-launch honesty: name the launch time. Warn that snipers and bundlers are
 *    common and that a dump after graduation is typical, so retail is not blindsided.
 *    Sniper bots and bundler bots are out of scope for this repo.
 * 3. After graduation: Meteora DAMM v2 locked LP with compounding_fee_bps = 10000,
 *    so 100% of LP fees auto-compound into quote token B. Buybacks and burns are
 *    discouraged.
 * 4. Lock extra team tokens (about an additional 5–10% or more) with a cliff and a
 *    stream. Publish the proof on the project site.
 * 5. Eyes equal buys: X Premium, AMAs, fee-funded boosts, and the X Developer API.
 * 6. Caveman-easy explainers for features.
 * 7. Codex.io is the token data API. Almost-free tier, plus a one-time $1 activation.
 * 8. The platform directory logs successful creates: category, short description,
 *    socials, contract, locks, and verification.
 * 9. OAuth connects so the platform can third-party verify connected accounts and
 *    the contract.
 * 10. Developer identity score: optional public identity, or anonymous-but-verified.
 *     Score X, AI-checkable claim proofs, and an optional external ID API. Publish
 *     the verification methods. Rank badges (gold/silver) are out of scope.
 *
 * Phase 1 also tracks factual status labels (locked liquidity, auto-compound,
 * connected GitHub/X) that stay grey until the check is true, plus a profile
 * completion score. Those labels report checks. They are not rank badges.
 *
 * Per-project admin: the root admin is the wallet that created the token
 * (Sign-In With Solana). The root can add co-admin wallets. Sensitive actions
 * (add/remove admins, large liquidity ops, X API credential changes) are designed
 * to require a second factor: a guardian wallet and/or passkey/TOTP. Phase 1
 * stubs that gate and does not verify signatures, passkeys, or TOTP secrets.
 *
 * Naming comes after a target-market intake. Prefer one syllable, few letters,
 * letters only, and an X cashtag that does not collide. The domain is a .com
 * at Cloudflare with WHOIS redaction. Brand assets are a simple mark. Generation
 * is TODO.
 *
 * Bonding-curve creation has no platform fee. Weekly milestones can become
 * status labels. Perks for those milestones are TBD.
 *
 * X analytics in the admin shell are mock until a real connect exists. X Radar
 * (Premium+ or Business) is a UI guide: cashtag plus a campaign keyword. There
 * is no documented Radar export API.
 */

export const PRODUCT_NAME = "Token Manager";

export const LAUNCH_STYLE = "bonding_curve" as const;

/** 500 bps = 5% of supply. Rule of thumb for the dev buy that funds post-graduation LP. */
export const DEV_BUY_SUPPLY_BPS = 500;

export const DEV_BUY_RULE_MIN_BPS = 400;
export const DEV_BUY_RULE_MAX_BPS = 600;

/** 10000 bps = 100% of LP fees auto-compound into quote token B. */
export const METEORA_COMPOUNDING_FEE_BPS = 10000;

/** Additional team lock, on top of the dev-buy liquidity rule. 500 bps = 5%. */
export const TEAM_LOCK_EXTRA_SUPPLY_BPS_MIN = 500;

/** Typical upper end of the "5–10%+" example. Higher is allowed. */
export const TEAM_LOCK_EXTRA_SUPPLY_BPS_TYPICAL_MAX = 1000;

export interface Principle {
  id: number;
  title: string;
  text: string;
}

export const PRINCIPLES: readonly Principle[] = [
  {
    id: 1,
    title: "Five percent liquidity",
    text: "About 5% of supply is the post-graduation liquidity rule of thumb. That dev buy is for the pool after graduation.",
  },
  {
    id: 2,
    title: "Fair-launch honesty",
    text: "Name the launch time. Warn that snipers and bundlers are common and that a dump after graduation is typical. This repo does not ship sniper or bundler bots.",
  },
  {
    id: 3,
    title: "Meteora lock and compound",
    text: "After graduation, lock LP on Meteora DAMM v2 with compounding_fee_bps = 10000 so fees auto-compound into quote token B. Buybacks and burns are discouraged.",
  },
  {
    id: 4,
    title: "Team locks",
    text: "Lock extra team tokens (about an additional 5–10% or more) with a cliff and a stream. Publish the proof on the project site.",
  },
  {
    id: 5,
    title: "Eyes equal buys",
    text: "X Premium, AMAs, fee-funded boosts, and the X Developer API are part of the year-one job.",
  },
  {
    id: 6,
    title: "Caveman explainers",
    text: "Explain features in short, plain words.",
  },
  {
    id: 7,
    title: "Codex.io",
    text: "Use Codex.io for token data. Almost-free tier, with a one-time $1 activation. Do not commit the API key.",
  },
  {
    id: 8,
    title: "Directory",
    text: "Log successful creates with category, short description, socials, contract, locks, and verification.",
  },
  {
    id: 9,
    title: "OAuth",
    text: "OAuth connects accounts so the platform can third-party verify those accounts together with the contract.",
  },
  {
    id: 10,
    title: "Identity score",
    text: "Public identity or anonymous-but-verified. Score X, AI-checkable claim proofs, and an optional external ID API. Publish the methods. Skip theatrical rank badges.",
  },
] as const;

export const PROFILE_COMPLETION_BENEFIT =
  "A finished profile shows the launch time, the dump risk, where liquidity is locked, and which accounts are actually connected. Grey labels are unfinished checks. Finishing them gives a buyer something to verify before they buy.";
