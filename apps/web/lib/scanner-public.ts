import {
  SCANNER_OPENAPI,
  SCANNER_RATE_LIMIT,
  buildScannerToken,
  type ScannerTokenPayload,
} from "@token-manager/shared";

import { mockProjects, type DirectoryProject } from "./mock-events";

export { SCANNER_OPENAPI, SCANNER_RATE_LIMIT };

/** Copy a mock directory row. Does not upgrade a missing check into a pass. */
export function toScannerToken(project: DirectoryProject): ScannerTokenPayload {
  const identity = project.event.identity;
  return buildScannerToken({
    id: project.event.id,
    name: project.event.name,
    symbol: project.event.symbol,
    category: project.event.category,
    shortDescription: project.event.shortDescription,
    contract: project.event.contract,
    createdAt: project.event.createdAt,
    launchAt: project.event.launchAt,
    mock: true,
    actor: project.event.actor,
    feePolicy: project.feePolicy,
    finalized: project.lock.finalized,
    identityMode: identity?.mode ?? null,
    socials: {
      x: project.event.socials.x ?? null,
      github: project.event.socials.github ?? null,
      telegram: project.event.socials.telegram ?? null,
      website: project.event.socials.website ?? null,
    },
    flags: {
      connectedX: project.signals.hasX,
      connectedGithub: project.signals.hasGithub,
      verificationStatus: project.event.verification.status,
      lockTier: project.lockTier,
      lockAssessed: true,
      autoCompound: project.signals.autoCompounding,
      profileCompletion: project.completion.percent,
      claims: (identity?.claimProofs ?? []).map((claim) => ({
        id: claim.id,
        statement: claim.statement,
        status: claim.status,
      })),
    },
  });
}

export function listScannerTokens(limit?: number): ScannerTokenPayload[] {
  const tokens = mockProjects.map(toScannerToken);
  if (limit === undefined) return tokens;
  return tokens.slice(0, limit);
}

export function scannerListBody(limit?: number) {
  return {
    mock: true as const,
    live: false as const,
    source: "fixture" as const,
    founderOwned: true as const,
    optional: true as const,
    rateLimit: SCANNER_RATE_LIMIT,
    tokens: listScannerTokens(limit),
  };
}
