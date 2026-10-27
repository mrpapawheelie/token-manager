import type { IdentityScore } from "@token-manager/shared";

export function IdentityScorePanel({ score }: { score: IdentityScore }) {
  const rows = [
    ["X", score.breakdown.x, 25],
    ["Claim proofs", score.breakdown.claims, 40],
    ["External ID", score.breakdown.externalId, 20],
    ["Methods published", score.breakdown.methodsPublished, 15],
  ] as const;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Identity score</h2>
      <p className="text-3xl font-semibold tracking-tight">{score.total} / 100</p>
      <p className="text-sm text-stone-600">
        Mode: {score.mode === "public" ? "Public identity" : "Anonymous, verified"}. This
        is a method breakdown, not a badge.
      </p>
      <dl className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value, cap]) => (
          <div key={label} className="rounded-md bg-stone-100 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-stone-500">{label}</dt>
            <dd className="text-sm">
              {value} / {cap}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
        {score.methods.map((method) => (
          <li key={method}>{method}</li>
        ))}
      </ul>
    </section>
  );
}
