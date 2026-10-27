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

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Ads and boosts</h2>
        <p className="text-sm text-stone-600">
          Fee-funded boosts are for attention. This shell does not spend. A later submit
          path still requires confirm.
        </p>
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

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sensitive actions</h2>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled
              className="cursor-not-allowed rounded-md bg-stone-200 px-3 py-2 text-sm text-stone-500"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-medium break-all">{value}</p>
    </div>
  );
}
