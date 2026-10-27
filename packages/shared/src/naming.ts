import { z } from "zod";

/** Bonding-curve creation has no platform fee. Mainnet still needs confirm: true. */
export const TOKEN_CREATION_FEE = "free" as const;

export const TOKEN_CREATION_FEE_NOTE =
  "Creating the bonding-curve coin has no platform fee. confirm: true is still required before a mainnet action. Phase 1 does not send the transaction.";

export const targetMarketSchema = z
  .object({
    audience: z.string().min(1).max(160),
    problem: z.string().min(1).max(240),
    category: z.string().min(1).max(40),
    tone: z.string().min(1).max(80),
    geography: z.string().min(1).max(80).optional(),
  })
  .strict();

export type TargetMarket = z.infer<typeof targetMarketSchema>;

export const nameScoreInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    ticker: z.string().min(1).max(10),
    /** Caller reports an X cashtag collision. Phase 1 does not query X. */
    cashtagTaken: z.boolean().default(false),
  })
  .strict();

export type NameScoreInput = z.infer<typeof nameScoreInputSchema>;

export const nameScoreSchema = z
  .object({
    name: z.string(),
    ticker: z.string(),
    cashtag: z.string(),
    lettersOnly: z.boolean(),
    letterCount: z.number().int().min(0),
    syllableEstimate: z.number().int().min(1),
    cashtagClear: z.boolean(),
    score: z.number().int().min(0).max(100),
    preferred: z.boolean(),
    notes: z.array(z.string()),
  })
  .strict();

export type NameScore = z.infer<typeof nameScoreSchema>;

/**
 * Rough syllable count: vowel groups, with a trailing silent e dropped.
 * It is a scoring hint, not a dictionary.
 */
export function estimateSyllables(word: string): number {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  const groups = letters.match(/[aeiouy]+/g);
  if (!groups || groups.length === 0) return 1;
  let count = groups.length;
  if (letters.endsWith("e") && count > 1) count -= 1;
  return Math.max(1, count);
}

export function scoreTokenName(input: NameScoreInput): NameScore {
  const name = input.name.trim();
  const ticker = input.ticker.trim();
  const lettersOnly = /^[A-Za-z]+$/.test(name) && /^[A-Za-z]+$/.test(ticker);
  const letterCount = name.replace(/[^A-Za-z]/g, "").length;
  const syllableEstimate = estimateSyllables(name);
  const cashtagClear = !input.cashtagTaken;
  const notes: string[] = [];
  let score = 100;

  if (!lettersOnly) {
    score -= 50;
    notes.push(
      "Use letters only. No numbers, hyphens, or other marks in the name or ticker.",
    );
  }
  if (syllableEstimate > 1) {
    score -= (syllableEstimate - 1) * 20;
    notes.push(
      `Syllable estimate is ${syllableEstimate}. Prefer one syllable when the market still understands the word.`,
    );
  } else {
    notes.push("Syllable estimate is 1.");
  }
  if (letterCount > 5) {
    score -= (letterCount - 5) * 6;
    notes.push(
      `The name has ${letterCount} letters. Fewer letters are easier to type and say.`,
    );
  } else if (letterCount > 0) {
    notes.push(`Letter count is ${letterCount}.`);
  }
  if (/(.)\1\1/i.test(name)) {
    score -= 10;
    notes.push("Three of the same letter in a row is harder to spell on a first read.");
  }
  if (!cashtagClear) {
    score -= 40;
    notes.push(
      `Cashtag $${ticker.toUpperCase()} is marked taken. Pick another ticker so the X cashtag does not collide.`,
    );
  } else {
    notes.push(
      `Cashtag $${ticker.toUpperCase()} is marked clear. Phase 1 does not search X.`,
    );
  }

  score = Math.max(0, Math.min(100, score));
  const preferred =
    lettersOnly &&
    syllableEstimate === 1 &&
    letterCount > 0 &&
    letterCount <= 5 &&
    cashtagClear;

  return nameScoreSchema.parse({
    name,
    ticker: ticker.toUpperCase(),
    cashtag: `$${ticker.toUpperCase()}`,
    lettersOnly,
    letterCount,
    syllableEstimate,
    cashtagClear,
    score,
    preferred,
    notes,
  });
}

