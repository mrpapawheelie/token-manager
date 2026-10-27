import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { TOOL_CATALOG } from "@token-manager/shared";

import { createTokenManagerServer } from "../src/server.ts";

const scratch = mkdtempSync(path.join(tmpdir(), "token-manager-"));
process.env.TOKEN_MANAGER_SESSION_PATH = path.join(scratch, "session.json");
process.env.TOKEN_MANAGER_BRAND_DIR = path.join(scratch, "brand");
delete process.env.CLOUDFLARE_API_TOKEN;
delete process.env.CLOUDFLARE_ACCOUNT_ID;

const ADDRESS = "11111111111111111111111111111111";

const design = {
  launchStyle: "bonding_curve",
  name: "Sample",
  symbol: "SAM",
  description: "Bonding-curve sample for the test.",
  category: "tooling",
  supplyUi: 1_000_000_000,
  decimals: 6,
  devBuySupplyBps: 500,
  launchAt: "2026-12-01T16:00:00.000Z",
  dumpHonestyAcknowledged: true,
  snipersCommonAcknowledged: true,
  socials: { x: "sample" },
};

async function withClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const server = createTokenManagerServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "token-manager-test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await run(client);
  } finally {
    await client.close();
    await server.close();
  }
}

function textOf(result: { content: unknown }): string {
  const content = result.content as Array<{ text?: string }>;
  return content.map((item) => item.text ?? "").join("\n");
}

