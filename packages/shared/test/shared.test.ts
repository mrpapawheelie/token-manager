import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { z } from "zod";

import {
  CAVEMAN_TOPICS,
  DEV_BUY_SUPPLY_BPS,
  JOURNEY_STAGES,
  STAGE_INDEX,
  TOOL_CATALOG,
  buildBadges,
  buildFairLaunchAnnouncement,
  cavemanScript,
  checkTokenDesign,
  createProgressState,
  lockProofSchema,
  meteoraPoolConfigSchema,
  API_BUILDER_OPENAPI,
  CONTRACT_ADDRESS_PLACEHOLDER,
  PLATFORM_RULE_FOUNDER_OWNERSHIP,
  SITE_TEMPLATE_STACK,
  SCANNER_OPENAPI,
  SCANNER_RATE_LIMIT,
  TOKEN_CREATION_FEE,
  WEEKLY_MILESTONES,
  brandAssetBrief,
  buildScannerToken,
  describeEndpoints,
  locateProjectData,
  compareOriginality,
  mockXAnalytics,
  placeholderScanNotification,
  prelaunchChecklist,
  planDomain,
  planFounderGithubRepo,
  x402EndpointSpec,
  quoteDevBuy,
  quoteTokenPrice,
  radarGuide,
  redactSecrets,
  reviewGuardianGate,
  scoreIdentity,
  scoreProfile,
  scoreTokenName,
  tokenDesignSchema,
  toolInputSchemas,
} from "../src/index.ts";

const ADDRESS = "11111111111111111111111111111111";

const signals = {
  hasListingMeta: true,
  launchTimeNamed: true,
  dumpHonestyAcknowledged: true,
  hasX: true,
  hasTelegram: true,
  hasGithub: true,
  devBuyNearRule: true,
  liquidityLocked: false,
  autoCompounding: false,
  teamLockPublished: false,
};

function requiresLiteralTrue(schema: z.ZodTypeAny, key: string): boolean {
  if (!(schema instanceof z.ZodObject)) return false;
  const field = schema.shape[key] as z.ZodTypeAny | undefined;
  return field instanceof z.ZodLiteral && field.value === true;
}

describe("journey and tools", () => {
  it("keeps stage order and indexes", () => {
    assert.equal(JOURNEY_STAGES.length, 11);
    assert.equal(JOURNEY_STAGES[0], "prep_weeks_out");
    assert.equal(JOURNEY_STAGES[10], "year_one_ops");
    for (const stage of JOURNEY_STAGES) {
      assert.equal(JOURNEY_STAGES[STAGE_INDEX[stage]], stage);
    }
  });

  it("requires confirm and guardian fields on the tools that spend or gate", () => {
    for (const tool of TOOL_CATALOG) {
      const schema = toolInputSchemas[tool.name];
      if (tool.spendy) {
        assert.equal(requiresLiteralTrue(schema, "confirm"), true, tool.name);
      }
      if (tool.guardian) {
        assert.equal(
          requiresLiteralTrue(schema, "guardianAcknowledged"),
          true,
          tool.name,
        );
      }
    }
  });
});

