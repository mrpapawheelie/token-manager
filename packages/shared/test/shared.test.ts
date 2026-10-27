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
  assessCredentials,
  AGENT_TEASER,
  AUDIT_SLOT,
  CREDIBILITY,
  JOURNEY_SYNC,
  SECURITY_DISCLAIMER,
  buildScannerToken,
  buildWalletProof,
  chooseFeePolicy,
  creationActorMeta,
  creationActorMetaSchema,
  daoPlaybook,
  feePolicyChoiceSchema,
  postCreateLock,
  postCreateLockSchema,
  kycBadges,
  describeEndpoints,
  locateProjectData,
  compareOriginality,
  mockXAnalytics,
  placeholderScanNotification,
  prelaunchChecklist,
  planDomain,
  privySessionStub,
  reviewEmailProof,
  planFounderGithubRepo,
  reviewXHeuristics,
  tier1AttestationStub,
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
    const actor = creationActorMeta({ actorType: "human", surface: "web" });
    const token = buildScannerToken({
      id: "sample",
      name: "Sample",
      symbol: "SAM",
      category: "tooling",
      shortDescription: "Missing checks stay empty.",
      mock: true,
      actor,
      feePolicy: "earmarked",
      finalized: false,
      flags: {
        connectedX: false,
        verificationStatus: "pending",
        claims: [],
      },
    });
    assert.equal(token.live, false);
    assert.equal(token.actor.agent_created, false);
    assert.equal(token.actor.no_human, false);
    assert.equal(token.postCreateLock.platformAdminCanChange, true);
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

describe("credentials", () => {
  it("tags actions and does not grade or auto-verify", () => {
    const empty = assessCredentials({ category: "tooling" });
    assert.equal(empty.aiCalled, false);
    assert.equal(empty.gradesPeople, false);
    assert.equal(empty.ratings, null);
    assert.equal(
      empty.tags.every((tag) => tag.active === false && tag.rating === null),
      true,
    );
    const recorded = assessCredentials({
      category: "tooling",
      recorded: { eth_aligned_contrib: true },
    });
    assert.equal(
      recorded.tags.find((tag) => tag.id === "eth_aligned_contrib")?.active,
      true,
    );
    assert.equal(
      recorded.tags.find((tag) => tag.id === "gitcoin_passport")?.active,
      false,
    );

    const proof = buildWalletProof(ADDRESS);
    assert.equal(proof.method, "siws");
    assert.equal(proof.verified, false);
    assert.equal(proof.pastedMembershipUrl, "rejected");
    const pasted = toolInputSchemas.cred_resolve_membership.safeParse({
      source: "gitcoin_passport",
      walletAddress: ADDRESS,
      membershipUrl: "https://example.com/passport",
    });
    assert.equal(pasted.success, false);

    const review = reviewXHeuristics({
      subjectLabel: "sample",
      longInactivityThenLaunchSpam: true,
      voiceStyleShift: false,
    });
    assert.equal(review.published, false);
    assert.equal(review.verified, false);
    assert.equal(review.items[0]?.visibility, "private");
    assert.equal(review.items[0]?.verified, false);
    assert.equal(review.items[0]?.autoPublished, false);
  });
});

describe("optional kyc", () => {
  it("does not attest tier 1 and blocks a mismatched oauth email", () => {
    const tier1 = tier1AttestationStub("coinbase");
    assert.equal(tier1.attested, false);
    assert.equal(tier1.apiCapability, "unverified");
    const badges = kycBadges({ 1: true, 2: true, 3: true });
    assert.equal(badges.length, 3);
    assert.equal(
      badges.every((badge) => badge.stackable && badge.vendorAttested === false),
      true,
    );
    assert.equal(badges[0]?.active, false);
    assert.equal(badges[1]?.active, true);
    assert.equal(badges[2]?.active, true);

    const mismatch = reviewEmailProof({
      registrationEmail: "Founder@Example.com",
      oauthEmail: "other@example.com",
      oauthProvider: "google",
    });
    assert.equal(mismatch.status, "mismatch_needs_magic_link");
    assert.equal(mismatch.oauthIsIdentityProof, false);
    assert.equal(mismatch.magicLinkSent, false);
    const matched = reviewEmailProof({
      registrationEmail: "founder@example.com",
      oauthEmail: "Founder@Example.com",
    });
    assert.equal(matched.status, "matched");
    assert.equal(matched.oauthIsIdentityProof, true);

    const privy = privySessionStub();
    assert.equal(privy.authenticated, false);
    assert.equal(privy.plan, "free");
    assert.equal(privy.alongside, "siws");
  });
});

