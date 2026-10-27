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

/** Hard naming rules. The scorer and the docs table both read this list. */
export const NAME_RULES = [
  {
    id: "market",
    rule: "Write the target market before the name.",
    prefer: "Audience, problem, category, and tone are recorded first.",
  },
  {
    id: "syllables",
    rule: "Use the fewest syllables.",
    prefer: "One syllable.",
  },
  {
    id: "letters",
    rule: "Use few letters.",
    prefer: "2–5 letters.",
  },
  {
    id: "letters_only",
    rule: "Letters only.",
    prefer: "No hyphens, numbers, or other marks in the name or ticker.",
  },
  {
    id: "spellable",
    rule: "Spellable on a first read.",
    prefer: "A vowel, no triple letter, and no four-consonant run.",
  },
  {
    id: "recognizable",
    rule: "Recognizable when someone hears it.",
    prefer: "2–8 letters with a vowel, not one letter repeated.",
  },
  {
    id: "cashtag",
    rule: "Unique enough for a correct X cashtag.",
    prefer: "Caller says it is free, and it is not on the local famous or generic list.",
  },
] as const;

/**
 * There is no X cashtag search in this repo. `cashtagTaken` is caller-reported.
 * The heuristic only consults the lists below.
 */
export const NAME_COLLISION_GAP =
  "No live X cashtag search. cashtagTaken is whatever the caller reports. Local heuristics only flag a built-in list of well-known tickers and generic words. A clear result is not proof the cashtag is free on X.";

const WELL_KNOWN_TICKERS = new Set([
  "BTC",
  "ETH",
  "SOL",
  "USDC",
  "USDT",
  "BNB",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "BONK",
  "WIF",
  "JUP",
  "RAY",
  "JTO",
  "PYTH",
  "ORCA",
  "PEPE",
  "SHIB",
  "TRUMP",
  "LINK",
  "UNI",
  "AAVE",
  "TON",
  "SUI",
  "APT",
  "NEAR",
  "ATOM",
  "DOT",
]);

const GENERIC_CASHTAGS = new Set([
  "A",
  "I",
  "OK",
  "GO",
  "AI",
  "APP",
  "COIN",
  "TOKEN",
  "MOON",
  "PUMP",
  "CAT",
  "DOG",
  "THE",
  "AND",
  "FOR",
  "YOU",
  "NEW",
  "PRO",
  "MAX",
  "ONE",
]);

export const nameScoreInputSchema = z
  .object({
    name: z.string().min(1).max(32),
    ticker: z.string().min(1).max(10),
    /** Caller reports an X cashtag collision. This repo does not query X. */
    cashtagTaken: z.boolean().default(false),
    /** Required before a name can be preferred. Record it with name_intake. */
    market: targetMarketSchema.optional(),
  })
  .strict();

export type NameScoreInput = z.infer<typeof nameScoreInputSchema>;

export const nameCollisionSchema = z
  .object({
    mode: z.literal("local_heuristic"),
    liveXSearch: z.literal(false),
    callerReportedTaken: z.boolean(),
    heuristicRisk: z.enum(["low", "medium", "high"]),
    reasons: z.array(z.string()),
    gap: z.string(),
  })
  .strict();

export type NameCollision = z.infer<typeof nameCollisionSchema>;

export const nameScoreSchema = z
  .object({
    name: z.string(),
    ticker: z.string(),
    cashtag: z.string(),
    lettersOnly: z.boolean(),
    letterCount: z.number().int().min(0),
    syllableEstimate: z.number().int().min(1),
    spellable: z.boolean(),
    recognizable: z.boolean(),
    marketRecorded: z.boolean(),
    cashtagClear: z.boolean(),
    collision: nameCollisionSchema,
    score: z.number().int().min(0).max(100),
    preferred: z.boolean(),
    notes: z.array(z.string()),
  })
  .strict();

export type NameScore = z.infer<typeof nameScoreSchema>;

export const nameCandidateSchema = z
  .object({
    name: z.string().min(1).max(32),
    ticker: z.string().min(1).max(10),
    cashtagTaken: z.boolean().default(false),
  })
  .strict();

