# Contributing

Phase 1 is schemas, pure helpers, and labeled stubs. Keep that boundary.

## Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

Use pnpm. Node 22 or newer.

## Where things go

- Journey order and product numbers: `packages/shared/src/stages.ts` and `principles.ts`.
- Zod schemas: `packages/shared/src/schemas.ts`. Add admin, badge, and pool fields there before using them in an app.
- Tool names: `packages/shared/src/catalog.ts` and a matching input in `tool-inputs.ts`. Then handle it in `apps/mcp/src/handlers.ts`.
- Docs pages should name the MCP tool a reader would call.
- Mock directory rows in `apps/web` must say they are mock data.

## Rules that are easy to break

- Bonding-curve launches only. Do not add a mint-first wizard as the main path.
- Do not add sniper or bundler tools, buyback tools, or burn tools.
- Spendy or mainnet actions require `confirm: z.literal(true)` even when the handler is a stub.
- Sensitive admin and large liquidity actions require a guardian acknowledgement. Phase 1 must not treat that flag as a verified signature, passkey, or TOTP check.
- Do not add schema fields for private keys, seeds, OAuth tokens, TOTP secrets, or API keys.
- Do not log tool arguments. The MCP server already avoids stdout except for the protocol.

## Checks

`pnpm build` is the bar. `pnpm test` covers the dev-buy math, the 10000 bps lock, redaction, the guardian stub, and that the MCP server lists its tools.