export const CLOUDFLARE_DOMAIN_STEPS = [
  "Write the target market down before you buy a name. Tool: name_intake.",
  "Score the word with name_score. Prefer one syllable, few letters, letters only, and a free X cashtag.",
  "Create a Cloudflare account. Do not paste the account password or an API token into MCP.",
  "In the Cloudflare dashboard, open Registrar and register the .com. Prefer .com over other TLDs.",
  "Leave WHOIS contact privacy on. Cloudflare includes redacted registration; that is the private registration this project uses.",
  "Point DNS at the project site only after the name is final. Phase 1 does not call Cloudflare.",
] as const;

export const domainPlanSchema = z
  .object({
    label: z.string(),
    hostname: z.string().nullable(),
    tld: z.literal(".com"),
    registrar: z.literal("cloudflare"),
    privacy: z.literal("whois_redaction"),
    acceptable: z.boolean(),
    notes: z.array(z.string()),
    connectSteps: z.array(z.string()),
  })
  .strict();

export type DomainPlan = z.infer<typeof domainPlanSchema>;

export function planDomain(label: string): DomainPlan {
  const trimmed = label.trim();
  const lettersOnly = /^[A-Za-z]+$/.test(trimmed);
  const hostname = lettersOnly ? `${trimmed.toLowerCase()}.com` : null;
  const notes = [
    "Prefer a .com.",
    "Register it at Cloudflare with WHOIS redaction (private registration included).",
    "Phase 1 does not check availability and does not buy the domain.",
  ];
  if (!lettersOnly) {
    notes.unshift("The label must be letters only before it can be a hostname.");
  }
  return domainPlanSchema.parse({
    label: trimmed,
    hostname,
    tld: ".com",
    registrar: "cloudflare",
    privacy: "whois_redaction",
    acceptable: lettersOnly,
    notes,
    connectSteps: [...CLOUDFLARE_DOMAIN_STEPS],
  });
}

export const BRAND_PRINCIPLES = [
  "One simple mark. A person should recognize it at favicon size.",
  "Few colors and high contrast. Skip gradients, mockups, and tiny words inside the icon.",
  "The same mark becomes the avatar, the X header, the OG image, and the favicon.",
  "Letters in the name stay in the wordmark beside the mark, not crammed into a 32px icon.",
] as const;

export const brandAssetKindSchema = z.enum([
  "logo",
  "avatar",
  "x_header",
  "og",
  "favicon",
]);

export type BrandAssetKind = z.infer<typeof brandAssetKindSchema>;

export const BRAND_ASSET_SPECS: Record<BrandAssetKind, { pixels: string; note: string }> =
  {
    logo: { pixels: "1024x1024", note: "Square mark on a plain background." },
    avatar: {
      pixels: "400x400",
      note: "The mark centered, still readable as a circle crop.",
    },
    x_header: {
      pixels: "1500x500",
      note: "Mark on the left, lots of empty space. No profit claim.",
    },
    og: {
      pixels: "1200x630",
      note: "Mark plus the name. Include the launch time only when it is real.",
    },
    favicon: { pixels: "32x32", note: "The mark alone. No small text." },
  };

export function brandAssetBrief(input: {
  name: string;
  kind: BrandAssetKind;
  background: "light" | "dark";
}): {
  generation: "todo";
  kind: BrandAssetKind;
  name: string;
  background: "light" | "dark";
  pixels: string;
  note: string;
  principles: readonly string[];
} {
  const spec = BRAND_ASSET_SPECS[input.kind];
  return {
    generation: "todo",
    kind: input.kind,
    name: input.name,
    background: input.background,
    pixels: spec.pixels,
    note: spec.note,
    principles: BRAND_PRINCIPLES,
  };
}

