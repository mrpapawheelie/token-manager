import type { ClaimProof, IdentityScore } from "./schemas.js";

export const IDENTITY_METHODS = [
  "x_account_connected",
  "claim_proofs_ai_checkable",
  "optional_external_id_api",
  "public_or_anonymous_verified_mode",
] as const;

export const IDENTITY_SCORE_FORMULA =
  "x: 15 if a handle is present, plus 10 if X Premium, cap 25. claims: 10 per supported proof, 4 per submitted or unchecked proof, 0 if unsupported, cap 40. externalId: 20 if a provider name is present, else 0. methodsPublished: 15 when the method list is non-empty. total = min(100, sum). Mode adds no points. Anonymous-but-verified is a full mode.";

export interface IdentityScoreInput {
  mode: IdentityScore["mode"];
  xHandle?: string;
  xPremium?: boolean;
  claimProofs: Array<
    Pick<ClaimProof, "status" | "id" | "statement" | "evidenceUri" | "aiCheckable">
  >;
  externalIdProvider?: string;
  methods?: string[];
}

export function scoreIdentity(input: IdentityScoreInput): IdentityScore {
  const x = input.xHandle ? Math.min(25, 15 + (input.xPremium ? 10 : 0)) : 0;
  let claims = 0;
  for (const claim of input.claimProofs) {
    if (claim.status === "supported") claims += 10;
    else if (claim.status === "submitted" || claim.status === "unchecked") claims += 4;
  }
  claims = Math.min(40, claims);
  const externalId = input.externalIdProvider ? 20 : 0;
  const methods =
    input.methods && input.methods.length > 0 ? input.methods : [...IDENTITY_METHODS];
  const methodsPublished = methods.length > 0 ? 15 : 0;
  const total = Math.min(100, x + claims + externalId + methodsPublished);
  const claimProofs = input.claimProofs.map((claim) => ({
    id: claim.id,
    statement: claim.statement,
    evidenceUri: claim.evidenceUri,
    aiCheckable: true as const,
    status: claim.status,
  }));
  return {
    mode: input.mode,
    total,
    breakdown: { x, claims, externalId, methodsPublished },
    ...(input.xHandle ? { xHandle: input.xHandle } : {}),
    ...(input.xPremium !== undefined ? { xPremium: input.xPremium } : {}),
    claimProofs,
    ...(input.externalIdProvider ? { externalIdProvider: input.externalIdProvider } : {}),
    methods,
  };
}