describe("liquidity and honesty", () => {
  it("quotes a 5% dev buy", () => {
    const quote = quoteDevBuy(1_000_000_000, DEV_BUY_SUPPLY_BPS);
    assert.equal(quote.devBuyTokenUi, 50_000_000);
    assert.equal(quote.withinRuleOfThumb, true);
  });

  it("rejects a design that hides the dump caveat", () => {
    const result = checkTokenDesign({
      launchStyle: "bonding_curve",
      name: "Sample",
      symbol: "SAM",
      description: "A bonding-curve coin.",
      category: "tooling",
      supplyUi: 1_000_000_000,
      decimals: 6,
      devBuySupplyBps: 500,
      launchAt: "2026-12-01T16:00:00.000Z",
      dumpHonestyAcknowledged: false,
      snipersCommonAcknowledged: true,
      socials: {},
    });
    assert.equal(result.valid, false);
  });

  it("rejects classic mint-first as the launch style", () => {
    const parsed = tokenDesignSchema.safeParse({
      launchStyle: "mint_first",
      name: "Sample",
      symbol: "SAM",
      description: "nope",
      category: "tooling",
      supplyUi: 1,
      decimals: 6,
      devBuySupplyBps: 500,
      launchAt: "2026-12-01T16:00:00.000Z",
      dumpHonestyAcknowledged: true,
      snipersCommonAcknowledged: true,
      socials: {},
    });
    assert.equal(parsed.success, false);
  });

  it("fixes Meteora compounding at 10000", () => {
    const parsed = meteoraPoolConfigSchema.safeParse({
      contract: ADDRESS,
      quoteSymbol: "SOL",
      priceSource: "codex",
      compoundingFeeBps: 0,
    });
    assert.equal(parsed.success, false);
    const lock = lockProofSchema.safeParse({
      kind: "meteora_damm_v2_lp",
      subject: ADDRESS,
      locker: "meteora-damm-v2",
      quoteSymbol: "SOL",
    });
    assert.equal(lock.success, false);
  });

  it("writes the dump and sniper warning into launch copy", () => {
    const copy = buildFairLaunchAnnouncement({
      name: "Sample",
      symbol: "SAM",
      launchAt: "2026-12-01T16:00:00.000Z",
      devBuySupplyBps: 500,
      supplyUi: 1_000_000_000,
      socials: { x: "sample" },
    });
    assert.match(copy, /dump after graduation is typical/i);
    assert.match(copy, /Snipers and bundlers are common/);
    assert.match(copy, /does not ship them/);
    assert.equal(/jito bundle/i.test(copy), false);
  });

  it("keeps caveman scripts free of key material", () => {
    for (const topic of CAVEMAN_TOPICS) {
      const script = cavemanScript(topic);
      assert.equal(/private key/i.test(script), false);
      assert.ok(script.length > 20);
    }
  });
});

describe("profile, identity, guardian, price", () => {
  it("scores 7 of 10 checks as 70 percent and leaves locks grey", () => {
    const score = scoreProfile(signals);
    assert.equal(score.percent, 70);
    const badges = buildBadges(signals, "none");
    const lock = badges.find((badge) => badge.id === "locked_liquidity");
    const x = badges.find((badge) => badge.id === "x");
    assert.equal(lock?.active, false);
    assert.equal(x?.active, true);
  });

  it("scores identity from published weights and adds nothing for mode", () => {
    const anonymous = scoreIdentity({
      mode: "anonymous_verified",
      claimProofs: [],
    });
    const named = scoreIdentity({
      mode: "public",
      claimProofs: [],
    });
    assert.equal(anonymous.total, 15);
    assert.equal(named.total, 15);
    const withX = scoreIdentity({
      mode: "public",
      xHandle: "sample",
      xPremium: true,
      claimProofs: [
        {
          id: "c1",
          statement: "Repo is public",
          evidenceUri: "https://example.com/repo",
          aiCheckable: true,
          status: "supported",
        },
      ],
      externalIdProvider: "example-id",
    });
    assert.equal(withX.total, 25 + 10 + 20 + 15);
    assert.equal("badge" in withX, false);
  });

  it("does not treat a guardian acknowledgement as enforcement", () => {
    const blocked = reviewGuardianGate(
      {
        projectId: "sample",
        requiredFor: ["add_admin"],
        factors: [{ kind: "wallet", walletAddress: ADDRESS }],
        threshold: 1,
      },
      "add_admin",
      undefined,
    );
    assert.equal(blocked.status, "stub_blocked");
    assert.equal(blocked.enforced, false);
    const acknowledged = reviewGuardianGate(
      {
        projectId: "sample",
        requiredFor: ["large_liquidity"],
        factors: [{ kind: "totp", totpEnrolled: true }],
        threshold: 1,
      },
      "large_liquidity",
      { acknowledged: true, method: "totp" },
    );
    assert.equal(acknowledged.status, "stub_acknowledged");
    assert.equal(acknowledged.enforced, false);
  });

  it("stubs both price sources", () => {
    const codex = quoteTokenPrice({
      contract: ADDRESS,
      quoteSymbol: "SOL",
      priceSource: "codex",
    });
    const chain = quoteTokenPrice({
      contract: ADDRESS,
      quoteSymbol: "USDC",
      priceSource: "onchain",
    });
    assert.equal(codex.status, "not_implemented");
    assert.equal(codex.priceUi, null);
    assert.equal(chain.priceSource, "onchain");
    assert.match(codex.next, /Codex/);
  });
});

