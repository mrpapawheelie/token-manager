import { z } from "zod";

import { actorTypeSchema, type ActorType } from "./actor.js";

/**
 * Fee path for a project. human_withdrawable is only for a human create
 * and is discouraged. An agent create cannot select it.
 * Phase 1 records the choice and does not move funds.
 */
export const feePolicySchema = z.enum([
  "earmarked",
  "dao_governed",
  "human_withdrawable",
]);

export type FeePolicy = z.infer<typeof feePolicySchema>;

export const FEE_POLICY_NOTES = [
  {
    id: "earmarked" as const,
    forActor: "human_or_agent" as const,
    discouraged: false,
    note: "Fees are earmarked for a named purpose. This stub does not withdraw them.",
  },
  {
    id: "dao_governed" as const,
    forActor: "human_or_agent" as const,
    discouraged: false,
    note: "A DAO vote directs fees. The pointer is governance_dao_playbook. Phase 1 does not open a vote.",
  },
  {
    id: "human_withdrawable" as const,
    forActor: "human" as const,
    discouraged: true,
    note: "Only for human-created projects. Discouraged. Rejected when actor_type is agent.",
  },
] as const;

export const feePolicyChoiceSchema = z
  .object({
    actorType: actorTypeSchema,
    policy: feePolicySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.actorType === "agent" && value.policy === "human_withdrawable") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "human_withdrawable is only for human-created projects and is discouraged for an agent. Choose earmarked or dao_governed.",
      });
    }
  });

export function chooseFeePolicy(input: { actorType: ActorType; policy: FeePolicy }) {
  const parsed = feePolicyChoiceSchema.parse(input);
  const discouraged = parsed.policy === "human_withdrawable";
  return {
    actorType: parsed.actorType,
    policy: parsed.policy,
    discouraged,
    allowed: true as const,
    stored: false as const,
    network: false as const,
    note: discouraged
      ? "human_withdrawable is only for human-created projects and is discouraged. Phase 1 does not withdraw fees."
      : "Fee path chosen locally. Phase 1 does not move funds.",
  };
}

export const authorityStateSchema = z.enum(["immutable", "mutable"]);

export const postCreateLockSchema = z
  .object({
    actor_type: actorTypeSchema,
    agent_created: z.boolean(),
    finalized: z.boolean(),
    mintAdmin: authorityStateSchema,
    lpAdmin: authorityStateSchema,
    feeAdmin: authorityStateSchema,
    retcon: z.enum(["non_retcon", "open"]),
    platformAdminCanChange: z.boolean(),
    note: z.string().min(1).max(400),
  })
  .strict()
  .superRefine((value, ctx) => {
    const agent = value.actor_type === "agent";
    if (value.agent_created !== agent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PostCreateLock.agent_created is true only when actor_type is agent.",
      });
    }
    if (agent && value.platformAdminCanChange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Humans cannot change mint, LP, or fee admin via platform admin for an agent_created project.",
      });
    }
    if (agent && value.finalized) {
      const frozen =
        value.mintAdmin === "immutable" &&
        value.lpAdmin === "immutable" &&
        value.feeAdmin === "immutable" &&
        value.retcon === "non_retcon";
      if (!frozen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "After an agent finalize, mint, LP, and fee admin are immutable and non-retcon.",
        });
      }
    }
  });

export type PostCreateLock = z.infer<typeof postCreateLockSchema>;

export function postCreateLock(input: {
  actorType: ActorType;
  finalized: boolean;
}): PostCreateLock {
  const agent = input.actorType === "agent";
  const frozen = agent && input.finalized;
  const note = frozen
    ? "After agent finalize, mint, LP, and fee admin are immutable and non-retcon. Humans cannot change those via platform admin."
    : agent
      ? "Agent-created and not finalized. Platform admin cannot change mint, LP, or fee admin. Finalize marks them immutable and non-retcon. Phase 1 does not write chain state."
      : "Human-created. Platform admin is still only a stub. Phase 1 does not write chain state.";
  return postCreateLockSchema.parse({
    actor_type: input.actorType,
    agent_created: agent,
    finalized: input.finalized,
    mintAdmin: frozen ? "immutable" : "mutable",
    lpAdmin: frozen ? "immutable" : "mutable",
    feeAdmin: frozen ? "immutable" : "mutable",
    retcon: frozen ? "non_retcon" : "open",
    platformAdminCanChange: !agent,
    note,
  });
}

export const AGENT_TEASER =
  "Give the agent the MCP. It creates and sets up the project, then notifies the human. Phase 1 does not send the transaction or the notice.";