export const nameShortlistInputSchema = z
  .object({
    market: targetMarketSchema,
    candidates: z.array(nameCandidateSchema).min(1).max(12),
  })
  .strict();

export type NameShortlistInput = z.infer<typeof nameShortlistInputSchema>;

export const nameShortlistSchema = z
  .object({
    marketRecorded: z.literal(true),
    liveXSearch: z.literal(false),
    collisionMode: z.literal("local_heuristic"),
    gap: z.string(),
    ranked: z.array(nameScoreSchema),
    /** Highest preferred name, or null when none pass the hard rules. */
    best: nameScoreSchema.nullable(),
  })
  .strict();

export type NameShortlist = z.infer<typeof nameShortlistSchema>;

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

export function assessReadability(name: string): {
  spellable: boolean;
  recognizable: boolean;
  notes: string[];
} {
  const letters = name.toLowerCase().replace(/[^a-z]/g, "");
  const notes: string[] = [];
  const hasVowel = /[aeiouy]/.test(letters);
  const triple = /(.)\1\1/.test(letters);
  const consonantRun = /[^aeiouy]{4,}/.test(letters);
  if (letters.length < 2) {
    notes.push("Use at least two letters so the name can be recognized.");
  }
  if (!hasVowel) notes.push("Add a vowel so a person can say the name.");
  if (triple) {
    notes.push("Three of the same letter in a row is harder to spell on a first read.");
  }
  if (consonantRun) notes.push("Four consonants in a row is hard to spell.");
  const spellable = letters.length >= 2 && hasVowel && !triple && !consonantRun;
  const recognizable =
    letters.length >= 2 && letters.length <= 8 && hasVowel && !/^(.)\1+$/.test(letters);
  if (letters.length > 8) {
    notes.push("Past eight letters the name is harder to recognize at a glance.");
  }
  if (spellable) notes.push("The name looks spellable on a first read.");
  if (recognizable) notes.push("The length is in the recognizable range.");
  return { spellable, recognizable, notes };
}

function collisionHeuristic(
  name: string,
  ticker: string,
): { heuristicRisk: "low" | "medium" | "high"; reasons: string[] } {
  const symbol = ticker.toUpperCase().replace(/[^A-Z]/g, "");
  const word = name.toUpperCase().replace(/[^A-Z]/g, "");
  const reasons: string[] = [];
  const famous = WELL_KNOWN_TICKERS.has(symbol) || WELL_KNOWN_TICKERS.has(word);
  const generic = GENERIC_CASHTAGS.has(symbol) || GENERIC_CASHTAGS.has(word);
  if (famous) {
    reasons.push(
      `${symbol || word} matches a built-in list of well-known tickers. This is not an X search.`,
    );
  }
  if (generic) {
    reasons.push(
      `${symbol || word} is on a built-in list of generic words. A cashtag that common is a poor bet.`,
    );
  }
  if (symbol.length > 0 && symbol.length <= 2) {
    reasons.push(
      "Very short cashtags collide often. The local list cannot prove this one is free.",
    );
  }
  if (famous || generic) return { heuristicRisk: "high", reasons };
  if (symbol.length > 0 && symbol.length <= 2)
    return { heuristicRisk: "medium", reasons };
  return {
    heuristicRisk: "low",
    reasons: ["No built-in collision hit. This does not mean the X cashtag is free."],
  };
}

