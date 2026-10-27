"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

const blurbSchema = z
  .object({
    blurb: z
      .string()
      .trim()
      .min(1, "Write one sentence.")
      .max(160, "Keep it under 160 characters."),
  })
  .strict();

/** Founder sites validate forms with Zod. This sample does not submit anywhere. */
export function SiteBlurbForm() {
  const [blurb, setBlurb] = useState("");
  const [message, setMessage] = useState("Not submitted.");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = blurbSchema.safeParse({ blurb });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the sentence.");
      return;
    }
    setMessage(
      "Valid. Still not published. The site stays on the founder's Vercel project.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="block text-sm font-medium" htmlFor="site-blurb">
        One-line blurb
      </label>
      <input
        id="site-blurb"
        value={blurb}
        onChange={(event) => setBlurb(event.target.value)}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white"
      >
        Check with Zod
      </button>
      <p className="text-sm text-stone-600">{message}</p>
    </form>
  );
}
