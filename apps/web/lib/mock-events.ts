import {
  IDENTITY_METHODS,
  buildBadges,
  creationEventSchema,
  guardianPolicySchema,
  scoreIdentity,
  scoreProfile,
  type BadgeDefinition,
  type CoAdmin,
  type CreationEvent,
  type GuardianPolicy,
  type LockTier,
  type ProfileCompletionScore,
  type ProfileSignals,
} from "@token-manager/shared";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function addr(prefix: string): string {
  const value = (prefix + "1".repeat(44)).slice(0, 44);
  if (!ADDRESS.test(value)) {
    throw new Error(`Mock address failed for ${prefix}`);
  }
  return value;
}

export interface DirectoryProject {
  event: CreationEvent;
  signals: ProfileSignals;
  lockTier: LockTier;
  badges: BadgeDefinition[];
  completion: ProfileCompletionScore;
  admin: {
    creatorWallet: string;
    coAdmins: CoAdmin[];
    guardian: GuardianPolicy;
  };
}

function project(input: {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description: string;
  contractPrefix: string;
  creatorPrefix: string;
  launchAt: string;
  stage: CreationEvent["stage"];
  verification: CreationEvent["verification"]["status"];
  signals: ProfileSignals;
  lockTier: LockTier;
  locks: CreationEvent["locks"];
  socials: CreationEvent["socials"];
  identity: CreationEvent["identity"];
  coAdmins: CoAdmin[];
}): DirectoryProject {
  const creatorWallet = addr(input.creatorPrefix);
  const completion = scoreProfile(input.signals);
  const badges = buildBadges(input.signals, input.lockTier);
  const event = creationEventSchema.parse({
    id: input.id,
    createdAt: "2026-10-01T15:00:00.000Z",
    name: input.name,
    symbol: input.symbol,
    category: input.category,
    shortDescription: input.description,
    socials: input.socials,
    contract: addr(input.contractPrefix),
    locks: input.locks,
    verification: {
      status: input.verification,
      methods: [...IDENTITY_METHODS],
    },
    identity: input.identity,
    stage: input.stage,
    launchAt: input.launchAt,
    dumpHonestyAcknowledged: true,
    launchStyle: "bonding_curve",
  });
  const guardian = guardianPolicySchema.parse({
    projectId: input.id,
    requiredFor: ["add_admin", "remove_admin", "large_liquidity", "x_api_credentials"],
    factors: [
      { kind: "wallet", walletAddress: addr("Guard") },
      { kind: "passkey", passkeyCredentialId: `passkey-${input.id}` },
      { kind: "totp", totpEnrolled: true },
    ],
    threshold: 1,
    largeLiquidityQuoteUi: 50,
  });
  return {
    event,
    signals: input.signals,
    lockTier: input.lockTier,
    badges,
    completion,
    admin: { creatorWallet, coAdmins: input.coAdmins, guardian },
  };
}

const northSignals: ProfileSignals = {
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
};

const queueSignals: ProfileSignals = {
  hasListingMeta: true,
  launchTimeNamed: false,
  dumpHonestyAcknowledged: true,
  hasX: false,
  hasTelegram: false,
  hasGithub: false,
  devBuyNearRule: false,
  liquidityLocked: true,
  autoCompounding: true,
  teamLockPublished: false,
};

const forgeSignals: ProfileSignals = {
  hasListingMeta: true,
  launchTimeNamed: true,
  dumpHonestyAcknowledged: true,
  hasX: true,
  hasTelegram: true,
  hasGithub: true,
  devBuyNearRule: true,
  liquidityLocked: true,
  autoCompounding: true,
  teamLockPublished: true,
};

