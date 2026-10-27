import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_CATALOG, redactSecrets, toolInputSchemas } from "@token-manager/shared";

import { handleTool } from "./handlers.js";

export function createTokenManagerServer(): McpServer {
  const server = new McpServer(
    { name: "token-manager", version: "0.1.0" },
    { instructions: phase1Instructions },
  );

  for (const tool of TOOL_CATALOG) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: toolInputSchemas[tool.name],
        annotations: {
          readOnlyHint: !tool.writesSession && !tool.spendy,
          destructiveHint: tool.spendy || tool.guardian,
        },
      },
      async (args: unknown) => {
        try {
          const payload = await handleTool(tool.name, args);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(redactSecrets(payload), null, 2),
              },
            ],
          };
        } catch (error) {
          console.error(
            `token-manager tool ${tool.name} failed`,
            error instanceof Error ? error.name : "error",
          );
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  phase: 1,
                  status: "error",
                  tool: tool.name,
                  message: "Tool failed before it could finish. Secrets are not stored.",
                }),
              },
            ],
          };
        }
      },
    );
  }

  return server;
}

const phase1Instructions = [
  "Year-one bonding-curve token manager. Phase 1 validates inputs and returns stubs for chain writes.",
  "Do not send private keys, seeds, OAuth tokens, TOTP secrets, or API keys.",
  "Mainnet and spendy tools require confirm: true and still do not broadcast.",
  "Sensitive admin and liquidity tools also require a guardian acknowledgement. Phase 1 does not verify it.",
  "Sniper and bundler bots are out of scope.",
  "Founder ownership is non-negotiable: wallets, GitHub repos, domains, and X stay on the founder's accounts. Guidance never blocks DIY.",
  "Record the target market before a name can be preferred. name_score collision checks are local heuristics and do not search X.",
  "Domain checks never take an API token as an argument. brand_generate writes SVG files the founder owns and does not call a paid image API.",
  "Scanner flags stay unverified, false, or null when a check was not made. Do not invent a pass.",
].join(" ");