describe("dual surface and agent creators", () => {
  it("labels an agent and rejects a mixed flag", () => {
    const agent = creationActorMeta({ actorType: "agent", surface: "mcp" });
    assert.equal(agent.actor_type, "agent");
    assert.equal(agent.agent_created, true);
    assert.equal(agent.no_human, true);
    assert.equal(agent.sessionId, "stub-shared-session");
    assert.equal(JOURNEY_SYNC.liveSync, false);
    assert.equal(JOURNEY_SYNC.sharedStageOrder, true);
    const human = creationActorMeta({ actorType: "human", surface: "web" });
    assert.equal(human.agent_created, false);
    assert.equal(human.no_human, false);
    const mixed = creationActorMetaSchema.safeParse({
      actor_type: "agent",
      sessionId: "stub-shared-session",
      surface: "mcp",
      agent_created: true,
      no_human: false,
    });
    assert.equal(mixed.success, false);
  });

  it("keeps human_withdrawable off agent creates and freezes an agent finalize", () => {
    const denied = feePolicyChoiceSchema.safeParse({
      actorType: "agent",
      policy: "human_withdrawable",
    });
    assert.equal(denied.success, false);
    const humanFee = chooseFeePolicy({
      actorType: "human",
      policy: "human_withdrawable",
    });
    assert.equal(humanFee.discouraged, true);
    assert.equal(humanFee.network, false);
    const lock = postCreateLock({ actorType: "agent", finalized: true });
    assert.equal(lock.mintAdmin, "immutable");
    assert.equal(lock.lpAdmin, "immutable");
    assert.equal(lock.feeAdmin, "immutable");
    assert.equal(lock.retcon, "non_retcon");
    assert.equal(lock.platformAdminCanChange, false);
    const opened = postCreateLockSchema.safeParse({
      ...lock,
      mintAdmin: "mutable",
    });
    assert.equal(opened.success, false);
    const playbook = daoPlaybook("agent");
    assert.equal(playbook.votesSent, false);
    assert.equal(playbook.humanNotified, false);
    assert.match(playbook.teaser, /Give the agent the MCP/);
    assert.equal(AUDIT_SLOT.completed, false);
    assert.equal(AUDIT_SLOT.auditor, null);
    assert.match(SECURITY_DISCLAIMER, /not a security audit/);
    assert.equal(CREDIBILITY.listing, "wysiwyg");
    assert.equal(CREDIBILITY.repoClonable, true);
    assert.match(AGENT_TEASER, /notifies the human/);

    const scanned = buildScannerToken({
      id: "agent-row",
      name: "Agent Row",
      symbol: "AGENT",
      category: "tooling",
      shortDescription: "Labeled for buyers and scanners.",
      mock: true,
      actor: creationActorMeta({ actorType: "agent", surface: "mcp" }),
      feePolicy: "dao_governed",
      finalized: true,
      flags: { claims: [] },
    });
    assert.equal(scanned.actor.agent_created, true);
    assert.equal(scanned.actor.no_human, true);
    assert.equal(scanned.postCreateLock.retcon, "non_retcon");
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
      "do not grade people",
      "Buyers decide",
      "does not invent an attestation",
      "magic link",
      "Privy",
      "web or MCP",
      "agent-created",
      "stub-shared-session",
      "human_withdrawable",
      "non-retcon",
      "Give the agent the MCP",
      "third-party audit",
      "WYSIWYG",
      "not a live API",
      "function map",
      "clonable",
    ]) {
      assert.equal(readme.includes(phrase), true, phrase);
    }
  });
});