describe("naming, domain, and attention", () => {
  it("prefers a short letters-only name with a clear cashtag", () => {
    const preferred = scoreTokenName({ name: "Mox", ticker: "MOX", cashtagTaken: false });
    assert.equal(preferred.preferred, true);
    assert.equal(preferred.syllableEstimate, 1);
    assert.equal(preferred.cashtag, "$MOX");
    assert.equal(preferred.score, 100);

    const long = scoreTokenName({
      name: "Moonshot",
      ticker: "MOON",
      cashtagTaken: false,
    });
    assert.equal(long.syllableEstimate, 2);
    assert.equal(long.preferred, false);
    assert.ok(long.score < preferred.score);

    const marked = scoreTokenName({ name: "Mox1", ticker: "MOX1", cashtagTaken: true });
    assert.equal(marked.lettersOnly, false);
    assert.equal(marked.cashtagClear, false);
    assert.equal(marked.preferred, false);
  });

  it("plans a Cloudflare .com and does not invent a Radar API", () => {
    const domain = planDomain("Mox");
    assert.equal(domain.hostname, "mox.com");
    assert.equal(domain.registrar, "cloudflare");
    assert.equal(domain.privacy, "whois_redaction");
    assert.equal(planDomain("mox-1").hostname, null);

    const radar = radarGuide({
      ticker: "mox",
      keyword: "launch week",
      tier: "premium_plus",
    });
    assert.equal(radar.exportApi, "none_documented");
    assert.equal(radar.cashtag, "$MOX");
    assert.match(radar.steps.join(" "), /no documented Radar export API/);

    const chart = mockXAnalytics("@northcurve");
    assert.equal(chart.mock, true);
    assert.equal(chart.apiCalled, false);
    assert.equal(
      brandAssetBrief({ name: "Mox", kind: "favicon", background: "light" }).generation,
      "todo",
    );
    assert.equal(TOKEN_CREATION_FEE, "free");
    assert.ok(WEEKLY_MILESTONES.every((item) => item.perk === "tbd"));
  });
});

describe("founder ownership and scanner flags", () => {
  it("keeps founder ownership non-negotiable and optional", () => {
    assert.equal(PLATFORM_RULE_FOUNDER_OWNERSHIP.nonNegotiable, true);
    assert.equal(PLATFORM_RULE_FOUNDER_OWNERSHIP.optional, true);
    assert.equal(PLATFORM_RULE_FOUNDER_OWNERSHIP.blocksDiy, false);
    assert.match(PLATFORM_RULE_FOUNDER_OWNERSHIP.text, /leaves Token Manager/);
  });

  it("does not invent a pass when a check is missing", () => {
    const token = buildScannerToken({
      id: "sample",
      name: "Sample",
      symbol: "SAM",
      category: "tooling",
      shortDescription: "Missing checks stay empty.",
      mock: true,
      flags: {
        connectedX: false,
        verificationStatus: "pending",
        claims: [],
      },
    });
    assert.equal(token.live, false);
    assert.equal(token.verification.connected_x, false);
    assert.equal(token.verification.connected_github, "unverified");
    assert.equal(token.verification.id_verified, "unverified");
    assert.equal(token.verification.lp_locked_tier, "unverified");
    assert.equal(token.verification.auto_compound, "unverified");
    assert.equal(token.verification.profile_completion, null);
    assert.deepEqual(token.verification.claim_fields, []);
    assert.equal(SCANNER_RATE_LIMIT.enforced, false);
    assert.equal(
      SCANNER_OPENAPI.paths["/api/scanner/tokens/{id}"].get.responses[
        "404"
      ].description.includes("null"),
      true,
    );
    const hook = placeholderScanNotification();
    assert.equal(hook.enqueued, false);
    assert.equal(hook.webhookCalled, false);
  });

  it("compares claims locally and refuses a platform GitHub org", () => {
    const empty = compareOriginality({ name: "Mox", statement: "A wallet helper." });
    assert.equal(empty.verdict, "unchecked");
    assert.equal(empty.unique, null);
    assert.equal(empty.searched, false);
    const overlap = compareOriginality({
      name: "Mox",
      statement: "A wallet helper for founders.",
      corpus: [{ name: "Other", summary: "A wallet helper for founders." }],
    });
    assert.equal(overlap.verdict, "possible_overlap");
    assert.equal(overlap.unique, null);
    const repo = planFounderGithubRepo({
      founderLogin: "token-manager",
      repoName: "launch",
      action: "create",
    });
    assert.equal(repo.acceptable, false);
    assert.equal(repo.owner, null);
    assert.equal(repo.created, false);
    assert.equal(repo.platformOrg, null);
  });
});

