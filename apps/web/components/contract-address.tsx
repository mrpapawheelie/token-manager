"use client";

import { useState } from "react";

export function ContractAddress({
  address,
  placeholder,
}: {
  address: string | null;
  placeholder: string;
}) {
  const [copied, setCopied] = useState(false);
  const ready = address !== null && address.length > 0;

  async function copy() {
    if (!ready || !address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
  }

  return (
    <div className="rounded-lg bg-stone-900 px-4 py-4 text-white">
      <p className="text-xs font-medium tracking-wide text-stone-300 uppercase">
        Token contract
      </p>
      <p className="mt-2 font-mono text-lg break-all sm:text-2xl">
        {ready ? address : placeholder}
      </p>
      <button
        type="button"
        onClick={copy}
        disabled={!ready}
        className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-medium text-stone-900 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-300"
      >
        {ready ? (copied ? "Copied" : "Copy address") : "Nothing to copy yet"}
      </button>
    </div>
  );
}
