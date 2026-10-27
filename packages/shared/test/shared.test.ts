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
  quoteDevBuy,
  quoteTokenPrice,
  redactSecrets,
  reviewGuardianGate,
  scoreIdentity,
  scoreProfile,
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
    ]) {
      assert.equal(readme.includes(phrase), true, phrase);
    }
  });
});
