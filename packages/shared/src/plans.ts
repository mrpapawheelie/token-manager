export interface CheckItem {
  id: string;
  done: boolean;
  text: string;
}

export function prepChecklist(input: {
  hasPremium: boolean;
  communityUrl?: string;
  amaIso?: string;
  devApiAppCreated: boolean;
}): CheckItem[] {
  return [
    {
      id: "premium",
      done: input.hasPremium,
      text: "X Premium is on, so posts and the community have a fair chance of being seen.",
    },
    {
      id: "community",
      done: Boolean(input.communityUrl),
      text: "X Community exists. Post the named launch time there.",
    },
    {
      id: "ama",
      done: Boolean(input.amaIso),
      text: "AMA time is chosen and public.",
    },
    {
      id: "dev_api",
      done: input.devApiAppCreated,
      text: "X Developer API app exists. Keys stay in a secret store, not in the repo or the tool call.",
    },
    {
      id: "honesty",
      done: false,
      text: "Fair-launch post names the time, the sniper risk, and the typical post-graduation dump.",
    },
  ];
}

export function schedulePrep(launchAt: string): { when: string; task: string }[] {
  const launch = new Date(launchAt).getTime();
  const day = 86_400_000;
  const at = (daysBefore: number) => new Date(launch - daysBefore * day).toISOString();
  return [
    {
      when: at(21),
      task: "Open the X Community and the Telegram announcement channel. Write the launch time in public.",
    },
    {
      when: at(14),
      task: "Activate Codex.io (almost-free tier, one-time $1). Run setup_codex. Do not paste the API key.",
    },
    {
      when: at(7),
      task: "Draft the fair-launch post. Include the dump caveat. Do not set up a sniper or a bundler.",
    },
    {
      when: at(3),
      task: "Confirm X Premium, the AMA slot, and the X Developer API app.",
    },
    {
      when: new Date(launch).toISOString(),
      task: "Named launch time. Bonding curve. Dev buy is for later liquidity.",
    },
  ];
}

export function telegramPlan(input: {
  channelOrGroupUrl?: string;
  purpose: "announcements" | "chat" | "both";
}): string[] {
  const lines = [
    "Keep an announcement channel for the launch time, the fair-launch post, and lock proofs.",
    "Keep chat for questions. Mods do not promise price.",
    "Pin the dump caveat: a dump after graduation is typical, and snipers are common.",
  ];
  if (input.purpose === "announcements" || input.purpose === "both") {
    lines.push("Announcements stay short and dated.");
  }
  if (input.purpose === "chat" || input.purpose === "both") {
    lines.push("Chat can be noisy. The pin still carries the launch time and the risk.");
  }
  if (input.channelOrGroupUrl) lines.push(`Current link: ${input.channelOrGroupUrl}`);
  return lines;
}

export function xCommunityPlan(input: {
  communityName: string;
  launchAt: string;
}): string[] {
  return [
    `Create or open the X Community “${input.communityName}” before ${input.launchAt}.`,
    "Post the named launch time in the community and on the profile.",
    "Pin the dump caveat next to that time.",
    "Schedule the AMA. X Premium and the Developer API are how you show up. They are not a price promise.",
  ];
}

export function graduateChecklist(input: { devBuySupplyBps: number }): {
  notes: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  if (input.devBuySupplyBps < 400 || input.devBuySupplyBps > 600) {
    warnings.push(
      "Dev buy is away from the ~5% liquidity rule. Know which tokens you will use for the Meteora LP.",
    );
  }
  return {
    notes: [
      "Graduation moves the coin off the curve.",
      "A dump after graduation is typical. Say that in public before you migrate.",
      "Next liquidity home is Meteora DAMM v2 with fees compounding into quote token B.",
      "A buyback is not the graduation plan.",
    ],
    warnings,
  };
}