export const xAnalyticsSnapshotSchema = z
  .object({
    mock: z.literal(true),
    apiCalled: z.literal(false),
    label: z.string(),
    handle: z.string(),
    followers: z.number().int().nonnegative(),
    impressions: z.number().int().nonnegative(),
    engagements: z.number().int().nonnegative(),
    weeks: z.array(
      z
        .object({
          label: z.string(),
          impressions: z.number().int().nonnegative(),
        })
        .strict(),
    ),
  })
  .strict();

export type XAnalyticsSnapshot = z.infer<typeof xAnalyticsSnapshotSchema>;

/** Fixture numbers for the admin shell. Not an X API response. */
export function mockXAnalytics(handle: string): XAnalyticsSnapshot {
  const clean = handle.replace(/^@/, "");
  const seed = clean.length + 3;
  return xAnalyticsSnapshotSchema.parse({
    mock: true,
    apiCalled: false,
    label: "Mock data. Not pulled from the X API.",
    handle: `@${clean}`,
    followers: 800 + seed * 37,
    impressions: 12000 + seed * 500,
    engagements: 400 + seed * 20,
    weeks: [
      { label: "W1", impressions: 2000 + seed * 10 },
      { label: "W2", impressions: 3500 + seed * 15 },
      { label: "W3", impressions: 2800 + seed * 12 },
      { label: "W4", impressions: 4100 + seed * 18 },
    ],
  });
}

export const radarGuideSchema = z
  .object({
    tier: z.enum(["premium_plus", "business"]),
    cashtag: z.string(),
    keyword: z.string(),
    exportApi: z.literal("none_documented"),
    steps: z.array(z.string()),
  })
  .strict();

export type RadarGuide = z.infer<typeof radarGuideSchema>;

/**
 * X Radar is a product surface, not an export API this repo can call.
 * Guide the UI. Do not invent an endpoint.
 */
export function radarGuide(input: {
  ticker: string;
  keyword: string;
  tier: "premium_plus" | "business";
}): RadarGuide {
  const cashtag = `$${input.ticker.replace(/^\$/, "").toUpperCase()}`;
  const tierLabel = input.tier === "premium_plus" ? "Premium+" : "Business";
  return radarGuideSchema.parse({
    tier: input.tier,
    cashtag,
    keyword: input.keyword,
    exportApi: "none_documented",
    steps: [
      `Radar needs X ${tierLabel}. Premium (without +) is not the Radar tier.`,
      `In the X Radar UI, watch the cashtag ${cashtag} and the campaign keyword “${input.keyword}”.`,
      "There is no documented Radar export API. This tool does not call one and will not invent one.",
      "Read the results in the Radar UI. Fee-funded boosts, when you run them, are for attention (ads_preview), not for a price defense.",
    ],
  });
}

export const weeklyMilestoneSchema = z
  .object({
    week: z.number().int().min(1).max(52),
    title: z.string(),
    badgeId: z.string(),
    perk: z.literal("tbd"),
  })
  .strict();

export type WeeklyMilestone = z.infer<typeof weeklyMilestoneSchema>;

/** Milestone labels are checks. Perks are not defined in Phase 1. */
export const WEEKLY_MILESTONES: readonly WeeklyMilestone[] = [
  { week: 1, title: "Target market written down", badgeId: "market_named", perk: "tbd" },
  { week: 2, title: "Name and .com chosen", badgeId: "name_chosen", perk: "tbd" },
  { week: 3, title: "Launch time public", badgeId: "launch_named", perk: "tbd" },
  {
    week: 4,
    title: "Bonding curve created (no platform fee)",
    badgeId: "curve_live",
    perk: "tbd",
  },
  { week: 5, title: "Dump caveat still pinned", badgeId: "dump_honest", perk: "tbd" },
  { week: 6, title: "Meteora lock published", badgeId: "lp_locked", perk: "tbd" },
  {
    week: 7,
    title: "Team stream proof on the site",
    badgeId: "team_locked",
    perk: "tbd",
  },
  { week: 8, title: "Directory row complete", badgeId: "directory_row", perk: "tbd" },
];
