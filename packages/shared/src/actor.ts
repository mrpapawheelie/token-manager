import { z } from "zod";

/**
 * Web and MCP share stage order. Phase 1 does not copy the session file
 * between them. Both surfaces use the same stub session id until a later
 * phase connects them.
 */
export const JOURNEY_SYNC = {
  sharedStageOrder: true,
  liveSync: false,
  sessionId: "stub-shared-session",
  note: "Web and MCP read the same stage ids from packages/shared. Phase 1 does not sync the JSON session between them. Pass stub-shared-session on both surfaces when a later phase connects them.",
} as const;

export const actorTypeSchema = z.enum(["human", "agent"]);

export type ActorType = z.infer<typeof actorTypeSchema>;

export const surfaceSchema = z.enum(["web", "mcp"]);

export type Surface = z.infer<typeof surfaceSchema>;

export const creationActorMetaSchema = z
  .object({
    actor_type: actorTypeSchema,
    sessionId: z.string().min(1).max(80),
    surface: surfaceSchema,
    agent_created: z.boolean(),
    no_human: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const agent = value.actor_type === "agent";
    if (value.agent_created !== agent || value.no_human !== agent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "agent_created and no_human are true only when actor_type is agent. A human create sets both to false.",
      });
    }
  });

export type CreationActorMeta = z.infer<typeof creationActorMetaSchema>;

export function creationActorMeta(input: {
  actorType: ActorType;
  surface: Surface;
  sessionId?: string;
}): CreationActorMeta {
  const agent = input.actorType === "agent";
  return creationActorMetaSchema.parse({
    actor_type: input.actorType,
    sessionId: input.sessionId ?? JOURNEY_SYNC.sessionId,
    surface: input.surface,
    agent_created: agent,
    no_human: agent,
  });
}