describe("prelaunch and api builder", () => {
  it("keeps pre-launch free and before a mint", () => {
    const plan = prelaunchChecklist({ publish_site: true });
    assert.equal(plan.fee, "free");
    assert.equal(plan.mint, false);
    assert.equal(plan.blocksLaunch, false);
    assert.deepEqual(
      plan.steps.map((step) => step.id),
      ["publish_site", "create_x", "publish_account", "first_ama", "hype_cadence"],
    );
    assert.equal(plan.steps[0]?.done, true);
    assert.equal(plan.steps[1]?.done, false);
    assert.equal(SITE_TEMPLATE_STACK.ui, "shadcn/ui");
    assert.equal(SITE_TEMPLATE_STACK.forms, "zod");
    assert.match(CONTRACT_ADDRESS_PLACEHOLDER, /publishes at launch/);
  });

  it("does not invent data, a balance, or an x402 charge", () => {
    const missing = locateProjectData("none");
    assert.equal(missing.found, false);
    assert.equal(missing.live, false);
    assert.deepEqual(describeEndpoints("").endpoints, []);
    const payable = x402EndpointSpec();
    assert.equal(payable.endpoint.auth, "x402");
    assert.equal(payable.endpoint.live, false);
    assert.equal(payable.x402.httpStatus, 402);
    assert.equal(payable.x402.implemented, false);
    assert.equal(payable.x402.payTo, "founder");
    assert.equal(payable.x402.platformReceivesFunds, false);
    assert.match(
      API_BUILDER_OPENAPI.paths["/v1/project/summary"].get.responses["402"].description,
      /Payment Required/,
    );
  });
});

describe("redaction and readme", () => {
  it("redacts secret keys and long base58 strings", () => {
    const secret = "5".repeat(88);
    const redacted = redactSecrets({
      note: secret,
      privateKey: "hunter2",
      walletAddress: ADDRESS,
      nested: { api_key: "abc" },
    });
    assert.equal(redacted.note, "[redacted]");
    assert.equal(redacted.privateKey, "[redacted]");
    assert.equal(redacted.walletAddress, ADDRESS);
    assert.equal(redacted.nested.api_key, "[redacted]");
    const state = createProgressState("default");
    state.notes.push(secret);
    assert.equal(redactSecrets(state).notes[0], "[redacted]");
  });

  it("documents the product rules in the readme", () => {
    const readme = readFileSync(new URL("../../../README.md", import.meta.url), "utf8");
    for (const phrase of [
      "5%",
      "sniper",
      "compounding_fee_bps",
      "10000",
      "cliff",
      "X Premium",
      "Caveman",
      "Codex",
      "$1",
      "OAuth",
      "anonymous",
      "Sign-In With Solana",
      "guardian",
      "TOTP",
      "passkey",
      "70%",
      "Cloudflare",
      "creation is free",
      "Radar",
      "no documented Radar export API",
      "founder ownership",
      "leaves Token Manager",
      "unverified",
      "wire project data",
      "x402",
    ]) {
      assert.equal(readme.includes(phrase), true, phrase);
    }
  });
});