export function scoreTokenName(input: NameScoreInput): NameScore {
  const name = input.name.trim();
  const ticker = input.ticker.trim();
  const lettersOnly = /^[A-Za-z]+$/.test(name) && /^[A-Za-z]+$/.test(ticker);
  const letterCount = name.replace(/[^A-Za-z]/g, "").length;
  const syllableEstimate = estimateSyllables(name);
  const marketRecorded = input.market !== undefined;
  const cashtagClear = !input.cashtagTaken;
  const reading = assessReadability(name);
  const collisionHit = collisionHeuristic(name, ticker);
  const notes: string[] = [];
  let score = 100;

  if (!marketRecorded) {
    notes.push(
      "Record the target market with name_intake before this name can be preferred.",
    );
  } else {
    notes.push("Target market is recorded.");
  }
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
  } else if (letterCount === 1) {
    score -= 20;
    notes.push("One letter is too short to own as a name.");
  } else if (letterCount > 0) {
    notes.push(`Letter count is ${letterCount}.`);
  }
  if (!reading.spellable) score -= 25;
  if (!reading.recognizable) score -= 15;
  notes.push(...reading.notes);
  if (collisionHit.heuristicRisk === "high") score -= 30;
  if (collisionHit.heuristicRisk === "medium") score -= 8;
  notes.push(...collisionHit.reasons);
  if (!cashtagClear) {
    score -= 40;
    notes.push(
      `Cashtag $${ticker.toUpperCase()} is marked taken by the caller. Pick another ticker.`,
    );
  } else {
    notes.push(
      `Cashtag $${ticker.toUpperCase()} is marked clear by the caller. This is not an X search.`,
    );
  }

  score = Math.max(0, Math.min(100, score));
  const preferred =
    marketRecorded &&
    lettersOnly &&
    syllableEstimate === 1 &&
    letterCount >= 2 &&
    letterCount <= 5 &&
    reading.spellable &&
    reading.recognizable &&
    cashtagClear &&
    collisionHit.heuristicRisk !== "high";

  return nameScoreSchema.parse({
    name,
    ticker: ticker.toUpperCase(),
    cashtag: `$${ticker.toUpperCase()}`,
    lettersOnly,
    letterCount,
    syllableEstimate,
    spellable: reading.spellable,
    recognizable: reading.recognizable,
    marketRecorded,
    cashtagClear,
    collision: {
      mode: "local_heuristic",
      liveXSearch: false,
      callerReportedTaken: input.cashtagTaken,
      heuristicRisk: collisionHit.heuristicRisk,
      reasons: collisionHit.reasons,
      gap: NAME_COLLISION_GAP,
    },
    score,
    preferred,
    notes,
  });
}

function compareNameScores(a: NameScore, b: NameScore): number {
  if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
  if (a.score !== b.score) return b.score - a.score;
  if (a.syllableEstimate !== b.syllableEstimate) {
    return a.syllableEstimate - b.syllableEstimate;
  }
  if (a.letterCount !== b.letterCount) return a.letterCount - b.letterCount;
  return a.name.localeCompare(b.name);
}

/** Rank candidates against the hard rules. The market object is required. */
export function shortlistNames(input: NameShortlistInput): NameShortlist {
  const parsed = nameShortlistInputSchema.parse(input);
  const ranked = parsed.candidates
    .map((candidate) =>
      scoreTokenName({
        name: candidate.name,
        ticker: candidate.ticker,
        cashtagTaken: candidate.cashtagTaken,
        market: parsed.market,
      }),
    )
    .sort(compareNameScores);
  return nameShortlistSchema.parse({
    marketRecorded: true,
    liveXSearch: false,
    collisionMode: "local_heuristic",
    gap: NAME_COLLISION_GAP,
    ranked,
    best: ranked.find((item) => item.preferred) ?? null,
  });
}

export function recordTargetMarket(market: TargetMarket): {
  market: TargetMarket;
  marketRecorded: true;
  creationFee: "free";
  rule: string;
  diy: string;
} {
  const parsed = targetMarketSchema.parse(market);
  return {
    market: parsed,
    marketRecorded: true,
    creationFee: "free",
    rule: "Name the audience before the ticker. Pass this market into name_score or name_shortlist. Creation of the curve has no platform fee.",
    diy: "You can skip the tool and write the market down yourself. A name is not preferred until that market is passed in.",
  };
}

export const CLOUDFLARE_DOMAIN_STEPS = [
  "Write the target market down before you buy a name. Tool: name_intake. Writing it down yourself is enough.",
  "Score the word with name_score or name_shortlist. Prefer one syllable, few letters, letters only, and a cashtag that is not an obvious collision.",
  "Create a Cloudflare account that you own. Token Manager never holds that login.",
  "Optional availability hint: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the process environment. Do not paste them into a tool argument. With those unset, domain_plan stays offline.",
  "When the hint runs, it calls Cloudflare Intel WHOIS. It does not register the domain. A missing record is not a promise you can buy the name.",
  "In the Cloudflare dashboard, open Registrar and register the .com yourself. Prefer .com over other TLDs.",
  "Leave WHOIS contact privacy on. Cloudflare Registrar includes redaction. That is the private registration this project uses.",
  "Point DNS at the project site only after the name is final. The domain stays in your Cloudflare account if you leave Token Manager.",
] as const;

