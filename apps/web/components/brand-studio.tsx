"use client";

import { useActionState, useEffect, useState } from "react";

import {
  generateBrandAction,
  planDomainAction,
  recordMarketAction,
  scoreNamesAction,
  type BrandState,
  type DomainState,
  type MarketState,
  type NameState,
} from "@/app/brand/actions";

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-base";
const buttonClass =
  "rounded-md bg-stone-900 px-4 py-3 text-base text-white disabled:opacity-60";

const KIND_LABELS: Record<string, string> = {
  logo: "Logo mark",
  app_icon: "App icon",
  avatar: "X avatar",
  x_header: "X header",
  og: "OG image",
  favicon: "Favicon",
};

function downloadSvg(filename: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BrandStudio() {
  const [marketState, marketAction, marketPending] = useActionState(recordMarketAction, {
    status: "idle",
  } as MarketState);
  const [nameState, nameAction, namePending] = useActionState(scoreNamesAction, {
    status: "idle",
  } as NameState);
  const [domainState, domainAction, domainPending] = useActionState(planDomainAction, {
    status: "idle",
  } as DomainState);
  const [brandState, brandAction, brandPending] = useActionState(generateBrandAction, {
    status: "idle",
  } as BrandState);

  const [audience, setAudience] = useState("");
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("");
  const [geography, setGeography] = useState("");
  const [candidates, setCandidates] = useState(() =>
    Array.from({ length: 4 }, () => ({ name: "", ticker: "", taken: false })),
  );
  const [domainLabel, setDomainLabel] = useState("");
  const [brandName, setBrandName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [background, setBackground] = useState<"light" | "dark">("light");
  const [variant, setVariant] = useState(0);

  const market = marketState.status === "ready" ? marketState.market : null;
  const suggested =
    nameState.status === "ready"
      ? (nameState.bestName ?? nameState.rows[0]?.name ?? "")
      : "";

  useEffect(() => {
    if (!suggested) return;
    setDomainLabel((current) => (current.trim() ? current : suggested));
    setBrandName((current) => (current.trim() ? current : suggested));
  }, [suggested]);

  useEffect(() => {
    if (!category.trim()) return;
    setSubtitle((current) => (current.trim() ? current : category.trim()));
  }, [category]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Target market</h2>
        <p className="max-w-2xl text-sm text-stone-700">
          Write who the coin is for before you pick a name. You can keep this note in your
          own doc. The form only checks the shape.
        </p>
        <form action={marketAction} className="grid max-w-2xl gap-3">
          <label className="block text-sm font-medium" htmlFor="audience">
            Audience
            <input
              id="audience"
              name="audience"
              required
              maxLength={160}
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="problem">
            Problem
            <input
              id="problem"
              name="problem"
              required
              maxLength={240}
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium" htmlFor="category">
              Category
              <input
                id="category"
                name="category"
                required
                maxLength={40}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="tone">
              Tone
              <input
                id="tone"
                name="tone"
                required
                maxLength={80}
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>
          <label className="block text-sm font-medium" htmlFor="geography">
            Geography (optional)
            <input
              id="geography"
              name="geography"
              maxLength={80}
              value={geography}
              onChange={(event) => setGeography(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <button type="submit" className={buttonClass} disabled={marketPending}>
            {marketPending ? "Saving…" : "Save market"}
          </button>
          {marketState.status === "error" ? (
            <p className="text-sm text-red-800" role="alert">
              {marketState.message}
            </p>
          ) : null}
          {market ? (
            <p className="text-sm text-stone-700" aria-live="polite">
              Market recorded for {market.audience}. Naming stays optional. Curve creation
              still has no platform fee.
            </p>
          ) : null}
        </form>
      </section>

      {market ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Score names</h2>
          <p className="max-w-2xl text-sm text-stone-700">
            Prefer one syllable, 2–5 letters, letters only, and a word someone can spell.
            The cashtag check is a local list plus the box you tick. It does not search X.
          </p>
          <form action={nameAction} className="max-w-2xl space-y-3">
            <MarketFields market={market} />
            {["First", "Second", "Third", "Fourth"].map((label, index) => (
              <fieldset
                key={label}
                className="grid gap-3 rounded-lg bg-white p-3 ring-1 ring-stone-200 sm:grid-cols-2"
              >
                <legend className="px-1 text-sm font-medium">{label} candidate</legend>
                <label className="block text-sm" htmlFor={`name-${index}`}>
                  Name
                  <input
                    id={`name-${index}`}
                    name={`name-${index}`}
                    maxLength={32}
                    value={candidates[index]?.name ?? ""}
                    onChange={(event) =>
                      setCandidates((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, name: event.target.value } : row,
                        ),
                      )
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm" htmlFor={`ticker-${index}`}>
                  Ticker
                  <input
                    id={`ticker-${index}`}
                    name={`ticker-${index}`}
                    maxLength={10}
                    value={candidates[index]?.ticker ?? ""}
                    onChange={(event) =>
                      setCandidates((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, ticker: event.target.value }
                            : row,
                        ),
                      )
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    name={`taken-${index}`}
                    className="size-4"
                    checked={candidates[index]?.taken ?? false}
                    onChange={(event) =>
                      setCandidates((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, taken: event.target.checked }
                            : row,
                        ),
                      )
                    }
                  />
                  I already know this X cashtag is taken
                </label>
              </fieldset>
            ))}
            <button type="submit" className={buttonClass} disabled={namePending}>
              {namePending ? "Scoring…" : "Score shortlist"}
            </button>
          </form>
          {nameState.status === "error" ? (
            <p className="text-sm text-red-800" role="alert">
              {nameState.message}
            </p>
          ) : null}
          {nameState.status === "ready" ? (
            <div className="space-y-3" aria-live="polite">
              <p className="max-w-2xl text-sm text-stone-700">{nameState.gap}</p>
              <ul className="grid gap-3">
                {nameState.rows.map((row) => (
                  <li
                    key={`${row.name}-${row.ticker}`}
                    className="rounded-lg bg-white p-3 text-sm ring-1 ring-stone-200"
                  >
                    <p className="font-medium">
                      {row.name} {row.cashtag} · {row.score}
                      {row.preferred ? " · preferred" : ""}
                    </p>
                    <p className="text-stone-600">
                      {row.syllableEstimate} syllable
                      {row.syllableEstimate === 1 ? "" : "s"} · {row.letterCount} letters
                      · {row.spellable ? "spellable" : "hard to spell"} ·{" "}
                      {row.recognizable ? "recognizable" : "hard to recognize"} ·
                      collision {row.heuristicRisk}
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-stone-700">
                      {row.notes.slice(0, 4).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {market ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Domain plan</h2>
          <p className="max-w-2xl text-sm text-stone-700">
            Prefer a .com at Cloudflare with WHOIS redaction. This page does not buy it.
            Register it on the Cloudflare account you own, or skip the tool and do that
            yourself.
          </p>
          <form action={domainAction} className="grid max-w-2xl gap-3">
            <label className="block text-sm font-medium" htmlFor="domain-label">
              Label
              <input
                id="domain-label"
                name="label"
                value={domainLabel}
                onChange={(event) => setDomainLabel(event.target.value)}
                maxLength={32}
                required
                className={`${inputClass} mt-1`}
              />
            </label>
            <button type="submit" className={buttonClass} disabled={domainPending}>
              {domainPending ? "Planning…" : "Plan .com"}
            </button>
          </form>
          {domainState.status === "error" ? (
            <p className="text-sm text-red-800" role="alert">
              {domainState.message}
            </p>
          ) : null}
          {domainState.status === "ready" ? (
            <div
              className="max-w-2xl space-y-2 text-sm text-stone-700"
              aria-live="polite"
            >
              <p>
                {domainState.hostname ?? "No hostname yet"} · privacy{" "}
                {domainState.privacy} · purchased {String(domainState.purchased)} ·
                secrets stored {String(domainState.storesSecrets)}
              </p>
              <p>{domainState.gap}</p>
              <p>{domainState.ownership}</p>
              <ul className="list-disc pl-5">
                {domainState.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <ol className="list-decimal pl-5">
                {domainState.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}

      {market ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Brand kit</h2>
          <p className="max-w-2xl text-sm text-stone-700">
            A simple geometric mark, high contrast, readable at 32px. Change the variant
            after you look at it. Download the SVGs and keep them. They are yours.
          </p>
          <form action={brandAction} className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium" htmlFor="brand-name">
              Name
              <input
                id="brand-name"
                name="name"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                maxLength={32}
                required
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="subtitle">
              Subtitle (optional)
              <input
                id="subtitle"
                name="subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                maxLength={48}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="background">
              Background
              <select
                id="background"
                name="background"
                value={background}
                onChange={(event) =>
                  setBackground(event.target.value === "dark" ? "dark" : "light")
                }
                className={`${inputClass} mt-1`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="block text-sm font-medium" htmlFor="variant">
              Variant (0–11)
              <input
                id="variant"
                name="variant"
                type="number"
                min={0}
                max={11}
                value={variant}
                onChange={(event) => setVariant(Number(event.target.value))}
                className={`${inputClass} mt-1`}
              />
            </label>
            <button
              type="submit"
              className={`${buttonClass} sm:col-span-2`}
              disabled={brandPending}
            >
              {brandPending ? "Drawing…" : "Generate kit"}
            </button>
          </form>
          {brandState.status === "error" ? (
            <p className="text-sm text-red-800" role="alert">
              {brandState.message}
            </p>
          ) : null}
          {brandState.status === "ready" ? (
            <div className="space-y-3" aria-live="polite">
              <p className="max-w-2xl text-sm text-stone-700">{brandState.ownership}</p>
              <p className="max-w-2xl text-sm text-stone-700">{brandState.iteration}</p>
              <p className="max-w-2xl text-sm text-stone-700">
                {brandState.written
                  ? `Saved on this machine under ${brandState.directory}. Copy that folder into the repo you control.`
                  : "Preview is ready. The disk write did not finish, so use the download buttons and keep the files yourself."}
              </p>
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  brandState.assets.forEach((asset, index) => {
                    window.setTimeout(
                      () => downloadSvg(asset.filename, asset.svg),
                      index * 250,
                    );
                  });
                }}
              >
                Download all SVGs
              </button>
              <ul className="grid gap-4 sm:grid-cols-2">
                {brandState.assets.map((asset) => (
                  <li
                    key={asset.kind}
                    className={`space-y-2 rounded-lg bg-white p-3 ring-1 ring-stone-200 ${
                      asset.kind === "x_header" || asset.kind === "og"
                        ? "sm:col-span-2"
                        : ""
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {KIND_LABELS[asset.kind] ?? asset.kind} · {asset.pixels}
                    </p>
                    <p className="text-sm text-stone-600">{asset.note}</p>
                    <img
                      alt={`${KIND_LABELS[asset.kind] ?? asset.kind} preview`}
                      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`}
                      className={
                        asset.kind === "favicon"
                          ? "h-16 w-16"
                          : "h-auto w-full max-h-64 object-contain object-left"
                      }
                    />
                    <button
                      type="button"
                      className="text-sm underline"
                      onClick={() => downloadSvg(asset.filename, asset.svg)}
                    >
                      Download {asset.filename}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function MarketFields({
  market,
}: {
  market: {
    audience: string;
    problem: string;
    category: string;
    tone: string;
    geography?: string;
  };
}) {
  return (
    <>
      <input type="hidden" name="audience" value={market.audience} />
      <input type="hidden" name="problem" value={market.problem} />
      <input type="hidden" name="category" value={market.category} />
      <input type="hidden" name="tone" value={market.tone} />
      {market.geography ? (
        <input type="hidden" name="geography" value={market.geography} />
      ) : null}
    </>
  );
}
