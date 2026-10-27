import type { JourneyStageId } from "./stages.js";

export interface ToolCatalogEntry {
  name: string;
  title: string;
  stage: JourneyStageId | "session";
  implemented: boolean;
  /** Chain write or a fee spend. The input schema requires confirm: true. */
  spendy: boolean;
  /** Sensitive admin or liquidity action. The schema requires a guardian acknowledgement. */
  guardian: boolean;
  writesSession: boolean;
  description: string;
  next: string;
}

/**
 * Tool names and Phase 1 behavior. Handlers and docs should follow this list.
 * `implemented: false` means the tool validates input and returns a stub payload.
 */
export const TOOL_CATALOG = [
  {
    name: "get_progress",
    title: "Get journey progress",
    stage: "session",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: true,
    description:
      "Read the local journey session. Creates a session on first use. Returns the current stage and the tool names for that stage.",
    next: "Run the tools in nextTools, or resume to move the stage.",
  },
  {
    name: "resume",
    title: "Resume a session",
    stage: "session",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: true,
    description:
      "Load the local session, record acknowledgements, and optionally mark the current stage complete or move to a named stage.",
    next: "Continue with the tools listed for the current stage.",
  },
  {
    name: "prep_x_checklist",
    title: "X prep checklist",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Checklist for X Premium, the community, an AMA slot, and an X Developer API app. No API keys.",
    next: "Schedule the weeks before launch with prep_x_schedule.",
  },
  {
    name: "prep_x_schedule",
    title: "Prep schedule",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "A short schedule that ends at the named launch time.",
    next: "Draft the fair-launch post before the date, including the dump caveat.",
  },
  {
    name: "name_intake",
    title: "Target-market intake",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Record who the coin is for before anyone picks a name. Audience, problem, category, and tone.",
    next: "Score candidate words with name_score. Do not buy a domain first.",
  },
  {
    name: "social_telegram_plan",
    title: "Telegram plan",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Announcement channel versus chat. Pin the launch time and the dump caveat.",
    next: "Validate the public links with social_validate_links.",
  },
  {
    name: "social_x_community_plan",
    title: "X Community plan",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Open the X Community before launch and post the named time plus the dump caveat.",
    next: "Pair it with an AMA plan in grow_x_ama_plan when the date is real.",
  },
  {
    name: "caveman_list_topics",
    title: "List caveman topics",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "List the plain-language explainer topics.",
    next: "Call caveman_explain with one topic.",
  },
  {
    name: "caveman_explain",
    title: "Caveman explainer",
    stage: "prep_weeks_out",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "Short explainer for one feature. Plain words. No profit promise.",
    next: "Use the script on the project site or in the launch post.",
  },
  {
    name: "setup_check_environment",
    title: "Check environment",
    stage: "environment",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Review cluster, a public wallet address, and whether Codex activation is recorded. Does not connect a wallet and does not print secrets.",
    next: "Record Codex with setup_codex. Spendy tools still require confirm: true.",
  },
  {
    name: "setup_codex",
    title: "Codex setup",
    stage: "environment",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Checklist for the Codex.io almost-free tier and the one-time $1 activation. There is no API key field.",
    next: "After activation, meteora_quote_pool can target priceSource codex. Phase 1 still does not call Codex.",
  },
  {
    name: "launch_curve_validate_design",
    title: "Validate bonding-curve design",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Validate listing fields for a bonding-curve launch, including the named time and the dump acknowledgement.",
    next: "Quote the dev buy with launch_curve_quote_dev_buy.",
  },
  {
    name: "social_validate_links",
    title: "Validate social links",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "Validate the public social link object used on the directory row.",
    next: "Preview status labels with badge_preview.",
  },
  {
    name: "badge_list",
    title: "List status labels",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "List factual status labels. They start grey and turn on only when the check is true. They are not rank badges.",
    next: "Pass real signals to badge_preview.",
  },
  {
    name: "badge_preview",
    title: "Preview status labels",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Build the grey-or-active label set from profile signals and a liquidity tier.",
    next: "Show the same labels on the project site and the directory row.",
  },
  {
    name: "score_profile",
    title: "Profile completion score",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Percent complete from the public checklist. Example: 7 of 10 checks is 70% complete.",
    next: "Read score_benefits for why the missing checks matter.",
  },
  {
    name: "score_benefits",
    title: "Why finish the profile",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "Copy for the benefit of finishing the profile checklist.",
    next: "Fill the missing items from score_profile.",
  },
  {
    name: "name_score",
    title: "Score a name",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Score a name and ticker: one syllable preferred, few letters, letters only, and a cashtag that does not collide. Phase 1 does not search X.",
    next: "If the score is preferred, plan the .com with domain_plan.",
  },
  {
    name: "domain_plan",
    title: "Plan the .com",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Build a .com plan for Cloudflare with WHOIS redaction. Does not check availability or register anything.",
    next: "Read the connect steps from domain_connect. Keep Cloudflare tokens out of the tool.",
  },
  {
    name: "domain_connect",
    title: "Cloudflare connect steps",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Document the Cloudflare Registrar flow: register the .com, leave privacy on, do not paste credentials.",
    next: "Brand work is brand_principles, then brand_generate for each asset size.",
  },
  {
    name: "brand_principles",
    title: "Brand principles",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "Rules for a simple mark that still works as a favicon.",
    next: "Request a brief with brand_generate. Generation itself is TODO.",
  },
  {
    name: "brand_generate",
    title: "Brand asset brief",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Returns the size and the brief for a logo, avatar, X header, OG image, or favicon. TODO: no image is generated in Phase 1.",
    next: "A later phase can draw the asset from this brief. Do not upload secrets with it.",
  },
  {
    name: "badge_milestones",
    title: "Weekly milestones",
    stage: "design_listing_meta",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Weekly checks that can become status labels. Perks are TBD. Token creation stays free.",
    next: "Ship the week's check in public. Do not invent a perk.",
  },
  {
    name: "launch_curve_quote_dev_buy",
    title: "Quote the dev buy",
    stage: "bonding_curve_launch",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Quote token amount for a dev buy. The rule of thumb is about 5% of supply, reserved for post-graduation liquidity.",
    next: "Build the announcement with launch_curve_build_announcement.",
  },
  {
    name: "launch_curve_build_announcement",
    title: "Build fair-launch copy",
    stage: "bonding_curve_launch",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Fill the fair-launch announcement: named time, dev-buy purpose, sniper warning, and the typical post-graduation dump.",
    next: "A later phase can submit the curve create. Phase 1 does not sign it.",
  },
  {
    name: "launch_curve_submit",
    title: "Submit bonding-curve create",
    stage: "bonding_curve_launch",
    implemented: false,
    spendy: true,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Requires confirm: true. Bonding-curve creation has no platform fee. Phase 1 does not build, sign, or send it. No sniper and no bundler.",
    next: "Keep the validated design and the announcement. A later phase will build the free create after confirm: true.",
  },
  {
    name: "directory_build_event",
    title: "Build a creation event",
    stage: "log_creation_event",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Validate a directory payload: category, description, socials, contract, locks, and verification.",
    next: "Store it locally with directory_log_create. That file is not the public directory yet.",
  },
  {
    name: "directory_log_create",
    title: "Log a creation locally",
    stage: "log_creation_event",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: true,
    description:
      "Validate and store a creation event on the local session. This is not the hosted platform directory.",
    next: "Publish the same fields on the project site, including lock proofs.",
  },
  {
    name: "graduate_checklist",
    title: "Graduation checklist",
    stage: "graduate",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Checklist before graduation. Repeats that a dump after graduation is typical.",
    next: "Preview the Meteora lock before migrate day.",
  },
  {
    name: "graduate_submit",
    title: "Submit graduation",
    stage: "graduate",
    implemented: false,
    spendy: true,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Requires confirm: true. Phase 1 does not send a graduation transaction.",
    next: "After a real graduation, move to meteora_quote_pool and meteora_lock_lp.",
  },
  {
    name: "meteora_preview_damm_v2",
    title: "Preview DAMM v2 terms",
    stage: "meteora_damm_v2",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Preview locked DAMM v2 terms. compounding_fee_bps is fixed at 10000. Buybacks and burns are discouraged.",
    next: "Quote a price with meteora_quote_pool, then stub the create or lock.",
  },
  {
    name: "meteora_quote_pool",
    title: "Quote pool price",
    stage: "meteora_damm_v2",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Choose Codex.io or an on-chain read as the price source. Phase 1 returns a stub quote and does not call the network.",
    next: "Pass the same priceSource into meteora_create_pool when a later phase can trade.",
  },
  {
    name: "meteora_create_pool",
    title: "Create DAMM v2 pool",
    stage: "meteora_damm_v2",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. Creates no pool. Config must use compounding_fee_bps = 10000.",
    next: "Wire the Codex or on-chain price client, then submit the DAMM v2 create under the guardian gate.",
  },
  {
    name: "meteora_add_liquidity",
    title: "Add liquidity",
    stage: "meteora_damm_v2",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. Adds no liquidity.",
    next: "Treat adds above largeLiquidityQuoteUi as a large liquidity op that needs the guardian.",
  },
  {
    name: "meteora_lock_lp",
    title: "Lock LP",
    stage: "meteora_damm_v2",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. Does not lock a position. The intended lock uses compounding_fee_bps = 10000.",
    next: "Publish the position address with vest_build_proof's sibling lock proof on the project site.",
  },
  {
    name: "meteora_reinvest_fees",
    title: "Reinvest compounded fees",
    stage: "meteora_damm_v2",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. Does not move fees. Product setting remains compounding_fee_bps = 10000, which compounds into quote token B.",
    next: "Prefer the in-pool compound over a buyback or a burn.",
  },
  {
    name: "vest_plan_lock",
    title: "Plan a team lock",
    stage: "team_locks",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Plan a cliff plus a stream for extra team tokens. The habit is an additional 5–10% or more.",
    next: "Build a public proof payload with vest_build_proof after the stream exists.",
  },
  {
    name: "vest_build_proof",
    title: "Build a lock proof",
    stage: "team_locks",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "Validate a public lock-proof object for the project site.",
    next: "Publish it with site_publish_proofs once that path exists.",
  },
  {
    name: "vest_lock_tokens",
    title: "Create the team lock",
    stage: "team_locks",
    implemented: false,
    spendy: true,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Requires confirm: true. Phase 1 does not create a stream account.",
    next: "Create the cliff and stream, then vest_build_proof with the public stream address.",
  },
  {
    name: "site_preview_pages",
    title: "Preview project-site pages",
    stage: "team_locks",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "List the public pages a project site should ship, including lock proofs and admin entry.",
    next: "The admin shell lives at /tokens/{id}/admin on the platform stub.",
  },
  {
    name: "site_publish_proofs",
    title: "Publish proofs",
    stage: "team_locks",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Phase 1 does not deploy a site. Proofs stay in the local session or the repo templates.",
    next: "Put the lock proof URI on the public project page.",
  },
  {
    name: "oauth_begin",
    title: "Begin OAuth connect",
    stage: "oauth_verify",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Starts no redirect and accepts no tokens. OAuth is how the platform will verify an account against the contract.",
    next: "Use verify_connected_accounts after a real connect exists.",
  },
  {
    name: "oauth_connection_status",
    title: "OAuth connection status",
    stage: "oauth_verify",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Reports no live connection. Labels are public account names, not tokens.",
    next: "Keep API keys and refresh tokens out of tool arguments.",
  },
  {
    name: "verify_connected_accounts",
    title: "Verify connected accounts",
    stage: "oauth_verify",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Third-party check that connected accounts belong with the contract. Phase 1 does not call a provider.",
    next: "Publish the method list with identity_explain_methods.",
  },
  {
    name: "verify_contract_link",
    title: "Link account to contract",
    stage: "oauth_verify",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Records the intended public link between an account label and a contract. No network call.",
    next: "Show the result on the directory row when a later phase can verify it.",
  },
  {
    name: "identity_explain_methods",
    title: "Explain identity methods",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Publish the identity score formula. Public and anonymous-but-verified are both valid. No rank badges.",
    next: "Calculate a number with identity_score_from_inputs. The number trusts the statuses you send.",
  },
  {
    name: "identity_score_from_inputs",
    title: "Score identity inputs",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Compute the identity score from X, claim statuses, an optional external ID provider name, and published methods.",
    next: "Store unchecked claims with identity_add_claim. Phase 1 does not run the AI check.",
  },
  {
    name: "identity_add_claim",
    title: "Store a claim proof",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: true,
    description:
      "Store an AI-checkable claim on the local session with status unchecked. Evidence is a public URI.",
    next: "A later phase can run the check. Do not mark a claim supported by hand in this phase.",
  },
  {
    name: "admin_session_preview",
    title: "Preview SIWS admin session",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Preview which wallet would be root or co-admin. Root is the wallet that created the token. Phase 1 does not check a Sign-In With Solana signature, so authenticated is false.",
    next: "TODO: verify the SIWS signature before treating the session as signed in.",
  },
  {
    name: "admin_list_co_admins",
    title: "List co-admins",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "List co-admin wallets stored on the local session. Phase 1 starts empty.",
    next: "Adding or removing a co-admin is a stub that requires the guardian gate.",
  },
  {
    name: "admin_add_co_admin",
    title: "Add a co-admin",
    stage: "oauth_verify",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. Does not add a wallet. Root admin is the creator wallet; co-admins are extra wallets the root approves.",
    next: "TODO: require a verified guardian wallet signature, passkey assertion, or TOTP before writing the co-admin list.",
  },
  {
    name: "admin_remove_co_admin",
    title: "Remove a co-admin",
    stage: "oauth_verify",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. Does not remove a wallet.",
    next: "TODO: same guardian check as admin_add_co_admin. A compromised creator wallet must not be enough.",
  },
  {
    name: "admin_x_credentials_change",
    title: "Change X API credentials",
    stage: "oauth_verify",
    implemented: false,
    spendy: true,
    guardian: true,
    writesSession: false,
    description:
      "Stub. Requires confirm: true and a guardian acknowledgement. There is no field for an API key or client secret. Do not send credentials.",
    next: "TODO: rotate X API credentials in a secret store after the guardian gate. Never pass them through MCP.",
  },
  {
    name: "admin_guardian_policy",
    title: "Save a guardian policy",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: true,
    description:
      "Validate and store a local guardian policy: which actions need a guardian wallet, passkey, and/or TOTP. Phase 1 does not enforce it.",
    next: "Sensitive stubs still return not_implemented after the acknowledgement fields are present.",
  },
  {
    name: "admin_dashboard_snapshot",
    title: "Admin dashboard snapshot",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Local overview for the admin shell: stage, locks, co-admins, guardian policy, and which panels are still stubs.",
    next: "Open the web admin shell for the same sections: X analytics, Radar guidance, ads, Meteora, and the AI chat placeholder.",
  },
  {
    name: "admin_x_connect",
    title: "Connect X for the admin shell",
    stage: "oauth_verify",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Starts no OAuth redirect and accepts no token. The admin shell will later pull X analytics for the connected account.",
    next: "Use admin_x_analytics for the mock chart until a real connect exists.",
  },
  {
    name: "admin_x_analytics",
    title: "X analytics fixture",
    stage: "oauth_verify",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Returns followers, impressions, and engagements clearly marked as mock. Does not call the X API.",
    next: "Connect the account later with admin_x_connect. Do not paste an API key here.",
  },
  {
    name: "admin_x_radar_guide",
    title: "X Radar UI guide",
    stage: "grow_x",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "How to watch a cashtag and a campaign keyword in X Radar (Premium+ or Business). There is no documented Radar export API, so this tool does not call one.",
    next: "Fee-funded attention boosts stay on ads_preview and ads_submit.",
  },
  {
    name: "ai_chat_project",
    title: "Project AI chat",
    stage: "year_one_ops",
    implemented: false,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Placeholder chat over project context. Phase 1 calls no model and stores no prompt. Do not paste keys.",
    next: "A later phase can answer from public project context only.",
  },
  {
    name: "grow_x_ama_plan",
    title: "AMA plan",
    stage: "grow_x",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description: "A short AMA run of show tied to the named launch time.",
    next: "Fee-funded boosts go through ads_submit or grow_x_boost_plan and stay stubs.",
  },
  {
    name: "grow_x_boost_plan",
    title: "Boost plan",
    stage: "grow_x",
    implemented: false,
    spendy: true,
    guardian: false,
    writesSession: false,
    description:
      "Stub. Requires confirm: true. Describes a fee-funded boost as attention, not price support. Spends nothing.",
    next: "Use ads_preview for the same idea on the admin shell.",
  },
  {
    name: "grow_x_dev_api_checklist",
    title: "X Developer API checklist",
    stage: "grow_x",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Checklist for an X Developer API app. No key field. Credential changes use admin_x_credentials_change.",
    next: "Keep keys in a secret store. The guardian gate is required before a change.",
  },
  {
    name: "ads_preview",
    title: "Preview an ad or boost",
    stage: "grow_x",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Draft a fee-funded boost tied to attention: a cashtag, a campaign keyword, an AMA, or a launch post. It does not spend. It is not a Radar API and it is not price support.",
    next: "ads_submit is the spend stub and requires confirm: true.",
  },
  {
    name: "ads_submit",
    title: "Submit an ad or boost",
    stage: "grow_x",
    implemented: false,
    spendy: true,
    guardian: false,
    writesSession: false,
    description: "Stub. Requires confirm: true. Does not buy ads or boosts.",
    next: "Fund boosts from fees only after the spend path exists. Keep it separate from buybacks.",
  },
  {
    name: "ops_year_checklist",
    title: "Year-one checklist",
    stage: "year_one_ops",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: false,
    description:
      "Operating checklist for the first year: proofs stay public, directory row stays current, dumps are not met with burns.",
    next: "Log a week with ops_year_log_week.",
  },
  {
    name: "ops_year_log_week",
    title: "Log an ops week",
    stage: "year_one_ops",
    implemented: true,
    spendy: false,
    guardian: false,
    writesSession: true,
    description:
      "Append a short weekly note to the local session. If a buyback was requested, the tool records the discouragement and does not plan one.",
    next: "Keep the public proof page and the Codex data check on the weekly list.",
  },
] as const satisfies readonly ToolCatalogEntry[];

export type ToolCatalogItem = (typeof TOOL_CATALOG)[number];
export type ToolName = ToolCatalogItem["name"];
export type ImplementedToolName = Extract<ToolCatalogItem, { implemented: true }>["name"];

const BY_NAME = new Map<ToolName, ToolCatalogItem>(
  TOOL_CATALOG.map((tool) => [tool.name, tool]),
);

export function toolByName(name: ToolName): ToolCatalogItem {
  const found = BY_NAME.get(name);
  if (!found) {
    throw new Error(`Unknown tool ${name}`);
  }
  return found;
}

export function toolsForStage(stage: JourneyStageId): ToolName[] {
  return TOOL_CATALOG.filter((tool) => tool.stage === stage).map((tool) => tool.name);
}

export const ALWAYS_TOOLS = [
  "get_progress",
  "resume",
  "caveman_explain",
  "caveman_list_topics",
  "badge_list",
  "score_profile",
] as const satisfies readonly ToolName[];
