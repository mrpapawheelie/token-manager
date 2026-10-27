# Token Manager

Year-one Solana token manager for Pump.fun-style **bonding-curve** launches. The journey creates the coin on a curve, names the launch time in public, graduates, then locks liquidity on Meteora DAMM v2. Classic SPL mint-first launches are out of scope.

Phase 1 is the foundation: shared schemas, a stdio MCP server, a docs site, and a platform shell with mock directory data. Chain writes, OAuth token exchange, Codex calls, and Sign-In With Solana checks are stubs.

## Principles

These are also encoded in `packages/shared/src/principles.ts`.

1. **About 5% of supply** is the post-graduation liquidity rule of thumb (the dev buy).
2. **Fair-launch honesty.** Name the launch time. Warn that snipers and bundlers are common and that a dump after graduation is typical, so retail is not blindsided. This repo does not ship sniper or bundler bots.
3. **After graduation, lock LP on Meteora DAMM v2** with `compounding_fee_bps = 10000`, so 100% of LP fees auto-compound into quote token B. Buybacks and burns are discouraged.
4. **Lock extra team tokens** (about an additional 5–10% or more) with a cliff and a stream. Publish the proof on the project site.
5. **Eyes equal buys.** X Premium, AMAs, fee-funded boosts, and the X Developer API.
6. **Caveman-easy explainers** for features.
7. **Codex.io** is the token data API. Almost-free tier, plus a one-time $1 activation. Do not commit the API key.
8. **The platform directory** logs successful creates: category, short description, socials, contract, locks, and verification.
9. **OAuth** connects accounts so the platform can third-party verify those accounts together with the contract.
10. **Developer identity score.** Optional public identity, or anonymous-but-verified. Score X, AI-checkable claim proofs, and an optional external ID API. Publish the verification methods. Rank badges are out of scope.

Factual status labels (locked liquidity, auto-compounding, GitHub, X, Telegram, team lock) start grey and turn on when the check is true. A profile completion score (for example **70%** complete) shows what is still missing. Those labels are checks, not trophies.

## Per-project admin

Each project site has an admin shell (see `/tokens/[id]/admin` on the web app).

- **Sign-In With Solana.** The root admin is the wallet that created the token. Phase 1 previews the role and sets `authenticated: false`. It does not check a signature.
- **Co-admins.** The root can add other wallet addresses. `admin_add_co_admin` and `admin_remove_co_admin` are stubs.
- **Guardian gate.** A compromised creator wallet must not be enough for sensitive actions. The design requires a second factor — a guardian wallet and/or a passkey and/or TOTP — before:
  - add or remove admins
  - large liquidity ops (create pool, add liquidity, lock LP, reinvest fees)
  - X API credential changes
- Phase 1 stores a `GuardianPolicy` and requires `guardianAcknowledged: true` on those tool schemas. It does **not** verify a signature, a WebAuthn assertion, or a TOTP code. There is no field for a TOTP secret or an API key. See the `TODO(phase-2)` notes in `packages/shared/src/admin.ts`.

## Journey

| Index | Stage                  | What it is                                                 |
| ----- | ---------------------- | ---------------------------------------------------------- |
| 0     | `prep_weeks_out`       | Name the time. Open X and Telegram. Write the dump caveat. |
| 1     | `environment`          | Public wallet, cluster, Codex activation.                  |
| 2     | `design_listing_meta`  | Listing fields, socials, grey-until-true labels.           |
| 3     | `bonding_curve_launch` | Dev-buy quote, fair-launch copy, confirmed create (stub).  |
| 4     | `log_creation_event`   | Directory payload.                                         |
| 5     | `graduate`             | Leave the curve. Expect a dump.                            |
| 6     | `meteora_damm_v2`      | Price from Codex or chain data, lock, compound.            |
| 7     | `team_locks`           | Cliff, stream, public proof.                               |
| 8     | `oauth_verify`         | OAuth, identity methods, admin and guardian.               |
| 9     | `grow_x`               | AMA, boosts, X Developer API.                              |
| 10    | `year_one_ops`         | Keep proofs and the directory row honest for a year.       |

Stage order lives in `packages/shared/src/stages.ts`. Tool names and stub vs implemented flags live in `packages/shared/src/catalog.ts`. The docs page **Stages and tools** renders that catalog.

## Repo

```
apps/mcp        stdio MCP server
apps/docs       docs site
apps/web        directory, token page, admin shell (mock data)
packages/shared schemas, stage ids, pure helpers, stub price clients
templates/      metadata, caveman script, fair-launch copy
```

## What runs in Phase 1

Implemented locally (no network, no signatures, no spends):

- `get_progress` and `resume` against a gitignored JSON session
- Checklists, fair-launch copy, caveman scripts, design validation, dev-buy quote
- Directory payload build and a **local** creation log
- Meteora terms preview (`compounding_fee_bps` fixed at 10000)
- Price quote **stub** for `priceSource: "codex" | "onchain"` (`packages/shared/src/clients/price.ts`)
- Team-lock plan and lock-proof object
- Identity score formula, unchecked claim storage, profile completion score, status labels
- Admin session **preview** (not authenticated), local guardian policy save, dashboard snapshot

Stubs (input is validated, then the tool returns `status: "not_implemented"`):

- `launch_curve_submit`, `graduate_submit`, `vest_lock_tokens`
- `meteora_create_pool`, `meteora_add_liquidity`, `meteora_lock_lp`, `meteora_reinvest_fees`
- `oauth_begin`, `oauth_connection_status`, `verify_connected_accounts`, `verify_contract_link`
- `admin_add_co_admin`, `admin_remove_co_admin`, `admin_x_credentials_change`
- `ai_chat_project`, `grow_x_boost_plan`, `ads_submit`, `site_publish_proofs`

Spendy tools require `confirm: true` even though they do not broadcast. Guardian tools also require `guardianAcknowledged: true` and a method of `wallet`, `passkey`, or `totp`.

## Run it

```bash
pnpm install
pnpm build
pnpm test
pnpm dev:docs   # docs site
pnpm dev:web    # directory shell
pnpm start:mcp  # stdio MCP, after build
```

The MCP process speaks JSON-RPC on stdout. Logs go to stderr. Session state defaults to `.token-manager/session.json` in the process working directory (gitignored). Override with `TOKEN_MANAGER_SESSION_PATH`. Copy `.env.example` if you want the variable written down. Do not put secrets in that file.

### MCP in Cursor

Build first, then add a server that runs Node with the repo as the working directory:

```json
{
  "mcpServers": {
    "token-manager": {
      "command": "node",
      "args": ["apps/mcp/dist/index.js"],
      "cwd": "/absolute/path/to/token-manager"
    }
  }
}
```

Start with `get_progress`, `caveman_explain`, and `setup_codex`. Do not paste a seed, an OAuth token, a TOTP secret, or a Codex/X API key into any tool. The server redacts values that look like secrets, and the schemas do not accept those fields. Redaction is a backstop, not a place to put keys.

## Secrets

`.gitignore` includes `.env` and `.token-manager/`. Tool schemas reject unknown keys, so a `privateKey` field fails validation. Public wallet addresses are the only key material the schemas allow, and only in the 32–44 character base58 form.
