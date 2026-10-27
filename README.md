# Token Manager

Year-one Solana token manager for Pump.fun-style **bonding-curve** launches. The journey creates the coin on a curve, names the launch time in public, graduates, then locks liquidity on Meteora DAMM v2. Classic SPL mint-first launches are out of scope.

Phase 1 is the foundation: shared schemas, a stdio MCP server, a docs site, and a platform shell with mock directory data. Chain writes, OAuth token exchange, Codex calls, and Sign-In With Solana checks are stubs.

## Platform rule #1 (non-negotiable): founder ownership

Everything in Token Manager is **optional**. Guidance never blocks a do-it-yourself launch.

Wallets, GitHub repositories, domains, and X accounts stay under the **founder's own accounts**. If the founder leaves Token Manager tomorrow, the coin, the repo, the domain, and the X account keep working. This repo is not the source of truth for those accounts. GitHub OAuth, when it exists, targets their login (`github_oauth_begin`, `github_repo_plan`). A platform org is refused.

This rule is `PLATFORM_RULE_FOUNDER_OWNERSHIP` in `packages/shared/src/principles.ts`. The numbered principles below do not override it.

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

We **validate actions**. We **do not grade people**. Credential tags (`CredentialTag`) are neutral: grey or empty is a signal, and color means the action was recorded. A shady history withholds benefits. **Buyers decide.** Personal OAuth covers the founder's GitHub, LinkedIn, and X (`cred_oauth_begin`). Building wallets are Sign-In With Solana only (`cred_wallet_proof`). Gitcoin Passport, Build Guild, and Base builders resolve from that signed address through documented APIs (`cred_resolve_membership`); a pasted membership URL is not accepted. `cred_assess` maps recorded history onto tags and does not call a model. X compromise heuristics (`cred_x_heuristics`) open a private `AdminFlagQueueItem` and do not auto-publish a verified claim.

KYC is optional (`KycTier` 0–3). Tier 0 is none. Tier 1 is OAuth to an already-KYC'd venue such as Coinbase only if that API can attest; `kyc_tier1_attest` leaves `attested` false and does not invent an attestation. Tier 2 is a paid ID upload stub. Tier 3 adds a short video interview stub. `KycBadge` rows stack, and `vendorAttested` stays false. If a registration email and an OAuth email differ, `kyc_email_proof` (`EmailProofStatus`) requires a magic link before that OAuth counts as identity proof, and Phase 1 does not send the link. Privy (`PrivySessionStub`, `kyc_privy_session`) is the free-plan-first path for Google or social login and wallet connect. The session stays signed out and sits beside Sign-In With Solana. The creator admin is still the SIWS wallet.

Factual status labels (locked liquidity, auto-compounding, GitHub, X, Telegram, team lock) start grey and turn on when the check is true. A profile completion score (for example **70%** complete) shows what is still missing. Those labels are checks, not trophies.

Write the target market before the name (`name_intake`). Score the word for one syllable, few letters, letters only, and a clear X cashtag (`name_score`). Prefer a `.com` at Cloudflare with WHOIS redaction (`domain_plan`, `domain_connect`). Brand files are a simple mark; `brand_generate` returns the brief and does not draw the image yet.

Bonding-curve **creation is free** (no platform fee). `launch_curve_submit` still requires `confirm: true` and does not send a transaction in Phase 1. Weekly milestones can become labels (`badge_milestones`). Perks for those milestones are TBD.

The admin shell shows X followers, impressions, and engagements as **mock** charts. `admin_x_connect` does not start OAuth. X Radar (Premium+ or Business) is a UI guide for a cashtag plus a campaign keyword. There is no documented Radar export API, and this repo does not fake one. Fee-funded boosts stay on `ads_*` as attention, not as a Radar download.

`claims_intake`, `originality_compare`, and `originality_coach` record a use case and compare it with a list the caller supplies. They do not search the web and they do not mark a name unique. Contract checks are the easy half of a LARP-style scan. Claim and copycat risk is the hard half.

Token Manager helps the founder **market** the coin and **wire project data** to consumers and agents. Pre-launch (`prelaunch_checklist`) is free and happens before any mint or fee: publish the site, create X, publish the account, run a first AMA, and set a hype cadence. The founder site stack is Vercel, Next.js, TypeScript, shadcn/ui, and Zod. The contract address sits at the top of the template with one-click copy, or a placeholder before the mint.

`api_builder_locate`, `api_builder_describe`, `api_builder_readonly`, `api_builder_token_gate`, and `api_builder_x402` describe that data API. Auth on `ApiEndpointSpec` is `none`, `token`, or `x402`. x402 is HTTP 402: another agent can micropay the **founder** to query. `X402Config` is a stub (`implemented: false`). The mock OpenAPI sample is `GET /v1/project/summary`. Phase 1 does not charge and does not serve those routes.

The public scanner sketch is `GET /api/scanner/tokens` and `GET /api/scanner/tokens/{id}` on the web app, plus `GET /api/scanner/openapi`. Payloads use `ScannerTokenPayload` and `VerificationFlags`. Missing steps are `false`, `null`, or `"unverified"`. Phase 1 rows are `mock: true` and `live: false`. `directory_log_create` attaches a scan-notification placeholder and does not call a webhook. The fixture does not enforce a rate limit; a live deployment should cap anonymous reads at about 60 requests per minute per IP. See the docs page **Scanner API**.

## Web or MCP

Founders can run the journey on the **web or MCP**. Both surfaces read the same stage ids from `packages/shared`. `JOURNEY_SYNC` records that shared order. Phase 1 does not copy the JSON session between them. The stub session id is `stub-shared-session` (`liveSync` is false). `get_progress` returns that note. The directory shell is mobile-friendly on the shadcn breakpoint scale: cards below `lg`, a table from there up.

An agent may call MCP to create or set up a project. Those tools require `actorType`: `human` or `agent` (`ActorType`). The creation event stores `CreationActorMeta` with `actor_type`. When `actor_type` is `agent`, `agent_created` and `no_human` are both true. A human create sets both to false. An agent-created project must be labeled for buyers and scanners: the directory badge, the creation event, and the scanner JSON all carry those flags.

`FeePolicy` is `earmarked`, `dao_governed`, or `human_withdrawable`. `human_withdrawable` is only for human-created projects and is discouraged. An agent create cannot select it. `fee_policy_choose` records the path locally and does not move funds. `governance_dao_playbook` is a pointer for DAO vote setup. It does not open a vote.

`PostCreateLock`: after an agent finalize, mint, LP, and fee admin are immutable and non-retcon. Humans cannot change those via platform admin for an agent-created project. `governance_finalize_lock` returns that record. Phase 1 does not write it on chain.

Teaser: Give the agent the MCP. It creates and sets up the project, then notifies the human. Phase 1 does not send the transaction or the notice.

The docs page **Governance** is the function map. OpenAPI files in this repo are sketches and not a live API (`live` is false). The security disclaimer is that Token Manager is not a security audit and does not custody funds. The third-party audit slot is empty (`auditor` null, `completed` false) until a named firm fills it. Credibility is a WYSIWYG listing: the directory shows recorded checks and agent labels, and it does not invent a rank. The repo stays clonable. A founder can copy it and leave.

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
apps/web        directory, token page, admin shell, scanner JSON (mock data)
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
- `github_oauth_begin`, `scanner_notify`
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
