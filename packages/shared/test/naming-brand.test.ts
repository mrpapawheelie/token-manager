import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  BRAND_PIXEL_SIZES,
  NAME_COLLISION_GAP,
  NAME_RULES,
  interpretWhoisLookup,
  lookupComAvailability,
  planDomain,
  renderBrandAsset,
  renderBrandKit,
  scoreTokenName,
  shortlistNames,
  toolInputSchemas,
  type TargetMarket,
} from "../src/index.ts";
import { writeBrandAssets } from "../src/brand-files.ts";

const market: TargetMarket = {
  audience: "People who say the name out loud",
  problem: "Long coin names get mistyped",
  category: "tooling",
  tone: "plain",
};

describe("name scoring", () => {
  it("covers the hard rules in the shared table", () => {
    const ids = NAME_RULES.map((rule) => rule.id);
    assert.deepEqual(ids, [
      "market",
      "syllables",
      "letters",
      "letters_only",
      "spellable",
      "recognizable",
      "cashtag",
    ]);
  });

  it("refuses a preferred name until the market is recorded", () => {
    const scored = scoreTokenName({ name: "Mox", ticker: "MOX", cashtagTaken: false });
    assert.equal(scored.marketRecorded, false);
    assert.equal(scored.preferred, false);
    assert.match(scored.notes.join(" "), /name_intake/);
  });

  it("penalizes hyphens, numbers, extra syllables, and a caller-reported collision", () => {
    const hyphen = scoreTokenName({
      name: "mo-x",
      ticker: "MOX",
      cashtagTaken: false,
      market,
    });
    assert.equal(hyphen.lettersOnly, false);
    assert.equal(hyphen.preferred, false);

    const numbered = scoreTokenName({
      name: "Mox1",
      ticker: "MOX",
      cashtagTaken: false,
      market,
    });
    assert.equal(numbered.lettersOnly, false);

    const long = scoreTokenName({
      name: "Moonshot",
      ticker: "SHOT",
      cashtagTaken: false,
      market,
    });
    assert.equal(long.syllableEstimate, 2);
    assert.equal(long.preferred, false);
    assert.ok(long.score < 100);

    const taken = scoreTokenName({
      name: "Mox",
      ticker: "MOX",
      cashtagTaken: true,
      market,
    });
    assert.equal(taken.cashtagClear, false);
    assert.equal(taken.collision.callerReportedTaken, true);
    assert.equal(taken.collision.liveXSearch, false);
    assert.equal(taken.preferred, false);
  });

  it("flags famous tickers with a local heuristic and does not invent an X result", () => {
    const famous = scoreTokenName({
      name: "Bit",
      ticker: "BTC",
      cashtagTaken: false,
      market,
    });
    assert.equal(famous.collision.mode, "local_heuristic");
    assert.equal(famous.collision.liveXSearch, false);
    assert.equal(famous.collision.heuristicRisk, "high");
    assert.equal(famous.collision.gap, NAME_COLLISION_GAP);
    assert.equal(famous.preferred, false);
    assert.match(famous.collision.reasons.join(" "), /not an X search/i);

    const mush = scoreTokenName({
      name: "Bcdf",
      ticker: "BCDF",
      cashtagTaken: false,
      market,
    });
    assert.equal(mush.spellable, false);
    assert.equal(mush.recognizable, false);
    assert.equal(mush.preferred, false);
  });

  it("ranks a shortlist and keeps the collision gap honest", () => {
    const list = shortlistNames({
      market,
      candidates: [
        { name: "Moonshot", ticker: "SHOT", cashtagTaken: false },
        { name: "Mox1", ticker: "MOX1", cashtagTaken: true },
        { name: "Mox", ticker: "MOX", cashtagTaken: false },
      ],
    });
    assert.equal(list.liveXSearch, false);
    assert.equal(list.best?.name, "Mox");
    assert.equal(list.ranked[0]?.name, "Mox");
    assert.equal(list.ranked[0]?.preferred, true);
    assert.equal(
      toolInputSchemas.name_shortlist.safeParse({
        candidates: [{ name: "Mox", ticker: "MOX" }],
      }).success,
      false,
    );
  });
});