export const DOMAIN_AVAILABILITY_GAP =
  "No live availability check. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment (never as tool arguments) to call Cloudflare Intel WHOIS. This repo does not buy the domain. A WHOIS miss is not proof the .com is for sale.";

export const DOMAIN_OWNERSHIP_NOTE =
  "The domain stays on the founder's Cloudflare account. Token Manager does not become the registrar, the WHOIS contact, or the billing owner. If you leave, the domain keeps resolving. Buying it yourself in the dashboard is enough. The tools are guidance.";

export const domainAvailabilitySchema = z
  .object({
    checked: z.boolean(),
    /** False when WHOIS shows a registration. Null when unchecked or inconclusive. */
    available: z.boolean().nullable(),
    hostname: z.string().nullable(),
    source: z.enum(["offline", "cloudflare", "fixture"]),
    livePurchase: z.literal(false),
    registrar: z.literal("cloudflare"),
    gap: z.string(),
  })
  .strict();

export type DomainAvailability = z.infer<typeof domainAvailabilitySchema>;

export function offlineAvailability(
  hostname: string | null,
  gap = DOMAIN_AVAILABILITY_GAP,
): DomainAvailability {
  return domainAvailabilitySchema.parse({
    checked: false,
    available: null,
    hostname,
    source: "offline",
    livePurchase: false,
    registrar: "cloudflare",
    gap,
  });
}

export const domainPlanSchema = z
  .object({
    label: z.string(),
    hostname: z.string().nullable(),
    tld: z.literal(".com"),
    registrar: z.literal("cloudflare"),
    privacy: z.literal("whois_redaction"),
    acceptable: z.boolean(),
    purchased: z.literal(false),
    storesSecrets: z.literal(false),
    ownership: z.string(),
    notes: z.array(z.string()),
    connectSteps: z.array(z.string()),
    availability: domainAvailabilitySchema,
  })
  .strict();

export type DomainPlan = z.infer<typeof domainPlanSchema>;

export function planDomain(label: string, availability?: DomainAvailability): DomainPlan {
  const trimmed = label.trim();
  const lettersOnly = /^[A-Za-z]+$/.test(trimmed);
  const hostname = lettersOnly ? `${trimmed.toLowerCase()}.com` : null;
  const notes = [
    "Prefer a .com.",
    "Register it at Cloudflare with WHOIS redaction (private registration included).",
    "Buying the domain is a dashboard action on the founder's Cloudflare account. This tool does not purchase it.",
  ];
  if (!lettersOnly) {
    notes.unshift("The label must be letters only before it can be a hostname.");
  }
  const availabilityResult = lettersOnly
    ? (availability ?? offlineAvailability(hostname))
    : offlineAvailability(
        null,
        "The label must be letters only before an availability check.",
      );
  return domainPlanSchema.parse({
    label: trimmed,
    hostname,
    tld: ".com",
    registrar: "cloudflare",
    privacy: "whois_redaction",
    acceptable: lettersOnly,
    purchased: false,
    storesSecrets: false,
    ownership: DOMAIN_OWNERSHIP_NOTE,
    notes,
    connectSteps: [...CLOUDFLARE_DOMAIN_STEPS],
    availability: availabilityResult,
  });
}