describe("mcp server", () => {
  it("lists every catalog tool", async () => {
    await withClient(async (client) => {
      const listed = await client.listTools();
      const names = listed.tools.map((tool) => tool.name).sort();
      const expected = TOOL_CATALOG.map((tool) => tool.name).sort();
      assert.deepEqual(names, expected);
      for (const prefix of [
        "admin_",
        "badge_",
        "score_",
        "ai_chat_",
        "ads_",
        "meteora_",
        "launch_curve_",
        "name_",
        "domain_",
        "brand_",
        "claims_",
        "originality_",
        "github_",
        "scanner_",
        "prelaunch_",
        "api_builder_",
        "cred_",
        "kyc_",
      ]) {
        assert.equal(
          names.some((name) => name.startsWith(prefix)),
          true,
          prefix,
        );
      }
    });
  });

  it("tracks progress, redacts notes, and leaves spendy tools unimplemented", async () => {
    await withClient(async (client) => {
      const progress = JSON.parse(
        textOf(
          await client.callTool({
            name: "get_progress",
            arguments: { sessionId: "mcp-test" },
          }),
        ),
      ) as { data: { stageIndex: number; state: { currentStage: string } } };
      assert.equal(progress.data.stageIndex, 0);
      assert.equal(progress.data.state.currentStage, "prep_weeks_out");

      const secret = "5".repeat(88);
      const resumed = JSON.parse(
        textOf(
          await client.callTool({
            name: "resume",
            arguments: {
              sessionId: "mcp-test",
              markCurrentComplete: true,
              note: secret,
            },
          }),
        ),
      ) as { data: { state: { currentStage: string; notes: string[] } } };
      assert.equal(resumed.data.state.currentStage, "environment");
      assert.equal(resumed.data.state.notes.includes(secret), false);
      assert.equal(resumed.data.state.notes.includes("[redacted]"), true);

      const score = JSON.parse(
        textOf(
          await client.callTool({
            name: "score_profile",
            arguments: {
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
            },
          }),
        ),
      ) as { data: { percent: number } };
      assert.equal(score.data.percent, 70);

      const quote = JSON.parse(
        textOf(
          await client.callTool({
            name: "meteora_quote_pool",
            arguments: { contract: ADDRESS, quoteSymbol: "SOL", priceSource: "codex" },
          }),
        ),
      ) as { status: string; data: { quote: { status: string; priceUi: null } } };
      assert.equal(quote.status, "ok");
      assert.equal(quote.data.quote.status, "not_implemented");
      assert.equal(quote.data.quote.priceUi, null);

      const denied = await client.callTool({
        name: "launch_curve_submit",
        arguments: { confirm: false, cluster: "devnet", design },
      });
      assert.equal(denied.isError, true);

      const stubbed = JSON.parse(
        textOf(
          await client.callTool({
            name: "launch_curve_submit",
            arguments: { confirm: true, cluster: "devnet", design },
          }),
        ),
      ) as { status: string };
      assert.equal(stubbed.status, "not_implemented");

      const admin = JSON.parse(
        textOf(
          await client.callTool({
            name: "admin_add_co_admin",
            arguments: {
              confirm: true,
              cluster: "devnet",
              guardianAcknowledged: true,
              guardianMethod: "wallet",
              projectId: "sample",
              walletAddress: ADDRESS,
            },
          }),
        ),
      ) as { status: string; next: string; data: { guardian: { enforced: boolean } } };
      assert.equal(admin.status, "not_implemented");
      assert.equal(admin.data.guardian.enforced, false);
      assert.match(admin.next, /TODO/);
    });
  });

  it("scores a shortlist, stays offline on domains, and writes brand svgs", async () => {
    await withClient(async (client) => {
      const market = {
        audience: "People who say the name out loud",
        problem: "Long coin names get mistyped",
        category: "tooling",
        tone: "plain",
      };
      const intake = JSON.parse(
        textOf(
          await client.callTool({
            name: "name_intake",
            arguments: market,
          }),
        ),
      ) as { data: { marketRecorded: boolean; creationFee: string } };
      assert.equal(intake.data.marketRecorded, true);
      assert.equal(intake.data.creationFee, "free");

      const shortlist = JSON.parse(
        textOf(
          await client.callTool({
            name: "name_shortlist",
            arguments: {
              market,
              candidates: [
                { name: "Moonshot", ticker: "SHOT" },
                { name: "Mox", ticker: "MOX" },
              ],
            },
          }),
        ),
      ) as {
        data: { liveXSearch: boolean; best: { name: string; preferred: boolean } | null };
      };
      assert.equal(shortlist.data.liveXSearch, false);
      assert.equal(shortlist.data.best?.name, "Mox");
      assert.equal(shortlist.data.best?.preferred, true);

      const domain = JSON.parse(
        textOf(
          await client.callTool({
            name: "domain_plan",
            arguments: { label: "Mox" },
          }),
        ),
      ) as {
        data: {
          hostname: string;
          purchased: boolean;
          availability: { source: string; checked: boolean; livePurchase: boolean };
        };
      };
      assert.equal(domain.data.hostname, "mox.com");
      assert.equal(domain.data.purchased, false);
      assert.equal(domain.data.availability.source, "offline");
      assert.equal(domain.data.availability.checked, false);
      assert.equal(domain.data.availability.livePurchase, false);

      const brand = JSON.parse(
        textOf(
          await client.callTool({
            name: "brand_generate",
            arguments: { name: "Mox", kind: "logo", kit: true, background: "light" },
          }),
        ),
      ) as {
        data: {
          written: boolean;
          assets: Array<{
            kind: string;
            width: number;
            height: number;
            relativePath: string;
          }>;
        };
      };
      assert.equal(brand.data.written, true);
      const header = brand.data.assets.find((asset) => asset.kind === "x_header");
      const og = brand.data.assets.find((asset) => asset.kind === "og");
      const favicon = brand.data.assets.find((asset) => asset.kind === "favicon");
      assert.equal(header?.width, 1500);
      assert.equal(header?.height, 500);
      assert.equal(og?.width, 1200);
      assert.equal(og?.height, 630);
      assert.equal(favicon?.width, 32);
      assert.equal(favicon?.height, 32);
      assert.match(readFileSync(favicon?.relativePath ?? "", "utf8"), /width="32"/);
    });
  });
});