export const mockProjects: DirectoryProject[] = [
  project({
    id: "north-curve",
    name: "North Curve",
    symbol: "NORTH",
    category: "tooling",
    description:
      "Sample tooling launch at 70% profile completion. Socials are on. Locks are still grey.",
    contractPrefix: "Curve",
    creatorPrefix: "RootA",
    launchAt: "2026-12-01T16:00:00.000Z",
    stage: "log_creation_event",
    verification: "verified",
    signals: northSignals,
    lockTier: "none",
    locks: [],
    socials: {
      x: "northcurve",
      telegram: "https://t.me/northcurve",
      github: "https://github.com/example/north-curve",
    },
    identity: scoreIdentity({
      mode: "public",
      xHandle: "northcurve",
      xPremium: true,
      externalIdProvider: undefined,
      claimProofs: [
        {
          id: "north-repo",
          statement: "The repo link matches the directory row.",
          evidenceUri: "https://example.com/north-curve/claim",
          aiCheckable: true,
          status: "supported",
        },
      ],
    }),
    coAdmins: [
      {
        walletAddress: addr("CoAd"),
        addedBy: addr("RootA"),
        addedAt: "2026-10-20T00:00:00.000Z",
        label: "ops",
      },
    ],
  }),
  project({
    id: "queue-note",
    name: "Queue Note",
    symbol: "QUEUE",
    category: "community",
    description:
      "Mostly grey labels. A partial LP lock is the one colored liquidity check.",
    contractPrefix: "Queue",
    creatorPrefix: "RootB",
    launchAt: "2026-11-20T16:00:00.000Z",
    stage: "bonding_curve_launch",
    verification: "pending",
    signals: queueSignals,
    lockTier: "partial",
    locks: [
      {
        kind: "meteora_damm_v2_lp",
        subject: addr("Damm"),
        supplyBps: 200,
        compoundingFeeBps: 10000,
        locker: "meteora-damm-v2",
        quoteSymbol: "SOL",
      },
    ],
    socials: {},
    identity: scoreIdentity({ mode: "anonymous_verified", claimProofs: [] }),
    coAdmins: [],
  }),
  project({
    id: "forge-lock",
    name: "Forge Lock",
    symbol: "FORGE",
    category: "infra",
    description:
      "Anonymous-but-verified sample with locks, compounding, and a published team stream.",
    contractPrefix: "Forge",
    creatorPrefix: "RootC",
    launchAt: "2026-10-15T16:00:00.000Z",
    stage: "year_one_ops",
    verification: "anonymous_verified",
    signals: forgeSignals,
    lockTier: "full",
    locks: [
      {
        kind: "meteora_damm_v2_lp",
        subject: addr("Damm"),
        supplyBps: 500,
        compoundingFeeBps: 10000,
        locker: "meteora-damm-v2",
        quoteSymbol: "SOL",
        proofUri: "https://example.com/forge-lock/lp",
      },
      {
        kind: "team_vest_cliff_stream",
        subject: addr("Team"),
        supplyBps: 800,
        cliffSeconds: 86_400 * 30,
        streamSeconds: 86_400 * 180,
        locker: "stream-locker",
        recipientLabel: "team",
        proofUri: "https://example.com/forge-lock/team",
      },
    ],
    socials: {
      website: "https://example.com/forge-lock",
      x: "forgelock",
      xCommunity: "https://x.com/i/communities/example",
      telegram: "https://t.me/forgelock",
      github: "https://github.com/example/forge-lock",
    },
    identity: scoreIdentity({
      mode: "anonymous_verified",
      xHandle: "forgelock",
      xPremium: true,
      externalIdProvider: "example-id",
      claimProofs: [
        {
          id: "forge-site",
          statement: "Proof page lists the LP and the team stream.",
          evidenceUri: "https://example.com/forge-lock/claim",
          aiCheckable: true,
          status: "supported",
        },
        {
          id: "forge-github",
          statement: "GitHub org matches the linked account.",
          evidenceUri: "https://example.com/forge-lock/github",
          aiCheckable: true,
          status: "supported",
        },
      ],
    }),
    coAdmins: [
      {
        walletAddress: addr("CoAd"),
        addedBy: addr("RootC"),
        addedAt: "2026-10-18T00:00:00.000Z",
        label: "editor",
      },
    ],
  }),
];

export function getProject(id: string): DirectoryProject | undefined {
  return mockProjects.find((item) => item.event.id === id);
}
