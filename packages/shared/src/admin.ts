import type {
  AdminSession,
  CoAdmin,
  GuardianPolicy,
  SensitiveAction,
} from "./schemas.js";
import { guardianMethodSchema } from "./schemas.js";

export interface AdminPreviewInput {
  projectId: string;
  walletAddress: string;
  creatorWallet: string;
  coAdmins: CoAdmin[];
  now?: Date;
}

export interface AdminPreview {
  authorized: boolean;
  session: AdminSession | null;
  todo: string;
}

const SIWS_TODO =
  "TODO(phase-2): verify a Sign-In With Solana signature for this wallet before authenticated can be true. Phase 1 does not check a signature.";

/**
 * Root admin is the wallet that created the token.
 * Co-admins are wallets the root has added. This preview does not authenticate.
 */
export function previewAdminSession(input: AdminPreviewInput): AdminPreview {
  const now = input.now ?? new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);
  const isRoot = input.walletAddress === input.creatorWallet;
  const isCoAdmin = input.coAdmins.some(
    (admin) => admin.walletAddress === input.walletAddress,
  );
  if (!isRoot && !isCoAdmin) {
    return { authorized: false, session: null, todo: SIWS_TODO };
  }
  return {
    authorized: true,
    session: {
      projectId: input.projectId,
      walletAddress: input.walletAddress,
      role: isRoot ? "root" : "co_admin",
      method: "sign_in_with_solana",
      authenticated: false,
      rootWallet: input.creatorWallet,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      note: "Preview only. Signature check is not implemented, so this session is not signed in.",
    },
    todo: SIWS_TODO,
  };
}

export interface GuardianApproval {
  acknowledged: true;
  method: "wallet" | "passkey" | "totp";
}

export interface GuardianGateReview {
  action: SensitiveAction;
  status: "stub_blocked" | "stub_acknowledged";
  enforced: false;
  todo: string;
}

const GUARDIAN_TODO =
  "TODO(phase-2): verify a guardian wallet signature, a WebAuthn/passkey assertion, or a TOTP code against a server-side secret. Never log the secret, the seed, or an API key. Acknowledgement in Phase 1 is not proof.";

/**
 * Second layer for a compromised creator wallet.
 * Phase 1 records the policy and the acknowledgement shape. It does not verify factors.
 */
export function reviewGuardianGate(
  policy: GuardianPolicy | null,
  action: SensitiveAction,
  approval: GuardianApproval | undefined,
): GuardianGateReview {
  const required = policy?.requiredFor.includes(action) ?? false;
  if (!required && !approval) {
    return {
      action,
      status: "stub_acknowledged",
      enforced: false,
      todo: GUARDIAN_TODO,
    };
  }
  if (
    !approval?.acknowledged ||
    !guardianMethodSchema.safeParse(approval.method).success
  ) {
    return {
      action,
      status: "stub_blocked",
      enforced: false,
      todo: GUARDIAN_TODO,
    };
  }
  return {
    action,
    status: "stub_acknowledged",
    enforced: false,
    todo: GUARDIAN_TODO,
  };
}