export function daoPlaybook(actorType: ActorType) {
  return {
    actorType,
    pointer: "governance_dao_playbook" as const,
    votesSent: false as const,
    humanNotified: false as const,
    network: false as const,
    teaser: AGENT_TEASER,
    steps: [
      AGENT_TEASER,
      "Choose a fee path with fee_policy_choose: earmarked or dao_governed.",
      actorType === "agent"
        ? "human_withdrawable is only for human-created projects and is discouraged for an agent. The schema rejects it."
        : "human_withdrawable is allowed on a human-created project and discouraged. Prefer earmarked or dao_governed.",
      "DAO vote setup stays on the founder's accounts. This playbook is a pointer. It does not create a proposal or cast a vote.",
      "After an agent finalize, governance_finalize_lock marks mint, LP, and fee admin immutable and non-retcon. Humans cannot change those via platform admin.",
    ],
  };
}

export function governanceIssues(input: {
  actor_type: ActorType;
  agent_created: boolean;
  no_human: boolean;
  feePolicy: FeePolicy;
  postCreateLock: PostCreateLock;
}): string[] {
  const issues: string[] = [];
  const agent = input.actor_type === "agent";
  if (input.agent_created !== agent || input.no_human !== agent) {
    issues.push("agent_created and no_human are true only when actor_type is agent.");
  }
  if (agent && input.feePolicy === "human_withdrawable") {
    issues.push(
      "human_withdrawable is only for human-created projects and is discouraged for an agent.",
    );
  }
  if (input.postCreateLock.actor_type !== input.actor_type) {
    issues.push("PostCreateLock.actor_type must match the creation actor.");
  }
  if (input.postCreateLock.agent_created !== agent) {
    issues.push("PostCreateLock.agent_created must match the creation actor.");
  }
  if (
    agent &&
    input.postCreateLock.finalized &&
    (input.postCreateLock.mintAdmin !== "immutable" ||
      input.postCreateLock.lpAdmin !== "immutable" ||
      input.postCreateLock.feeAdmin !== "immutable" ||
      input.postCreateLock.retcon !== "non_retcon" ||
      input.postCreateLock.platformAdminCanChange)
  ) {
    issues.push(
      "After an agent finalize, mint, LP, and fee admin are immutable and non-retcon. Humans cannot change them via platform admin.",
    );
  }
  return issues;
}

export const SECURITY_DISCLAIMER =
  "Token Manager is not a security audit and does not custody funds. Phase 1 schemas and stubs do not protect a mint, an LP position, or a fee account. Do not treat these docs as an attestation.";

export const AUDIT_SLOT = {
  kind: "third_party" as const,
  auditor: null,
  completed: false as const,
  reportUri: null,
  note: "Third-party audit slot. Empty until a named firm completes a review. Phase 1 does not fill it.",
};

export const CREDIBILITY = {
  listing: "wysiwyg" as const,
  repoClonable: true as const,
  note: "Credibility is a WYSIWYG listing: the directory shows recorded checks and agent labels, and it does not invent a rank. The repo stays clonable. A founder can copy it and leave.",
};

export const FUNCTION_MAP = [
  {
    id: "web_directory",
    surface: "web",
    served: true,
    live: false,
    summary:
      "Directory shell of mock creations. Cards below the lg breakpoint, a table from lg up. Same stage ids as MCP.",
  },
  {
    id: "mcp_journey",
    surface: "mcp",
    served: true,
    live: false,
    summary:
      "get_progress and resume use a local JSON session. liveSync is false. The stub session id is stub-shared-session.",
  },
  {
    id: "scanner_openapi",
    surface: "web",
    served: true,
    live: false,
    summary:
      "GET /api/scanner/tokens serves fixtures. SCANNER_OPENAPI is a sketch, not a live API. Missing flags stay unverified.",
  },
  {
    id: "api_builder_openapi",
    surface: "mcp",
    served: false,
    live: false,
    summary:
      "API_BUILDER_OPENAPI describes HTTP 402 and a balance read. Those routes are not served.",
  },
  {
    id: "governance_openapi",
    surface: "docs",
    served: false,
    live: false,
    summary:
      "GOVERNANCE_OPENAPI documents fee policy and the post-create lock. No path is served. Choosing a policy does not move funds.",
  },
] as const;

export const GOVERNANCE_OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "Token Manager governance sketch",
    version: "0.1.0",
    description:
      "Honesty: this document is not a live API. No path is served. live is false. fee_policy_choose and governance_finalize_lock do not move funds or change a mint.",
  },
  paths: {
    "/governance/fee-policy": {
      post: {
        summary: "Not served. fee_policy_choose is a local MCP helper.",
        responses: {
          "501": {
            description:
              "Not implemented as HTTP. human_withdrawable is only for a human create and is discouraged for an agent.",
          },
        },
      },
    },
    "/governance/finalize-lock": {
      post: {
        summary:
          "Not served. After an agent finalize the record marks mint, LP, and fee admin immutable and non-retcon.",
        responses: {
          "501": {
            description:
              "Not implemented as HTTP. Humans cannot change those authorities via platform admin for an agent_created project. This route does not write chain state.",
          },
        },
      },
    },
  },
} as const;