export function connectDomainGuide(hostname?: string): {
  hostname: string | null;
  registered: false;
  purchased: false;
  storesSecrets: false;
  privacy: "whois_redaction";
  registrar: "cloudflare";
  ownership: string;
  diy: string;
  env: {
    tokenVariable: "CLOUDFLARE_API_TOKEN";
    accountVariable: "CLOUDFLARE_ACCOUNT_ID";
    required: false;
    acceptedInToolArgs: false;
    permission: string;
  };
  steps: string[];
} {
  return {
    hostname: hostname ?? null,
    registered: false,
    purchased: false,
    storesSecrets: false,
    privacy: "whois_redaction",
    registrar: "cloudflare",
    ownership: DOMAIN_OWNERSHIP_NOTE,
    diy: "Register the .com in your own Cloudflare dashboard. You do not have to call this tool.",
    env: {
      tokenVariable: "CLOUDFLARE_API_TOKEN",
      accountVariable: "CLOUDFLARE_ACCOUNT_ID",
      required: false,
      acceptedInToolArgs: false,
      permission: "Account Intel read, for the optional WHOIS hint only.",
    },
    steps: [...CLOUDFLARE_DOMAIN_STEPS],
  };
}

export const BRAND_PRINCIPLES = [
  "One simple mark. A person should recognize it at favicon size.",
  "Few colors and high contrast. Skip gradients, mockups, and tiny words inside the icon.",
  "The same mark becomes the avatar, the X header, the OG image, and the favicon.",
  "Letters in the name stay in the wordmark beside the mark, not crammed into a 32px icon.",
] as const;

export const brandAssetKindSchema = z.enum([
  "logo",
  "app_icon",
  "avatar",
  "x_header",
  "og",
  "favicon",
]);

export type BrandAssetKind = z.infer<typeof brandAssetKindSchema>;

/** Pixel sizes for the kit. Tests and the renderer both use these numbers. */
export const BRAND_PIXEL_SIZES = {
  logo: { width: 1024, height: 1024 },
  app_icon: { width: 512, height: 512 },
  avatar: { width: 400, height: 400 },
  x_header: { width: 1500, height: 500 },
  og: { width: 1200, height: 630 },
  favicon: { width: 32, height: 32 },
} as const satisfies Record<BrandAssetKind, { width: number; height: number }>;

export const BRAND_ASSET_SPECS: Record<
  BrandAssetKind,
  { pixels: string; width: number; height: number; note: string }
> = {
  logo: {
    ...BRAND_PIXEL_SIZES.logo,
    pixels: "1024x1024",
    note: "Square mark on a plain background. No words inside the mark.",
  },
  app_icon: {
    ...BRAND_PIXEL_SIZES.app_icon,
    pixels: "512x512",
    note: "The same mark, sized as an app icon. No words inside the mark.",
  },
  avatar: {
    ...BRAND_PIXEL_SIZES.avatar,
    pixels: "400x400",
    note: "The mark centered, still readable as a circle crop.",
  },
  x_header: {
    ...BRAND_PIXEL_SIZES.x_header,
    pixels: "1500x500",
    note: "Mark on the left, name on the right, lots of empty space. No profit claim.",
  },
  og: {
    ...BRAND_PIXEL_SIZES.og,
    pixels: "1200x630",
    note: "Mark plus the name. No invented launch time and no profit claim.",
  },
  favicon: {
    ...BRAND_PIXEL_SIZES.favicon,
    pixels: "32x32",
    note: "The mark alone. No small text.",
  },
};

export const BRAND_ASSET_OWNERSHIP =
  "These files belong to the founder. Download the SVGs and keep them in a repo or folder you control. Token Manager is not the source of truth for the brand. If you leave, the copies you saved still work. Guidance is optional.";

export const BRAND_ITERATION_NOTE =
  "Change variant from 0 to 11 after you look at the kit. Each variant is another geometric mark from the same name. Download the one you want to keep.";

export function brandAssetBrief(input: {
  name: string;
  kind: BrandAssetKind;
  background: "light" | "dark";
}): {
  generation: "svg";
  format: "image/svg+xml";
  kind: BrandAssetKind;
  name: string;
  background: "light" | "dark";
  pixels: string;
  width: number;
  height: number;
  note: string;
  principles: readonly string[];
  ownership: string;
} {
  const spec = BRAND_ASSET_SPECS[input.kind];
  return {
    generation: "svg",
    format: "image/svg+xml",
    kind: input.kind,
    name: input.name,
    background: input.background,
    pixels: spec.pixels,
    width: spec.width,
    height: spec.height,
    note: spec.note,
    principles: BRAND_PRINCIPLES,
    ownership: BRAND_ASSET_OWNERSHIP,
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
