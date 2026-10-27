"use client";

import { useState } from "react";

import type { DirectoryProject } from "@/lib/mock-events";

const ACTIONS = [
  "Add co-admin",
  "Remove co-admin",
  "Create Meteora pool",
  "Add liquidity",
  "Lock LP",
  "Reinvest fees",
  "Change X API credentials",
] as const;

export function AdminDashboard({ project }: { project: DirectoryProject }) {
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [priceSource, setPriceSource] = useState<"codex" | "onchain">("codex");

  function sendChat() {
    const trimmed = message.trim();
    if (!trimmed) return;
    const looksSecret =
      /^[1-9A-HJ-NP-Za-km-z]{80,}$/.test(trimmed) ||
      /private key|seed phrase|api key|totp/i.test(trimmed);
    setReply(
      looksSecret
        ? "That looks like a secret. It stayed in this browser and was not stored."
        : `Placeholder only. No model was called. You wrote: ${trimmed.slice(0, 240)}`,
    );
    setMessage("");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2 rounded-lg border border-stone-400 bg-stone-100 p-4">
        <h2 className="text-lg font-semibold">Private admin review</h2>
        <p className="text-sm text-stone-700">
          Private. This queue is not on the public token page. A heuristic is not a
          verified claim. We validate actions. We do not grade people.
        </p>
        {project.privateFlags.length === 0 ? (
          <p className="text-sm text-stone-600">No private flags on this mock.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {project.privateFlags.map((flag) => (
              <li key={flag.id} className="rounded-md bg-white p-3 ring-1 ring-stone-300">
                <p className="font-medium">{flag.reason.replaceAll("_", " ")}</p>
                <p className="text-stone-700">{flag.detail}</p>
                <p className="text-stone-500">
                  {flag.queue} · {flag.visibility} · published {String(flag.published)} ·
                  verified {String(flag.verified)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Sign-in preview</h2>
        <p className="mt-1 text-sm text-stone-600">
          Root admin is the wallet that created the token. Sign-In With Solana is not
          connected, so this preview does not check a signature.
        </p>
        <p className="mt-3 font-mono text-xs break-all">
          Creator wallet {project.admin.creatorWallet}
        </p>
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          className="mt-3 rounded-md bg-stone-900 px-3 py-2 text-sm text-white"
        >
          {preview ? "Leave preview" : "Preview as root admin"}
        </button>
        <p className="mt-2 text-sm">
          {preview
            ? "Previewing as root. authenticated would still be false until a signature check exists."
            : "Signed out. The panels below stay visible so the shell can be reviewed."}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Privy can cover Google or social login and wallet connect. Start on the free
          plan. This stub is signed out and sits beside Sign-In With Solana. It is not a
          second root admin.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Stage" value={project.event.stage} />
        <Stat label="Profile" value={`${project.completion.percent}% complete`} />
        <Stat label="Locks on record" value={String(project.event.locks.length)} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Co-admins</h2>
        {project.admin.coAdmins.length === 0 ? (
          <p className="text-sm text-stone-600">No co-admin wallets in this mock.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {project.admin.coAdmins.map((admin) => (
              <li key={admin.walletAddress} className="font-mono text-xs break-all">
                {admin.label ? `${admin.label}: ` : ""}
                {admin.walletAddress}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-stone-600">
          Adding or removing a wallet needs the root plus a guardian approval. Phase 1
          does not check the guardian, so the buttons stay off.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Guardian policy</h2>
        <p className="text-sm text-stone-600">
          Sensitive actions need a second factor so a compromised creator wallet is not
          enough. Factors in this mock: guardian wallet, passkey credential id, and TOTP
          enrolled. The TOTP secret is not in the page. Threshold{" "}
          {project.admin.guardian.threshold}. Large liquidity starts at{" "}
          {project.admin.guardian.largeLiquidityQuoteUi ?? "—"} quote tokens. Enforcement
          is off.
        </p>
        <ul className="list-disc pl-5 text-sm">
          {project.admin.guardian.requiredFor.map((action) => (
            <li key={action}>{action.replaceAll("_", " ")}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Placeholder AI chat</h2>
        <p className="text-sm text-stone-600">
          Project context only, later. This box calls no model. Do not paste keys.
        </p>
        <label className="block text-sm">
          <span className="font-medium">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={sendChat}
          className="rounded-md border border-stone-400 px-3 py-2 text-sm"
        >
          Send placeholder
        </button>
        {reply ? <p className="text-sm text-stone-800">{reply}</p> : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">X automated posts</h2>
        <p className="text-sm text-stone-600">
          Stub queue. Nothing is scheduled. Credential changes use the guardian gate and
          never accept an API key in the form.
        </p>
        <ul className="list-disc pl-5 text-sm text-stone-500">
          <li>Launch-time post — not queued</li>
          <li>Dump-caveat pin — not queued</li>
          <li>AMA reminder — not queued</li>
        </ul>
      </section>

      <XAnalytics
        handle={project.event.socials.x ?? project.event.symbol}
        symbol={project.event.symbol}
      />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Ads and boosts</h2>
        <p className="text-sm text-stone-600">
          {`Fee-funded boosts are for attention around $${project.event.symbol.toUpperCase()} and a campaign keyword. This shell does not spend. A later submit path still requires confirm. Boosts are not a Radar export and not a buyback.`}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">API builder</h2>
        <p className="text-sm text-stone-600">
          Wire project data to people and to other agents. Phase 1 only writes the spec.
          It does not read a balance and it does not collect a payment.
        </p>
        <ul className="list-disc pl-5 text-sm text-stone-600">
          <li>Where is the data? Unknown stays unknown.</li>
          <li>If it is nowhere, describe the endpoints. No model is called.</li>
          <li>Balance and address checks are read-only.</li>
          <li>A token gate is optional and off until you ask.</li>
          <li>
            x402 is HTTP 402. Another agent can micropay the founder to query. This shell
            does not charge.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Meteora liquidity</h2>
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium">Price source</legend>
          <label className="flex gap-2">
            <input
              type="radio"
              name="price-source"
              checked={priceSource === "codex"}
              onChange={() => setPriceSource("codex")}
            />
            Codex.io (almost-free tier, one-time $1). No request is sent.
          </label>
          <label className="flex gap-2">
            <input
              type="radio"
              name="price-source"
              checked={priceSource === "onchain"}
              onChange={() => setPriceSource("onchain")}
            />
            On-chain read. No RPC is opened.
          </label>
          <p>
            Stub quote source: {priceSource === "codex" ? "Codex.io" : "on-chain"}. Price
            is empty. Pool terms stay at compounding_fee_bps = 10000.
          </p>
        </fieldset>
      </section>

      {project.lock.platformAdminCanChange ? null : (
        <section className="space-y-2 rounded-lg border border-sky-300 bg-sky-50 p-4">
          <h2 className="text-lg font-semibold">Agent-created lock</h2>
          <p className="text-sm text-sky-950">
            Agent created. No human. Humans cannot change mint, LP, or fee admin via
            platform admin. The lock is non-retcon. Phase 1 does not write that freeze on
            chain.
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sensitive actions</h2>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled
              className="min-h-11 cursor-not-allowed rounded-md bg-stone-200 px-3 py-2 text-sm text-stone-500"
            >
              {action}
            </button>
          ))}
        </div>
        <p className="text-sm text-stone-600">
          Disabled on purpose. Phase 1 does not verify a guardian wallet, passkey, or
          TOTP, and it does not send these transactions.
        </p>
      </section>
    </div>
  );
}

function XAnalytics({ handle, symbol }: { handle: string; symbol: string }) {
  const clean = handle.replace(/^@/, "");
  const seed = clean.length + 3;
  const weeks = [
    { label: "W1", impressions: 2000 + seed * 10 },
    { label: "W2", impressions: 3500 + seed * 15 },
    { label: "W3", impressions: 2800 + seed * 12 },
    { label: "W4", impressions: 4100 + seed * 18 },
  ];
  const max = Math.max(...weeks.map((week) => week.impressions));
  const followers = 800 + seed * 37;
  const impressions = 12000 + seed * 500;
  const engagements = 400 + seed * 20;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">X analytics</h2>
      <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950">
        Mock data. Not pulled from the X API. Connect is not live.
      </p>
      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-md bg-stone-200 px-3 py-2 text-sm text-stone-500"
      >
        Connect X account
      </button>
      <dl className="grid gap-2 sm:grid-cols-3">
        <Stat label="Followers" value={String(followers)} />
        <Stat label="Impressions" value={String(impressions)} />
        <Stat label="Engagements" value={String(engagements)} />
      </dl>
      <div className="space-y-2" aria-label="Mock impressions by week">
        {weeks.map((week) => (
          <div
            key={week.label}
            className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-2 text-xs"
          >
            <span>{week.label}</span>
            <div className="h-3 rounded bg-stone-200">
              <div
                className="h-3 rounded bg-sky-700"
                style={{ width: `${Math.round((week.impressions / max) * 100)}%` }}
              />
            </div>
            <span className="text-right">{week.impressions}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm text-stone-700">
        <h3 className="font-medium text-stone-900">X Radar</h3>
        <p>
          {`Radar needs Premium+ or Business. Watch cashtag $${symbol.toUpperCase()} plus a campaign keyword such as the launch week.`}
        </p>
        <p>
          There is no documented Radar export API. Use the Radar screen in X. This page
          does not call one.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-medium break-all">{value}</p>
    </div>
  );
}