export function yearOneChecklist(monthsLive: number): string[] {
  const items = [
    "Keep lock proofs on the project site. Update them if a stream address changes.",
    "Keep the directory row current: socials, verification, and identity methods.",
    "Post a weekly note that a reader can check. Skip price calls.",
    "Leave dumps alone. Fees already compound into quote token B. A burn does not undo a dump.",
    "Run the AMA rhythm you promised. Fee-funded boosts are for attention.",
    "Check Codex token data after the $1 activation. Do not commit the key.",
    "Review co-admins and the guardian policy. A creator wallet alone is a single point of failure.",
  ];
  if (monthsLive < 1) {
    items.unshift(
      "First month: confirm the launch post still shows the time you used and the dump caveat.",
    );
  }
  return items;
}

export function amaPlan(input: {
  launchAt: string;
  amaAt: string;
  hostHandle: string;
}): string[] {
  return [
    `Host @${input.hostHandle.replace(/^@/, "")} runs the AMA at ${input.amaAt}.`,
    `Launch time on record: ${input.launchAt}.`,
    "Open with the bonding-curve shape, the ~5% dev buy, and the dump caveat.",
    "Close with where proofs will live: Meteora lock, team stream, and the directory row.",
    "Do not take questions that ask for a sniper setup.",
  ];
}

export function devApiChecklist(input: {
  appCreated: boolean;
  usage: Array<"read_posts" | "post_as_project" | "communities">;
}): CheckItem[] {
  return [
    {
      id: "app",
      done: input.appCreated,
      text: "Developer app exists on the X developer portal.",
    },
    {
      id: "usage",
      done: input.usage.length > 0,
      text: `Planned uses: ${input.usage.length > 0 ? input.usage.join(", ") : "none chosen"}.`,
    },
    {
      id: "secrets",
      done: true,
      text: "Keys are not pasted into MCP, git, or the admin chat. Changes go through the guardian gate.",
    },
  ];
}

export function codexChecklist(
  activationPaid: boolean,
  tier: "almost_free" | "other",
): string[] {
  return [
    "Codex.io is the token data API for this project.",
    tier === "almost_free"
      ? "Plan: almost-free tier."
      : "Plan on record is not the almost-free tier. The year-one default is almost-free.",
    activationPaid
      ? "One-time $1 activation is marked paid in this answer. Phase 1 did not check Codex."
      : "One-time $1 activation is still open. Token data calls wait on it.",
    "Store the API key outside the repo. Tool schemas have no key field.",
    "meteora_quote_pool can name priceSource codex. The client is a stub until a later phase.",
  ];
}

export function environmentChecks(input: {
  cluster: "devnet" | "mainnet-beta";
  walletAddress?: string;
  rpcUrl?: string;
  codexActivationPaid?: boolean;
}): CheckItem[] {
  return [
    {
      id: "cluster",
      done: true,
      text:
        input.cluster === "mainnet-beta"
          ? "Cluster is mainnet-beta. Spendy tools still require confirm: true. Phase 1 sends no transaction."
          : "Cluster is devnet. Spendy tools still require confirm: true. Phase 1 sends no transaction.",
    },
    {
      id: "wallet",
      done: Boolean(input.walletAddress),
      text: input.walletAddress
        ? "Public wallet address is present. Private keys are refused."
        : "No public wallet address yet.",
    },
    {
      id: "rpc",
      done: Boolean(input.rpcUrl),
      text: input.rpcUrl
        ? "RPC URL was provided. Query secrets are redacted if they appear in the echo."
        : "No RPC URL provided. Fine for Phase 1.",
    },
    {
      id: "codex",
      done: input.codexActivationPaid === true,
      text: "Codex almost-free tier needs the one-time $1 activation before token data calls.",
    },
  ];
}

export function adsPreview(input: {
  objective: "ama" | "launch_post" | "community";
  budgetNote: string;
}): string[] {
  return [
    `Objective: ${input.objective}.`,
    `Budget note: ${input.budgetNote}`,
    "Fee-funded boosts buy attention. They are not a buyback and they are not price support.",
    "Phase 1 does not spend. ads_submit requires confirm: true and still does nothing.",
  ];
}

export const SITE_PAGES = [
  "Home: what the coin is, in caveman words",
  "Launch: named time, dev-buy rule, dump caveat",
  "Locks: Meteora LP proof and team cliff/stream proof",
  "Directory facts: category, socials, contract, verification methods",
  "Admin: SIWS root wallet, co-admins, guardian policy (sensitive actions stay gated)",
] as const;
