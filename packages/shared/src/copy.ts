import { bpsToPercent } from "./design.js";
import type { SocialLinks } from "./schemas.js";

export interface FairLaunchFields {
  name: string;
  symbol: string;
  launchAt: string;
  devBuySupplyBps: number;
  supplyUi: number;
  socials: SocialLinks;
}

function formatSocials(socials: SocialLinks): string {
  const lines = [
    socials.website ? `Website: ${socials.website}` : null,
    socials.x ? `X: ${socials.x}` : null,
    socials.xCommunity ? `X Community: ${socials.xCommunity}` : null,
    socials.telegram ? `Telegram: ${socials.telegram}` : null,
    socials.github ? `GitHub: ${socials.github}` : null,
    socials.discord ? `Discord: ${socials.discord}` : null,
  ].filter((line): line is string => line !== null);
  return lines.length > 0 ? lines.join("\n") : "No public links yet.";
}

export function buildFairLaunchAnnouncement(fields: FairLaunchFields): string {
  const when = fields.launchAt.endsWith("Z")
    ? `${fields.launchAt} (UTC)`
    : fields.launchAt;
  const percent = bpsToPercent(fields.devBuySupplyBps);
  const supply = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(
    fields.supplyUi,
  );
  return [
    `${fields.name} (${fields.symbol}) — fair launch`,
    "",
    `Launch time: ${when}`,
    "",
    "This is a bonding-curve launch. The coin is created on the curve. Supply is not minted into one wallet first.",
    "",
    `Dev buy: about ${percent}% of ${supply} tokens. That buy is the rule of thumb for post-graduation liquidity.`,
    "",
    "Read this before you buy:",
    "- Snipers and bundlers are common on public bonding-curve launches. This project does not run them, and this tool does not ship them.",
    "- A dump after graduation is typical. People who bought the curve often sell when liquidity moves. The price can fall hard.",
    "- This post is not a promise of profit.",
    "",
    "Links:",
    formatSocials(fields.socials),
  ].join("\n");
}

export const CAVEMAN_TOPICS = [
  "bonding_curve",
  "dev_buy",
  "dump",
  "meteora_compound",
  "team_lock",
  "identity",
  "directory",
  "codex",
  "eyes_equal_buys",
  "oauth",
  "admin_guardian",
  "badges",
] as const;

export type CavemanTopic = (typeof CAVEMAN_TOPICS)[number];

const SCRIPTS: Record<CavemanTopic, string> = {
  bonding_curve:
    "Coin starts on a curve.\nPeople buy. People sell. Price moves with that.\nYou do not mint the whole pile into one wallet first.",
  dev_buy:
    "Dev buys about five coins of every hundred.\nThose coins are for the pool after graduation.\nIt is a liquidity habit. It is not a bot.",
  dump: "When the curve ends, many people sell.\nPrice can fall. That is normal.\nSay this before launch so buyers are not surprised.",
  meteora_compound:
    "After graduation, lock the pool on Meteora DAMM v2.\nSet compounding fee to 10000.\nThat means pool fees stay in and add to the quote coin (token B).\nSkip buybacks. Skip burns.",
  team_lock:
    "Lock more team coins. About five to ten of every hundred, or more.\nFirst a cliff. Then a stream.\nPut the proof on the site.",
  identity:
    "Use your name, or stay unnamed and still get checked.\nThe score shows the method: X, claim proofs a machine can read, maybe an outside ID check.\nPublish the method. Skip fake trophies.",
  directory:
    "When a create works, write it down.\nCategory. Short text. Socials. Contract. Locks. How it was checked.",
  codex:
    "Token numbers come from Codex.\nThe almost-free plan needs a one-time one dollar turn-on.\nThen you can read token data. Keep the key private.",
  eyes_equal_buys:
    "Eyes matter as much as buys.\nX Premium. AMAs. Boosts paid from fees. The X developer API.\nShow up. Say the risks out loud.",
  oauth:
    "Connect accounts with OAuth.\nThe platform can then check that the account and the contract belong together.\nNever paste secrets into the tool.",
  admin_guardian:
    "The wallet that made the coin is the root admin.\nRoot can add other wallets as helpers.\nA second lock — guardian wallet, passkey, or TOTP — must approve big changes.\nBig changes: add or remove admins, large liquidity, X API keys.\nPhase 1 does not check that second lock yet.",
  badges:
    "Labels start grey.\nThey turn on when the check is true: liquidity locked, fees compounding, GitHub, X.\nGrey means unfinished. It is not a scoreboard rank.",
};

export function cavemanScript(topic: CavemanTopic): string {
  return SCRIPTS[topic];
}

export function listCavemanTopics(): CavemanTopic[] {
  return [...CAVEMAN_TOPICS];
}
