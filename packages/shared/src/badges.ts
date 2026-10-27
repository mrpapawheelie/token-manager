import { PROFILE_COMPLETION_BENEFIT } from "./principles.js";
import type {
  BadgeDefinition,
  BadgeId,
  LockTier,
  ProfileCompletionScore,
  ProfileSignals,
} from "./schemas.js";

export const PROFILE_CHECKLIST: readonly { key: keyof ProfileSignals; label: string }[] =
  [
    { key: "hasListingMeta", label: "Listing name and description" },
    { key: "launchTimeNamed", label: "Named launch time" },
    {
      key: "dumpHonestyAcknowledged",
      label: "Dump-after-graduation caveat acknowledged",
    },
    { key: "hasX", label: "X account linked" },
    { key: "hasTelegram", label: "Telegram linked" },
    { key: "hasGithub", label: "GitHub linked" },
    { key: "devBuyNearRule", label: "Dev buy near the 5% liquidity rule" },
    { key: "liquidityLocked", label: "Liquidity locked" },
    { key: "autoCompounding", label: "LP fees set to auto-compound" },
    { key: "teamLockPublished", label: "Team lock proof published" },
  ];

const BADGE_COPY: Record<BadgeId, { label: string; on: string; off: string }> = {
  locked_liquidity: {
    label: "Locked liquidity",
    on: "A public LP lock is recorded.",
    off: "No LP lock yet. This label stays grey.",
  },
  auto_compounding: {
    label: "Auto-compounding",
    on: "compounding_fee_bps = 10000. Fees compound into quote token B.",
    off: "Auto-compound is not on. This label stays grey.",
  },
  github: {
    label: "GitHub",
    on: "GitHub link is present.",
    off: "GitHub is not connected. This label stays grey.",
  },
  x: {
    label: "X",
    on: "X account is linked.",
    off: "X is not connected. This label stays grey.",
  },
  telegram: {
    label: "Telegram",
    on: "Telegram link is present.",
    off: "Telegram is not connected. This label stays grey.",
  },
  team_lock: {
    label: "Team lock",
    on: "A cliff-and-stream proof is published.",
    off: "Team lock proof is missing. This label stays grey.",
  },
};

export function listBadgeCatalog(): Array<{
  id: BadgeId;
  label: string;
  starts: "grey";
}> {
  return (Object.keys(BADGE_COPY) as BadgeId[]).map((id) => ({
    id,
    label: BADGE_COPY[id].label,
    starts: "grey" as const,
  }));
}

export function buildBadges(
  signals: ProfileSignals,
  lockTier: LockTier,
): BadgeDefinition[] {
  const liquidityActive = lockTier !== "none" && signals.liquidityLocked;
  const liquidityDetail =
    lockTier === "full"
      ? "Full tier: locked LP at or above the ~5% liquidity habit."
      : lockTier === "partial"
        ? "Partial tier: some LP is locked, under the ~5% habit."
        : BADGE_COPY.locked_liquidity.off;
  return [
    {
      id: "locked_liquidity",
      label:
        lockTier === "partial"
          ? "Locked liquidity · partial"
          : lockTier === "full"
            ? "Locked liquidity · full"
            : "Locked liquidity",
      active: liquidityActive,
      tier: lockTier,
      detail: liquidityActive ? liquidityDetail : BADGE_COPY.locked_liquidity.off,
    },
    {
      id: "auto_compounding",
      label: "Auto-compounding",
      active: signals.autoCompounding,
      detail: signals.autoCompounding
        ? BADGE_COPY.auto_compounding.on
        : BADGE_COPY.auto_compounding.off,
    },
    {
      id: "github",
      label: "GitHub",
      active: signals.hasGithub,
      detail: signals.hasGithub ? BADGE_COPY.github.on : BADGE_COPY.github.off,
    },
    {
      id: "x",
      label: "X",
      active: signals.hasX,
      detail: signals.hasX ? BADGE_COPY.x.on : BADGE_COPY.x.off,
    },
    {
      id: "telegram",
      label: "Telegram",
      active: signals.hasTelegram,
      detail: signals.hasTelegram ? BADGE_COPY.telegram.on : BADGE_COPY.telegram.off,
    },
    {
      id: "team_lock",
      label: "Team lock",
      active: signals.teamLockPublished,
      detail: signals.teamLockPublished
        ? BADGE_COPY.team_lock.on
        : BADGE_COPY.team_lock.off,
    },
  ];
}

export function scoreProfile(signals: ProfileSignals): ProfileCompletionScore {
  const completed: string[] = [];
  const missing: string[] = [];
  for (const item of PROFILE_CHECKLIST) {
    if (signals[item.key]) completed.push(item.label);
    else missing.push(item.label);
  }
  const percent = Math.round((completed.length / PROFILE_CHECKLIST.length) * 100);
  return {
    percent,
    completed,
    missing,
    benefit: PROFILE_COMPLETION_BENEFIT,
  };
}
