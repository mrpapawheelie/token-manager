import { z } from "zod";

/** Founder sites use this stack. The directory shell does not replace it. */
export const SITE_TEMPLATE_STACK = {
  host: "vercel",
  framework: "next.js",
  language: "typescript",
  ui: "shadcn/ui",
  forms: "zod",
  extendable: true,
  founderOwned: true,
} as const;

export const CONTRACT_ADDRESS_PLACEHOLDER = "Contract address publishes at launch";

export const prelaunchStepIdSchema = z.enum([
  "publish_site",
  "create_x",
  "publish_account",
  "first_ama",
  "hype_cadence",
]);

export type PrelaunchStepId = z.infer<typeof prelaunchStepIdSchema>;

export const prelaunchChecklistSchema = z
  .object({
    fee: z.literal("free"),
    mint: z.literal(false),
    blocksLaunch: z.literal(false),
    stack: z.object({
      host: z.literal("vercel"),
      framework: z.literal("next.js"),
      language: z.literal("typescript"),
      ui: z.literal("shadcn/ui"),
      forms: z.literal("zod"),
    }),
    steps: z
      .array(
        z
          .object({
            id: prelaunchStepIdSchema,
            title: z.string(),
            detail: z.string(),
            done: z.boolean(),
          })
          .strict(),
      )
      .length(5),
  })
  .strict();

export type PrelaunchChecklist = z.infer<typeof prelaunchChecklistSchema>;

const PRELAUNCH_COPY: Record<PrelaunchStepId, { title: string; detail: string }> = {
  publish_site: {
    title: "Publish the site",
    detail:
      "Ship the project site before any mint. The contract line stays a placeholder until the coin exists. No platform fee.",
  },
  create_x: {
    title: "Create the X account",
    detail: "Open the X account on the founder's login. Token Manager does not own it.",
  },
  publish_account: {
    title: "Publish the account",
    detail:
      "Put the handle, the site, and the launch time where people can find them. Still no mint.",
  },
  first_ama: {
    title: "First AMA",
    detail: "Name the first AMA time in public. This is attention, not a fee.",
  },
  hype_cadence: {
    title: "Hype cadence",
    detail:
      "Pick a simple posting rhythm through launch week. Keep the dump caveat ready for the launch post.",
  },
};

export function prelaunchChecklist(
  done: Partial<Record<PrelaunchStepId, boolean>> = {},
): PrelaunchChecklist {
  return prelaunchChecklistSchema.parse({
    fee: "free",
    mint: false,
    blocksLaunch: false,
    stack: {
      host: SITE_TEMPLATE_STACK.host,
      framework: SITE_TEMPLATE_STACK.framework,
      language: SITE_TEMPLATE_STACK.language,
      ui: SITE_TEMPLATE_STACK.ui,
      forms: SITE_TEMPLATE_STACK.forms,
    },
    steps: (Object.keys(PRELAUNCH_COPY) as PrelaunchStepId[]).map((id) => ({
      id,
      title: PRELAUNCH_COPY[id].title,
      detail: PRELAUNCH_COPY[id].detail,
      done: done[id] === true,
    })),
  });
}
