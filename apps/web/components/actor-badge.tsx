"use client";

import type { CreationActorMeta } from "@token-manager/shared";

type FeePolicy = "earmarked" | "dao_governed" | "human_withdrawable";

interface LockView {
  retcon: "non_retcon" | "open";
  platformAdminCanChange: boolean;
}

export function ActorBadge({
  actor,
  feePolicy,
  lock,
}: {
  actor: CreationActorMeta;
  feePolicy: FeePolicy;
  lock: LockView;
}) {
  const agent = actor.agent_created && actor.no_human;
  const fee =
    feePolicy === "dao_governed"
      ? "DAO governed"
      : feePolicy === "human_withdrawable"
        ? "Human withdrawable · discouraged"
        : "Earmarked";

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {agent ? (
        <>
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-950 ring-1 ring-sky-300">
            Agent created
          </span>
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-950 ring-1 ring-sky-300">
            No human
          </span>
        </>
      ) : (
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600 ring-1 ring-stone-200">
          Human
        </span>
      )}
      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 ring-1 ring-stone-200">
        {fee}
      </span>
      {lock.retcon === "non_retcon" ? (
        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-950 ring-1 ring-sky-300">
          Mint, LP, and fee admin immutable · non-retcon
        </span>
      ) : null}
      {agent && !lock.platformAdminCanChange ? (
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 ring-1 ring-stone-200">
          Platform admin cannot change these
        </span>
      ) : null}
    </div>
  );
}