describe("domain plan", () => {
  it("stays offline without a token and rejects a token field", () => {
    let called = false;
    return lookupComAvailability("Mox", {
      env: {},
      fetchImpl: () => {
        called = true;
        throw new Error("network");
      },
    }).then((result) => {
      assert.equal(called, false);
      assert.equal(result.checked, false);
      assert.equal(result.available, null);
      assert.equal(result.source, "offline");
      assert.equal(result.livePurchase, false);
      assert.equal(JSON.stringify(result).includes("secret-token"), false);

      const plan = planDomain("Mox", result);
      assert.equal(plan.hostname, "mox.com");
      assert.equal(plan.purchased, false);
      assert.equal(plan.storesSecrets, false);
      assert.equal(plan.privacy, "whois_redaction");

      assert.equal(
        toolInputSchemas.domain_plan.safeParse({
          label: "Mox",
          apiToken: "secret-token",
        }).success,
        false,
      );
      assert.equal(
        toolInputSchemas.domain_connect.safeParse({
          hostname: "mox.com",
          apiKey: "secret-token",
        }).success,
        false,
      );
    });
  });

  it("reads WHOIS fixtures without calling Cloudflare", () => {
    const registered = JSON.parse(
      readFileSync(
        new URL("./fixtures/cloudflare-whois-registered.json", import.meta.url),
        "utf8",
      ),
    ) as unknown;
    const miss = JSON.parse(
      readFileSync(
        new URL("./fixtures/cloudflare-whois-miss.json", import.meta.url),
        "utf8",
      ),
    ) as unknown;
    const taken = interpretWhoisLookup("example.com", 200, registered);
    assert.equal(taken.available, false);
    assert.equal(taken.checked, true);
    assert.equal(taken.livePurchase, false);
    const unknown = interpretWhoisLookup("mox.com", 404, miss);
    assert.equal(unknown.available, null);
    assert.equal(unknown.checked, true);
    assert.match(unknown.gap, /not proof/i);

    let seenAuth = "";
    return lookupComAvailability("Mox", {
      env: { token: "secret-token", accountId: "acct" },
      fetchImpl: (_url, init) => {
        const headers = new Headers(init?.headers);
        seenAuth = headers.get("authorization") ?? "";
        return Promise.resolve(new Response(JSON.stringify(registered), { status: 200 }));
      },
    }).then((result) => {
      assert.equal(result.available, false);
      assert.equal(seenAuth, "Bearer secret-token");
      assert.equal(JSON.stringify(result).includes("secret-token"), false);
    });
  });
});

describe("brand kit", () => {
  it("locks the pixel sizes", () => {
    assert.deepEqual(BRAND_PIXEL_SIZES.logo, { width: 1024, height: 1024 });
    assert.deepEqual(BRAND_PIXEL_SIZES.app_icon, { width: 512, height: 512 });
    assert.deepEqual(BRAND_PIXEL_SIZES.avatar, { width: 400, height: 400 });
    assert.deepEqual(BRAND_PIXEL_SIZES.x_header, { width: 1500, height: 500 });
    assert.deepEqual(BRAND_PIXEL_SIZES.og, { width: 1200, height: 630 });
    assert.deepEqual(BRAND_PIXEL_SIZES.favicon, { width: 32, height: 32 });
  });

  it("writes real SVG files at those sizes", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "brand-"));
    const written = writeBrandAssets(
      { name: "Mox", background: "light", variant: 0, subtitle: "tooling" },
      directory,
    );
    assert.equal(written.length, 6);
    for (const asset of written) {
      const svg = readFileSync(asset.absolutePath, "utf8");
      assert.equal(svg, asset.svg);
      assert.match(svg, new RegExp(`width="${asset.width}"`));
      assert.match(svg, new RegExp(`height="${asset.height}"`));
      assert.match(svg, /<svg/);
      assert.equal(/<script/i.test(svg), false);
      assert.equal(/<image/i.test(svg), false);
      assert.equal(asset.width, BRAND_PIXEL_SIZES[asset.kind].width);
      assert.equal(asset.height, BRAND_PIXEL_SIZES[asset.kind].height);
    }
    const favicon = written.find((asset) => asset.kind === "favicon");
    const header = written.find((asset) => asset.kind === "x_header");
    const og = written.find((asset) => asset.kind === "og");
    assert.equal(favicon?.width, 32);
    assert.equal(/<text/i.test(favicon?.svg ?? ""), false);
    assert.match(header?.svg ?? "", />Mox</);
    assert.match(og?.svg ?? "", />Mox</);
    assert.match(og?.svg ?? "", /tooling/);
    assert.match(written[0]?.ownership ?? "", /founder/i);

    const hype = renderBrandAsset({
      name: "Mox",
      kind: "og",
      background: "light",
      subtitle: "guaranteed 100x",
    });
    assert.equal(/100x/i.test(hype.svg), false);
    assert.equal(/guaranteed/i.test(hype.svg), false);

    const kit = renderBrandKit({ name: "Mox", background: "dark", variant: 1 });
    const light = renderBrandAsset({
      name: "Mox",
      kind: "logo",
      background: "light",
      variant: 0,
    });
    const next = kit.find((asset) => asset.kind === "logo");
    assert.notEqual(light.svg, next?.svg);
    assert.equal(
      toolInputSchemas.brand_generate.safeParse({
        name: "Mox",
        kind: "logo",
        seed: "not-a-field",
      }).success,
      false,
    );
  });
});
